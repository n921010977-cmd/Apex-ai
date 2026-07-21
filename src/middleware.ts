import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Uses the edge-safe config (no Credentials provider, no Node `crypto`/bcrypt/
// otplib) — middleware runs on the Edge Runtime and only needs to decode the
// session cookie for route gating, never to sign a user in. See
// src/auth.config.ts for why this must stay separate from src/auth.ts.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/report/:path*"],
};
