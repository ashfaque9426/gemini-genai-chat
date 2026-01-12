import { signJWTToken } from '@/lib/auth/signToken';
import { NextResponse } from 'next/server';

const isProd = process.env.NODE_ENV === "production";

export async function POST(req: Request) {
    try {
        const { uid, userEmail } = await req.json();

        if (!uid || !userEmail) throw new Error(`${(!uid && 'google user id') || (!userEmail && 'user email')} is required.`);

        const { refreshToken, accessToken, errMsg } = await signJWTToken(uid, userEmail, "RefreshAccess");
        if (!refreshToken) {
            throw new Error("Refresh token generation failed");
        } else if (!accessToken) {
            throw new Error("Access token generation failed");
        }

        if (errMsg) throw new Error(errMsg);

        const response = NextResponse.json({ accessToken }, { status: 200 });

        response.cookies.set({
            name: "refreshToken",
            value: refreshToken,
            httpOnly: true,
            sameSite: "lax",
            secure: isProd,
            path: "/api",
            maxAge: 7 * 24 * 60 * 60,
            ...(isProd && { domain: process.env.SITE_DOMAIN }),
        });

        return response;
    }
    catch (err) {
        let message = 'Server error occurred from /api/user-secrets. Err:';
        if (err instanceof Error) {
            message += err.message;
        }
        return NextResponse.json({ message }, { status: 400 });
    }
}