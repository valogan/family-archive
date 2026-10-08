import { NextRequest, NextResponse } from "next/server";
import {
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!process.env.AUTH_PASSWORD) {
    return NextResponse.json(
      { error: "Auth is not configured (set AUTH_PASSWORD)" },
      { status: 400 }
    );
  }
  try {
    const { password } = await req.json();
    if (typeof password !== "string" || !(await verifyPassword(password))) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }
    const { token, maxAge } = await createSessionToken();
    const https =
      req.headers.get("x-forwarded-proto") === "https" ||
      new URL(req.url).protocol === "https:";
    const res = NextResponse.json({ success: true });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: https,
      path: "/",
      maxAge,
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
