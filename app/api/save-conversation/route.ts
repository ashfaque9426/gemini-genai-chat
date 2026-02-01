import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/utils/customMiddleware/verifyJWT";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { serverError } from "@/utils/utilityFunc/serverError";
import connectToDB from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import { Types } from "mongoose";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const jwtResult = verifyJWT(req, "Access");
        if (jwtResult.error) {
            throw new Error(jwtResult.message);
        }

        const userId = jwtResult.decoded ? jwtResult.decoded.uid : null;

        if (!userId) {
            throw new Error("User ID(uid) is required");
        }

        const { conversationId, userPrompt, responseText } = await req.json();

        if (!userPrompt || !responseText) {
            const errStr = !userPrompt ? "User prompt is required" : "Response text is required";
            throw new Error(errStr);
        }

        await connectToDB();

        let convId: Types.ObjectId;
        if (conversationId) {
            if (!Types.ObjectId.isValid(conversationId)) {
                throw new Error("Invalid conversationId");
            }

            const tempConvId = new Types.ObjectId(conversationId)

            const exists = await Conversation.exists({
                _id: tempConvId,
                uid: userId,
            });

            if (!exists) {
                throw new Error("Conversation not found or not owned by user.");
            }

            convId = tempConvId;
        }
        else {
            const model = genAI.getGenerativeModel({
                model: "gemini-3-flash-preview",
                systemInstruction: "You are a title generator. Create a concise, catchy title (max 5 words) based on the user's input. Do not use quotes or markdown."
            });

            const resObj = await model.generateContent(userPrompt);
            const title = resObj.response.text();

            const conversation = await Conversation.create({ uid: userId, title });
            convId = conversation._id;
        }


        await Message.create({
            conversationId: convId,
            uid: userId,
            role: 'user',
            content: userPrompt,
        });

        await Message.create({
            conversationId: convId,
            uid: userId,
            role: 'assistant',
            content: responseText,
        });

        return NextResponse.json({ conversationId: convId, error: false, message: "Conversation saved successfully." }, { status: 201 });
    }
    catch (err) {
        const { message, statusCode } = serverError('Server error occurred from /api/save-conversation.', 'No ', 'Invalid', 'expired', 'required', err, 401, 401, 401, 400);
        return NextResponse.json({ conversationId: null, error: true, message }, { status: statusCode });
    }
}