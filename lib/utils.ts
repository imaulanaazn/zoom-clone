/* eslint-disable camelcase */
import axios from "axios";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as faceapi from "face-api.js";
import { IDetection } from "@/interface";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function refreshAccessToken() {
  const zoomToken = JSON.parse(localStorage.getItem("zoomToken") || "{}");
  const refreshToken =
    zoomToken && zoomToken.refreshToken ? zoomToken.refreshToken : "";

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/users/me/oauth/token`,
      { refresh_token: refreshToken, grant_type: "refresh_token" }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    const token = JSON.stringify({
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
    });

    localStorage.setItem("zoomToken", token);

    return access_token;
  } catch (error) {
    console.error("Failed to refresh access token:", error);
    throw error;
  }
}

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use(
  async (config) => {
    const zoomToken = JSON.parse(localStorage.getItem("zoomToken") || "{}");
    let accessToken =
      zoomToken && zoomToken.accessToken ? zoomToken.accessToken : "";

    if (isTokenExpired(accessToken)) {
      try {
        accessToken = await refreshAccessToken();
      } catch (error) {
        window.location.href = "/auth/sign-in";
        throw error;
      }
    }

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export function isTokenExpired(token: string | null) {
  if (!token) return true;

  const payload = JSON.parse(atob(token.split(".")[1]));
  return payload.exp * 1000 < Date.now();
}

export function recognizeFace(
  detections: IDetection[],
  descriptor: number[]
): IDetection[] {
  const threshold = 0.6;

  return detections.map((detection) => {
    const distance = faceapi.euclideanDistance(
      detection.descriptor,
      descriptor
    );

    if (distance < threshold) {
      return {
        ...detection,
        detection_time: detection.detection_time + 2000,
      };
    }

    return detection;
  });
}
