import { signJWTToken } from '@/lib/auth/signToken';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { uid, userEmail } = await req.json();
        if (!uid || !userEmail) throw new Error(`${(!uid && 'google user id') || (!userEmail && 'user email')} is required.`);

        const { accessToken, errMsg } = await signJWTToken(uid, userEmail, "Access");

        if (!accessToken) {
            throw new Error("Access token generation failed");
        }

        if (errMsg) throw new Error(errMsg);

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