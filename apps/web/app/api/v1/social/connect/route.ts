import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const platform = request.nextUrl.searchParams.get('platform');
  return NextResponse.json({
    platform: platform,
    status: "OAuth flow endpoint",
    message: "Connect endpoint is ready"
  });
}
