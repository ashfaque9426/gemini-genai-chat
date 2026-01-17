import { UserInfoData } from "@/providers/AuthProvider";
import { lsUserInfoStr } from "@/utils/constants/constants";
import { clientErrMsg } from "@/utils/utilityFunc/utilityFunc";

interface TokenType {
    token: string | null,
    message: string | null
}

export async function refreshAccessToken(): Promise<TokenType> {
    const dataObj: TokenType = {
        token: null,
        message: null
    };

    try {
        const userInfo = localStorage.getItem(lsUserInfoStr);

        if (!userInfo) {
            throw new Error("User info not found in the local stroage.");
        }

        const parsedUserInfo: UserInfoData = JSON.parse(userInfo);
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
        const message = clientErrMsg(err, "Failed to refresh the access token. Err:");
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
        const message = clientErrMsg(err, "Failed to refresh the access token. Err:");
        dataObj["message"] = message;
    }

    return dataObj;
}