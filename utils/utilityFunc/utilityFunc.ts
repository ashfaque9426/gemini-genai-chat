import { Bounce, toast, ToastOptions } from "react-toastify";
import { lsUserInfoStr } from "../constants/constants";

type ErrorInput = Error | { message?: string } | unknown;
type Email = string & {
  readonly email: "A valid email address as defined by RFC 5322 (mostly).";
};

const emailRegex: RegExp = new RegExp(
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
);

export function isValidEmail(email: string): email is Email {
  return emailRegex.test(email);
}


export function clientErrMsg(err: ErrorInput, errStr: string): string {
    console.error(errStr, err);
    let message = errStr;
    if (err instanceof Error) {
        message += err.message;
    }

    return message;
}

export function isAccessTokenValid() {
  const userInfo = localStorage.getItem(lsUserInfoStr);
  if (!userInfo) return false;
  const parsedUserInfo = JSON.parse(userInfo);

  return Date.now() < Number(parsedUserInfo.expiresAt);
};


export function showToastMst(toastType: 'success' | 'error' | 'warning', toastMsg: string) {
    const toastConfig: ToastOptions = {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
    };
    
    if (toastType === 'success') {
        toast.success(toastMsg, toastConfig);
    } else if (toastType === 'error') {
        toast.error(toastMsg, toastConfig);
    } else if (toastType === 'warning') {
        toast.warn(toastMsg, toastConfig);
    }
}