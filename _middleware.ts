// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// const protectedRoute = createRouteMatcher([
//   '/',
//   '/upcoming',
//   '/meeting(.*)',
//   '/previous',
//   '/recordings',
//   '/personal-room',
// ]);

// export default clerkMiddleware((auth, req) => {
//   if (protectedRoute(req)) auth().protect();
// });

// export const config = {
//   matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
// };

// import { NextResponse } from 'next/server';

// export function middleware(req: any) {
//   const accessToken = req.cookies.get('accessToken');
//   console.log(req.cookies);

//   if (!accessToken || isTokenExpired(accessToken)) {
//     return NextResponse.redirect('http://localhost:3000/sign-in');
//   }

//   return NextResponse.next();
// }

// function isTokenExpired(token: string) {
//   const payload = JSON.parse(atob(token.split('.')[1]));
//   return payload.exp * 1000 < Date.now();
// }

// // Apply middleware to protected routes
// export const config = {
//   matcher: ['/upcoming'],
// };
