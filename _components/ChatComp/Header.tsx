import React from 'react'

function Header() {
  return (
    <header className='px-5 py-3.5'>
      <div className='flex justify-between items-center gap-3'>
        <div className='text-2xl font-semibold'>GenAI</div>
        <div className='flex items-center gap-3'>
          <button className='badge-dark'>Sign In With Google</button>
          <button className='badge-dark'>Signout</button>
        </div>
      </div>
    </header>
  )
}

export default Header