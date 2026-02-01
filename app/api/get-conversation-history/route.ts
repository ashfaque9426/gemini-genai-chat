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

        const result = await Conversation.find({ uid: decoded.uid }).lean();

        return NextResponse.json({ conversations: result, message: "" }, { status: 201 });
    }
    catch(err) {
        const { message, statusCode } = serverError("Error from /api/get-conversation-history.", "", "", "", "", err, 0, 0, 0, 0);
        return NextResponse.json({ conversations: null, message }, { status: statusCode });
    }
}