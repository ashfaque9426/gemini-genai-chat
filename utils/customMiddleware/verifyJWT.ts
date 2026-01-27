import jwt, { JwtPayload, TokenExpiredError, JsonWebTokenError  } from "jsonwebtoken";
import { NextRequest } from "next/server";

interface VerifyJWTResult {
  decoded?: JWTPayload;
  error: boolean;
  message: string;
  status: number;
}

interface JWTPayload extends JwtPayload {
  uid: string;
  userEmail: string;
}


export const verifyJWT = (req: NextRequest, tokenType: "Access" | "Refresh"): VerifyJWTResult => {
  let token: string = "";

  if (tokenType === "Access") {
    const authorization = req.headers.get("authorization");
    if (!authorization) {
      return { error: true, message: "No Authorization header.", status: 401 };
    }

    const parts = authorization.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return { error: true, message: "Invalid JWT token format.", status: 400 };
    }

    token = parts[1];
  } else if (tokenType === "Refresh") {
    const refreshToken = req.cookies.get("refreshToken")?.value;
    if (!refreshToken) {
      return { error: true, message: "No refresh token cookie.", status: 401 };
    }

    token = refreshToken;
  }

  let tokenSecret;

  if (tokenType === "Access") tokenSecret = process.env.ACCESS_SECRET as string;
  else if (tokenType === "Refresh") tokenSecret = process.env.REFRESH_SECRET as string;

  if (!tokenSecret) return { error: true, message: "Not included token type.", status: 500 };

  try {
    const decoded = jwt.verify(token, tokenSecret) as JWTPayload;

    return { decoded, error: false, message: "", status: 200 };
  } catch (error) {
    console.error("JWT verification failed:", error);

    if (error instanceof TokenExpiredError) {
      return { error: true, message: `Authorization error. ${tokenType} Token expired.`, status: 401 };
    } 
    else if (error instanceof JsonWebTokenError) {
      return { error: true, message: `Authorization error. Invalid ${tokenType} Token.`, status: 401 };
    }

    return { error: true, message: `Authorization error. Invalid or expired ${tokenType} Token.`, status: 401 };
  }
}