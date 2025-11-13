import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get("authorization");
  const USER = process.env.BASIC_AUTH_USER || "";
  const PASS = process.env.BASIC_AUTH_PASS || "";

  if (basicAuth) {
    const auth = basicAuth.split(" ")[1];
    const [user, pwd] = Buffer.from(auth, "base64").toString().split(":");
    if (user === USER && pwd === PASS) return NextResponse.next();
  }
  return new NextResponse("Auth required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
  });
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\.(png|jpg|svg|css|js)).*)"]
};