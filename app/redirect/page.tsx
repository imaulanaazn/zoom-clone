"use client";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, Suspense } from "react";

export default function Page() {
  return (
    <Suspense>
      <Redirect />
    </Suspense>
  );
}

function Redirect() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const router = useRouter();

  useEffect(() => {
    async function getAccessToken() {
      try {
        const response = await fetch(
          `http://localhost:4000/api/v1/users/me/token?code=${code}`
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        const token = JSON.stringify({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expires_in: data.expires_in,
        });

        localStorage.setItem("zoomToken", token);
        router.push("/");
      } catch (error) {
        console.error("Failed to fetch the access token:", error);
      }
    }

    if (code) {
      getAccessToken();
    }
  }, [code]);
  return <div>This is the redirect page</div>;
}
