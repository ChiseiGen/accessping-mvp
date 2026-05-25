import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "7px",
          background: "#171a1f",
          color: "#fbfcf8",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "20px",
          fontWeight: 800
        }}
      >
        A
      </div>
    ),
    size
  );
}
