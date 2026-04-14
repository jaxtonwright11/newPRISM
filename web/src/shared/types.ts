export type CommunityType = 'civic' | 'diaspora' | 'rural' | 'policy' | 'academic' | 'cultural';
export type TopicStatus = 'active' | 'trending' | 'hot' | 'cooling' | 'archived';
export type ReactionType = 'this_resonates' | 'seeing_differently' | 'want_to_understand';
export type ConnectionStatus = 'pending' | 'accepted' | 'declined';
export type PostType = 'permanent' | 'story';
export type VerificationLevel = 1 | 2 | 3;
export type RadiusMiles = 10 | 20 | 30 | 40;

export interface Community {
  id: string;
  name: string;
  region: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  community_type: CommunityType;
  color_hex: string;
  description: string | null;
  verified: boolean;
  active: boolean;
}

export interface Topic {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  status: TopicStatus;
  perspective_count: number;
  community_count: number;
  created_at: string;
  updated_at: string;
}

export interface Perspective {
  id: string;
  community_id: string;
  topic_id: string;
  quote: string;
  context: string | null;
  category_tag: string | null;
  verified: boolean;
  reaction_count: number;
  bookmark_count: number;
  share_count: number;
  created_at: string;
  community?: Community;
  topic?: Topic;
  user_reaction?: ReactionType | null;
  user_bookmarked?: boolean;
}

export interface Post {
  id: string;
  user_id: string;
  community_id: string | null;
  topic_id: string | null;
  content: string;
  image_url: string | null;
  post_type: PostType;
  radius_miles: RadiusMiles;
  expires_at: string | null;
  latitude: number | null;
  longitude: number | null;
  like_count: number;
  comment_count: number;
  share_count: number;
  created_at: string;
  user?: UserProfile;
  community?: Community;
  topic?: Topic;
  user_liked?: boolean;
}

export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  home_community_id: string | null;
  verification_level: VerificationLevel;
  ghost_mode: boolean;
  default_radius_miles: RadiusMiles;
  created_at: string;
}

export interface UserProfile extends User {
  perspectives_read: number;
  communities_engaged: number;
  connections_made: number;
}

export interface MapPin {
  id: string;
  type: 'community' | 'post' | 'story';
  latitude: number;
  longitude: number;
  color_hex: string;
  community_type: CommunityType;
  activity_level: 'high' | 'medium' | 'low';
  community?: Community;
  post?: Post;
}

export interface CommunityAlignment {
  id: string;
  topic_id: string;
  alignment_statement: string;
  community_ids: string[];
  agreement_pct: number;
  communities?: Community[];
}

export interface ConnectionRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  topic_id: string;
  perspective_id: string | null;
  status: ConnectionStatus;
  intro_message: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'reaction' | 'connection_request' | 'connection_accepted' | 'new_perspective' | 'community_milestone' | 'comment' | 'like';
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, string>;
}

export interface BookmarkedPerspective {
  perspective_id: string;
  bookmarked_at: string;
}

export interface BookmarkedTopic {
  topic_id: string;
  bookmarked_at: string;
}

/** Perspective with embedded community info, as returned by feed/discover APIs. */
export interface DisplayPerspective {
  id: string;
  quote: string;
  context: string | null;
  category_tag: string | null;
  reaction_count: number;
  bookmark_count: number;
  created_at?: string;
  community: {
    name: string;
    region: string;
    community_type: CommunityType;
    color_hex: string;
    verified: boolean;
  };
}
