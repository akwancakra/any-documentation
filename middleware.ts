import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/api/auth", "/api/health", "/docs"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/") || pathname === "/"
  );
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    if (token && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (!token && !isPublicRoute(pathname)) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (token) {
      const userRole = token.role as string;

      const adminOnlyRoutes = ["/editor", "/dashboard/login-logs"];
      const isAdminOnlyRoute = adminOnlyRoutes.some((route) =>
        pathname.startsWith(route)
      );

      if (isAdminOnlyRoute && userRole !== "admin") {
        return NextResponse.redirect(
          new URL("/dashboard?error=access-denied", req.url)
        );
      }

      const userAndAdminRoutes = ["/dashboard", "/docs"];
      const isUserAndAdminRoute = userAndAdminRoutes.some((route) =>
        pathname.startsWith(route)
      );

      if (isUserAndAdminRoute && !["user", "admin"].includes(userRole)) {
        return NextResponse.redirect(
          new URL("/login?error=invalid-role", req.url)
        );
      }

      if (pathname === "/") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        if (isPublicRoute(pathname)) return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api/auth (NextAuth routes)
     * - api/health (public health probe)
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     * - static image files
     */
    "/((?!api/auth|api/health|_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
