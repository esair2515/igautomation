import { NextRequest, NextResponse } from "next/server";
export function middleware(request: NextRequest) { if (!request.cookies.has("social_ops_session")) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(request.nextUrl.pathname)}`, request.url)); return NextResponse.next(); }
export const config = { matcher: ["/dashboard/:path*", "/team/:path*", "/settings/:path*"] };
