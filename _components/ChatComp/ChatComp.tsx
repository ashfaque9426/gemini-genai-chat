"use client";

import { useState } from "react";

export default function ChatComp() {
  const [output, setOutput] = useState("");

  async function send() {
    setOutput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Explain RAG simply" }]
      })
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      setOutput(prev => prev + chunk);
    }
  }

  return (
    <div className="w-1/2 my-32 p-5 mx-auto">
      <button className="px-1.5 py-0.5 mb-5 text-lg text-white font-semibold cursor-pointer bg-blue-400 rounded-lg" onClick={send}>Send</button>
      <pre>{output}</pre>
    </div>
  );
}
