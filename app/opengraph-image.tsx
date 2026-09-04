import { ImageResponse } from "next/og";

export const alt = "Christopher Kilo — Software Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#050505",
          padding: 72,
          color: "#f5f5f5",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 24,
            letterSpacing: 8,
            color: "#a3a3a3",
          }}
        >
          CHRISTOPHER KILO
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 700,
              color: "#f8e71c",
            }}
          >
            Software Engineer
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#d4d4d4",
              maxWidth: 880,
              lineHeight: 1.35,
            }}
          >
            Full-Stack Development · Cloud / IT · Graphic Design
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#a3a3a3" }}>
          christopherkilo.com
        </div>
      </div>
    ),
    { ...size },
  );
}
