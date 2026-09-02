import type { Metadata } from "next";
import { Noto_Sans_Gujarati, Noto_Serif_Gujarati } from "next/font/google";
import "./documents.css";

/**
 * Layout for the document-filler section. Loads the Gujarati faces only
 * here so the rest of the app doesn't pay for them: serif for the generated
 * deed sheets, sans for Gujarati UI labels (IBM Plex has no Gujarati
 * glyphs, so it falls through to these for Gujarati text).
 */

const gujaratiSerif = Noto_Serif_Gujarati({
  variable: "--font-gujarati-serif",
  subsets: ["gujarati", "latin"],
});

const gujaratiSans = Noto_Sans_Gujarati({
  variable: "--font-gujarati-sans",
  subsets: ["gujarati", "latin"],
});

export const metadata: Metadata = {
  title: "Document drafts — TitleClear.ai",
  description:
    "Fill Gujarat property documents — banakhat, rent agreement, sale deed, power of attorney and more — in Gujarati, ready to print or download.",
};

export default function DocumentsLayout({ children }: LayoutProps<"/documents">) {
  return (
    <div
      className={`${gujaratiSerif.variable} ${gujaratiSans.variable} doc-ui contents`}
    >
      {children}
    </div>
  );
}
