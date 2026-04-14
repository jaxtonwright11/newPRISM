import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://web-liard-psi-12.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/signup`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/feed`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/discover`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/map`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return staticRoutes;

  const supabase = createClient(url, key);

  const [topicsRes, communitiesRes] = await Promise.all([
    supabase.from("topics").select("slug, updated_at").limit(200),
    supabase.from("communities").select("id, created_at").eq("active", true).limit(200),
  ]);

  const topicRoutes: MetadataRoute.Sitemap = (topicsRes.data ?? []).map((t) => ({
    url: `${SITE_URL}/topic/${t.slug}`,
    lastModified: new Date(t.updated_at),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const communityRoutes: MetadataRoute.Sitemap = (communitiesRes.data ?? []).map((c) => ({
    url: `${SITE_URL}/community/${c.id}`,
    lastModified: new Date(c.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const compareRoutes: MetadataRoute.Sitemap = (topicsRes.data ?? []).map((t) => ({
    url: `${SITE_URL}/compare/${t.slug}`,
    lastModified: new Date(t.updated_at),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...topicRoutes, ...compareRoutes, ...communityRoutes];
}
