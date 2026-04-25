export interface CommunitySentiment {
  community_id: string;
  community_name: string;
  community_type: string;
  latitude: number;
  longitude: number;
  region: string;
  perspective_count: number;
  dominant_reaction: "i_see_this" | "i_didnt_know_this" | "i_agree";
  reaction_counts: {
    i_see_this: number;
    i_didnt_know_this: number;
    i_agree: number;
  };
}
