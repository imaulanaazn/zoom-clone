"use client";
import { IDetection, IPastMeeting } from "@/lib/interface";
import { apiClient } from "@/lib/utils";
import Image from "next/image";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function MeetingDetails() {
  const [meeting, setMeeting] = useState<IPastMeeting>();
  const { meetingId } = useParams();
  const [detections, setDetections] = useState<IDetection[]>([]);
  const [search, setSearch] = useState("");

  async function getDetections() {
    try {
      const req = await apiClient.get(
        `/api/v1/meeting/${meetingId}/detections`
      );
      const detections = req.data;
      const newDetections = detections.map((detection: any) => ({
        ...detection,
        descriptor: JSON.parse(detection.descriptor),
      }));
      setDetections(newDetections);
    } catch (e) {
      toast.error("Gagal mengambil data peserta meeting");
      console.log(e);
    }
  }

  useEffect(() => {
    async function getMeetings() {
      try {
        const response = await apiClient.get(
          `https://zoomserver-production.up.railway.app/api/v1/users/me/meetings/history/${meetingId}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = response.data.meeting[0];
        getDetections();
        setMeeting(data);
      } catch (error) {
        console.error("Error creating instant meeting:", error);
        throw error;
      }
    }

    getMeetings();
  }, []);

  return (
    <div className="flex gap-6">
      <div className="w-96 rounded-xl bg-dark-1 p-6 text-white/90">
        <h3>Meeting Details</h3>
        <div className="mt-6 flex items-center justify-between">
          <p>Meeting Topic : </p>
          <p>{meeting?.topic || ""}</p>
        </div>
        <div className="flex items-center justify-between">
          <p>Meeting Host : </p>
          <p>{meeting?.host_email || ""}</p>
        </div>
        <div className="flex items-center justify-between">
          <p>Meeting Start : </p>
          <p>
            {meeting?.started_at &&
              new Date(meeting.started_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex-1 rounded-xl bg-dark-1 p-6 text-white/90">
        <div className="flex items-center justify-between">
          <h3>Attendances</h3>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              className="rounded-md border border-white bg-transparent px-2 py-1"
              onChange={(e) => {
                setSearch(e.target.value);
              }}
            />
            <button
              className="rounded-md bg-blue-600 px-3 py-1 text-white"
              // onClick={handleSearch}
            >
              Cari
            </button>
          </div>
        </div>
        <table className="mt-4 w-full table-auto">
          <thead className="border-b">
            <tr className="bg-slate-800">
              <th className="p-4 text-left font-medium">Id</th>
              <th className="p-4 text-left font-medium">Name</th>
              <th className="p-4 text-left font-medium">Image</th>
              <th className="p-4 text-left font-medium">Detection Time (m)</th>
            </tr>
          </thead>
          <tbody>
            {detections.map((detection) => (
              <tr
                key={detection.attendance_id}
                className="border-b hover:bg-gray-50"
              >
                <td className="p-4">{detection.attendance_id}</td>
                <td className="p-4">{detection.name}</td>
                <td className="p-2">
                  <Image
                    src={`https://zoomserver-production.up.railway.app/uploads/${detection.image}`}
                    width={100}
                    height={100}
                    alt="user profile"
                    className="aspect-square h-auto w-12 object-cover"
                  />
                </td>
                <td className="p-4">
                  {detection.detection_time / (60 * 1000)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!detections.length && (
          <p className="mt-8 text-center">No data were found</p>
        )}
      </div>
    </div>
  );
}
