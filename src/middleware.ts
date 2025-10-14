import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
// Define public routes here
const publicRoutes = ['/', "/sign-in(.*)", '/api/webhook']

// Create a matcher for public routes
const isPublicRoute = createRouteMatcher(publicRoutes)

export default clerkMiddleware(async (auth, req) => {
  // Protect all routes except the ones in the publicRoutes array
  if (!isPublicRoute(req)) {
    await auth.protect() // Ensure the user is authenticated before proceeding
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',

    // Always run for API routes
    '/(api|trpc)(.*)',

    // Protect everything else except public routes
  ],
}