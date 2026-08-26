import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  const validUsername = process.env.STAFF_USERNAME;
  const validPassword = process.env.STAFF_PASSWORD;
  const secret = process.env.STAFF_SESSION_SECRET;

  if (!validUsername || !validPassword || !secret) {
    return NextResponse.json(
      { error: "Staff login isn't configured yet." },
      { status: 500 },
    );
  }

  // Plain comparison, not timing-safe: this gates a low-stakes internal tool with one shared
  // credential pair, not a target worth defending against a timing attack.
  if (username !== validUsername || password !== validPassword) {
    return NextResponse.json(
      { error: "Incorrect username or password." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("staff_session", secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("staff_session");
  return response;
}
