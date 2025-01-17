'use client';
import { useParams, useSearchParams } from 'next/navigation';
import { ZoomMtg } from '@zoom/meetingsdk';
import React, { useEffect, useRef, useState } from 'react';
import { IDetection, IMeeting } from '@/lib/interface';
import * as faceapi from 'face-api.js';
import { toast } from 'react-toastify';
import { apiClient, recognizeFace } from '@/lib/utils';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000';
const SDK_KEY = process.env.NEXT_PUBLIC_SDK_KEY || '';

export default function MeetingPage() {
  const { id: meetingId }: { id: string } = useParams();
  const params = useSearchParams();
  const meetingPwd = params.get('pwd');
  let videoRef: HTMLVideoElement | null = null;
  // let canvasRef: HTMLCanvasElement | null = null;
  const [detections, setDetections] = useState<IDetection[]>([]);
  const detectionsRef = useRef(detections);

  useEffect(() => {
    detectionsRef.current = detections;
  }, [detections]);

  async function getSignature({
    meetingNumber,
    role,
  }: {
    meetingNumber: number;
    role: number;
  }) {
    try {
      const req = await fetch(
        `${BASE_URL}/api/v1/meeting/${meetingId}/jwt-signature`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meetingNumber,
            role,
          }),
        },
      );
      const res = await req.json();
      const signature = res.signature as string;
      return signature;
    } catch (e) {
      console.log(e);
    }
  }

  function startMeeting({
    signature,
    sdkKey,
    meetingNumber,
    passWord,
    userName,
    userEmail,
    registrantToken,
    zakToken,
  }: {
    signature: string;
    sdkKey: string;
    meetingNumber: number;
    passWord: string;
    userName: string;
    userEmail: string;
    registrantToken: string;
    zakToken: string;
  }) {
    document.getElementById('zmmtg-root')!.style.display = 'block';

    ZoomMtg.init({
      leaveUrl: 'http://localhost:3000',
      patchJsMedia: true,
      leaveOnPageUnload: true,
      success: (success: unknown) => {
        ZoomMtg.join({
          signature,
          sdkKey,
          meetingNumber,
          passWord,
          userName,
          userEmail,
          tk: registrantToken,
          zak: zakToken,
          success: (success: unknown) => {
            initFaceDetection();
          },
          error: (error: unknown) => {
            console.log(error);
          },
        });
      },
      error: (error: unknown) => {
        console.log(error);
      },
    });
  }

  async function startInstantMeeting(meeting: IMeeting) {
    try {
      const meetingNumber = meeting.id;
      const passWord = meeting.encrypted_password;
      const signature = await getSignature({
        meetingNumber,
        role: 1,
      });
      if (!signature) {
        console.error('Failed to get the meeting signature');
        return;
      }
      startMeeting({
        signature,
        sdkKey: SDK_KEY,
        meetingNumber,
        passWord,
        userName: 'Your Name',
        userEmail: 'your-email@example.com',
        registrantToken: '',
        zakToken: meeting.start_url.split('zak=')[1] || '',
      });
    } catch (error) {
      console.error('Error starting instant meeting:', error);
    }
  }

  async function startJoinMeeting() {
    try {
      const meetingNumber = parseInt(meetingId);
      const passWord = meetingPwd || '';
      const signature = await getSignature({
        meetingNumber,
        role: 0,
      });
      if (!signature) {
        console.error('Failed to get the meeting signature');
        return;
      }
      startMeeting({
        signature,
        sdkKey: SDK_KEY,
        meetingNumber,
        passWord,
        userName: 'Your Name',
        userEmail: 'your-email@example.com',
        registrantToken: '',
        zakToken: '',
      });
    } catch (error) {
      console.error('Error starting instant meeting:', error);
    }
  }

  async function getMeetingDetails() {
    const zoomToken = JSON.parse(localStorage.getItem('zoomToken') || '{}');
    const accessToken =
      zoomToken && zoomToken.accessToken ? zoomToken.accessToken : '';
    try {
      const req = await fetch(`${BASE_URL}/api/v1/meeting/${meetingId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const meeting = await req.json();
      return meeting;
    } catch (e) {
      console.log(e);
    }
  }

  async function getDetections() {
    try {
      const req = await apiClient.get(
        `/api/v1/meeting/${meetingId}/detections`,
      );
      const detections = req.data;
      const newDetections = detections.map((detection: any) => ({
        ...detection,
        descriptor: JSON.parse(detection.descriptor),
      }));
      setDetections(newDetections);
    } catch (e) {
      console.log(e);
    }
  }

  async function addMeeting(meetingData: IMeeting) {
    const data = {
      id: meetingData.id,
      host_id: meetingData.host_id,
      host_email: meetingData.host_email,
      topic: meetingData.topic,
      type: meetingData.type,
      created_at: meetingData.created_at,
      start_url: meetingData.start_url,
      join_url: meetingData.join_url,
      password: meetingData.password,
      encrypted_password: meetingData.encrypted_password,
    };
    try {
      await apiClient.post(`/api/v1/meeting/${meetingId}`, data);
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {
    async function getMeeting() {
      try {
        const data = await getMeetingDetails();

        if (!data.id && data.code === 3001) {
          startJoinMeeting();
        } else if (data.id) {
          addMeeting(data);
          startInstantMeeting(data);
        }
      } catch (error) {
        console.error(error);
      }
    }
    getMeeting();
  }, []);

  const loadModels = async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri(
      '/models/tiny_face_detector',
    );
    await faceapi.nets.faceLandmark68Net.loadFromUri(
      '/models/face_landmark_68',
    );
    await faceapi.nets.faceRecognitionNet.loadFromUri(
      '/models/face_recognition',
    );
  };

  const detectFaces = async () => {
    if (videoRef) {
      const faceDetection = await faceapi
        .detectSingleFace(videoRef, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (faceDetection) {
        const newDetections = recognizeFace(
          detectionsRef.current,
          Array.from(faceDetection.descriptor),
        );
        setDetections(newDetections);
      } else {
        console.error('No face detected');
      }

      // if (canvasRef) {
      //   const dims = faceapi.matchDimensions(canvasRef, videoRef, true);
      //   const resizedDetections = faceapi.resizeResults(detections, dims);

      //   canvasRef
      //     .getContext('2d')
      //     ?.clearRect(0, 0, canvasRef.width, canvasRef.height);
      //   faceapi.draw.drawDetections(canvasRef, resizedDetections);
      // }
    }
  };

  const initFaceDetection = async () => {
    const toastId = toast.loading('Loading models');
    try {
      await loadModels();
      toast.update(toastId, {
        render: 'Models loaded successfully',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
    } catch {
      toast.update(toastId, {
        render: 'Failed to load models',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    }

    videoRef = document.getElementById('main-video-self') as HTMLVideoElement;
    if (videoRef) {
      // canvasRef = document.createElement('canvas');
      // canvasRef.style.position = 'absolute';
      // canvasRef.style.top = videoRef.offsetTop + 'px';
      // canvasRef.style.left = videoRef.offsetLeft + 'px';
      // canvasRef.width = videoRef.offsetWidth;
      // canvasRef.height = videoRef.offsetHeight;
      // document.body.appendChild(canvasRef);
      setInterval(detectFaces, 2000);
    }
  };

  async function updateDetection() {
    const detectionRes = detectionsRef.current.map((detection) => ({
      id: detection.detection_id,
      meeting_id: detection.meeting_id,
      attendance_id: detection.attendance_id,
      detection_time: detection.detection_time,
    }));

    try {
      await apiClient.put(`/api/v1/meeting/${meetingId}/detections`, {
        updates: detectionRes,
      });
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {
    getDetections();
  }, []);

  // useEffect(() => {
  //   return () => {
  //     if (canvasRef) canvasRef.remove();
  //   };
  // }, []);

  updateDetection();

  useEffect(() => {
    return () => {
      updateDetection();
    };
  }, []);

  return <div>page</div>;
}
