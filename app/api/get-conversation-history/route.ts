import Conversation from '@/models/Conversation';
import { verifyJWT } from '@/utils/customMiddleware/verifyJWT';
import { serverError } from '@/utils/utilityFunc/serverError';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const { decoded, error, message, status } = verifyJWT(req, "Access");
        if (error || !decoded) {
            return NextResponse.json({ conversations: null, message }, { status });
        }

        const start = req.nextUrl.searchParams.get("start");
        const end = req.nextUrl.searchParams.get("end");
        const parsedStart = start ? Number(start) : 0;
        const parsedEnd = end ? Number(end) : 10;
        const limit = parsedEnd - parsedStart;
        
        if (Number.isNaN(parsedStart) || Number.isNaN(parsedEnd)) {
            throw new Error("start and end values must be valid numbers.");
        }

        if (parsedStart < 0 || parsedEnd <= parsedStart) {
            throw new Error("Invalid range: end must be greater than start.");
        }

        const result = await Conversation.find({ uid: decoded.uid }).sort({ updatedAt: -1 }).skip(parsedStart).limit(limit).select("uid title createdAt updatedAt").lean();

        return NextResponse.json({ conversations: result, message: "" }, { status: 201 });
    }
    catch (err) {
        const { message, statusCode } = serverError("Error from /api/get-conversation-history.", "valid numbers", "Invalid range", "", "", err, 400, 400, 0, 0);
        return NextResponse.json({ conversations: null, message }, { status: statusCode });
    }
}