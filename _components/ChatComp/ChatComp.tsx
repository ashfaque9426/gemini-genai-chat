"use client";
import { useState, useRef } from "react";
import PromptTextField from "../FieldInput/PromptTextField";
import { v4 as uuidv4 } from 'uuid';
import { ImStop } from "react-icons/im";
import MarkdownRenderer from "./MarkDownRenderer";
import cn from "@/utils/clsx";
import useAuth from "@/hooks/useAuth";
import Loading from "./Loading";
interface chatCompTypes {
  chatCompStyles?: string;
}

export default function ChatComp({ chatCompStyles }: chatCompTypes) {
  const [conversations, setConversations] = useState<{ role: string; content: string }[]>([]);
  const [userPrompt, setUserPrompt] = useState("");
  const [dBtnDisabled, setdBtnDisabled] = useState(true);

  const { contextLoading } = useAuth();

  const abortControllerRef = useRef<AbortController | null>(null);

  function field_cng_event(e: React.FormEvent<HTMLTextAreaElement>) {
    const userPrompt = (e.target as HTMLTextAreaElement).value || "";
    setUserPrompt(userPrompt);
  }

  async function sendUserPrompt() {
    if (!dBtnDisabled) return;
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setConversations(prev => [
      ...prev,
      { role: "user", content: userPrompt },
      { role: "assistant", content: "" }
    ]);

    const arrayToSend = [...conversations, { role: "user", content: userPrompt }];

    setdBtnDisabled(false);
    setUserPrompt("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: arrayToSend
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      if (!res.body) {
        throw new Error("No response body");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let resStr = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        resStr += chunk;

        setConversations(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: resStr,
          };
          return updated;
        });
      }
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === "AbortError" || err instanceof Error && err.name === "AbortError";
      if (isAbort) {
        setConversations(prev => prev.slice(0, -2));
        abortControllerRef.current = null;
        console.log("Generation aborted by user");
      } else {
        console.error("Generate Error Response:", err);
      }
    } finally {
      abortControllerRef.current = null;
      setdBtnDisabled(true);
    }
  }

  return (
    <div className={cn("relative", chatCompStyles)}>
      {
        !contextLoading ? <>
          <div className="h-[87%] overflow-y-auto no-scrollbar">
            {
              conversations.length > 0 ? conversations.map(message => message.role === "user" ? <pre key={`user-prompt${uuidv4()}`} className="my-5 p-3 text-wrap border border-gray-500 rounded-lg">{message.content}</pre> : <MarkdownRenderer key={`LLM-Response${uuidv4()}`} text={message.content} />) : <div className="w-full h-full flex justify-center items-center">
                <p className="text-3xl font-semibold">What can I help you with?</p>
              </div>
            }
          </div>

          <PromptTextField name="LLMInput" id="IIFLLM" placeholder="Ask anything..." inputStyles="absolute z-30 bottom-5 w-full no-scrollbar" value={userPrompt} sendPrompt={sendUserPrompt} onEventChange={field_cng_event} />
          <button className="absolute right-2 bottom-7.5 z-50 text-3xl cursor-pointer disabled:cursor-not-allowed" disabled={dBtnDisabled} onClick={() => abortControllerRef.current?.abort()}><ImStop /></button>
        </> : <Loading defaultIcon={true} loadingIconStyles="text-5xl" />
      }

    </div>
  );
}
