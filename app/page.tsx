import Header from '@/_components/Header/Header';
import ChatComp from '../_components/ChatComp/ChatComp';
// import Sidebar from '@/_components/Sidebar/Sidebar';

export default function Home() {
  return (
    <>
      <Header />
      <main role="main" className='flex h-[90vh] relative'>
        {/* <Sidebar sidebarStyles="absolute inset-0 z-50 2xl:relative 2xl:w-[20%] 2xl:h-full" /> */}
        
        <div className='flex-1 h-full'>
          <ChatComp chatCompStyles='w-[90%] 2xl:w-1/2 h-full mx-auto' />
        </div>
      </main>
    </>
  );
}
