export interface Comment {
  video_id: string;
  playback_time_ms: number;
  content: string;
  user_name: string;
  created_at: string;
}

export interface PostCommentRequest {
  video_id: string;
  playback_time_ms: number;
  content: string;
  user_name?: string;
}
