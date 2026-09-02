/**
 * District-level jantri metadata: rate categories (bilingual labels + the
 * category's own multiplier), and the sourcing notes shown to users.
 *
 * IMPORTANT — the April-2023 revision is NOT a flat ×2. Per Revenue Dept
 * GR No. STP-122023-20-H.1 dated 13-04-2023 (in force 15-04-2023, and
 * still operative as of 20-08-2026 — the revised "Jantri 2.0" drafted in
 * Nov-2024 has not been notified):
 *   - LAND rates (agri, open plots, NA land, mineral, gamtal): ×2
 *   - Composite land+construction rates: residence flat ×1.8, office ×1.5,
 *     shop ×2
 * A policy change (e.g. Jantri 2.0 coming into force) is an edit here —
 * the data files stay untouched.
 */

export interface LabelPair {
  en: string;
  gu: string;
}

export interface RateCategory extends LabelPair {
  /** Printed ASR-2011 rate → rate in force. Per GR 13-04-2023. */
  multiplier: number;
}

/** Order matches CorpZone.r. */
export const CORP_RATE_CATEGORIES: RateCategory[] = [
  { en: "Open plot — residential", gu: "ખુલ્લા પ્લોટનો ભાવ (રહેણાંક)", multiplier: 2 },
  {
    en: "Residence flat / apartment (land + construction)",
    gu: "રહેણાંક ફ્લેટ / એપાર્ટમેન્ટ",
    multiplier: 1.8,
  },
  { en: "Office", gu: "ઓફિસ", multiplier: 1.5 },
  { en: "Shop", gu: "દુકાન", multiplier: 2 },
  { en: "Open plot — industrial", gu: "ખુલ્લા પ્લોટ (ઔદ્યોગિક)", multiplier: 2 },
  { en: "Agricultural — irrigated (piyat)", gu: "ખેતી — પિયત", multiplier: 2 },
  { en: "Agricultural — non-irrigated (bin piyat)", gu: "ખેતી — બિન પિયત", multiplier: 2 },
];

/** Order matches NaRow.r — all land rates, so all ×2. */
export const NA_RATE_CATEGORIES: RateCategory[] = [
  { en: "Non-agricultural — residential", gu: "બિનખેતી રહેણાંક", multiplier: 2 },
  { en: "Non-agricultural — commercial", gu: "બિનખેતી વાણિજ્ય", multiplier: 2 },
  { en: "Non-agricultural — industrial", gu: "બિનખેતી ઔદ્યોગિક", multiplier: 2 },
  { en: "Mineral-bearing land", gu: "ખનીજ તત્વોવાળી જમીન", multiplier: 2 },
];

export const GAMTAL_CATEGORIES: { residential: RateCategory; commercial: RateCategory } = {
  residential: { en: "Gamtal — residential", gu: "ગામતળ રહેણાંક", multiplier: 2 },
  commercial: { en: "Gamtal — commercial", gu: "ગામતળ વાણિજ્ય", multiplier: 2 },
};

export interface JantriDistrictMeta {
  slug: string;
  name: LabelPair;
  multiplierNote: LabelPair;
  asOfNote: LabelPair;
  sourceNote: LabelPair;
  coverageNote: LabelPair;
  /** Date we last verified the policy facts against official sources. */
  factsVerifiedOn: string;
}

export const VADODARA_META: JantriDistrictMeta = {
  slug: "vadodara",
  name: { en: "Vadodara", gu: "વડોદરા" },
  multiplierNote: {
    en: "Rate in force = ASR-2011 printed rate × the factor set by the Revenue Department GR of 13-04-2023, effective 15 April 2023: land rates ×2; residence flat ×1.8; office ×1.5; shop ×2.",
    gu: "હાલનો ભાવ = ASR-2011 નો છાપેલો ભાવ × મહેસૂલ વિભાગના તા. ૧૩-૦૪-૨૦૨૩ ના ઠરાવ મુજબનો ગુણાંક (તા. ૧૫-૦૪-૨૦૨૩ થી અમલી): જમીનના ભાવ ×૨; રહેણાંક ફ્લેટ ×૧.૮; ઓફિસ ×૧.૫; દુકાન ×૨.",
  },
  asOfNote: {
    en: "A revised jantri (draft published 20-11-2024) is pending with the state and has not been notified in force; until it is, these factored ASR-2011 rates apply. If it comes into force, rates here may change overnight — always cross-check on Garvi.",
    gu: "સુધારેલી જંત્રીનો મુસદ્દો (તા. ૨૦-૧૧-૨૦૨૪) સરકાર પાસે વિચારાધીન છે અને હજી અમલમાં આવેલ નથી; ત્યાં સુધી ASR-2011 ના ગુણાંકવાળા ભાવ લાગુ રહે છે. તે અમલમાં આવે તો અહીંના ભાવ બદલાઈ શકે — ગાર્વી પર અવશ્ય ખરાઈ કરવી.",
  },
  sourceNote: {
    en: "Digitised from the ASR-2011 (Final) jantri books for Vadodara district — the Corporation/Authority book and the Non-Agricultural (village) book.",
    gu: "વડોદરા જિલ્લાની ASR-2011 (ફાઈનલ) જંત્રી બુક — કોર્પોરેશન/ઓથોરિટી બુક તથા બિનખેતી (ગામ) બુક — પરથી ડિજિટાઈઝ કરેલ.",
  },
  coverageNote: {
    en: "Covers the undivided Vadodara district as printed in ASR-2011 — including talukas that are now in Chhota Udepur district.",
    gu: "ASR-2011 મુજબના અવિભાજિત વડોદરા જિલ્લાને આવરે છે — હાલ છોટા ઉદેપુર જિલ્લામાં ગયેલા તાલુકા સહિત.",
  },
  factsVerifiedOn: "2026-08-20",
};
