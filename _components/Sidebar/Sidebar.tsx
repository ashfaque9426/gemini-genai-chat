"use client";

import { Activity, useEffect } from "react";
import AsideBar from "./AsideBar";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import useAuth from "@/hooks/useAuth";

interface SidebarProps {
    sidebarStyles?: string;
}

function Sidebar({ sidebarStyles }: SidebarProps) {
    const { userInfo, showSidebar, setShowSidebar } = useAuth();
    const deviceType = useDeviceDetection();

    useEffect(() => {
        const setShowState = (state: boolean) => {
            setShowSidebar(state);
        }

        if (!userInfo) {
            setShowSidebar(false);
            return;
        }

        if (deviceType === "desktop") {
            setShowState(true);
        }
        else if (deviceType === "mobile" || deviceType === "tablet") {
            setShowState(false);
        }
    }, [userInfo, deviceType, setShowSidebar]);

    return (
        <Activity mode={showSidebar ? "visible" : "hidden"}>
            <AsideBar asidebarStyles={sidebarStyles} />
        </Activity>
    )
}

export default Sidebar;