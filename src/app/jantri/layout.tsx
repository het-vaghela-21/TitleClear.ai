import type { Metadata } from "next";
import { Noto_Sans_Gujarati } from "next/font/google";

/**
 * Jantri section layout: loads the Gujarati sans face only for this route
 * (IBM Plex has no Gujarati glyphs, so the inline Gujarati labels fall
 * through to it).
 */

const gujaratiSans = Noto_Sans_Gujarati({
  variable: "--font-gujarati-sans",
  subsets: ["gujarati", "latin"],
});

export const metadata: Metadata = {
  title: "Jantri rate lookup — TitleClear.ai",
  description:
    "Look up government jantri (ASR) land rates for Vadodara district by village and survey number — corporation value zones and village NA rates, with the current doubled rates.",
};

export default function JantriLayout({ children }: LayoutProps<"/jantri">) {
  return (
    <div
      className={`${gujaratiSans.variable} contents`}
      style={{ fontFamily: "var(--font-plex-sans), var(--font-gujarati-sans), sans-serif" }}
    >
      {children}
    </div>
  );
}
