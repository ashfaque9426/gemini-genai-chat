"use client"
import useAuth from '@/hooks/useAuth';
import cn from '@/utils/clsx';
import { useEffect, useRef, useState } from 'react';
import { ImSpinner2, ImSpinner3 } from "react-icons/im";
import FormComp from './FormComp';
import { IoIosSettings } from 'react-icons/io';
import { RxCross2 } from "react-icons/rx";

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
  const [showFormId, setShowFormId] = useState<string>("");
  const {userInfo, convId, setConvId, setShowSidebar, generatingConvIds } = useAuth();
  const convIds = useRef<string[]>([]);



  useEffect(() => {
    if (userInfo && firstLoad && !convId.reloadSession) return;

    const sortConv = () => {
      if (menuItems[0]._id === convId.conversationId) return;
      setLoading(true);
      const sortedConv = menuItems.find((itemObj: ItemObj) => itemObj._id === convId.conversationId);
      const otherConvs = menuItems.filter((itemObj: ItemObj) => itemObj._id !== convId.conversationId);
      if (sortedConv) setMenuItems([sortedConv, ...otherConvs]);
      setLoading(false);
    }

    const fetchConversations = async () => {
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
      // later will fetch the real array of documents
      await new Promise(resolve => setTimeout(resolve, 0));
      // filter _ids from result arrray them set the convIds.current
      convIds.current = [];
      setMenuItems([]);
      setLoading(false);
    };

    if (convId.conversationId && convIds.current.includes(convId.conversationId)) {
      sortConv();
    } else {
      fetchConversations();
    }

  }, [userInfo, convId, firstLoad, menuItems]);

  return (
    <aside className={cn("px-2", asidebarStyles)}>
      <span className='absolute top-1.5 right-1.5'><RxCross2 onClick={() => setShowSidebar(false)} className='text-xl font-semibold hover:cursor-pointer' /></span>
      {
        loading && <ImSpinner3 className='text-xl animate-spin' />
      }

      {
        (!loading && menuItems.length > 0) && <div className="flex flex-col h-full gap-2">
          <h2 className='text-2xl text-center font-semibold mb-2'>Your chats</h2>
          <ul className="flex-1 overflow-y-auto">
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
        </div>
      }

      {
        (!loading && menuItems.length === 0) && <p className='text-xl font-semibold'>No Conversation Avalilable</p>
      }

    </aside>
  )
}

export default AsideBar;