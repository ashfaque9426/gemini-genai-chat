import { GoogleImageUrl } from "@/models/User";
import { clientErrMsg, isValidEmail } from "@/utils/utilityFunc/utilityFunc";

interface UserInfoData {
    uid: string;
    userName: string;
    userEmail: string | null;
    photoURL: GoogleImageUrl;
    sessionType: string;
}

export async function saveUser(idToken: string, userInfo: UserInfoData): Promise<string> {
    try {
        if (!userInfo || typeof userInfo.userEmail !== "string" || !isValidEmail(userInfo.userEmail)) {
            const errStr = !userInfo ? "User info Object parameter value is required" : "The provided user email is invalid";
            throw new Error(errStr);
        }

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
        const message = clientErrMsg(err, "Failed to save the user in the database. Err:");
        return message;
    }
}