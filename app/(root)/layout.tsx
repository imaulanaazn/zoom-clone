"use client";
// import dynamic from 'next/dynamic';
import { ReactNode, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuthGuard from "@/components/AuthGuard";

// @ts-ignore: Suppress the next line's error
let ZoomMtg: any;

const RootLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  useEffect(() => {
    const loadZoomSDK = async () => {
      if (!ZoomMtg) {
        const ZoomModule = await import("@zoom/meetingsdk");
        ZoomMtg = ZoomModule.ZoomMtg;
        ZoomMtg.preLoadWasm();
        ZoomMtg.prepareWebSDK();
      }
    };

    loadZoomSDK();
  }, []);

  return (
    <main>
      <AuthGuard>
        {children}
        <ToastContainer />
      </AuthGuard>
    </main>
  );
};

export default RootLayout;
