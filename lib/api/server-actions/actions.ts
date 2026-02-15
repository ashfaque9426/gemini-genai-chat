"use server"

import connectToDB from "@/lib/mongodb";
import { cookies } from "next/headers";
import jwt from 'jsonwebtoken';
import { JWTPayload } from "@/utils/customMiddleware/verifyJWT";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import { Types } from "mongoose";
interface RTUD {
    success: boolean;
    message: string;
}

export async function updateconvTitle(convTitle: string): Promise<RTUD> {
    if (!convTitle || typeof convTitle !== "string") return { success: false, message: 'convTitle is required to perform this action.' };

    try {
        await connectToDB();
        const cookieStore = await cookies();

        const refreshToken = cookieStore.get("refreshToken");

        if (!refreshToken) {
            throw new Error("Refresh token not found.");
        }

        const tokenSecret = process.env.REFRESH_SECRET as string;

        if (!tokenSecret) throw new Error("Invalid token secret.");

        const decoded = jwt.verify(refreshToken.value, process.env.REFRESH_TOKEN_SECRET!) as JWTPayload;

        const result = await Conversation.updateOne({ uid: decoded.uid }, { title: convTitle });
        if (result.acknowledged && result.matchedCount === 0) throw new Error("No document found matching the UID in the database.");
        if (result.modifiedCount === 0) return { success: false, message: "Title already exists in the database." };
        return { success: true, message: "Title updated successfully." };
    }
    catch (err) {
        console.error(err);
        let message = "Unexpected server error occured during updating the convTitle.";
        if (err instanceof jwt.TokenExpiredError) message += "Err: Refresh Token expired.";
        if (err instanceof Error) message += "Err: " + err.message;

        return { success: false, message: message };
    }

}

export async function deleteConv(conversationId: string): Promise<RTUD> {
    if (!conversationId || !Types.ObjectId.isValid(conversationId)) return { success: false, message: 'Invalid Conversation id, A valid conversation id is required to perform this action.' };

    try {
        await connectToDB();
        const cookieStore = await cookies();

        const refreshToken = cookieStore.get("refreshToken");

        if (!refreshToken) {
            throw new Error("Refresh token not found.");
        }

        const tokenSecret = process.env.REFRESH_SECRET as string;

        if (!tokenSecret) throw new Error("Invalid token secret.");

        const decoded = jwt.verify(refreshToken.value, process.env.REFRESH_TOKEN_SECRET!) as JWTPayload;

        const convExists = await Conversation.exists({ uid: decoded.uid });
        const messageExists = await Message.exists({ uid: decoded.uid, conversationId: conversationId });

        if (!convExists || !messageExists) throw new Error("Conversation doesn't exist in the database.");

        await Message.deleteOne({ uid: decoded.uid, conversationId: conversationId });

        await Conversation.deleteOne({ uid: decoded.uid });

        return { success: true, message: "Conversation has been deleted successfully." };
    }
    catch (err) {
        console.error(err);
        let message = "Unexpected server error occured during deleting the Conversation.";
        if (err instanceof jwt.TokenExpiredError) message += "Err: Refresh Token expired.";
        if (err instanceof Error) message += "Err: " + err.message;

        return { success: false, message: message };
    }

}