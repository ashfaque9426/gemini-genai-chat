import { signJWTToken } from '@/lib/auth/signToken';
import connectToDB from '@/lib/mongodb';
import { verifyJWT } from '@/utils/customMiddleware/verifyJWT';
import { serverError } from '@/utils/utilityFunc/serverError';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        await connectToDB();

        const { userEmail } = await req.json();
        if (!userEmail) throw new Error('User email is required.');

        const { decoded, error, message, status } = verifyJWT(req, "Refresh");

        if (error) {
            return NextResponse.json({ message }, { status });
        }

        if (!decoded || typeof decoded !== 'object' || !('uid' in decoded) || !('userEmail' in decoded)) {
            throw new Error("Decoded token fields are invalid.");
        }

        if (decoded.userEmail !== userEmail) {
            throw new Error("User Email doesn't match with decoded User Email. Unauthorized Access.");
        }

        const { accessToken, errMsg } = await signJWTToken(decoded.uid, decoded.userEmail, "Access");

        if (errMsg) throw new Error(errMsg);

        if (!accessToken) {
            throw new Error("Access token generation failed");
        }

        return NextResponse.json({ accessToken }, { status: 200 });
    }
    catch (err) {
        const { message, statusCode } = serverError('Server error occurred from /api/refresh.', 'required', 'Unauthorized Access', 'Authorization error', 'User not found', err, 400, 401, 401, 404);
        return NextResponse.json({ message }, { status: statusCode });
    }
}