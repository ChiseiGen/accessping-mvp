import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "38px",
          background: "#171a1f",
          color: "#fbfcf8",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "104px",
          fontWeight: 800
        }}
      >
        A
      </div>
    ),
    size
  );
}
