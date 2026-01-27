import connectToDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyJWT } from '@/utils/customMiddleware/verifyJWT';
import { serverError } from '@/utils/utilityFunc/serverError';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const refreshToken = req.cookies.get("refreshToken")?.value;

        if (!refreshToken) {
            throw new Error("No refresh token found");
        }

        const { decoded, error, message } = verifyJWT(req, "Refresh");

        if (error) {
            throw new Error(message);
        }

        const { uid, userEmail } = await req.json();

        await connectToDB();

        const userInfo = await User.findOne({ uid, userEmail }).lean();

        if (!userInfo) {
            throw new Error("User not found in the database");
        }

        if (decoded && userInfo.userEmail !== decoded.userEmail) {
            throw new Error("Invalid user email.");
        }

        const response = NextResponse.json(
            { message: "Refresh Token cleared." },
            { status: 200 }
        );

        response.cookies.set({
            name: "refreshToken",
            value: "",
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/api",
            maxAge: 0,
            ...(process.env.NODE_ENV === "production" && {
                domain: process.env.SITE_DOMAIN,
            }),
        });

        return response;
    } catch (err) {
        const { message, statusCode } = serverError('Firebase Auth Error from /api/test-tokens', 'found', "Invalid", "No", "not found", err, 401, 401, 401, 404);
        return NextResponse.json({ message }, { status: statusCode });
    }
}