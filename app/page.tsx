import Header from '@/_components/Header/Header';
import ChatComp from '../_components/ChatComp/ChatComp';
// import AsideBar from '@/_components/ChatComp/AsideBar';

export default function Home() {
  return (
    <>
      <Header />
      <main role="main" className='h-[90vh]'>
        
        {/* <AsideBar asidebarStyles='w-[15%] border' /> */}
        <ChatComp chatCompStyles='w-[90%] 2xl:w-1/2 h-full mx-auto' />
      </main>
    </>
  );
}
