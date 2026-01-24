import { NextResponse } from "next/server";
import User, { GoogleImageUrl } from "@/models/User";
import { adminAuth } from "@/lib/firebase-admin";
import { serverError } from "@/utils/utilityFunc/serverError";
import connectToDB from "@/lib/mongodb";

interface ResponseObjType {
    userName: string;
    userEmail: string;
    photoURL: GoogleImageUrl;
    sessionType: string;
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            throw new Error("Authorization error, Missing Firebase Token. Unauthorized Access.");
        }

        const idToken = authHeader.split("Bearer ")[1];

        await connectToDB();

        const { userName, userEmail, photoURL, sessionType }: ResponseObjType = await req.json();
        if (!userName || !userEmail || !sessionType) {
            throw new Error(`${(!userName && 'User Name') || (!userEmail && 'User Email') || (!sessionType && 'Session Type')} is required.`);
        }

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const firebaseUser = await adminAuth.getUser(uid);

        if (!firebaseUser) {
            throw new Error("User not found in Firebase");
        }

        const userData = await User.findOne({ uid, userEmail }).lean();

        if (userData) {
            return NextResponse.json({ message: "User already exits in the Database." }, { status: 200 });
        }

        await User.create({ uid, userName, userEmail, photoURL, sessionType });
        return NextResponse.json({ message: "User is verified and successfully saved to the database." }, { status: 200 });

    } catch (error) {
        const { message, statusCode } = serverError('Firebase Auth Error from /api/save-user', 'Authorization error', 'User not found', 'is expired', 'is required', error, 401, 404, 401, 400);
        return NextResponse.json({ message }, { status: statusCode });
    }
}
