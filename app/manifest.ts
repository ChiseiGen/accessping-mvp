import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AccessPing",
    short_name: "AccessPing",
    description:
      "Run a fast WCAG first pass on public pages and turn findings into client-ready reports.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7f4",
    theme_color: "#0f766e",
    categories: ["productivity", "business", "developer"],
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png"
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  };
}
