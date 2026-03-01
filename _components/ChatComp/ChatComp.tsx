"use client";
import { useState, useRef, useEffect } from "react";
import PromptTextField from "./PromptTextField";
import { ImStop } from "react-icons/im";
import { LuSendHorizontal } from "react-icons/lu";
import MarkdownRenderer from "./MarkDownRenderer";
import cn from "@/utils/clsx";
import useAuth from "@/hooks/useAuth";
import Loading from "../Loading/Loading";
import { refreshAccessToken } from "@/lib/api/auth.api";
import { clientErrMsg, isAccessTokenValid, showToastMsg } from "@/utils/utilityFunc/utilityFunc";
import { lsUserInfoStr } from "@/utils/constants/constants";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import { Chats } from "@/providers/AuthProvider";
interface chatCompProps {
  chatCompStyles?: string;
}

interface RequestInit {
  method: string;
  body: string;
  signal: AbortSignal;
  headers?: {
    "Content-Type"?: string;
    Authorization?: string;
  };
}

export default function ChatComp({ chatCompStyles }: chatCompProps) {
  const [userPrompt, setUserPrompt] = useState("");
  const [dBtnDisabled, setdBtnDisabled] = useState(true);

  const convIdHolder = useRef("");
  const tempConvArr = useRef<Chats[]>([]);

  const { contextLoading, userInfo, accessSecret, convId, convStorage, generatingConvIds, userPromptArr, setConvId, setAccessSecret, setConvStorage, setgeneratingConvIds, setUserPromptArr, setPerfLogOut } = useAuth();
  const axiosSecure = useAxiosSecure();

  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  function field_cng_event(e: React.FormEvent<HTMLTextAreaElement>) {
    const userPrompt = (e.target as HTMLTextAreaElement).value || "";
    setUserPrompt(userPrompt);

    if (!convId.conversationId) return;

    setUserPromptArr(prev => {
      const idx = prev.findIndex(p => p.convId === convId.conversationId);

      if (idx === -1) {
        return [...prev, { convId: convId.conversationId as string, userPrompt }];
      }

      const updated = [...prev];
      updated[idx] = { ...updated[idx], userPrompt };
      return updated;
    });

  }

  function abortCurrentChat() {
    const targetConvId = convIdHolder.current || "logOutChat";
    abortControllersRef.current.get(targetConvId)?.abort();
    abortControllersRef.current.delete(targetConvId);
  }

  async function sendUserPrompt() {
    if (!dBtnDisabled || userPrompt === "" || (userPrompt !== "" && userPrompt.trim().length === 0)) return;
    abortCurrentChat();

    const streamingConvId = convIdHolder.current;
    const controller = new AbortController();
    abortControllersRef.current.set(streamingConvId, controller);


    setgeneratingConvIds(prev => [...prev, streamingConvId]);
    const promptId = crypto.randomUUID();
    const resId = crypto.randomUUID();
    if (userInfo) {
      setConvStorage(prev => {
        const index = prev.findIndex(
          conv => conv.convId === convId.conversationId
        );

        if (index === -1) {
          return [
            ...prev,
            {
              convId: streamingConvId,
              chats: [
                { _id: promptId, role: "user", content: userPrompt },
                { _id: resId, role: "assistant", content: "" },
              ],
            },
          ];
        }

        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          chats: [
            ...updated[index].chats,
            { _id: promptId, role: "user", content: userPrompt },
            { _id: resId, role: "assistant", content: "" },
          ],
        };

        return updated;
      });

    } else {
      setConvStorage(prev => {
        const hasTemp = prev.some(conv => conv.convId === "logOutChat");

        if (!hasTemp) {
          return [
            ...prev,
            {
              convId: "logOutChat",
              chats: [
                { _id: promptId, role: "user", content: userPrompt },
                { _id: resId, role: "assistant", content: "" },
              ],
            },
          ];
        }

        return prev.map(conv =>
          conv.convId === "logOutChat"
            ? {
              ...conv,
              chats: [
                ...conv.chats,
                { _id: promptId, role: "user", content: userPrompt },
                { _id: resId, role: "assistant", content: "" },
              ],
            }
            : conv
        );
      });
    }

    const arrayToSend = [...tempConvArr.current, { _id: promptId, role: "user", content: userPrompt }];

    setUserPrompt("");

    const methodObj: RequestInit = {
      method: "POST",
      body: JSON.stringify({
        messages: arrayToSend
      }),
      signal: controller.signal
    }

    let resStr = "";

    try {
      if (userInfo && !isAccessTokenValid()) {
        let refreshExpired = false;
        await refreshAccessToken().then(({ AccToken, message, expiresAt }) => {
          if (AccToken) {
            setAccessSecret(AccToken);
            localStorage.setItem(lsUserInfoStr, JSON.stringify({ userEmail: userInfo.userEmail, expiresAt: expiresAt }));
          }
          else if (message) throw new Error(message);
        }).catch(err => {
          if (err.message.includes("Refresh Token expired") || err.message.includes("Invalid")) {
            setPerfLogOut(true);
            if (err.message.includes("Refresh Token expired")) refreshExpired = true;
          }
          if (refreshExpired) {
            showToastMsg("info", "User Session Expired. Please login again.");
          }
          else throw new Error(err.message);
        });
      }

      if (userInfo) {
        methodObj.headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessSecret}`,
        };
      }

      const res = await fetch("/api/chat", methodObj);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Chat generate AI response text Request failed.");
      }

      if (!res.body) {
        throw new Error("No response body found");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        resStr += chunk;

        setConvStorage(prev =>
          prev.map(conv => {
            const targetConvId = userInfo ? streamingConvId : "logOutChat";
            if (conv.convId !== targetConvId) return conv;

            const storage = [...conv.chats];
            const lastIndex = storage.length - 1;

            if (lastIndex < 0 || storage[lastIndex].role !== "assistant") return conv;

            storage[lastIndex] = {
              ...storage[lastIndex],
              content: storage[lastIndex].content + chunk,
            };

            return { ...conv, chats: storage };
          })
        );
      }
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === "AbortError" || err instanceof Error && err.name === "AbortError";
      if (isAbort) {
        setConvStorage(prev => prev.map(conv => {
          const targetConvId = userInfo ? streamingConvId : "logOutChat";
          if (conv.convId !== targetConvId) return conv;

          const storage = [...conv.chats].slice(0, -2);

          return { ...conv, chats: storage };
        }));

        const targetConvId = streamingConvId || "logOutChat";
        abortControllersRef.current.delete(targetConvId);

        console.log("Generation aborted by user");
      } else {
        console.error("Generate Response Error. Err: ", err);
      }
    } finally {
      if (convId.conversationId) setgeneratingConvIds(prev => prev.filter(strId => strId !== convId.conversationId));
      else setgeneratingConvIds(prev => prev.filter(strId => strId !== streamingConvId));

      const wasAborted = controller.signal.aborted;

      if (!wasAborted && userInfo) {
        const { conversationId, error, message } = (await axiosSecure.post('/save-conversation', { conversationId: convId.conversationId, userPrompt, responseText: resStr })).data;

        if (error) {
          showToastMsg("error", "Failed to save the latest conversation in the database.");
          console.error(message);
        } else if (!streamingConvId && conversationId) {
          setConvId(conversationId, true);
          setConvStorage(prev => prev.map(item => item.convId === "" ? { ...item, convId: conversationId } : item));
          convIdHolder.current = conversationId;
        } else if (streamingConvId === conversationId) {
          setConvId(conversationId, false, true);
        }
      }

      const targetConvId = streamingConvId || "logOutChat";
      abortControllersRef.current.delete(targetConvId);
    }
  }

  useEffect(() => {
    const fetchConvs = async () => {
      try {
        if (!convId.conversationId) return;
        const { items, message } = (await axiosSecure.get("/get-conversation")).data;
        if (message) throw new Error(message);
        if (items) {
          const convObj = {
            convId: convId.conversationId,
            chats: items
          }
          setConvStorage(prev => [...prev, convObj]);
          tempConvArr.current = items;
          convIdHolder.current = convId.conversationId;
        }
      }
      catch (err) {
        clientErrMsg(err, "Error from fetchConv function.", true);
      }
    }

    if (convId.conversationId === null) {
      tempConvArr.current = [];
      convIdHolder.current = "";
      setUserPrompt("");
      return;
    }

    const existing = convStorage.find(item => item.convId === convId.conversationId);

    if (existing) {
      tempConvArr.current = existing.chats;
      convIdHolder.current = convId.conversationId;
    } else {
      fetchConvs();
    }
  }, [convId, convStorage, axiosSecure, setConvStorage]);

  useEffect(() => {
    const isGenerating = generatingConvIds.includes(convIdHolder.current);
    setdBtnDisabled(!isGenerating);
  }, [generatingConvIds]);

  useEffect(() => {
    if (!convId.conversationId) {
      setUserPrompt("");
      return;
    }

    const stored = userPromptArr.find(prompt => prompt.convId === convId.conversationId);

    setUserPrompt(stored?.userPrompt ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convId.conversationId]);

  const activeConv = convStorage.find(conv => userInfo ? (conv.convId === convId.conversationId || conv.convId === "") : conv.convId === "logOutChat");

  const messages = activeConv?.chats ?? [];

  return (
    <div className={cn("relative", chatCompStyles)}>
      {
        !contextLoading ? <>
          <div className="h-[87%] overflow-y-auto no-scrollbar">
            {
              (messages.length > 0) ? messages.map(message => message.role === "user" ? <pre key={`user-prompt${message._id}`} className="my-5 p-3 text-wrap border border-gray-500 rounded-lg">{message.content}</pre> : <MarkdownRenderer key={`LLM-Response${message._id}`} text={message.content} />) : <div className="w-full h-full flex justify-center items-center">
                {
                  userInfo ? <p className="text-3xl font-semibold">What can I help you with?</p> : <p className="text-3xl font-semibold">Please Login to save your conversation.</p>
                }
              </div>
            }
          </div>

          <PromptTextField name="LLMInput" id="IIFLLM" placeholder="Ask anything..." inputStyles="absolute z-30 bottom-5 w-full no-scrollbar" value={userPrompt} sendPrompt={sendUserPrompt} onEventChange={field_cng_event} />
          {
            dBtnDisabled ?
              <button className="absolute right-2 bottom-7.5 z-50 text-3xl cursor-pointer disabled:cursor-not-allowed" disabled={userPrompt.length === 0} onClick={sendUserPrompt}><LuSendHorizontal /></button>
              :
              <button className="absolute right-2 bottom-7.5 z-50 text-3xl cursor-pointer disabled:cursor-not-allowed" disabled={dBtnDisabled} onClick={() => abortCurrentChat()}><ImStop /></button>
          }
        </> : <Loading defaultIcon={true} loadingIconStyles="text-5xl" />
      }
    </div>
  );
}
