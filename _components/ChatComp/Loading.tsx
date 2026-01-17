import cn from "@/utils/clsx";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { SiAuthentik } from "react-icons/si";

interface LoadingProps {
    loadingParentStyles?: string;
    loadingIconStyles?: string;
    defaultIcon?: boolean;
    authIcon?: boolean;
}

function Loading({ loadingParentStyles, loadingIconStyles, defaultIcon, authIcon }: LoadingProps) {
    return (
        <div className={cn("h-full flex justify-center items-center", loadingParentStyles)}>
            { defaultIcon && <AiOutlineLoading3Quarters className={cn("animate-spin", loadingIconStyles)} /> }
            { authIcon && <SiAuthentik className={cn(loadingIconStyles)} /> }
            
        </div>
    )
}

export default Loading;