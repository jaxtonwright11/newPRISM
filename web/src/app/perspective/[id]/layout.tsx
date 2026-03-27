import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://web-liard-psi-12.vercel.app";
    const res = await fetch(`${baseUrl}/api/perspectives/${id}`, {
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const { data } = await res.json();
      if (data) {
        const community = data.community?.name ?? "a community";
        const quote = data.quote?.length > 120 ? data.quote.slice(0, 117) + "..." : data.quote;

        return {
          title: `${community} on PRISM`,
          description: `"${quote}"`,
          openGraph: {
            title: `${community} — PRISM Perspective`,
            description: `"${quote}"`,
            type: "article",
            siteName: "PRISM",
          },
          twitter: {
            card: "summary",
            title: `${community} — PRISM Perspective`,
            description: `"${quote}"`,
          },
        };
      }
    }
  } catch {
    // Fall through to defaults
  }

  return {
    title: "Perspective — PRISM",
    description: "See how communities experience the world differently.",
  };
}

export default function PerspectiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
