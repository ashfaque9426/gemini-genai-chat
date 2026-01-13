import { UserInfoData } from "@/providers/AuthProvider";
import { lsUserInfoStr } from "../constants/constants";

interface TokenType {
    token: string | null,
    message: string | null
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

    if (userInfo) {
        const parsedUserInfo: UserInfoData = JSON.parse(userInfo);
        const userEmail = parsedUserInfo.userEmail;
        console.log(userEmail);
    }

    return dataObj;
}

export async function issueUserSecret(idToken: string, userEmail: string): Promise<TokenType> {
    console.log(idToken, userEmail);
    const dataObj: TokenType = {
        token: null,
        message: null
    };
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
        console.error("Failed to save the user. Err:", err);
        let message = "Failed to save the user to the databse. ";
        if (err instanceof Error) {
            message += err.message;
        }

        return message;
    }
}