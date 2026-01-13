import { NextResponse } from "next/server";
import User from "@/models/User";
import { adminAuth } from "@/lib/firebase-admin";
import { serverError } from "@/utils/utilityFunc/serverError";
import connectToDB from "@/lib/mongodb";

export async function POST(req: Request) {
    try {
        await connectToDB();

        const { userName, userEmail, photoURL, sessionType } = await req.json();
        if (!userName || !userEmail || !photoURL || !sessionType) {
            throw new Error(`${(!userName && 'User Name') || (!userEmail && 'User Email') || (!sessionType && 'Session Type')} is required.`);
        }

        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            throw new Error("Authorization error, Missing Firebase Token. Unauthorized Access.");
        }
        const idToken = authHeader.split("Bearer ")[1];

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const firebaseUser = await adminAuth.getUser(uid);

        if (!firebaseUser) {
            throw new Error("User not found in Firebase");
        }

        const userData = await User.findOne({ uid, userEmail }).lean();

        if (userData) {
            return NextResponse.json({ message: "User already exits in the Database." }, { status: 409 });
        }

        const imageUrl = photoURL ? photoURL : null;

        await User.create({ uid, userName, userEmail, photoURL: imageUrl, sessionType });
        return NextResponse.json({ message: "User is verified and successfully saved to the database." }, { status: 200 });

    } catch (error) {
        const { message, statusCode } = serverError('Firebase Auth Error from /api/save-user', 'Authorization error', 'User not found', 'is expired', 'is required', error, 401, 404, 401, 400);
        return NextResponse.json({ message }, { status: statusCode });
    }
}
