import { NextResponse } from "next/server";
import { getSessionCookieName, revokeRequestSession } from "@/lib/admin-auth";
import { requireTrustedMutationOrigin } from "@/lib/api-security";

export async function POST(request: Request) {
  const originError = requireTrustedMutationOrigin(request);
  if (originError) {
    return originError;
  }

  await revokeRequestSession(request);

  const response = NextResponse.json({ success: true });
  response.cookies.set(getSessionCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0
  });

  return response;
}
