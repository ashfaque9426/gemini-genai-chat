"use client"
import useAuth from "@/hooks/useAuth";
import Image from "next/image";
import Link from "next/link";
import Loading from "./Loading";

function Header() {
  const { contextLoading, userInfo, googlePopup, logOut } = useAuth();

  const photoURL = userInfo?.photoURL ?? '/assets/images/no_user.webp';
  const userName = userInfo?.userName && userInfo.userName.length > 16 ? userInfo.userName.slice(0, 15) + "..." : userInfo?.userName;
  
  return (
    <header className='px-5 py-3.5'>
      <div className='flex justify-between items-center'>
        <Link href="/" className="text-2xl font-semibold">
          <h1>GenAI</h1>
        </Link>
        <section className='flex items-center gap-3'>
          { (contextLoading && !userInfo) && <Loading authIcon={true} loadingParentStyles="pe-16" loadingIconStyles="text-[40px]" />}
          { (!contextLoading && !userInfo) && <button onClick={googlePopup} disabled={userInfo || undefined} className='badge-dark'>Sign In With Google</button> }
          { (!contextLoading && userInfo) && <>
              <figure className="flex justify-center items-center gap-2.5">
                <figcaption className="text-lg font-semibold" >{userName}</figcaption>
                <Image className="object-cover rounded-full" src={photoURL} alt="User image" width={40} height={40} />
              </figure>
              <button onClick={logOut} className='badge-dark'>Signout</button>
          </> }
        </section>
      </div>
    </header>
  )
}

export default Header;