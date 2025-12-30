import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Initialize with the correct API version for beta models
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  const { messages } = await req.json();

  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
  });

  const lastMessage = messages.at(-1).content;

  try {
    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: lastMessage }] }]
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
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