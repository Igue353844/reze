export interface WatchParty {
  id: string;
  host_id: string;
  video_id: string | null;
  episode_id: string | null;
  name: string;
  code: string;
  is_active: boolean;
  current_time_seconds: number;
  is_playing: boolean;
  created_at: string;
  updated_at: string;
  videos?: {
    id: string;
    title: string;
    poster_url: string | null;
    video_url: string | null;
  } | null;
  episodes?: {
    id: string;
    title: string;
    video_url: string | null;
  } | null;
}

export interface WatchPartyParticipant {
  id: string;
  party_id: string;
  user_id: string;
  display_name: string;
  is_host: boolean;
  joined_at: string;
}

export interface WatchPartyMessage {
  id: string;
  party_id: string;
  user_id: string;
  display_name: string;
  message: string;
  created_at: string;
}
