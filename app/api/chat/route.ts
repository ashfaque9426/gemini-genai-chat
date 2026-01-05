
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


export async function POST(req: Request): Promise<Response> {
  const { messages }: ChatRequestBody = await req.json();

  const last = messages.at(-1);
  if (!last || last.role !== "user") throw new Error("Invalid state");

  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
  });

  try {
    const result = await model.generateContentStream({
      contents: messages.map((m: ChatMessage) => ({
        role: m.role,
        parts: [{ text: m.content }]
      }))
    });

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
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Failed to generate content. Err: ${error}` }), { status: 500 });
  }
}