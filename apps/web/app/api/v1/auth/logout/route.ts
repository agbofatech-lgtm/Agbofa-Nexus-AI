import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("agbofa_session", "", { httpOnly: true, path: "/", maxAge: 0 });
  response.cookies.set("agbofa_refresh", "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
