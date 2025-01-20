import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = `
    default-src 'self' https://source.zoom.us https://zoomserver-production.up.railway.app;
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://source.zoom.us;
    style-src 'self' 'unsafe-inline' https://source.zoom.us;
    img-src 'self' blob: data:;
    font-src 'self' data:;
    connect-src 'self' https://zoom.us https://file.zoom.us https://*.zoom.us https://*.zoom.cn https://*.zoom.com.cn https://marketplacefront-cf.zoom.us https://zoom-marketplace-apps.s3.amazonaws.com/ https://marketplacecontent-cf.zoom.us/ https://www.google-analytics.com https://*.telemetry.zoom.us https://cdn.cookielaw.org https://zoom-privacy.my.onetrust.com https://geolocation.onetrust.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-src 'self' https://www.googletagmanager.com;
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;
  // Replace newline characters and spaces
  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  requestHeaders.set(
    "Content-Security-Policy",
    contentSecurityPolicyHeaderValue
  );

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set(
    "Content-Security-Policy",
    contentSecurityPolicyHeaderValue
  );

  return response;
}
