import jwt, { JwtPayload } from "jsonwebtoken";
import { NextRequest } from "next/server";

interface VerifyJWTResult {
  decoded?: JwtPayload | string;
  error: boolean;
  message: string;
  status: number;
}

export const verifyJWT = (req: NextRequest, tokenType: "Access" | "Refresh"): VerifyJWTResult => {
  const authorization = req.headers.get("authorization");

  if (!authorization) {
    return { error: true, message: "Unauthorized access. No authorization header.", status: 401 };
  }

  const parts = authorization.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return { error: true, message: "Invalid JWT token format.", status: 400 };
  }

  const token = parts[1];
  let tokenSecret;

  if (tokenType === "Access") tokenSecret = process.env.ACCESS_SECRET as string;
  else if (tokenType === "Refresh") tokenSecret = process.env.REFRESH_SECRET as string;

  if (!tokenSecret) return { error: true, message: "Not included token type.", status: 400 };

  try {
    const decoded = jwt.verify(token, tokenSecret);

    return { decoded, error: false, message: "", status: 200 };
  } catch (error) {
    console.error("JWT verification failed:", error);

    return { error: true, message: "Authorization error. Invalid or expired token.", status: 401 };
  }
}