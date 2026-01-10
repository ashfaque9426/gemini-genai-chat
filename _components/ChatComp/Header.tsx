"use client"

import { UserInfoData } from "@/providers/AuthProvider";

interface HeaderProps {
  contextLoading: boolean
  userInfo: UserInfoData | null,
}

function Header({ contextLoading, userInfo }: HeaderProps) {

  return (
    <header className='px-5 py-3.5'>
      <div className='flex justify-between items-center gap-3'>
        <div className='text-2xl font-semibold'>GenAI</div>
        <div className='flex items-center gap-3'>
          { !(contextLoading && userInfo) && <button className='badge-dark'>Sign In With Google</button> }
          { (!contextLoading && userInfo) && <button className='badge-dark'>Signout</button> }
        </div>
      </div>
    </header>
  )
}

export default Header;