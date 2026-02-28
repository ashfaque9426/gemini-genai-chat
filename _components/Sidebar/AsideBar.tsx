"use client"
import useAuth from '@/hooks/useAuth';
import cn from '@/utils/clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ImSpinner2, ImSpinner3 } from "react-icons/im";
import FormComp from './FormComp';
import { IoIosSettings } from 'react-icons/io';
import { IoAdd } from "react-icons/io5";
import { RxCross2 } from "react-icons/rx";
import useAxiosSecure from '@/hooks/useAxiosSecure';
import { showToastMsg } from '@/utils/utilityFunc/utilityFunc';

interface asidebarProps {
  asidebarStyles?: string;
}

interface ItemObj {
  _id: string;
  uid: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

function AsideBar({ asidebarStyles }: asidebarProps) {
  const [menuItems, setMenuItems] = useState<ItemObj[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(false);
  const [fetchMore, setFetchMore] = useState(false);
  const [showFormId, setShowFormId] = useState<string>("");
  const { userInfo, convId, setConvId, setShowSidebar, generatingConvIds } = useAuth();
  const convIds = useRef<string[]>([]);
  const convStartEnd = useRef({ start: 0, end: 10 });
  const titlesRef = useRef<HTMLUListElement | null>(null);

  const axiosSecure = useAxiosSecure();

  const fetchConv = useCallback(async (calledFrm: "fetchConvs" | "fetchMore") => {
    if (!userInfo) {
        setMenuItems([]);
        setShowFormId("");
        setFirstLoad(false);
        setLoading(false);
        convIds.current = [];
        return;
      }
      setFirstLoad(true);
      setLoading(true);

      if (calledFrm === "fetchConvs") convStartEnd.current.start = 0;
      const { conversations, message } = (await axiosSecure.get(`/get-conversation-history?start${convStartEnd.current.start}&end=${convStartEnd.current.end}`)).data;

      if (message) {
        showToastMsg("error", message);
        setLoading(false);
        return;
      }

      if (conversations) {
        const filteredIds = conversations.map((item: ItemObj) => item._id);
        convIds.current = filteredIds;
        setMenuItems(conversations);
        setLoading(false);
      }
  }, [userInfo, axiosSecure]);

  useEffect(() => {
    const fetchConversations = async () => {
      await fetchConv("fetchMore");
      setFetchMore(false);
    }
    if (fetchMore) {
      fetchConversations();
    }
  }, [fetchMore, fetchConv]);

  useEffect(() => {
    const elem = titlesRef.current;
    if (!elem) return;

    const handleScroll = () => {
      if (elem.scrollTop + elem.clientHeight >= elem.scrollHeight - 5) {
        convStartEnd.current.start += 10;
        convStartEnd.current.end += 10;
        setFetchMore(true);
      }
    };

    elem.addEventListener("scroll", handleScroll);

    return () => {
      elem.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (userInfo && firstLoad && (!convId.reloadSession && !convId.sort)) return;

    const sortConv = () => {
      if (menuItems[0]._id === convId.conversationId) return;
      setLoading(true);
      const sortedConv = menuItems.find((itemObj: ItemObj) => itemObj._id === convId.conversationId);
      const otherConvs = menuItems.filter((itemObj: ItemObj) => itemObj._id !== convId.conversationId && itemObj.title !== "New Chat");
      if (sortedConv) setMenuItems([sortedConv, ...otherConvs]);
      setLoading(false);
    }

    const fetchConversations = async () => {
      await fetchConv("fetchConvs");
    }


    if (convId.conversationId && convIds.current.includes(convId.conversationId)) {
      sortConv();
    } else {
      fetchConversations();
    }

  }, [userInfo, convId, firstLoad, menuItems, fetchConv]);

  return (
    <aside className={cn("px-2", asidebarStyles)}>
      <span className='absolute top-1.5 right-1.5'><RxCross2 onClick={() => setShowSidebar(false)} className='text-xl font-semibold hover:cursor-pointer' /></span>
      {
        loading && <ImSpinner3 className='text-xl animate-spin' />
      }

      {
        (!loading && menuItems.length > 0) && <div className="flex flex-col h-full gap-2">
          <h2 className='text-2xl text-center font-semibold mb-2'>Your chats</h2>
          
          <button onClick={() => setMenuItems(prev => {
            if (prev[0].title !== "New Chat") return prev;
            return [{_id: "", uid: "", title: "New Chat", createdAt: "", updatedAt: ""}, ...prev];
          })} className='self-end text-2xl font-semibold' ><IoAdd /></button>

          <ul ref={titlesRef} className="flex-1 overflow-y-auto">
            {
              menuItems.map((itemObj: ItemObj) => (<li onClick={() => setConvId(itemObj._id)} key={itemObj._id}>
                <div className='flex items-center gap-2'>
                  <span className='text-lg'>{itemObj.title}</span>
                  {
                    generatingConvIds.includes(itemObj._id) && <span><ImSpinner2 className='animate-spin' /></span>
                  }

                  {
                    (!generatingConvIds.includes(itemObj._id) && showFormId !== itemObj._id) && <span>
                      <IoIosSettings onClick={() => setShowFormId(itemObj._id)} />
                    </span>
                  }

                  {
                    (showFormId === itemObj._id) && <FormComp title={itemObj.title} id={itemObj._id} setShowCID={setShowFormId} />
                  }
                </div>
              </li>))
            }
          </ul>

          {
            fetchMore && <ImSpinner3 className='text-xl animate-spin' />
          }
        </div>
      }

      {
        (!loading && menuItems.length === 0) && <p className='text-xl font-semibold'>No Conversation Avalilable</p>
      }

    </aside>
  )
}

export default AsideBar;