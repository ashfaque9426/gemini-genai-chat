"use client"
import cn from '@/utils/clsx';
interface asidebarTypes {
    asidebarStyles?: string
}

function AsideBar({ asidebarStyles }: asidebarTypes) {
  return (
    <aside className={cn("px-2", asidebarStyles)}>AsideBar</aside>
  )
}

export default AsideBar