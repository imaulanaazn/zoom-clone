"use client";
import MeetingCard from "@/components/MeetingCard";
import { IMeeting } from "@/interface";
import { apiClient } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const UpcomingPage = () => {
  const [meetings, setMeetings] = useState<IMeeting[]>([]);
  const router = useRouter();

  function convertZoomUrl(zoomUrl: string) {
    try {
      const url = new URL(zoomUrl); // Parse the Zoom URL
      const meetingId = url.pathname.split("/").pop(); // Extract the meeting ID
      const password = url.searchParams.get("pwd"); // Extract the password

      if (!meetingId || !password) {
        throw new Error("Invalid Zoom URL: Missing meeting ID or password");
      }

      const customUrl = `${BASE_URL}/meeting/${meetingId}?pwd=${password}`;
      return customUrl;
    } catch (error: any) {
      console.error("Error converting Zoom URL:", error.message);
      return "";
    }
  }

  useEffect(() => {
    async function getMeetings() {
      try {
        const response = await apiClient.get(
          "/api/v1/users/me/meetings?type=upcoming_meetings",
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = response.data.meetings;
        setMeetings(data);
      } catch (error) {
        console.error("Error creating instant meeting:", error);
        throw error;
      }
    }

    getMeetings();
  }, []);
  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <h1 className="text-3xl font-bold">Meeting Mendatang</h1>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {meetings && meetings.length > 0 ? (
          meetings.map((meeting: IMeeting) => (
            <MeetingCard
              key={meeting.id}
              icon={"/icons/upcoming.svg"}
              title={meeting.topic || "Tidak ada deskripsi"}
              date={
                new Date(meeting.start_time).toLocaleDateString() ||
                new Date().getDate().toLocaleString()
              }
              link={convertZoomUrl(meeting.join_url)}
              buttonIcon1={undefined}
              buttonText={"Mulai Meeting"}
              handleClick={() => {
                router.push(convertZoomUrl(meeting.join_url));
              }}
            />
          ))
        ) : (
          <h3 className="text-2xl font-semibold text-white">
            {"Tidak ada meeting"}
          </h3>
        )}
      </div>
    </section>
  );
};

export default UpcomingPage;
