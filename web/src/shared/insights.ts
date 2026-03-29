export interface InsightData {
  agreementMatrix: {
    topic: string;
    topic_id: string;
    pairs: { types: [string, string]; agreement_pct: number }[];
  }[];
  diversityScores: {
    topic: string;
    topic_id: string;
    slug: string;
    community_type_count: number;
    perspective_count: number;
    diversity_score: number;
  }[];
  geographicFaults: {
    topic: string;
    topic_id: string;
    coastal_sentiment: string;
    rural_sentiment: string;
    divergence: number;
  }[];
  risingTopics: {
    topic: string;
    topic_id: string;
    slug: string;
    this_week: number;
    last_week: number;
    growth_pct: number;
  }[];
}
