import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  return NextResponse.json({
    code: code ? "received" : "missing",
    state: state ? "received" : "missing",
    message: "Callback endpoint is ready"
  });
}
