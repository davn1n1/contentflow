export interface YouTubeChannelStats {
  id: string;
  title: string;
  customUrl: string | null;
  description: string;
  thumbnail: string | null;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
}

export interface YouTubeVideoStats {
  id: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  duration: number; // seconds
  engagement: number; // percentage
}

export interface YouTubeStatsResponse {
  channel: YouTubeChannelStats;
  videos: YouTubeVideoStats[];
  fetchedAt: string;
}
