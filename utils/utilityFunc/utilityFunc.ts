export async function refreshAccessToken(): Promise<string> {
    return "";
}

export async function issueUserSecret(uid: string, userEmail: string): Promise<string> {
    console.log(uid, userEmail);
    return "";
}

export async function saveUser(idToken: string, userEmail: string, sessionType: string) {
    try {
        const response = await fetch("/api/save-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`
            },
            body: JSON.stringify({
                userEmail: userEmail,
                sessionType: sessionType
                // Do NOT send the UID in the body; extract it from the token on the server
            })
        });

        const result = await response.json();
        return result.message;
    } catch (err) {
        console.error("Failed to save the user. Err:", err);
        let message = "Failed to save the user. Err:";
        if (err instanceof Error) {
            message += err.message;
        }

        return message;
    }
}