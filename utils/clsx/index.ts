import clsx from "clsx";
import { twMerge } from "tailwind-merge";

type CnInput = string | number | null | undefined | { [key: string]: boolean } | CnInput[];

type CnFunction = (...inputs: CnInput[]) => string;

const cn: CnFunction = (...allInputs) => {
    return twMerge(clsx(...allInputs));
};

export default cn;