"use client"
import Header from '@/_components/ChatComp/Header';
import ChatComp from '../_components/ChatComp/ChatComp';
import useAuth from '@/hooks/useAuth';
// import AsideBar from '@/_components/ChatComp/AsideBar';

export default function Home() {
  const { contextLoading, userInfo } = useAuth();
  return (
    <>
      <Header contextLoading={contextLoading} userInfo={userInfo} />
      <main role="main" className='h-[90vh]'>
        
        {/* <AsideBar asidebarStyles='w-[15%] border' /> */}
        <ChatComp chatCompStyles='w-[90%] 2xl:w-1/2 h-full mx-auto' contextLoading={contextLoading} />
      </main>
    </>
  );
}
