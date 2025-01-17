export interface IMeeting {
  uuid: string;
  id: 74923879013;
  host_id: string;
  host_email: string;
  topic: string;
  type: 1;
  status: string;
  timezone: string;
  created_at: string;
  start_url: string;
  start_time: string;
  join_url: string;
  password: string;
  h323_password: string;
  pstn_password: string;
  encrypted_password: string;
  settings: {
    host_video: boolean;
    participant_video: boolean;
    cn_meeting: boolean;
    in_meeting: boolean;
    join_before_host: boolean;
    jbh_time: 0;
    mute_upon_entry: boolean;
    watermark: boolean;
    use_pmi: boolean;
    approval_type: 2;
    audio: string;
    auto_recording: string;
    enforce_login: boolean;
    enforce_login_domains: string;
    alternative_hosts: string;
    alternative_host_update_polls: boolean;
    close_registration: boolean;
    show_share_button: boolean;
    allow_multiple_devices: boolean;
    registrants_confirmation_email: boolean;
    waiting_room: boolean;
    request_permission_to_unmute_participants: boolean;
    registrants_email_notification: boolean;
    meeting_authentication: boolean;
    encryption_type: string;
    approved_or_denied_countries_or_regions: {
      enable: boolean;
    };
    breakout_room: {
      enable: boolean;
    };
    internal_meeting: boolean;
    continuous_meeting_chat: {
      enable: boolean;
      auto_add_invited_external_users: boolean;
      auto_add_meeting_participants: boolean;
      channel_id: string;
    };
    participant_focused_meeting: boolean;
    push_change_to_calendar: boolean;
    resources: [];
    alternative_hosts_email_notification: boolean;
    show_join_info: boolean;
    device_testing: boolean;
    focus_mode: boolean;
    meeting_invitees: [];
    enable_dedicated_group_chat: boolean;
    private_meeting: boolean;
    email_notification: boolean;
    host_save_video_order: boolean;
    sign_language_interpretation: {
      enable: boolean;
    };
    email_in_attendee_report: boolean;
  };
  supportGoLive: boolean;
  creation_source: string;
  pre_schedule: boolean;
}

export interface IDetection {
  detection_id: number;
  meeting_id: number;
  detection_time: number;
  attendance_id: number;
  descriptor: number[];
  name: string;
  image: string;
}

export interface IPastMeeting extends IMeeting {
  started_at: string;
}
