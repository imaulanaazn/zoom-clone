/* eslint-disable camelcase */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import HomeCard from "./HomeCard";
import MeetingModal from "./MeetingModal";
// import { useUser } from '@clerk/nextjs';
import ReactDatePicker from "react-datepicker";
import { Input } from "./ui/input";
import axios from "axios";
import { IMeeting } from "@/lib/interface";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/utils";
import Image from "next/image";
import { ILabelGroup } from "@/interface";

// ZoomMtg.preLoadWasm();
// ZoomMtg.prepareWebSDK();

const initialValuesJoinMeet = {
  meetingId: "",
  meetingPwd: "",
};

const initialValuesScheduledMeet = {
  startTime: new Date(),
  topic: "",
  duration: {
    hour: 1,
    minute: 0,
  },
};

function getCustomRedirectUrl(meetingNumber: number, meetingPwd: string) {
  return `http://localhost:3000/meeting/${meetingNumber}?pwd=${meetingPwd}`;
}

const MeetingTypeList = () => {
  const router = useRouter();
  const [meetingState, setMeetingState] = useState<
    "isScheduleMeeting" | "isJoiningMeeting" | "isInstantMeeting" | undefined
  >(undefined);
  const [joinMeetValues, setJoinMeetingVal] = useState(initialValuesJoinMeet);
  const [scheduledMeetingVal, setScheduledMeetingVal] = useState(
    initialValuesScheduledMeet
  );
  const [meetingDetail, setMeetingDetail] = useState<IMeeting>();
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [labelGroups, setLabelGroups] = useState<ILabelGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ILabelGroup | null>(null);
  const [search, setSearch] = useState("");

  async function createScheduledMeeting() {
    const zoomToken = JSON.parse(localStorage.getItem("zoomToken") || "{}");
    const accessToken =
      zoomToken && zoomToken.accessToken ? zoomToken.accessToken : "";

    const toastId = toast.loading("Creating schedule");
    try {
      const response = await axios.post(
        "http://localhost:4000/api/v1/users/me/meetings",
        {
          topic: scheduledMeetingVal.topic,
          type: 2,
          start_time: scheduledMeetingVal.startTime.toISOString(),
          duration:
            scheduledMeetingVal.duration.hour * 60 +
            scheduledMeetingVal.duration.minute,
          time_zone: "UTC",
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: false,
            mute_upon_entry: true,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = response.data;
      if (selectedGroup) {
        createDetectionList(response.data.id);
      }

      setMeetingDetail(data);
      setShowAttendanceForm(false);
      setSelectedGroup(null);
      setScheduledMeetingVal(initialValuesScheduledMeet);
      toast.update(toastId, {
        type: "success",
        render: "Meeting scheduled",
        isLoading: false,
        autoClose: 3000,
      });
      return data;
    } catch (error: any) {
      toast.update(toastId, {
        type: "error",
        render: error.response.data.error || "Gagal membuat meeting",
        isLoading: false,
        autoClose: 3000,
      });
      console.error("Error creating scheduled meeting:", error);
      throw error;
    }
  }

  async function createInstantMeeting() {
    const zoomToken = JSON.parse(localStorage.getItem("zoomToken") || "{}");
    const accessToken =
      zoomToken && zoomToken.accessToken ? zoomToken.accessToken : "";

    try {
      const response = await axios.post(
        "http://localhost:4000/api/v1/users/me/meetings",
        { topic: "New Meeting", type: 1 },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = response.data;
      return data;
    } catch (error) {
      console.error("Error creating instant meeting:", error);
      throw error;
    }
  }

  async function startInstantMeeting() {
    const toastId = toast.loading("Creating new meeting");
    try {
      const meeting = await createInstantMeeting();
      if (!meeting || !meeting.id || !meeting.start_url) {
        console.error("Failed to create the meeting");
        return;
      }

      if (selectedGroup) {
        createDetectionList(meeting.id);
      }

      const redirectUrl = getCustomRedirectUrl(
        meeting.id,
        meeting.encrypted_password
      );

      toast.update(toastId, {
        type: "success",
        render: "Meeting created",
        isLoading: false,
        autoClose: 3000,
      });

      router.push(redirectUrl);
    } catch (error: any) {
      toast.update(toastId, {
        type: "error",
        render: error.response.data.error || "Gagal membuat meeting",
        isLoading: false,
        autoClose: 3000,
      });
      console.error("Error starting instant meeting:", error);
    }
  }

  async function createDetectionList(meeting_id: number) {
    try {
      const response = await apiClient.post(
        `/api/v1/meeting/${meeting_id}/detections`,
        { meeting_id, attendances: JSON.stringify(selectedGroup?.members) }
      );

      const data = response.data;
      return data;
    } catch (error) {
      console.error("Error creating instant meeting:", error);
      throw error;
    }
  }

  // async function getAttendances(query: string) {
  //   const userData = JSON.parse(localStorage.getItem('user_details') || '{}');

  //   if (!userData.account_id) {
  //     toast.error("Couldn't find your account. Please authorize yourself");
  //     return;
  //   }

  //   const toastId = toast.loading('Getting attendances');

  //   try {
  //     const response = await apiClient.get(
  //       `/api/v1/users/me/labels?owner_id=${userData.account_id}${query}`,
  //     );

  //     const data = response.data;
  //     setAttendances(data);

  //     toast.update(toastId, { isLoading: false, autoClose: 2000 });
  //     setShowAttendanceForm(true);
  //   } catch (error) {
  //     toast.update(toastId, {
  //       type: 'error',
  //       render: 'Failed to get attendances. pelase refresh',
  //       isLoading: false,
  //       autoClose: 3000,
  //     });
  //     console.error('Error getting attendances', error);
  //     throw error;
  //   }
  // }

  async function getLabelGroups(query: string) {
    const userData = JSON.parse(localStorage.getItem("user_details") || "{}");

    if (!userData.account_id) {
      toast.error("Couldn't find your account. Please authorize yourself");
      return;
    }

    try {
      const response = await apiClient.get(
        `/api/v1/users/me/label-groups?owner_id=${userData.account_id}${query}`
      );

      const data = response.data;
      if (data.length) {
        setLabelGroups(data);
      }
    } catch (error) {
      console.error("Error uploading new attendance:", error);
      throw error;
    }
  }

  function handleSearch() {
    getLabelGroups(search ? `&name=${search}` : "");
  }

  // if (!user) return <Loader />;

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      <HomeCard
        img="/icons/add-meeting.svg"
        title="New Meeting"
        description="Start an instant meeting"
        handleClick={() => {
          setMeetingState("isInstantMeeting");
          getLabelGroups("");
          setShowAttendanceForm(true);
        }}
      />
      <HomeCard
        img="/icons/join-meeting.svg"
        title="Join Meeting"
        description="via invitation link"
        className="bg-blue-1"
        handleClick={() => setMeetingState("isJoiningMeeting")}
      />
      <HomeCard
        img="/icons/schedule.svg"
        title="Schedule Meeting"
        description="Plan your meeting"
        className="bg-purple-1"
        handleClick={() => setMeetingState("isScheduleMeeting")}
      />
      {/* <HomeCard
        img="/icons/recordings.svg"
        title="View Recordings"
        description="Meeting Recordings"
        className="bg-yellow-1"
        handleClick={() => router.push('/recordings')}
      /> */}

      {!meetingDetail ? (
        <MeetingModal
          isOpen={meetingState === "isScheduleMeeting"}
          onClose={() => {
            setMeetingState(undefined);
            // setCbWithRecognition(false);
          }}
          title="Schedule a Meeting"
          buttonText={"Select Attendances"}
          handleClick={() => {
            getLabelGroups("");
            setShowAttendanceForm(true);
          }}
        >
          <div className="flex flex-col gap-2.5">
            <label className="text-base font-normal leading-[22.4px] text-sky-2">
              Add a Topic
            </label>
            <Input
              className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
              onChange={(e) =>
                setScheduledMeetingVal({
                  ...scheduledMeetingVal,
                  topic: e.target.value,
                })
              }
            />
          </div>
          <div className="flex w-full flex-col gap-2.5">
            <label className="text-base font-normal leading-[22.4px] text-sky-2">
              Select Start Date and Time
            </label>
            <ReactDatePicker
              selected={scheduledMeetingVal.startTime}
              onChange={(date) =>
                setScheduledMeetingVal({
                  ...scheduledMeetingVal,
                  startTime: date!,
                })
              }
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="time"
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full rounded bg-dark-3 p-2 focus:outline-none"
            />
          </div>

          <div className="flex w-full flex-col gap-2.5">
            <label className="text-base font-normal leading-[22.4px] text-sky-2">
              Select Meeting Duration
            </label>
            <div className="flex gap-4">
              <select
                defaultValue={1}
                name="hourDuration"
                id="hourDuration"
                className="flex-1 rounded-md bg-dark-3 p-2"
                onChange={(e) => {
                  setScheduledMeetingVal({
                    ...scheduledMeetingVal,
                    duration: {
                      ...scheduledMeetingVal.duration,
                      hour: parseInt(e.target.value!),
                    },
                  });
                }}
              >
                <option value="0">0 hour</option>
                <option value="1">1 hour</option>
                <option value="2">2 hour</option>
                <option value="3">3 hour</option>
                <option value="4">4 hour</option>
                <option value="5">5 hour</option>
                <option value="6">6 hour</option>
                <option value="7">7 hour</option>
                <option value="8">8 hour</option>
                <option value="9">9 hour</option>
                <option value="10">10 hour</option>
                <option value="11">11 hour</option>
                <option value="12">12 hour</option>
                <option value="13">13 hour</option>
                <option value="14">14 hour</option>
                <option value="15">15 hour</option>
                <option value="16">16 hour</option>
                <option value="17">17 hour</option>
                <option value="18">18 hour</option>
                <option value="19">19 hour</option>
                <option value="20">20 hour</option>
                <option value="21">21 hour</option>
                <option value="22">22 hour</option>
                <option value="23">23 hour</option>
                <option value="24">24 hour</option>
              </select>
              <select
                defaultValue={1}
                name="endTimeInMinute"
                id="endTimeInMinute"
                className="flex-1 rounded-md bg-dark-3 p-2"
                onChange={(e) => {
                  setScheduledMeetingVal({
                    ...scheduledMeetingVal,
                    duration: {
                      ...scheduledMeetingVal.duration,
                      minute: parseInt(e.target.value!),
                    },
                  });
                }}
              >
                <option value="0">0 minute</option>
                <option value="15">15 minute</option>
                <option value="30">30 minute</option>
                <option value="45">45 minute</option>
              </select>
            </div>
            {/* <div className="flex items-center gap-2">
              <input
                checked={cbWithRecognition}
                onChange={(e) => {
                  setCbWithRecognition(e.target.checked);
                }}
                id="use-recognition"
                type="checkbox"
                className="m-0 size-4 rounded-md"
              />
              <label
                htmlFor="use-recognition"
                className="m-0 text-base font-normal"
              >
                With face recognition
              </label>
            </div> */}
          </div>
        </MeetingModal>
      ) : (
        <MeetingModal
          isOpen={meetingState === "isScheduleMeeting"}
          onClose={() => {
            setMeetingState(undefined);
            setMeetingDetail(undefined);
          }}
          title="Meeting Created"
          handleClick={() => {
            navigator.clipboard.writeText(
              `http://localhost:3000/meeting/${meetingDetail?.id}?pwd=${meetingDetail.encrypted_password}`
            );
            toast.success("Link Copied");
          }}
          image={"/icons/checked.svg"}
          buttonIcon="/icons/copy.svg"
          className="text-center"
          buttonText="Copy Meeting Link"
        />
      )}

      <MeetingModal
        isOpen={meetingState === "isJoiningMeeting"}
        onClose={() => setMeetingState(undefined)}
        title="Type the link here"
        className="text-center"
        buttonText="Join Meeting"
        handleClick={() => {
          if (!joinMeetValues.meetingId || !joinMeetValues.meetingPwd) {
            toast.error("Please provide meeting id and meeting password");
          } else {
            router.push(
              `http://localhost:3000/meeting/${joinMeetValues.meetingId}?pwd=${joinMeetValues.meetingPwd}`
            );
          }
        }}
      >
        <Input
          placeholder="Meeting ID"
          onChange={(e) =>
            setJoinMeetingVal({ ...joinMeetValues, meetingId: e.target.value })
          }
          className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Input
          placeholder="Meeting Password"
          onChange={(e) =>
            setJoinMeetingVal({ ...joinMeetValues, meetingPwd: e.target.value })
          }
          className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </MeetingModal>

      {/* <MeetingModal
        isOpen={meetingState === 'isInstantMeeting'}
        onClose={() => {
          setMeetingState(undefined);
          setCbWithRecognition(false);
        }}
        title="Start an Instant Meeting"
        className="text-center"
        buttonText={cbWithRecognition ? 'Select Attendances' : 'Start Meeting'}
        handleClick={() => {
          cbWithRecognition ? getLabelGroups('') : startInstantMeeting();
        }}
      >
        <div className="flex items-center gap-2">
          <input
            checked={cbWithRecognition}
            onChange={(e) => {
              setCbWithRecognition(e.target.checked);
            }}
            id="with-recognition"
            type="checkbox"
            className="m-0 size-4 rounded-md"
          />
          <label
            htmlFor="with-recognition"
            className="m-0 text-base font-normal"
          >
            With face recognition
          </label>
        </div>
      </MeetingModal> */}
      {showAttendanceForm && (
        <MeetingModal
          isOpen={
            meetingState === "isInstantMeeting" ||
            meetingState === "isScheduleMeeting"
          }
          onClose={() => {
            setShowAttendanceForm(false);
            setSelectedGroup(null);
          }}
          title={
            meetingState === "isInstantMeeting"
              ? "Start an Instant Meeting"
              : "Schedule a Meeting"
          }
          className="text-center"
          buttonText={
            meetingState === "isInstantMeeting"
              ? "Start Meeting"
              : "Schedule Meeting"
          }
          handleClick={() => {
            meetingState === "isInstantMeeting"
              ? startInstantMeeting()
              : createScheduledMeeting();
          }}
        >
          <p>Please select attendance group to be recognise</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              className="flex-1 rounded-md border border-slate-600 bg-slate-800 px-2 py-1"
              onChange={(e) => {
                setSearch(e.target.value);
              }}
            />
            <button
              className="rounded-md bg-blue-600 px-3 py-1.5 text-white"
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
          <div className="h-96 overflow-y-auto">
            {labelGroups.map((labelGroup) => (
              <div
                key={labelGroup.id}
                className={`my-2 flex items-center gap-2 rounded-md p-2 hover:cursor-pointer ${
                  selectedGroup?.id === labelGroup.id
                    ? "bg-emerald-800"
                    : "bg-slate-800"
                }`}
                onClick={() => setSelectedGroup(labelGroup)}
              >
                <Image
                  width={50}
                  height={50}
                  src={`http://localhost:4000/uploads/${labelGroup.image}`}
                  alt="person profile"
                  className="aspect-square h-auto w-10 rounded-md object-cover"
                />
                <p className="m-0">{labelGroup.name}</p>
              </div>
            ))}
          </div>
        </MeetingModal>
      )}
    </section>
  );
};

export default MeetingTypeList;
