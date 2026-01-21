
import { NextRequest } from "next/server";
import { verifyJWT } from "@/utils/customMiddleware/verifyJWT";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

  const { messages }: ChatRequestBody = await req.json();
  const sysPrompt = {
    role: "system",
    content: "You are a helpful assistant."
  }

  const messageArr = [sysPrompt, ...messages];

  const last = messages.at(-1);
  if (!last || last.role !== "user") throw new Error("Invalid state");
  const lastUserPrompt = last.content;

  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
  });

  try {
    const result = await model.generateContentStream({
      contents: messageArr.map((m: ChatMessage) => ({
        role: m.role,
        parts: [{ text: m.content }]
      }))
    });

    const encoder = new TextEncoder();
    let LLMResponseTxt = "";
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
            LLMResponseTxt += text;

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
            if (authHeader) {
              console.log("safe place to save LLM response message with latest user prompt to mongodb.");
              console.log(`Latest User Prompt: ${lastUserPrompt}`);
              console.log(`Full LLM Response: ${LLMResponseTxt}`);
            }
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
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Internal server error. Failed to generate content. Err: ${error}` }), { status: 500 });
  }
}