import User from "@/models/User";
import jwt from "jsonwebtoken";

interface ReturnType {
    refreshToken: string | null,
    accessToken: string | null,
    errMsg: string | null
}

export async function signJWTToken(uid: string, userEmail: string, tokenType: 'Access' | 'Refresh' | 'RefreshAccess'): Promise<ReturnType> {
    if (!uid || !userEmail || !tokenType) return { refreshToken: null, accessToken: null, errMsg: `${(!uid && 'uid parameter value') || (!userEmail && 'userEmail parameter value') || (!tokenType && 'tokenType parameter value')} is required.` }
    try {
        const result = await User.findOne({ uid: uid, userEmail: userEmail });
        if (!result) {
            throw new Error('User not found.');
        }
        const payload = { uid: result.uid, userEmail: result.userEmail };
        const tokenObj: ReturnType = { refreshToken: null, accessToken: null, errMsg: null };
        const refreshExpire = '7d';
        const accessExpire = '3h';

        if (!process.env.REFRESH_SECRET) {
            throw new Error('REFRESH_SECRET environment variable is not defined.');
        }

        if (!process.env.ACCESS_SECRET) {
            throw new Error('ACCESS_SECRET environment variable is not defined.');
        }

        if (tokenType === "Refresh") {
            const token = jwt.sign(payload, process.env.REFRESH_SECRET as string, { expiresIn: refreshExpire });
            tokenObj['refreshToken'] = token;
        }
        else if (tokenType === "Access") {
            const token = jwt.sign(payload, process.env.ACCESS_SECRET as string, { expiresIn: accessExpire });
            tokenObj['accessToken'] = token;
        }
        else if (tokenType === "RefreshAccess") {
            const refresh = jwt.sign(payload, process.env.REFRESH_SECRET as string, { expiresIn: refreshExpire });
            const access = jwt.sign(payload, process.env.ACCESS_SECRET as string, { expiresIn: accessExpire });
            tokenObj['refreshToken'] = refresh;
            tokenObj['accessToken'] = access;
        }

        return tokenObj;
    }
    catch (err) {
        console.log(err);
        let errMsg = 'A sign JWT error occurred. Err:';
        if (err instanceof Error) {
            errMsg += err.message;
        }
        return { refreshToken: null, accessToken: null, errMsg };
    }
}