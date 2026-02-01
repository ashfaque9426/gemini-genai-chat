import Conversation from "@/models/Conversation";
import { verifyJWT } from "@/utils/customMiddleware/verifyJWT";
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { serverError } from "@/utils/utilityFunc/serverError";

export async function GET(req: NextRequest) {
    try {
        const { decoded, error, message, status } = verifyJWT(req, "Access");
        if (error || !decoded) {
            return NextResponse.json({ item: null, message }, { status });
        }

        const convId = req.nextUrl.searchParams.get("convId");
        if (!convId) {
            throw new Error("Conversation Id search param value is required.");
        }
        else if (!Types.ObjectId.isValid(convId)) {
            throw new Error("Invalid Conversation ID.");
        }

        const convID = new Types.ObjectId(convId);

        const result = await Conversation.findOne({ uid: decoded.uid, conversationId: convID }).lean();

        if (!result) {
            throw new Error("No conversation found.");
        }

        return NextResponse.json({ item: result, message: "" }, { status: 201 });
    }
    catch (err) {
        const { message, statusCode } = serverError("Error from /api/get-conversation", "Invalid", "required", "found", "No ", err, 400, 400, 404, 0);
        return NextResponse.json({ item: null, message }, { status: statusCode });
    }
}
