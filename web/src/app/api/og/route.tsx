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
          background: "linear-gradient(160deg, #1A1208 0%, #0A1628 40%, #0F1114 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* City light dots — amber glows mimicking the map */}
        {[
          { top: 180, left: 220, size: 16, opacity: 0.5 },
          { top: 200, left: 580, size: 20, opacity: 0.6 },
          { top: 280, left: 400, size: 12, opacity: 0.35 },
          { top: 150, left: 800, size: 18, opacity: 0.45 },
          { top: 320, left: 700, size: 10, opacity: 0.3 },
          { top: 250, left: 150, size: 14, opacity: 0.4 },
          { top: 350, left: 900, size: 12, opacity: 0.35 },
          { top: 130, left: 450, size: 8, opacity: 0.25 },
          { top: 380, left: 300, size: 10, opacity: 0.3 },
          { top: 160, left: 680, size: 14, opacity: 0.4 },
        ].map((dot, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${dot.top}px`,
              left: `${dot.left}px`,
              width: `${dot.size}px`,
              height: `${dot.size}px`,
              borderRadius: "50%",
              background: "#D4956B",
              boxShadow: `0 0 ${dot.size * 2}px ${dot.size}px rgba(212,149,107,${dot.opacity})`,
              opacity: dot.opacity,
            }}
          />
        ))}

        {/* Subtle border lines mimicking state borders */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.08,
            backgroundImage: `
              linear-gradient(rgba(212,149,107,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(212,149,107,0.3) 1px, transparent 1px)
            `,
            backgroundSize: "120px 100px",
          }}
        />

        {/* PRISM wordmark */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            marginBottom: "32px",
          }}
        >
          <span
            style={{
              fontSize: "52px",
              fontWeight: 700,
              color: "#EDEDEF",
              letterSpacing: "6px",
            }}
          >
            PRISM
          </span>
          {/* Rainbow line */}
          <div
            style={{
              width: "120px",
              height: "3px",
              borderRadius: "2px",
              background: "linear-gradient(90deg, #3B82F6, #A855F7, #F59E0B, #22C55E, #06B6D4, #F97316)",
            }}
          />
        </div>

        {/* Headline */}
        <p
          style={{
            fontSize: "32px",
            fontWeight: 700,
            color: "#EDEDEF",
            maxWidth: "700px",
            textAlign: "center",
            lineHeight: 1.3,
            marginBottom: "16px",
          }}
        >
          See how your community actually experiences the world
        </p>

        {/* Subtext */}
        <p
          style={{
            fontSize: "18px",
            color: "#9CA3AF",
            maxWidth: "550px",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Perspectives from communities across America, neighborhood by neighborhood.
        </p>

        {/* Accent line at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "linear-gradient(90deg, transparent, #D4956B, transparent)",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
