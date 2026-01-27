import { signJWTToken } from '@/lib/auth/signToken';
import { adminAuth } from '@/lib/firebase-admin';
import connectToDB from '@/lib/mongodb';
import { ACCESS_TOKEN_TTL_MS } from '@/utils/constants/constants';
import { serverError } from '@/utils/utilityFunc/serverError';
import { NextResponse } from 'next/server';

const isProd = process.env.NODE_ENV === "production";

export async function POST(req: Request) {
    try {
        await connectToDB();

        const { userEmail } = await req.json();
        if (!userEmail) throw new Error('User email is required.');

        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            throw new Error("Authorization error, Missing Firebase Token.");
        }
        const idToken = authHeader.split("Bearer ")[1];

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const email = decodedToken.email;

        if (email !== userEmail) {
            throw new Error("Authorization error, User email doesn't match with the decoded email from Firebase Token.");
        }

        const { refreshToken, accessToken, paymentTire, paymentExp, errMsg } = await signJWTToken(uid, userEmail, "RefreshAccess");
        if (!refreshToken) {
            throw new Error("Refresh token generation failed");
        } else if (!accessToken) {
            throw new Error("Access token generation failed");
        }

        if (errMsg) throw new Error(errMsg);
        const expirationTime = Date.now() + ACCESS_TOKEN_TTL_MS;

        const response = NextResponse.json({ accessToken, expiresAt: expirationTime, paymentTire, paymentExp }, { status: 200 });

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
        const { message, statusCode } = serverError('Server error occurred from /api/user-secrets.', 'required', 'User not found', 'Authorization error', 'expired', err, 400, 404, 401, 401);
        return NextResponse.json({ message }, { status: statusCode });
    }
}