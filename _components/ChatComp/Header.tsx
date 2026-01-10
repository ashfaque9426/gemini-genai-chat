"use client"

import { UserInfoData } from "@/providers/AuthProvider";
import Image from "next/image";
import Link from "next/link";

interface HeaderProps {
  contextLoading: boolean
  userInfo: UserInfoData | null,
}

function Header({ contextLoading, userInfo }: HeaderProps) {

  return (
    <header className='px-5 py-3.5'>
      <div className='flex justify-between items-center'>
        <Link href="/" className="text-2xl font-semibold">
          <h1>GenAI</h1>
        </Link>
        <section className='flex items-center gap-3'>
          { !(contextLoading && userInfo) && <button className='badge-dark'>Sign In With Google</button> }
          { (!contextLoading && userInfo) && <>
              <figure className="flex justify-center items-center gap-2.5">
                <figcaption>{userInfo.userName}</figcaption>
                <Image className="object-cover" src={userInfo.photoURL || '/assets/images/no_user.webp'} alt="User image" width={64} height={64} />
              </figure>
              <button className='badge-dark'>Signout</button>
          </> }
        </section>
      </div>
    </header>
  )
}

export default Header;