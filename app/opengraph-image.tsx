import { ImageResponse } from "next/og";

export const alt = "AccessPing accessibility report preview";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f6f7f4",
          color: "#171a1f",
          fontFamily: "Arial, Helvetica, sans-serif",
          padding: "64px"
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            border: "1px solid #cbd6d1",
            borderRadius: "18px",
            background: "#fbfcf8",
            padding: "44px 48px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "56px",
                  height: "56px",
                  borderRadius: "12px",
                  background: "#171a1f",
                  color: "#fbfcf8",
                  fontSize: "28px",
                  fontWeight: 700
                }}
              >
                A
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700 }}>AccessPing</div>
            </div>
            <div
              style={{
                display: "flex",
                padding: "10px 16px",
                borderRadius: "999px",
                background: "#dff3ef",
                color: "#0b5f59",
                fontSize: "18px",
                fontWeight: 700
              }}
            >
              WCAG first pass
            </div>
          </div>

          <div style={{ display: "flex", gap: "56px", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", maxWidth: "660px" }}>
              <div
                style={{
                  color: "#0b5f59",
                  fontSize: "18px",
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  marginBottom: "22px"
                }}
              >
                Pre-handoff accessibility check
              </div>
              <div style={{ fontSize: "72px", fontWeight: 800, lineHeight: 0.98 }}>
                Find access issues before your client does.
              </div>
              <div style={{ color: "#66706a", fontSize: "26px", lineHeight: 1.4, marginTop: "28px" }}>
                Scan public pages, prioritize WCAG fixes, and export a client-ready report.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "270px",
                height: "270px",
                borderRadius: "999px",
                border: "30px solid #0f766e",
                background: "#fbfcf8"
              }}
            >
              <div style={{ fontSize: "76px", fontWeight: 800, lineHeight: 1 }}>82</div>
              <div
                style={{
                  color: "#66706a",
                  fontSize: "17px",
                  fontWeight: 700,
                  textTransform: "uppercase"
                }}
              >
                Access score
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
