"use client";
import { apiClient, isTokenExpired, refreshAccessToken } from "@/lib/utils";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
}

function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      const zoomToken = JSON.parse(localStorage.getItem("zoomToken") || "{}");
      let accessToken =
        zoomToken && zoomToken.accessToken ? zoomToken.accessToken : "";

      if (!accessToken) {
        localStorage.removeItem("user_details");
        setIsAuthenticated(false);
        router.push("/auth/sign-in");
        return;
      }

      if (isTokenExpired(accessToken)) {
        try {
          accessToken = await refreshAccessToken();
        } catch (error) {
          window.location.href = "/auth/sign-in";
          localStorage.removeItem("user_details");
          throw error;
        }
      }

      setIsAuthenticated(true);
    };

    checkAuthentication();
  }, [router]);

  useEffect(() => {
    async function getUserInfo() {
      try {
        const response = await apiClient.get("/api/v1/users/me");
        const data = response.data;
        if (data.id) {
          localStorage.setItem("user_details", JSON.stringify(data));
        }
      } catch (error) {
        console.error("Error getting user details:", error);
        throw error;
      }
    }

    if (isAuthenticated) {
      getUserInfo();
    }
  }, [isAuthenticated]);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return <>{isAuthenticated && children}</>;
}

export default AuthGuard;
