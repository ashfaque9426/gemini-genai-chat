import cn from '@/utils/clsx';

type asidebarTypes = {
    asidebarStyles?: string
}

function AsideBar({ asidebarStyles }: asidebarTypes) {
  return (
    <aside className={cn("px-2", asidebarStyles)}>AsideBar</aside>
  )
}

export default AsideBar