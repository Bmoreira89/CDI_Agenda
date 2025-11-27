export { default } from "next-auth/middleware"

export const config = {
  matcher: ["/calendario/:path*", "/admin/:path*"]
}
