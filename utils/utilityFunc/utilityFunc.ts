import { UserInfoData } from "@/providers/AuthProvider";
import { lsUserInfoStr } from "../constants/constants";

interface TokenType {
    token: string | null,
    message: string | null
}

type ErrorInput = Error | { message?: string } | unknown;

function errMsg(err: ErrorInput, errStr: string): string {
    console.error(errStr, err);
    let message = errStr;
    if (err instanceof Error) {
        message += err.message;
    }

    return message;
}

export async function refreshAccessToken(): Promise<TokenType> {
    const userInfo = localStorage.getItem(lsUserInfoStr);
    const dataObj: TokenType = {
        token: null,
        message: null
    };

    if (!userInfo) {
        dataObj['message'] = "User info not found in the local stroage.";
        return dataObj;
    }

    const parsedUserInfo: UserInfoData = JSON.parse(userInfo);

    try {
        const response = await fetch('/api/refresh', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(parsedUserInfo)
        });

        const result = await response.json();
        dataObj["token"] = result.accessToken;
    } catch (err) {
        const message = errMsg(err, "Failed to refresh the access token. Err:");
        dataObj["message"] = message;
    }

    return dataObj;
}

export async function issueUserSecret(idToken: string, userEmail: string): Promise<TokenType> {
    const dataObj: TokenType = {
        token: null,
        message: null
    };

    if (!idToken || !userEmail) {
        dataObj["message"] = !idToken ? "idToken param value as string is required." : "userEmail Param value as string is required.";
        return dataObj;
    }

    try {
        const response = await fetch("/api/user-secrets", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`
            },
            body: JSON.stringify({ userEmail })
        });

        const result = await response.json();
        dataObj["token"] = result.accessToken;
    } catch (err) {
        const message = errMsg(err, "Failed to refresh the access token. Err:");
        dataObj["message"] = message;
    }

    return dataObj;
}

export async function saveUser(idToken: string, userInfo: UserInfoData) {
    try {
        const response = await fetch("/api/save-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`
            },
            body: JSON.stringify(userInfo)
        });

        const result = await response.json();
        return result.message;
    } catch (err) {
        const message = errMsg(err, "Failed to save the user in the database. Err:");
        return message;
    }
}