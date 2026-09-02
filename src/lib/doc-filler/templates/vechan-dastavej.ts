import type { DocBlock, DocTemplate, FieldValues, Lang } from "../types";
import {
  bold,
  clause,
  clauseNo,
  makeCtx,
  para,
  schedule,
  signatures,
  spacer,
  stampSpace,
  title,
  witnesses,
} from "../build";
import { toGujaratiDigits } from "../gujarati";
import { partyGroup, partyLine, propertySection, witnessGroup } from "../shared-fields";
import { propertyScheduleRows } from "./banakhat";

/**
 * વેચાણ દસ્તાવેજ / Sale deed — encoded from the Gujarat registration
 * department's model drafts (ખેતીની જમીન / બિનખેતી ખુલ્લો પ્લોટ / મકાન-ફ્લેટ
 * variants; see research/templates/vechan_*.txt). The land-type choice
 * switches the captions and the variant-specific clauses (agriculturist
 * buyer for farm land, NA permission for plots).
 */

type LandKind = "agri" | "plot" | "building";

function landKind(values: FieldValues): LandKind {
  const v = String(values["landKind"] ?? "");
  return v === "agri" || v === "building" ? v : "plot";
}

const LAND_LABEL: Record<LandKind, { gu: string; en: string }> = {
  agri: { gu: "ખેતીલાયક જમીન", en: "agricultural land" },
  plot: { gu: "બિનખેતીલાયક ખુલ્લા પ્લોટની જમીન", en: "non-agricultural open plot" },
  building: { gu: "મકાન / ફ્લેટવાળી મિલકત", en: "house / flat property" },
};

function buildGu(values: FieldValues): DocBlock[] {
  const c = makeCtx(values, "gu");
  const sellers = c.group("sellers");
  const buyers = c.group("buyers");
  const wit = c.group("witnesses");
  const kind = landKind(values);
  const landLabel = LAND_LABEL[kind].gu;

  const blocks: DocBlock[] = [
    stampSpace("ઈ-સ્ટેમ્પ / ફ્રેન્કિંગ માટે જગ્યા"),
    title("વેચાણ દસ્તાવેજ"),
    para(
      [
        `મોજે ગામ ${c.t("propVillage")}, તા. ${c.t("propTaluka")}, જિ. ${c.t("propDistrict")} ની સીમના રેવન્યુ બ્લોક/સર્વે નંબર ${c.num("surveyNo")}, કુલ ક્ષેત્રફળ ${c.t("area")} વાળી ${landLabel}નો વેચાણ દસ્તાવેજ ${c.money("totalAmount")} નો.`,
      ],
      "center",
    ),
    para([`આજરોજ ${c.dateLong("deedDate")} ના અંગ્રેજી દિને.`]),
  ];

  buyers.forEach((p, i) => {
    blocks.push(
      para([
        bold(buyers.length > 1 ? `વેચાણ રાખનાર ${toGujaratiDigits(i + 1)}: ` : "વેચાણ રાખનાર: "),
        partyLine(p, "gu"),
        " (જેમને હવે પછી આ વેચાણ દસ્તાવેજમાં તમો ",
        bold("“વેચાણ રાખનાર”"),
        " એ રીતે સંબોધવામાં આવ્યા છે; જે શબ્દના અર્થમાં તમો વેચાણ રાખનાર તથા તમારા વંશ, વાલી, વારસો, એસાઈનીઓ, એકઝીક્યુટર્સ, મુખત્યારો વગેરે તમામનો સમાવેશ કરવામાં આવેલ છે.)",
      ]),
    );
  });

  sellers.forEach((p, i) => {
    blocks.push(
      para([
        bold(sellers.length > 1 ? `વેચાણ આપનાર ${toGujaratiDigits(i + 1)}: ` : "વેચાણ આપનાર: "),
        partyLine(p, "gu"),
        " (જેમને હવે પછી આ વેચાણ દસ્તાવેજમાં અમો ",
        bold("“વેચાણ આપનાર”"),
        " એ રીતે સંબોધવામાં આવ્યા છે; જે શબ્દના અર્થમાં અમો વેચાણ આપનાર તથા અમારા વંશ, વાલી, વારસો, એસાઈનીઓ, એકઝીક્યુટર્સ, મુખત્યારો વગેરે તમામનો સમાવેશ કરવામાં આવેલ છે.)",
      ]),
    );
  });

  blocks.push(
    para([
      `આથી અમો વેચાણ આપનાર આ વેચાણ દસ્તાવેજ કરી આપીએ છીએ. તે મિલકત ડિસ્ટ્રિક્ટ ${c.t("propDistrict")}, સબ-ડિસ્ટ્રિક્ટ ${c.t("propSubDistrict")} ના મોજે ગામ ${c.t("propVillage")} માં આવેલ ${landLabel} છે, જે નીચે પરિશિષ્ટમાં જણાવેલ વર્ણન અને ક્ષેત્રફળવાળી મિલકત આજરોજ તમોને આ વેચાણ દસ્તાવેજથી વેચાણ આપેલ છે.`,
    ]),
    schedule(propertyScheduleRows(values, "gu"), "-: પરિશિષ્ટ (વેચાણ આપેલ મિલકતનું વર્ણન) :-"),
    para([
      "એ રીતે ઉપરોક્ત ચાર ખૂંટ વચ્ચે આવેલ મિલકત, જે શેઢા-પાળી, વાડ-વળગણ, ઝાડ-બીડ સહિતની અસલ હદ-નિશાન મુજબની, તથા રસ્તા વાપરવાના હક્કો તથા આવવા-જવાના તમામ હક્કો સાથે, વેચાણ આપીને તમોને તેના માલિક અને કબજેદાર ઠરાવ્યા છે.",
    ]),
  );

  if (kind === "plot" && c.has("naOrder")) {
    blocks.push(
      para([
        `મજકૂર જમીનમાં રહેણાકના હેતુ માટે બિનખેતીની પરવાનગી ${c.t("naOrder")} થી આપવામાં આવેલ છે.`,
      ]),
    );
  }

  blocks.push(
    para([
      bold("અવેજ અને પહોંચ: "),
      `સદર મિલકત તદ્દન બોજા રહિત અને તેના તમામ પ્રકારના રાઈટ, ટાઈટલ ક્લિયર અને માર્કેટેબલ છે તેવો તમો વેચાણ રાખનારને પાકો ભરોસો અને વિશ્વાસ આપીને વેચાણ આપેલ છે. જેની વેચાણ કિંમત ${c.money("totalAmount")} નક્કી કરેલ છે. જે વેચાણ અવેજની પૂરેપૂરી રકમ ${paymentPhrase(values)} અમો વેચાણ આપનારને મળી ગયેલ છે. એ રીતે પૂરેપૂરો ચૂકતે વેચાણ અવેજ મળી ગયેલ હોઈ, હવે વેચાણ અવેજ પેટે કોઈ રકમ લેવાની બાકી રહેતી નથી.`,
    ]),
    para([
      bold("માલિકી અને કબજો: "),
      "આજરોજથી તમો વેચાણ રાખનાર સદરહુ મિલકતના કુલ સ્વતંત્ર માલિક અને પ્રત્યક્ષ કબજેદાર થયા છો. સદરહુ મિલકતમાં તમો વેચાણ રાખનાર ખેડો, ખેડાવો, વેચો, સાટે યા ગીરો આપો — તમારું દિલ ચાહે તેમ ઉપયોગ કરવા હક્કદાર છો. સદર મિલકત તમોને આજરોજ યાવત્ ચંદ્ર-દિવાકરૌ — ચાંદો-સૂરજ તપે ત્યાં સુધી — કુલ અભરમના દાવે અઘાટ વેચાણ આપી, તમારા પ્રત્યક્ષ કબજે સોંપીને, તેના તમોને સંપૂર્ણ અને સ્વતંત્ર માલિક અને કબજેદાર ઠરાવ્યા છે.",
    ]),
    para([
      bold("ટાઈટલની બાંહેધરી: "),
      "સદરહુ મિલકત અંગે કોઈપણ વ્યક્તિ, સંસ્થા, બેંક, પેઢી, નાણાકીય સંસ્થા કે અમારા વારસદારો કે ભૂતકાળમાં હિત ધરાવનાર કોઈપણ વ્યક્તિ કે સરકારી / અર્ધ-સરકારી કચેરી દ્વારા કોઈ દાવા-દૂવી, તકરાર, લિટિગેશન કે કોર્ટ કેસ ઉપસ્થિત થાય, તો તેનો નિકાલ અમો વેચાણ આપનાર અમારા ખર્ચે લાવી આપીશું, તેમજ સદરહુ મિલકતના ટાઈટલ ચોખ્ખાં, ક્લિયર, માર્કેટેબલ અને સેલેબલ છે અને રહેશે તેવો પાકો વિશ્વાસ, ભરોસો, ખાતરી અને બાંહેધરી અમો તમોને આપીએ છીએ.",
    ]),
    para([
      bold("રેકોર્ડ તબદીલી: "),
      "સદર મિલકત તમો વેચાણ રાખનારના નામે ૭/૧૨ / સિટી સર્વે / પ્રોપર્ટી કાર્ડના રેકોર્ડમાં તબદીલ કરવા માટે જ્યાં જ્યાં જરૂરી હોય ત્યાં જર-જવાબો, સહીઓ, મત્તાં, સોગંદનામાં, કબૂલાતો આપવા તથા જરૂર જણાય તો રૂબરૂ હાજર રહેવા આથી અમો વેચાણ આપનાર બંધાયેલા છીએ.",
    ]),
    para([
      bold("વેરા: "),
      "મજકૂર મિલકતને લગતા ગુજરાત સરકાર, કેન્દ્ર સરકાર તથા સ્થાનિક સ્વરાજની સંસ્થાના કર, શિક્ષણ વેરો, જમીન મહેસૂલ જેવા તમામ પ્રકારના વેરા આજદિન સુધીના ભરપાઈ કરેલા છે; જો કાંઈ બાકી નીકળે તો તે અમો વેચાણ આપનારે ભરવાના છે, તથા આજ તારીખ પછીના તમામ કરવેરા તમો વેચાણ લેનારે ભરવાના રહેશે.",
    ]),
    para([
      bold("ખર્ચ અને સ્ટેમ્પ: "),
      "આ વેચાણ દસ્તાવેજ સબ રજિસ્ટ્રારની કચેરીમાં નોંધણી માટે રજૂ કરવામાં આવેલ છે. દસ્તાવેજ કરવા સારુ થતો તમામ ખર્ચ — સ્ટેમ્પ ડ્યુટી, રજિસ્ટ્રેશન ફી, વકીલ ફી, ટાઈપિંગ ખર્ચ વગેરે — તમો વેચાણ લેનારે ભોગવેલ છે. સદર દસ્તાવેજમાં સરકારશ્રીની જંત્રી મુજબની જરૂરી સ્ટેમ્પ વાપરેલ છે.",
    ]),
  );

  if (kind === "agri") {
    blocks.push(
      para([
        bold("ખેડૂત ખાતેદાર બાબત: "),
        c.has("khedutDetail")
          ? `આ વેચાણ દસ્તાવેજમાં વેચાણ રાખનાર ${c.t("khedutDetail")} થી ખેડૂત ખાતેદાર છે.`
          : "આ વેચાણ દસ્તાવેજમાં વેચાણ રાખનાર મોજે ગામ ________ ની સીમના સર્વે નં. ________, ખાતા નં. ________ થી ખેડૂત ખાતેદાર છે.",
      ]),
    );
  }

  if (c.has("extraClauses")) {
    blocks.push(para([bold("વધારાની શરતો: "), c.t("extraClauses")]));
  }

  blocks.push(
    spacer(),
    para([
      "આ વેચાણ દસ્તાવેજ અમોએ અમારી રાજીખુશીથી, શુદ્ધબુદ્ધિથી, બિનકેફીપણામાં, વાંચી, સમજી, વિચારીને, સભાન અવસ્થામાં, કોઈના દબાણ કે ધાક-ધમકી વિના, અક્કલ હોંશિયારીથી, વેચાણનો પૂરેપૂરો ચૂકતે અવેજ વસૂલ કરી લઈને લખી આપેલો છે; જે અમો વેચાણ આપનારને તથા અમારા વંશ, વાલી, વારસો તમામને કબૂલ, મંજૂર અને બંધનકર્તા છે અને રહેશે. જે નીચે સાક્ષીઓની રૂબરૂમાં અમોએ અમારી સહીઓ કરી આપેલી છે, જે બરાબર અને ખરી છે.",
    ]),
    signatures([
      ...sellers.map((p, i) => ({
        role: sellers.length > 1 ? `વેચાણ આપનાર ${toGujaratiDigits(i + 1)}` : "વેચાણ આપનાર",
        name: p.t("name"),
      })),
      ...buyers.map((p, i) => ({
        role: buyers.length > 1 ? `વેચાણ રાખનાર ${toGujaratiDigits(i + 1)}` : "વેચાણ રાખનાર",
        name: p.t("name"),
      })),
    ]),
    witnesses(
      "સાક્ષીઓ (અત્રે મતું — તત્રે શાખ)",
      wit.map((w) => `${w.t("name")}, રહે: ${w.t("address")}`),
    ),
    spacer(),
    para(
      [
        bold("નોંધ: "),
        "નોંધણી સમયે કલમ-૩૨(એ) મુજબ પક્ષકારોના ફોટા તથા અંગૂઠાની છાપ અને કલમ-૩૪(૩) મુજબનું ચેકલિસ્ટ સબ રજિસ્ટ્રાર કચેરીમાં ભરવાનું રહે છે; મિલકતના ફોટા સાથે રાખવા.",
      ],
      "left",
    ),
  );

  return blocks;
}

function paymentPhrase(values: FieldValues): string {
  const mode = String(values["paymentMode"] ?? "");
  const ref = String(values["paymentRef"] ?? "").trim();
  const base = mode === "cash" ? "રોકડેથી" : mode === "bank" ? "બેંક ટ્રાન્સફર (RTGS/NEFT)થી" : "ચેકથી";
  return ref === "" ? base : `${base} (નં. ${ref})`;
}

function buildEn(values: FieldValues): DocBlock[] {
  const c = makeCtx(values, "en");
  const sellers = c.group("sellers");
  const buyers = c.group("buyers");
  const wit = c.group("witnesses");
  const kind = landKind(values);
  const landLabel = LAND_LABEL[kind].en;

  const blocks: DocBlock[] = [
    stampSpace("Space reserved for e-stamp / franking"),
    title("SALE DEED"),
    para(
      [
        `Sale deed of the ${landLabel} bearing revenue block/survey no. ${c.num("surveyNo")} of Mouje ${c.t("propVillage")}, Taluka ${c.t("propTaluka")}, District ${c.t("propDistrict")}, admeasuring ${c.t("area")}, for ${c.money("totalAmount")}.`,
      ],
      "center",
    ),
    para([`Executed on ${c.dateLong("deedDate")}.`]),
  ];

  buyers.forEach((p, i) => {
    blocks.push(
      para([
        bold(buyers.length > 1 ? `Purchaser ${i + 1}: ` : "Purchaser: "),
        partyLine(p, "en"),
        " — hereinafter the ",
        bold("“Purchaser”"),
        " (which expression includes their heirs, guardians, successors, assignees, executors and attorneys).",
      ]),
    );
  });

  sellers.forEach((p, i) => {
    blocks.push(
      para([
        bold(sellers.length > 1 ? `Vendor ${i + 1}: ` : "Vendor: "),
        partyLine(p, "en"),
        " — hereinafter the ",
        bold("“Vendor”"),
        " (with the same inclusive meaning).",
      ]),
    );
  });

  let n = 0;
  const next = () => clauseNo(++n, "en");

  blocks.push(
    para([
      `NOW THE VENDOR hereby sells and conveys to the Purchaser the ${landLabel} situated in District ${c.t("propDistrict")}, Sub-district ${c.t("propSubDistrict")}, Mouje ${c.t("propVillage")}, more particularly described in the Schedule below:`,
    ]),
    schedule(propertyScheduleRows(values, "en"), "SCHEDULE OF THE PROPERTY"),
    clause(next(), [
      "The property within the four boundaries above, with its original boundary marks, hedges, fences and trees, together with all rights of way and access, is sold to the Purchaser, who is hereby constituted its owner and possessor.",
    ]),
    clause(next(), [
      bold("Consideration: "),
      `The sale consideration is fixed at ${c.money("totalAmount")}, which the Vendor has received in full from the Purchaser; nothing remains payable towards the consideration, and the Vendor grants full discharge.`,
    ]),
    clause(next(), [
      bold("Ownership: "),
      "From this day the Purchaser is the full, independent owner and actual possessor of the property, entitled to use, cultivate, sell, exchange or mortgage it as the Purchaser pleases, to hold absolutely for all time.",
    ]),
    clause(next(), [
      bold("Title warranty: "),
      "The Vendor assures that the title is clear, marketable and saleable, and undertakes to resolve at the Vendor's own cost any claim, dispute, litigation or court case raised by any person, institution, bank, heir or authority concerning the property.",
    ]),
    clause(next(), [
      bold("Mutation: "),
      "The Vendor shall give all replies, signatures, affidavits and admissions, and remain present where required, for transferring the property to the Purchaser's name in the 7/12 / city survey / property card records.",
    ]),
    clause(next(), [
      bold("Taxes: "),
      "All state, central and local taxes, cesses and land revenue up to this day have been paid by the Vendor (any arrears shall be borne by the Vendor); taxes from tomorrow onward shall be borne by the Purchaser.",
    ]),
    clause(next(), [
      bold("Expenses: "),
      "This deed is presented for registration before the sub-registrar. All expenses — stamp duty, registration fee, advocate's fee, typing charges — have been borne by the Purchaser. Stamp as per the government jantri has been used.",
    ]),
  );

  if (kind === "agri") {
    blocks.push(
      clause(next(), [
        bold("Agriculturist status: "),
        c.has("khedutDetail")
          ? `The Purchaser is an agriculturist khatedar by virtue of ${c.t("khedutDetail")}.`
          : "The Purchaser is an agriculturist khatedar (details of village, survey no. and khata no. to be stated).",
      ]),
    );
  }

  if (kind === "plot" && c.has("naOrder")) {
    blocks.push(
      clause(next(), [
        bold("NA permission: "),
        `Non-agricultural use of the land is permitted vide ${c.t("naOrder")}.`,
      ]),
    );
  }

  if (c.has("extraClauses")) {
    blocks.push(clause(next(), [bold("Additional terms: "), c.t("extraClauses")]));
  }

  blocks.push(
    spacer(),
    para([
      "The Vendor has executed this sale deed voluntarily, in sound mind and full consciousness, without coercion or threat, having received the entire consideration; it binds the Vendor and the Vendor's heirs in every way, and is signed in the presence of the witnesses below.",
    ]),
    signatures([
      ...sellers.map((p, i) => ({
        role: sellers.length > 1 ? `Vendor ${i + 1}` : "Vendor",
        name: p.t("name"),
      })),
      ...buyers.map((p, i) => ({
        role: buyers.length > 1 ? `Purchaser ${i + 1}` : "Purchaser",
        name: p.t("name"),
      })),
    ]),
    witnesses(
      "WITNESSES",
      wit.map((w) => `${w.t("name")}, address: ${w.t("address")}`),
    ),
    spacer(),
    para(
      [
        bold("Note: "),
        "At registration, the section 32A annexure (photos and thumb impressions) and the section 34(3) checklist are completed at the sub-registrar office; carry photographs of the property.",
      ],
      "left",
    ),
  );

  return blocks;
}

export const vechanDastavej: DocTemplate = {
  slug: "vechan-dastavej",
  name: { gu: "વેચાણ દસ્તાવેજ (સેલ ડીડ)", en: "Sale deed" },
  shortName: { gu: "વેચાણ દસ્તાવેજ", en: "Sale deed" },
  category: "sale",
  description: {
    gu: "મિલકતની માલિકી તબદીલ કરતો મુખ્ય દસ્તાવેજ — ખેતીની જમીન, બિનખેતી પ્લોટ કે મકાન-ફ્લેટ માટે, સરકારી મોડેલ ડ્રાફ્ટ મુજબ.",
    en: "The main deed transferring ownership — for agricultural land, NA plot or house/flat, per the government model drafts.",
  },
  stampNote: {
    gu: "ગુજરાતમાં વેચાણ દસ્તાવેજ પર સ્ટેમ્પ ડ્યુટી ~૪.૯% (અવેજ કે જંત્રી બેમાંથી વધુ પર) અને નોંધણી ફી ૧% (એકમાત્ર મહિલા ખરીદનાર માટે માફ) લાગે છે. દર બદલાતા રહે છે — ગાર્વી પોર્ટલ પર ખાતરી કરવી.",
    en: "In Gujarat a sale deed attracts ~4.9% stamp duty (on the higher of consideration or jantri) plus 1% registration fee (waived for a sole female purchaser). Rates change — verify on the Garvi portal.",
  },
  languages: ["gu", "en"],
  sections: [
    {
      id: "basics",
      title: { gu: "દસ્તાવેજની વિગત", en: "Deed details" },
      fields: [
        { id: "deedDate", kind: "date", label: { gu: "દસ્તાવેજની તારીખ", en: "Execution date" }, required: true },
        {
          id: "landKind",
          kind: "select",
          label: { gu: "મિલકતનો પ્રકાર", en: "Type of property" },
          defaultValue: "plot",
          options: [
            { value: "agri", label: { gu: "ખેતીલાયક જમીન", en: "Agricultural land" } },
            { value: "plot", label: { gu: "બિનખેતી ખુલ્લો પ્લોટ", en: "NA open plot" } },
            { value: "building", label: { gu: "મકાન / ફ્લેટ", en: "House / flat" } },
          ],
        },
        {
          id: "totalAmount",
          kind: "money",
          label: { gu: "વેચાણ કિંમત (રૂ.)", en: "Sale consideration (Rs.)" },
          placeholder: { gu: "દા.ત. 5500000", en: "e.g. 5500000" },
          required: true,
        },
        {
          id: "paymentMode",
          kind: "select",
          label: { gu: "અવેજ ચૂકવવાની રીત", en: "Consideration paid by" },
          defaultValue: "cheque",
          options: [
            { value: "cheque", label: { gu: "ચેક", en: "Cheque" } },
            { value: "bank", label: { gu: "બેંક ટ્રાન્સફર (RTGS/NEFT)", en: "Bank transfer (RTGS/NEFT)" } },
            { value: "cash", label: { gu: "રોકડ", en: "Cash" } },
          ],
        },
        {
          id: "paymentRef",
          kind: "text",
          label: { gu: "ચેક / ટ્રાન્ઝેક્શન નંબર (હોય તો)", en: "Cheque / transaction no. (if any)" },
        },
      ],
    },
    {
      id: "sellers",
      title: { gu: "વેચાણ આપનારની વિગત", en: "Vendor (seller) details" },
      fields: [
        partyGroup("sellers", { gu: "વેચાણ આપનાર", en: "Vendor" }, {
          withPan: true,
          withAadhaar: true,
          addLabel: { gu: "વેચાણ આપનાર ઉમેરો", en: "Add vendor" },
        }),
      ],
    },
    {
      id: "buyers",
      title: { gu: "વેચાણ રાખનારની વિગત", en: "Purchaser details" },
      fields: [
        partyGroup("buyers", { gu: "વેચાણ રાખનાર", en: "Purchaser" }, {
          withPan: true,
          withAadhaar: true,
          addLabel: { gu: "વેચાણ રાખનાર ઉમેરો", en: "Add purchaser" },
        }),
      ],
    },
    propertySection(),
    {
      id: "landSpecific",
      title: { gu: "જમીન-વિશેષ વિગત", en: "Land-specific details" },
      description: {
        gu: "મિલકતના પ્રકાર પ્રમાણે લાગુ પડે તે જ ભરો.",
        en: "Fill only what applies to the chosen property type.",
      },
      fields: [
        {
          id: "naOrder",
          kind: "text",
          label: { gu: "બિનખેતી પરવાનગી હુકમ (પ્લોટ માટે)", en: "NA permission order (for plots)" },
          placeholder: {
            gu: "દા.ત. કલેક્ટરશ્રી, અમદાવાદના હુકમ ક્રમાંક …, તા. …",
            en: "e.g. Collector, Ahmedabad order no. …, dated …",
          },
          gujarati: true,
          colSpan: 2,
        },
        {
          id: "khedutDetail",
          kind: "text",
          label: { gu: "ખરીદનારની ખેડૂત ખાતેદાર વિગત (ખેતી માટે)", en: "Purchaser's agriculturist detail (for farm land)" },
          placeholder: {
            gu: "દા.ત. મોજે બાવળાની સીમના સર્વે નં. ૧૫૫, ખાતા નં. ૨૨",
            en: "e.g. survey no. 155, khata no. 22 of Mouje Bavla",
          },
          help: {
            gu: "ગુજરાતમાં ખેતીની જમીન ખેડૂત ખાતેદાર જ ખરીદી શકે છે.",
            en: "In Gujarat only an agriculturist khatedar can buy farm land.",
          },
          gujarati: true,
          colSpan: 2,
        },
      ],
    },
    {
      id: "extra",
      title: { gu: "વધારાની શરતો", en: "Additional terms" },
      fields: [
        {
          id: "extraClauses",
          kind: "textarea",
          label: { gu: "તમારી શરતો (વૈકલ્પિક)", en: "Your terms (optional)" },
          gujarati: true,
          colSpan: 2,
        },
      ],
    },
    {
      id: "witnessSection",
      title: { gu: "સાક્ષીઓ", en: "Witnesses" },
      fields: [witnessGroup()],
    },
  ],
  build: (values, lang: Lang) => ({
    lang,
    title: lang === "gu" ? "વેચાણ દસ્તાવેજ" : "Sale deed",
    blocks: lang === "gu" ? buildGu(values) : buildEn(values),
  }),
};
