import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0A0A0F 0%, #12121A 50%, #0D1117 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Glow dots */}
        <div
          style={{
            position: "absolute",
            top: "120px",
            left: "200px",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: "#4A9EFF",
            boxShadow: "0 0 20px 8px rgba(74,158,255,0.4)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "180px",
            right: "280px",
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: "#A855F7",
            boxShadow: "0 0 16px 6px rgba(168,85,247,0.4)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "200px",
            left: "350px",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#F59E0B",
            boxShadow: "0 0 14px 5px rgba(245,158,11,0.4)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "160px",
            right: "320px",
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: "#10B981",
            boxShadow: "0 0 16px 6px rgba(16,185,129,0.4)",
          }}
        />
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #4A9EFF, #A855F7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "white", fontSize: "28px", fontWeight: 700 }}>P</span>
          </div>
          <span
            style={{
              fontSize: "48px",
              fontWeight: 700,
              color: "#F0F0F8",
              letterSpacing: "4px",
            }}
          >
            PRISM
          </span>
        </div>
        {/* Tagline */}
        <p
          style={{
            fontSize: "22px",
            color: "#8888A8",
            maxWidth: "600px",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          See how communities experience the same events.
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
