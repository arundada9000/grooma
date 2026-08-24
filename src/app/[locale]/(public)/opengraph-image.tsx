import { ImageResponse } from "next/og";
import { connection } from "next/server";
import { getShopContext } from "@/lib/tenant";
import { resolvePalettes } from "@/lib/theme/theme-css";

/**
 * Branded Open Graph card for every public page. Rendered per request
 * from live shop data (name, tagline, preset colors) with a graceful
 * platform-brand fallback. Copy stays Latin-script so the bundled
 * default font renders it; Devanagari OG text is out of scope.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Book your appointment online.";

export default async function OpengraphImage() {
  await connection();

  let name = "Grooma";
  let tagline = "Your grooming, made simple.";
  let accent = "#84572a";
  let background = "#f5efe6";
  try {
    const shop = await getShopContext();
    const palettes = resolvePalettes(shop.branding);
    name = shop.name;
    tagline = shop.tagline?.trim() || tagline;
    accent = palettes.light.accent;
    background = palettes.light.background;
  } catch {
    // Platform fallback above keeps the image working without a database.
  }

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 36,
        background: `linear-gradient(135deg, ${background} 0%, ${accent}22 100%)`,
      }}
    >
      <div style={{ display: "flex", gap: 14 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              width: 26,
              height: 96,
              borderRadius: 13,
              rotate: "18deg",
              background: i % 2 === 0 ? accent : "#f5efe6",
              border: `3px solid ${accent}`,
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 88,
          fontWeight: 700,
          color: "#1a1512",
          letterSpacing: -2,
        }}
      >
        {name}
      </div>
      <div style={{ display: "flex", fontSize: 40, color: "#4b4038" }}>{tagline}</div>
    </div>,
    size,
  );
}
