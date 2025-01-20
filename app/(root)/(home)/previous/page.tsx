"use client";
import MeetingCard from "@/components/MeetingCard";
import { IPastMeeting } from "@/interface";
import { apiClient } from "@/lib/utils";
import { useEffect, useState } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const PreviousPage = () => {
  const [meetings, setMeetings] = useState<IPastMeeting[]>([]);

  useEffect(() => {
    async function getMeetings() {
      try {
        const response = await apiClient.get(
          `${BASE_URL}/api/v1/users/me/meetings/history`,
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
      <h1 className="text-3xl font-bold">Meeting Sebelumnya</h1>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {meetings && meetings.length > 0 ? (
          meetings.map((meeting: IPastMeeting) => (
            <MeetingCard
              key={meeting.id}
              isPreviousMeeting={true}
              icon={"/icons/previous.svg"}
              title={meeting.topic || "Tidak ada deskripsi"}
              date={
                new Date(meeting.started_at).toLocaleDateString() ||
                new Date().getDate().toLocaleString()
              }
              link={`${BASE_URL}/meeting/${meeting.id}?pwd=${meeting.encrypted_password}`}
              buttonIcon1={undefined}
              buttonText={""}
              handleClick={() => {}}
              meetingId={meeting.id}
            />
          ))
        ) : (
          <h1 className="text-2xl font-bold text-white">
            {"Tidak ada meeting"}
          </h1>
        )}
      </div>
    </section>
  );
};

export default PreviousPage;
