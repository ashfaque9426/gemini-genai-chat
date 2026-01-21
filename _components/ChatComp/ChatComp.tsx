"use client";
import { useState, useRef } from "react";
import PromptTextField from "./PromptTextField";
import { v4 as uuidv4 } from 'uuid';
import { ImStop } from "react-icons/im";
import MarkdownRenderer from "./MarkDownRenderer";
import cn from "@/utils/clsx";
import useAuth from "@/hooks/useAuth";
import Loading from "../Loading/Loading";
interface chatCompTypes {
  chatCompStyles?: string;
}

export default function ChatComp({ chatCompStyles }: chatCompTypes) {
  const [conversations, setConversations] = useState<{ role: string; content: string }[]>([]);
  const [userPrompt, setUserPrompt] = useState("");
  const [dBtnDisabled, setdBtnDisabled] = useState(true);

  const { contextLoading, userInfo } = useAuth();

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

    const methodObj = {
      method: "POST",
      body: JSON.stringify({
        messages: arrayToSend
      }),
      signal: controller.signal
    }

    try {
      const res = await fetch("/api/chat", methodObj);

      if (!res.ok) {
        const data = await res.json();
        if (userInfo && res.status === 401) {
          console.log("Access token expired or invalid", data.message);
          // if user logged in then,
          // call the refreshAccessToken() here since axios does not support data streaming the way of incremental chunks, if the token is being returned update the auth token state.
          // if something is wrong and message being returned, update the outter scopped message variable.
          // if the data.message contains includes that string indicating refresh token is expired call user logOut method here.
        }
        // then wrong throw new Error here with the updated message variable.
        throw new Error(data.message || "Request failed");
      }

      if (!res.body) {
        throw new Error("No response body found");
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
      // if the user is logged in then, make post request to the api route to save the userPrompt and resStr to mongodb collection(because response streming chunks begins with the returned response with headers from ther server, so cant return the error message from the server endpoint if failed to update the user prompt and LLM response message in mongodb collection).

      // then
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
                {
                  userInfo ? <p className="text-3xl font-semibold">What can I help you with?</p> : <p className="text-3xl font-semibold">Please Login to save your conversation.</p>
                }
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
