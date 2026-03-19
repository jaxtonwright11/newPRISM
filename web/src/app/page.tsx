import { TopicSidebar } from "@/components/topic-sidebar";
import { PerspectiveCard } from "@/components/perspective-card";
import { PrismMap } from "@/components/prism-map";
import { AlignmentPanel } from "@/components/alignment-panel";
import type { Topic, Perspective, Community, CommunityAlignment } from "../../../shared/types";

const MOCK_COMMUNITIES: Community[] = [
  {
    id: "c1", name: "Detroit Metro", region: "Southeast Michigan", country: "US",
    latitude: 42.3314, longitude: -83.0458, community_type: "civic",
    color_hex: "#4A9EFF", description: "Urban civic community", verified: true, active: true,
  },
  {
    id: "c2", name: "Appalachian Voices", region: "Eastern Kentucky", country: "US",
    latitude: 37.8393, longitude: -83.2635, community_type: "rural",
    color_hex: "#22C55E", description: "Rural community perspectives", verified: true, active: true,
  },
  {
    id: "c3", name: "Somali Diaspora MN", region: "Twin Cities, Minnesota", country: "US",
    latitude: 44.9778, longitude: -93.2650, community_type: "diaspora",
    color_hex: "#F59E0B", description: "Diaspora community perspectives", verified: true, active: true,
  },
];

const MOCK_TOPICS: Topic[] = [
  {
    id: "t1", title: "Infrastructure Investment Impact", slug: "infrastructure-investment",
    summary: "How federal infrastructure spending is changing communities differently",
    status: "hot", perspective_count: 12, community_count: 5,
    created_at: "2026-03-19T00:00:00Z", updated_at: "2026-03-19T00:00:00Z",
  },
  {
    id: "t2", title: "Rural Healthcare Access", slug: "rural-healthcare",
    summary: "The widening gap in healthcare access between urban and rural communities",
    status: "trending", perspective_count: 8, community_count: 4,
    created_at: "2026-03-18T00:00:00Z", updated_at: "2026-03-19T00:00:00Z",
  },
  {
    id: "t3", title: "Immigration Policy Effects", slug: "immigration-policy",
    summary: "On-the-ground effects of immigration policy changes across communities",
    status: "active", perspective_count: 15, community_count: 6,
    created_at: "2026-03-17T00:00:00Z", updated_at: "2026-03-19T00:00:00Z",
  },
];

const MOCK_PERSPECTIVES: Perspective[] = [
  {
    id: "p1", community_id: "c1", topic_id: "t1",
    quote: "The new bridge project isn't just concrete and steel — it's the first time in decades our neighborhood has been connected to job centers without a two-hour bus ride.",
    context: "Detroit's Gordie Howe bridge and surrounding infrastructure have changed transit patterns for historically isolated neighborhoods.",
    category_tag: "Domestic Policy", verified: true,
    reaction_count: 47, bookmark_count: 12, share_count: 8,
    created_at: "2026-03-19T10:00:00Z",
    community: MOCK_COMMUNITIES[0],
  },
  {
    id: "p2", community_id: "c2", topic_id: "t1",
    quote: "They keep talking about broadband expansion, but we still can't get a cell signal at the county health clinic. Infrastructure means something different when you're 40 miles from the nearest highway.",
    context: "Eastern Kentucky communities report that federal infrastructure priorities rarely match rural needs.",
    category_tag: "Domestic Policy", verified: true,
    reaction_count: 63, bookmark_count: 18, share_count: 15,
    created_at: "2026-03-19T09:00:00Z",
    community: MOCK_COMMUNITIES[1],
  },
  {
    id: "p3", community_id: "c3", topic_id: "t1",
    quote: "Our community center was built with infrastructure funds, and now it's the only place where new arrivals can access translation services and job training. This is what investment looks like for us.",
    context: "Minnesota's Somali diaspora community has leveraged infrastructure funding for cultural and economic integration spaces.",
    category_tag: "Diaspora", verified: true,
    reaction_count: 35, bookmark_count: 9, share_count: 5,
    created_at: "2026-03-19T08:00:00Z",
    community: MOCK_COMMUNITIES[2],
  },
];

const MOCK_ALIGNMENTS: CommunityAlignment[] = [
  {
    id: "a1", topic_id: "t1",
    alignment_statement: "All three communities agree that infrastructure investment must prioritize local hiring and workforce development",
    community_ids: ["c1", "c2", "c3"], agreement_pct: 89,
  },
  {
    id: "a2", topic_id: "t1",
    alignment_statement: "Communities agree that broadband access is a prerequisite for economic participation in 2026",
    community_ids: ["c1", "c2"], agreement_pct: 94,
  },
];

export default function Home() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <TopicSidebar topics={MOCK_TOPICS} />

      <main className="flex-1 flex flex-col">
        <div className="flex-1 relative">
          <PrismMap communities={MOCK_COMMUNITIES} />
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            <span className="text-xs font-medium text-red-400 tracking-wide">LIVE</span>
          </div>
        </div>
      </main>

      <aside className="w-[420px] border-l border-border flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Community Perspectives
          </h2>
          {MOCK_PERSPECTIVES.map((perspective) => (
            <PerspectiveCard key={perspective.id} perspective={perspective} />
          ))}
        </div>

        <div className="border-t border-border">
          <AlignmentPanel
            alignments={MOCK_ALIGNMENTS}
            communities={MOCK_COMMUNITIES}
          />
        </div>
      </aside>
    </div>
  );
}
