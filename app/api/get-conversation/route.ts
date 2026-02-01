import { verifyJWT } from "@/utils/customMiddleware/verifyJWT";
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { serverError } from "@/utils/utilityFunc/serverError";
import Message from "@/models/Message";

export async function GET(req: NextRequest) {
    try {
        const { decoded, error, message, status } = verifyJWT(req, "Access");
        if (error || !decoded) {
            return NextResponse.json({ messages: null, message }, { status });
        }

        const convId = req.nextUrl.searchParams.get("convId");
        if (!convId) {
            throw new Error("Conversation Id search param value is required.");
        }
        else if (!Types.ObjectId.isValid(convId)) {
            throw new Error("Invalid Conversation ID.");
        }

        const convID = new Types.ObjectId(convId);

        const result = await Message.find({ conversationId: convID, uid: decoded.uid }).select("role content -_id").lean();

        if (!result.length) {
            throw new Error("Unable to find messages. Please try again later");
        }

        return NextResponse.json({ messages: result, message: "" }, { status: 201 });
    }
    catch (err) {
        const { message, statusCode } = serverError("Error from /api/get-conversation", "Invalid", "required", "find", "", err, 400, 400, 404, 0);
        return NextResponse.json({ messages: null, message }, { status: statusCode });
    }
}
