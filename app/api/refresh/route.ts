import { signJWTToken } from '@/lib/auth/signToken';
import { verifyJWT } from '@/utils/customMiddleware/verifyJWT';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { uid, userEmail } = await req.json();
        if (!uid || !userEmail) throw new Error(`${(!uid && 'google user id') || (!userEmail && 'user email')} is required.`);

        const { decoded, error, message, status } = verifyJWT(req, "Refresh");

        if (error) {
            return NextResponse.json({ message }, { status });
        }

        if (!decoded || typeof decoded !== 'object' || !('uid' in decoded) || !('userEmail' in decoded)) {
            throw new Error("Decoded token is invalid or missing required fields.");
        }
        const { accessToken, errMsg } = await signJWTToken(decoded.uid, decoded.userEmail, "Access");

        if (errMsg) throw new Error(errMsg);

        if (!accessToken) {
            throw new Error("Access token generation failed");
        }

        return NextResponse.json({ accessToken }, { status: 200 });
    }
    catch (err) {
        let message = 'Server error occurred from /api/refresh. Err:';
        if (err instanceof Error) {
            message += err.message;
        }
        return NextResponse.json({ message }, { status: 400 });
    }
}