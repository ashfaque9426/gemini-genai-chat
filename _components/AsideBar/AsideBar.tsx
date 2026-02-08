"use client"
import useAuth from '@/hooks/useAuth';
import cn from '@/utils/clsx';
import { useEffect, useRef, useState } from 'react';
import { ImSpinner2, ImSpinner3 } from "react-icons/im";
import FormComp from './FormComp';
import { IoIosSettings } from 'react-icons/io';
interface asidebarTypes {
  asidebarStyles?: string
}
interface ItemObj {
  _id: string;
  uid: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

function AsideBar({ asidebarStyles }: asidebarTypes) {
  const [menuItems, setMenuItems] = useState<ItemObj[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(false);
  const [showFormIds, setShowFormIds] = useState<string[]>([]);
  const { convId, setConvId, generatingConvIds } = useAuth();
  const convIds = useRef<string[]>([]);

  useEffect(() => {
    if (firstLoad && !convId.reloadSession) return;

    const sortConv = () => {
      if (menuItems[0]._id === convId.conversationId) return;
      setLoading(true);
      const sortedConv = menuItems.find((itemObj: ItemObj) => itemObj._id === convId.conversationId);
      const otherConvs = menuItems.filter((itemObj: ItemObj) => itemObj._id !== convId.conversationId);
      if (sortedConv) setMenuItems([sortedConv, ...otherConvs]);
      setLoading(false);
    }

    const fetchConversations = async () => {
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

  }, [convId, firstLoad, menuItems]);

  return (
    <aside className={cn("px-2", asidebarStyles)}>
      <h2 className='text-2xl font-semibold'>Your Chats</h2>
      {
        loading && <ImSpinner3 className='text-xl animate-spin' />
      }

      {
        (!loading && menuItems.length > 0) && <ul>
          {
            menuItems.map((itemObj: ItemObj) => (<li onClick={() => setConvId(itemObj._id)} key={itemObj._id}>
              <div className='flex items-center gap-2'>
                <span className='text-lg'>{itemObj.title}</span>
                {
                  generatingConvIds.includes(itemObj._id) && <span><ImSpinner2 className='animate-spin' /></span>
                }

                {
                  !generatingConvIds.includes(itemObj._id) && !showFormIds.includes(itemObj._id) && <span>
                    <IoIosSettings onClick={() => setShowFormIds(prev => [...prev, itemObj._id])} />
                  </span>
                }

                {
                  showFormIds.includes(itemObj._id) && <FormComp title={itemObj.title} id={itemObj._id} setShowCIDS={setShowFormIds} />
                }
              </div>
            </li>))
          }
        </ul>
      }

      {
        (!loading && menuItems.length === 0) && <p className='text-xl font-semibold'>No Conversation Avalilable</p>
      }

    </aside>
  )
}

export default AsideBar;