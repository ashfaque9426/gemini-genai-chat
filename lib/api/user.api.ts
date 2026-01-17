import { UserInfoData } from "@/providers/AuthProvider";
import { clientErrMsg } from "@/utils/utilityFunc/utilityFunc";

export async function saveUser(idToken: string, userInfo: UserInfoData): Promise<string> {
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
        const message = clientErrMsg(err, "Failed to save the user in the database. Err:");
        return message;
    }
}