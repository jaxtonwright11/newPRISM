export interface CommunitySentiment {
  community_id: string;
  community_name: string;
  community_type: string;
  latitude: number;
  longitude: number;
  region: string;
  perspective_count: number;
  dominant_reaction: "this_resonates" | "seeing_differently" | "want_to_understand";
  reaction_counts: {
    this_resonates: number;
    seeing_differently: number;
    want_to_understand: number;
  };
}
