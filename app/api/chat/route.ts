
import { NextRequest } from "next/server";
import { verifyJWT } from "@/utils/customMiddleware/verifyJWT";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { serverError } from "@/utils/utilityFunc/serverError";

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
}

// 1. Initialize with the correct API version for beta models
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);


export async function POST(req: NextRequest): Promise<Response> {
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const jwtResult = verifyJWT(req, "Access");
    if (jwtResult.error) {
      return new Response(
        JSON.stringify({ message: jwtResult.message }),
        {
          status: jwtResult.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  try {
    const { messages }: ChatRequestBody = await req.json();

    if (!messages || messages.length === 0) {
      throw new Error("Invalid Request. Invalid value or an empty messages array.");
    }

    const last = messages.at(-1);
    if (!last || last.role !== "user") throw new Error("Invalid state");

    async function generateWithFallback(messages: ChatMessage[]) {
      let lastError: unknown;

      const MODELS = ["gemini-3-flash-preview", "gemini-3.1-pro-preview", "gemini-3.1-flash-preview", "gemini-3.1-flash-lite-preview", "gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-1.5-pro", "gemini-1.5-flash"];

      for (const modelName of MODELS) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: "You are a helpful assistant."
          });

          const result = await model.generateContentStream({
            contents: messages.map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }]
            }))
          });

          return {
            result,
            modelUsed: modelName
          };
        } catch (err: unknown) {
          lastError = err;

          function isRateLimitError(err: unknown): boolean {
            if (typeof err === "object" && err !== null) {
              const e = err as { status?: number; message?: string };

              return (e.status === 429 || e.message?.includes("rate") || e.message?.includes("quota") || false);
            }
            return false;
          }

          if (!isRateLimitError(err)) {
            throw err;
          }

          console.warn(`Model ${modelName} rate-limit reached. Trying next...`);
        }
      }

      throw lastError;
    }

    const { result, modelUsed } = await generateWithFallback(messages);

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let aborted = false;

        const onAbort = () => {
          aborted = true;
          controller.error(new Error("Client aborted request"));
        };

        req.signal.addEventListener("abort", onAbort);
        try {
          for await (const chunk of result.stream as AsyncIterable<{ text(): string }>) {
            if (aborted) break;

            const text: string = chunk.text();

            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          if (!aborted) {
            controller.error(err);
          }
        } finally {
          req.signal.removeEventListener("abort", onAbort);

          if (!aborted) {
            controller.close();
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': "text/event-stream; charset=utf-8",
        'Cache-Control': "no-cache",
        'Connection': 'keep-alive',
        "x-model-used": modelUsed
      },
    });
  } catch (error) {
    if (typeof error === "object" && error !== null) {
      const err = error as { status?: number; message?: string };
      if(err.status === 429 || err.message?.includes("rate") || err.message?.includes("quota")) {
        return new Response(JSON.stringify({ message: "You have reached the AI session limit for free tier use." }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
    }
    
    const { message, statusCode } = serverError("Error from /api/chat", "Invalid Request", "Invalid state", "aborted", "", error, 400, 400, 499, 0);
    return new Response(JSON.stringify({ message }), { status: statusCode, headers: { "Content-Type": "application/json" } });
  }
}