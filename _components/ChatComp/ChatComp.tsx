"use client";
import { useState } from "react";
import PromptTextField from "../FieldInput/PromptTextField";

export default function ChatComp() {
  const [output, setOutput] = useState("");
  const [userPrompt, setUserPrompt] = useState("");

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

  function field_cng_event(e: React.FormEvent<HTMLTextAreaElement>) {
    const userPrompt = (e.target as HTMLTextAreaElement).value || "";
    setUserPrompt(userPrompt);
  }

  async function sendUserPrompt() {
    console.log(userPrompt);
    setUserPrompt("");
  }

  return (
    <div className="w-[90%] 2xl:w-1/2 h-full mx-auto relative">
      <button className="px-1.5 py-0.5 my-5 text-lg text-white font-semibold cursor-pointer bg-blue-400 rounded-lg" onClick={send}>Send</button>
      <pre className="text-wrap h-[87%] overflow-y-auto">{output}</pre>
      
      <PromptTextField name="LLMInput" id="IIFLLM" placeholder="Ask anything..." inputStyles="absolute z-50 bottom-5 w-full" value={userPrompt} sendPrompt={sendUserPrompt} onEventChange={field_cng_event} />
    </div>
  );
}
