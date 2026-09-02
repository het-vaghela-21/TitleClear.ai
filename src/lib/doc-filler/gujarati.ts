/**
 * Gujarati language utilities for generated documents: digits, number words
 * (Indian system — હજાર / લાખ / કરોડ), rupee phrasing and dates.
 *
 * Deeds conventionally spell amounts twice — figures and words — e.g.
 * "રૂ. ૫,૫૦,૦૦૦/- (અંકે રૂપિયા પાંચ લાખ પચાસ હજાર પૂરા)". The helpers here
 * produce exactly that shape so every template phrases them the same way.
 */

const GU_DIGITS = ["૦", "૧", "૨", "૩", "૪", "૫", "૬", "૭", "૮", "૯"];

/** Convert Western digits in a string to Gujarati numerals. */
export function toGujaratiDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => GU_DIGITS[Number(d)]);
}

/**
 * Gujarati number words 0–99. Gujarati two-digit numbers are irregular
 * (like Hindi), so they're a lookup table, not a formula.
 */
const GU_ONES: string[] = [
  "શૂન્ય", "એક", "બે", "ત્રણ", "ચાર", "પાંચ", "છ", "સાત", "આઠ", "નવ",
  "દસ", "અગિયાર", "બાર", "તેર", "ચૌદ", "પંદર", "સોળ", "સત્તર", "અઢાર", "ઓગણીસ",
  "વીસ", "એકવીસ", "બાવીસ", "ત્રેવીસ", "ચોવીસ", "પચીસ", "છવીસ", "સત્તાવીસ", "અઠ્ઠાવીસ", "ઓગણત્રીસ",
  "ત્રીસ", "એકત્રીસ", "બત્રીસ", "તેત્રીસ", "ચોત્રીસ", "પાંત્રીસ", "છત્રીસ", "સાડત્રીસ", "આડત્રીસ", "ઓગણચાલીસ",
  "ચાલીસ", "એકતાલીસ", "બેતાલીસ", "ત્રેતાલીસ", "ચુંમાલીસ", "પિસ્તાલીસ", "છેતાલીસ", "સુડતાલીસ", "અડતાલીસ", "ઓગણપચાસ",
  "પચાસ", "એકાવન", "બાવન", "ત્રેપન", "ચોપન", "પંચાવન", "છપ્પન", "સત્તાવન", "અઠ્ઠાવન", "ઓગણસાઠ",
  "સાઠ", "એકસઠ", "બાસઠ", "ત્રેસઠ", "ચોસઠ", "પાંસઠ", "છાસઠ", "સડસઠ", "અડસઠ", "અગણોસિત્તેર",
  "સિત્તેર", "એકોતેર", "બોતેર", "તોતેર", "ચુમોતેર", "પંચોતેર", "છોતેર", "સિત્યોતેર", "ઇઠ્યોતેર", "ઓગણાએંસી",
  "એંસી", "એક્યાસી", "બ્યાસી", "ત્યાસી", "ચોર્યાસી", "પંચ્યાસી", "છ્યાસી", "સિત્યાસી", "ઈઠ્યાસી", "નેવ્યાસી",
  "નેવું", "એકાણું", "બાણું", "ત્રાણું", "ચોરાણું", "પંચાણું", "છન્નું", "સત્તાણું", "અઠ્ઠાણું", "નવ્વાણું",
];

function twoDigitWordsGu(n: number): string {
  return GU_ONES[n];
}

/** 0–999 in Gujarati words: "[X]સો [YZ]". */
function threeDigitWordsGu(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds === 0) return twoDigitWordsGu(rest);
  const hundredWord = `${GU_ONES[hundreds]}સો`;
  return rest === 0 ? hundredWord : `${hundredWord} ${twoDigitWordsGu(rest)}`;
}

/**
 * Whole number → Gujarati words in the Indian system.
 * 1,25,500 → "એક લાખ પચીસ હજાર પાંચસો"
 */
export function numberToGujaratiWords(n: number): string {
  if (!Number.isFinite(n)) return "";
  if (n < 0) return `ઋણ ${numberToGujaratiWords(-n)}`;
  n = Math.floor(n);
  if (n === 0) return GU_ONES[0];

  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;

  if (crore > 0) parts.push(`${numberToGujaratiWords(crore)} કરોડ`);
  if (lakh > 0) parts.push(`${twoDigitWordsGu(lakh)} લાખ`);
  if (thousand > 0) parts.push(`${twoDigitWordsGu(thousand)} હજાર`);
  if (rest > 0) parts.push(threeDigitWordsGu(rest));

  return parts.join(" ");
}

/** English words in the Indian system, for English-language documents. */
const EN_ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen",
];
const EN_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function twoDigitWordsEn(n: number): string {
  if (n < 20) return EN_ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o === 0 ? EN_TENS[t] : `${EN_TENS[t]}-${EN_ONES[o]}`;
}

function threeDigitWordsEn(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h === 0) return twoDigitWordsEn(rest);
  const hw = `${EN_ONES[h]} hundred`;
  return rest === 0 ? hw : `${hw} ${twoDigitWordsEn(rest)}`;
}

export function numberToEnglishWordsIndian(n: number): string {
  if (!Number.isFinite(n)) return "";
  if (n < 0) return `minus ${numberToEnglishWordsIndian(-n)}`;
  n = Math.floor(n);
  if (n === 0) return EN_ONES[0];

  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;

  if (crore > 0) parts.push(`${numberToEnglishWordsIndian(crore)} crore`);
  if (lakh > 0) parts.push(`${twoDigitWordsEn(lakh)} lakh`);
  if (thousand > 0) parts.push(`${twoDigitWordsEn(thousand)} thousand`);
  if (rest > 0) parts.push(threeDigitWordsEn(rest));

  return parts.join(" ");
}

/** 5500000 → "55,00,000" (Indian digit grouping). */
export function formatIndianNumber(n: number): string {
  if (!Number.isFinite(n)) return "";
  const sign = n < 0 ? "-" : "";
  const s = String(Math.floor(Math.abs(n)));
  if (s.length <= 3) return sign + s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${sign}${rest},${last3}`;
}

/**
 * Full deed-style rupee phrase.
 *  gu: "રૂ. ૫,૫૦,૦૦૦/- (અંકે રૂપિયા પાંચ લાખ પચાસ હજાર પૂરા)"
 *  en: "Rs. 5,50,000/- (Rupees five lakh fifty thousand only)"
 * Returns a blank-line phrase when the amount is missing/invalid.
 */
export function rupeesInWords(amount: string | number | undefined, lang: "gu" | "en"): string {
  const n = typeof amount === "number" ? amount : Number(String(amount ?? "").replace(/[,\s]/g, ""));
  if (!Number.isFinite(n) || String(amount ?? "").trim() === "") {
    return lang === "gu"
      ? "રૂ. ________/- (અંકે રૂપિયા ____________________ પૂરા)"
      : "Rs. ________/- (Rupees ____________________ only)";
  }
  const grouped = formatIndianNumber(n);
  if (lang === "gu") {
    return `રૂ. ${toGujaratiDigits(grouped)}/- (અંકે રૂપિયા ${numberToGujaratiWords(n)} પૂરા)`;
  }
  const words = numberToEnglishWordsIndian(n);
  return `Rs. ${grouped}/- (Rupees ${words} only)`;
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

export const GU_MONTHS = [
  "જાન્યુઆરી", "ફેબ્રુઆરી", "માર્ચ", "એપ્રિલ", "મે", "જૂન",
  "જુલાઈ", "ઓગસ્ટ", "સપ્ટેમ્બર", "ઓક્ટોબર", "નવેમ્બર", "ડિસેમ્બર",
];

export const GU_WEEKDAYS = [
  "રવિવાર", "સોમવાર", "મંગળવાર", "બુધવાર", "ગુરુવાર", "શુક્રવાર", "શનિવાર",
];

const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parseISODate(value: string | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "2026-08-18" → gu: "તા. ૧૮/૦૮/૨૦૨૬" | en: "18/08/2026". */
export function dateShort(value: string | undefined, lang: "gu" | "en"): string {
  const d = parseISODate(value);
  if (!d) return lang === "gu" ? "તા. ____/____/________" : "____/____/________";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const s = `${dd}/${mm}/${d.getFullYear()}`;
  return lang === "gu" ? `તા. ${toGujaratiDigits(s)}` : s;
}

/**
 * Long deed-opening form.
 *  gu: "તા. ૧૮મી ઓગસ્ટ, ૨૦૨૬ ને સોમવાર"
 *  en: "18th August, 2026 (Monday)"
 */
export function dateLong(value: string | undefined, lang: "gu" | "en"): string {
  const d = parseISODate(value);
  if (!d) {
    return lang === "gu" ? "તા. ________________" : "________________";
  }
  const day = d.getDate();
  if (lang === "gu") {
    const suffix = day === 1 ? "લી" : day === 2 || day === 3 ? "જી" : day === 4 ? "થી" : day <= 10 || day === 30 ? "મી" : "મી";
    return `તા. ${toGujaratiDigits(day)}${suffix} ${GU_MONTHS[d.getMonth()]}, ${toGujaratiDigits(d.getFullYear())} ને ${GU_WEEKDAYS[d.getDay()]}`;
  }
  const j = day % 10;
  const k = day % 100;
  const ord = j === 1 && k !== 11 ? "st" : j === 2 && k !== 12 ? "nd" : j === 3 && k !== 13 ? "rd" : "th";
  const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()];
  return `${day}${ord} ${EN_MONTHS[d.getMonth()]}, ${d.getFullYear()} (${weekday})`;
}

/**
 * Convenience: age phrase used in party introductions, in the abbreviation
 * the Gujarat model drafts use ("ઉ.વ.આ." = ઉંમર વર્ષ આશરે).
 * gu: "ઉ.વ.આ. ૪૫" | en: "aged about 45 years"
 */
export function agePhrase(age: string | undefined, lang: "gu" | "en"): string {
  const v = (age ?? "").trim();
  if (v === "") return lang === "gu" ? "ઉ.વ.આ. ______" : "aged ______ years";
  return lang === "gu" ? `ઉ.વ.આ. ${toGujaratiDigits(v)}` : `aged about ${v} years`;
}
