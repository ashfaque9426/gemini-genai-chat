import { NextResponse } from "next/server";
import User from "@/models/User";
import { adminAuth } from "@/lib/firebase-admin";
import { serverError } from "@/utils/utilityFunc/serverError";

export async function POST(req: Request) {
    try {
        const { userName, userEmail, photoURL, sessionType } = await req.json();
        if (!userName || !userEmail || !photoURL || !sessionType) {
            throw new Error(`${(!userName && 'User Name') || (!userEmail && 'User Email') || (!sessionType && 'Session Type')} is required.`);
        }

        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            throw new Error("Missing Firebase Token");
        }
        const idToken = authHeader.split("Bearer ")[1];

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const firebaseUser = await adminAuth.getUser(uid);

        const imageUrl = photoURL ? photoURL : null;

        if (firebaseUser) {
            await User.create({ uid: uid, userName, userEmail, photoURL: imageUrl, sessionType });
            return NextResponse.json({ message: "User is verified and successfully saved to the database." }, { status: 200 });
        }

        return NextResponse.json({ error: "User not found in Firebase" }, { status: 404 });

    } catch (error) {
        const { message, statusCode } = serverError('Firebase Auth Error from /api/save-user', 'Missing Firebase Token', 'User not found', 'is expired', 'is required', error, 401, 404, 401, 400);
        return NextResponse.json({ message }, { status: statusCode });
    }
}
