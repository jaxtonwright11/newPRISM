import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const size = Number(request.nextUrl.searchParams.get("size") || "192");
  const s = Math.min(Math.max(size, 48), 1024);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #3B82F6, #A855F7)",
          borderRadius: `${s * 0.2}px`,
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: `${s * 0.55}px`,
            fontWeight: 700,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          P
        </span>
      </div>
    ),
    { width: s, height: s }
  );
}
