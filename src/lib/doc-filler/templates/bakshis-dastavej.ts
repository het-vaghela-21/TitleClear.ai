import type { DocBlock, DocTemplate, FieldValues, Lang } from "../types";
import {
  bold,
  clause,
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
 * બક્ષિસ દસ્તાવેજ (બક્ષિસ-ખત) / Gift deed — encoded from the Gujarat model
 * draft (research/templates/bakshis_khat.txt): love-and-affection recital,
 * no-consideration transfer, and the standard eight clauses.
 */

function buildGu(values: FieldValues): DocBlock[] {
  const c = makeCtx(values, "gu");
  const donors = c.group("donors");
  const donees = c.group("donees");
  const wit = c.group("witnesses");
  const share = c.has("share") ? c.t("share") : "સંપૂર્ણ (પૂરેપૂરી)";

  const blocks: DocBlock[] = [
    stampSpace("ઈ-સ્ટેમ્પ / ફ્રેન્કિંગ માટે જગ્યા"),
    title("બક્ષિસ દસ્તાવેજ (બક્ષિસ-ખત)"),
    para([
      `આ બક્ષિસ-ખત આજરોજ ${c.dateLong("deedDate")}, મુકામ ${c.t("place")} ખાતે, નીચે જણાવેલ પક્ષકારો વચ્ચે કરવામાં આવે છે:`,
    ]),
  ];

  donors.forEach((p, i) => {
    blocks.push(
      para([
        bold(donors.length > 1 ? `બક્ષિસ આપનાર ${toGujaratiDigits(i + 1)}: ` : "બક્ષિસ આપનાર: "),
        partyLine(p, "gu"),
        " (જેમનો હવે પછી ",
        bold("“બક્ષિસ આપનાર”"),
        " તરીકે ઉલ્લેખ કરવામાં આવ્યો છે; જે શબ્દમાં તેમના વંશ, વાલી, વારસો, એસાઈનીઓ વગેરેનો સમાવેશ થાય છે.)",
      ]),
    );
  });

  donees.forEach((p, i) => {
    blocks.push(
      para([
        bold(donees.length > 1 ? `બક્ષિસ લેનાર ${toGujaratiDigits(i + 1)}: ` : "બક્ષિસ લેનાર: "),
        partyLine(p, "gu"),
        " (જેમનો હવે પછી ",
        bold("“બક્ષિસ લેનાર”"),
        " તરીકે ઉલ્લેખ કરવામાં આવ્યો છે.)",
      ]),
    );
  });

  blocks.push(
    para([
      `બક્ષિસ લેનાર એ બક્ષિસ આપનારના ${c.t("relationship")} થાય છે, અને બક્ષિસ લેનાર માટેના બક્ષિસ આપનારના પ્રેમ અને સ્નેહને કારણે બક્ષિસ આપનારે નીચે પરિશિષ્ટમાં જણાવેલ મિલકતનો ${share} હિસ્સો બક્ષિસ આપવાનું નક્કી કરેલ છે. જે અન્વયે બંને પક્ષો નીચે મુજબ કબૂલ થાય છે:`,
    ]),
    clause("૧.", [
      "ઉક્ત બક્ષિસ આપનાર, બક્ષિસ લેનાર માટેના કુદરતી પ્રેમ અને સ્નેહથી પ્રેરાઈને, પોતાની સ્વતંત્ર ઈચ્છાથી અને કોઈપણ દબાણ, અનુચિત પ્રભાવ કે જબરદસ્તી વિના, અને કોઈપણ નાણાકીય અવેજ વગર, આથી ઉક્ત મિલકત તેના તમામ સ્વતંત્ર અધિકારો અને માળખાં સહિત બક્ષિસ લેનારને સંપૂર્ણપણે અને હંમેશ માટે, સંપૂર્ણ ભોગવટા અને માલિકી હક સાથે, બક્ષિસથી તબદીલ કરે છે.",
    ]),
    clause("૨.", [
      "સદરહુ મિલકત પૂર્વ-વેચાણ, બક્ષિસ, ગીરો અને તકરારો સહિત તમામ પ્રકારના બોજાથી મુક્ત છે, અને બક્ષિસ આપનારને તે બક્ષિસ આપવાનો સંપૂર્ણ હક્ક અને અધિકાર છે.",
    ]),
    clause("૩.", [
      "સદરહુ મિલકતનો વાસ્તવિક અને પ્રત્યક્ષ કબજો આજરોજ બક્ષિસ લેનારને સોંપી આપેલ છે.",
    ]),
    clause("૪.", [
      "આજ પછીના મિલકતને લગતા વીજળી, પાણી, મ્યુનિસિપલ / પંચાયત વેરા વગેરે તમામ ખર્ચ અને લેણાં બક્ષિસ લેનારે ભરવાનાં રહેશે; આજદિન સુધીનાં લેણાં બક્ષિસ આપનારે ભરપાઈ કરેલ છે.",
    ]),
    clause("૫.", [
      "સદરહુ મિલકતનું મૂલ્ય રજિસ્ટ્રારશ્રીની માર્ગદર્શિકા (જંત્રી) પ્રમાણે આકારણી કરી, તે મુજબનું જરૂરી સ્ટેમ્પ-શુલ્ક આ દસ્તાવેજમાં ચૂકવવામાં આવેલ છે.",
    ]),
    clause("૬.", [
      "બક્ષિસ આપનાર સદરહુ મિલકત ઉપરના પોતાના તમામ હક્કો આથી છોડી દે છે. આજરોજથી બક્ષિસ લેનાર મિલકતના સંપૂર્ણ સ્વતંત્ર માલિક છે અને તેમાં વેચાણ, બક્ષિસ, ગીરો, ગણોતપટા વગેરે — પોતાનું દિલ ચાહે તે રીતે — વ્યવસ્થા કરવા હક્કદાર છે.",
    ]),
    clause("૭.", [
      "સદરહુ મિલકત બક્ષિસ લેનારના નામે સરકારી / પંચાયત / મ્યુનિસિપલ દફતરે તથા વીજળી-પાણી જેવાં રેકોર્ડમાં તબદીલ કરાવવા માટે જ્યાં જરૂર પડે ત્યાં બક્ષિસ આપનાર જરૂરી સહીઓ, કબૂલાતો અને સંમતિ આપવા બંધાયેલા છે.",
    ]),
    clause("૮.", [
      "બક્ષિસ લેનારે આ બક્ષિસ સહર્ષ સ્વીકારેલ છે, જેની આ લેખમાં તેમની સહીથી કબૂલાત આપવામાં આવે છે.",
    ]),
  );

  if (c.has("extraClauses")) {
    blocks.push(clause("૯.", [bold("વધારાની શરતો: "), c.t("extraClauses")]));
  }

  blocks.push(
    spacer(),
    schedule(propertyScheduleRows(values, "gu"), "-: પરિશિષ્ટ (બક્ષિસ આપેલ મિલકતનું વર્ણન) :-"),
    para([
      "આ બક્ષિસ-ખત અમોએ અમારી રાજીખુશીથી, શુદ્ધબુદ્ધિથી, બિનકેફીપણામાં, વાંચી, સમજી, વિચારીને, સભાન અવસ્થામાં, કોઈના દબાણ કે ધાક-ધમકી વિના લખી આપેલ છે; જે અમોને તથા અમારા વંશ, વાલી, વારસો તમામને કબૂલ, મંજૂર અને બંધનકર્તા છે અને રહેશે.",
    ]),
    signatures([
      ...donors.map((p, i) => ({
        role: donors.length > 1 ? `બક્ષિસ આપનાર ${toGujaratiDigits(i + 1)}` : "બક્ષિસ આપનાર",
        name: p.t("name"),
      })),
      ...donees.map((p, i) => ({
        role: donees.length > 1 ? `બક્ષિસ લેનાર ${toGujaratiDigits(i + 1)} (સ્વીકાર સહી)` : "બક્ષિસ લેનાર (સ્વીકાર સહી)",
        name: p.t("name"),
      })),
    ]),
    witnesses(
      "સાક્ષીઓ (અત્રે મતું — તત્રે શાખ)",
      wit.map((w) => `${w.t("name")}, રહે: ${w.t("address")}`),
    ),
  );

  return blocks;
}

function buildEn(values: FieldValues): DocBlock[] {
  const c = makeCtx(values, "en");
  const donors = c.group("donors");
  const donees = c.group("donees");
  const wit = c.group("witnesses");
  const share = c.has("share") ? c.t("share") : "entire";

  const blocks: DocBlock[] = [
    stampSpace("Space reserved for e-stamp / franking"),
    title("GIFT DEED"),
    para([
      `This Gift Deed is made at ${c.t("place")} on ${c.dateLong("deedDate")} between:`,
    ]),
  ];

  donors.forEach((p, i) => {
    blocks.push(
      para([
        bold(donors.length > 1 ? `Donor ${i + 1}: ` : "Donor: "),
        partyLine(p, "en"),
        " — hereinafter the ",
        bold("“Donor”"),
        " (which expression includes their heirs, guardians, successors and assignees).",
      ]),
    );
  });

  donees.forEach((p, i) => {
    blocks.push(
      para([
        bold(donees.length > 1 ? `Donee ${i + 1}: ` : "Donee: "),
        partyLine(p, "en"),
        " — hereinafter the ",
        bold("“Donee”"),
        ".",
      ]),
    );
  });

  blocks.push(
    para([
      `The Donee is the Donor's ${c.t("relationship")}, and out of love and affection for the Donee the Donor has decided to gift the ${share} share of the property described in the Schedule below. The parties therefore agree:`,
    ]),
    clause("1.", [
      "The Donor, moved by natural love and affection, of the Donor's own free will, without coercion, undue influence or force, and without any monetary consideration, hereby transfers the said property with all independent rights and structures to the Donee absolutely and forever, with full ownership and enjoyment.",
    ]),
    clause("2.", [
      "The property is free from all encumbrances — prior sale, gift, mortgage and disputes — and the Donor has full right and authority to gift it.",
    ]),
    clause("3.", [
      "Actual and physical possession of the property has been delivered to the Donee this day.",
    ]),
    clause("4.", [
      "All future utility charges and municipal / panchayat taxes shall be borne by the Donee; dues up to today have been paid by the Donor.",
    ]),
    clause("5.", [
      "The property has been valued per the registrar's guideline (jantri) and the requisite stamp duty has been paid on this deed.",
    ]),
    clause("6.", [
      "The Donor relinquishes all rights over the property. From today the Donee is its full independent owner, free to sell, gift, mortgage, lease or otherwise deal with it as the Donee pleases.",
    ]),
    clause("7.", [
      "The Donor shall give all signatures, admissions and consents required to transfer the property to the Donee's name in government / panchayat / municipal records and utility records.",
    ]),
    clause("8.", [
      "The Donee has gladly accepted this gift, which acceptance is recorded by the Donee's signature on this deed.",
    ]),
  );

  if (c.has("extraClauses")) {
    blocks.push(clause("9.", [bold("Additional terms: "), c.t("extraClauses")]));
  }

  blocks.push(
    spacer(),
    schedule(propertyScheduleRows(values, "en"), "SCHEDULE OF THE GIFTED PROPERTY"),
    para([
      "This deed is executed voluntarily, in sound mind and full consciousness, without coercion or threat; it binds the parties and their heirs in every way, and is signed before the witnesses below.",
    ]),
    signatures([
      ...donors.map((p, i) => ({
        role: donors.length > 1 ? `Donor ${i + 1}` : "Donor",
        name: p.t("name"),
      })),
      ...donees.map((p, i) => ({
        role: donees.length > 1 ? `Donee ${i + 1} (acceptance)` : "Donee (acceptance)",
        name: p.t("name"),
      })),
    ]),
    witnesses(
      "WITNESSES",
      wit.map((w) => `${w.t("name")}, address: ${w.t("address")}`),
    ),
  );

  return blocks;
}

export const bakshisDastavej: DocTemplate = {
  slug: "bakshis-dastavej",
  name: { gu: "બક્ષિસ દસ્તાવેજ (ગિફ્ટ ડીડ)", en: "Gift deed" },
  shortName: { gu: "બક્ષિસ દસ્તાવેજ", en: "Gift deed" },
  category: "family",
  description: {
    gu: "પ્રેમ અને સ્નેહથી, અવેજ વગર, મિલકત સ્વજનને નામે કરી આપતો દસ્તાવેજ — સરકારી મોડેલ ડ્રાફ્ટ મુજબ.",
    en: "Transfers property to a loved one out of love and affection, without consideration — per the government model draft.",
  },
  stampNote: {
    gu: "ગુજરાતમાં બક્ષિસ દસ્તાવેજ પર સામાન્ય રીતે વેચાણ જેટલી (~૪.૯%) સ્ટેમ્પ ડ્યુટી લાગે છે; નજીકના લોહીના સંબંધમાં રાહત દરો બદલાયા કરે છે (સ્ટેમ્પ સુધારા કાયદા ૨૦૨૫ સહિત). વર્તમાન દર ગાર્વી પર ખાતરી કરવો.",
    en: "A gift deed in Gujarat generally attracts conveyance-level (~4.9%) stamp duty; concessional rates for close blood relatives keep changing (including the 2025 stamp amendment). Verify current rates on Garvi.",
  },
  languages: ["gu", "en"],
  sections: [
    {
      id: "basics",
      title: { gu: "દસ્તાવેજની વિગત", en: "Deed details" },
      fields: [
        { id: "deedDate", kind: "date", label: { gu: "તારીખ", en: "Date" }, required: true },
        { id: "place", kind: "text", label: { gu: "સ્થળ", en: "Place" }, required: true, gujarati: true },
        {
          id: "relationship",
          kind: "text",
          label: { gu: "બક્ષિસ લેનારનો સંબંધ", en: "Donee's relation to donor" },
          placeholder: { gu: "દા.ત. પુત્ર / પુત્રી / પત્ની / ભાઈ", en: "e.g. son / daughter / wife / brother" },
          required: true,
          gujarati: true,
        },
        {
          id: "share",
          kind: "text",
          label: { gu: "કેટલો હિસ્સો? (ખાલી = સંપૂર્ણ)", en: "Share gifted (empty = entire)" },
          placeholder: { gu: "દા.ત. અડધો (૫૦%)", en: "e.g. half (50%)" },
          gujarati: true,
        },
      ],
    },
    {
      id: "donors",
      title: { gu: "બક્ષિસ આપનારની વિગત", en: "Donor details" },
      fields: [
        partyGroup("donors", { gu: "બક્ષિસ આપનાર", en: "Donor" }, {
          withPan: true,
          withAadhaar: true,
          max: 2,
          addLabel: { gu: "બક્ષિસ આપનાર ઉમેરો", en: "Add donor" },
        }),
      ],
    },
    {
      id: "donees",
      title: { gu: "બક્ષિસ લેનારની વિગત", en: "Donee details" },
      fields: [
        partyGroup("donees", { gu: "બક્ષિસ લેનાર", en: "Donee" }, {
          withPan: true,
          withAadhaar: true,
          max: 2,
          addLabel: { gu: "બક્ષિસ લેનાર ઉમેરો", en: "Add donee" },
        }),
      ],
    },
    propertySection({ titleOverride: { gu: "બક્ષિસ આપવાની મિલકત", en: "Property being gifted" } }),
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
    title: lang === "gu" ? "બક્ષિસ દસ્તાવેજ" : "Gift deed",
    blocks: lang === "gu" ? buildGu(values) : buildEn(values),
  }),
};
