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
  subtitle,
  title,
  witnesses,
} from "../build";
import { numberToGujaratiWords, toGujaratiDigits } from "../gujarati";
import { partyGroup, witnessGroup } from "../shared-fields";

/**
 * ભાડા કરાર / Leave & licence (rent) agreement — the most-used document on
 * every competitor platform. Body available in Gujarati and English.
 * Structure follows the customary Gujarat 11-month leave & licence format.
 */

function buildGu(values: FieldValues): DocBlock[] {
  const c = makeCtx(values, "gu");
  const landlords = c.group("landlords");
  const tenants = c.group("tenants");
  const wit = c.group("witnesses");

  const months = c.raw("termMonths");
  const monthsWords =
    months !== "" && Number.isFinite(Number(months))
      ? `${toGujaratiDigits(months)} (${numberToGujaratiWords(Number(months))})`
      : "________";

  const useLabel =
    c.raw("useType") === "commercial" ? "ધંધાકીય (કોમર્શિયલ)" : "રહેણાક (રેસિડેન્શિયલ)";

  const blocks: DocBlock[] = [
    stampSpace("ઈ-સ્ટેમ્પ / ફ્રેન્કિંગ માટે જગ્યા — Space for e-stamp"),
    title("ભાડા કરાર (લીવ એન્ડ લાયસન્સ કરાર)"),
    subtitle(`મુદત: ${monthsWords} માસ`),
    para([
      `આજરોજ ${c.dateLong("agreementDate")} ના રોજ, મુકામ ${c.t("place")} ખાતે, આ ભાડા કરાર નીચે જણાવેલ પક્ષકારો વચ્ચે કરવામાં આવે છે:`,
    ]),
  ];

  landlords.forEach((p, i) => {
    blocks.push(
      para([
        bold(landlords.length > 1 ? `મકાનમાલિક ${toGujaratiDigits(i + 1)}: ` : "મકાનમાલિક: "),
        `${p.t("name")}, ${p.age("age")}, ધંધો: ${p.t("occupation")}, રહે: ${p.t("address")}`,
        " — જે હવે પછી આ કરારમાં ",
        bold("“મકાનમાલિક”"),
        " તરીકે ઓળખાશે (જે શબ્દમાં તેમના વારસદારો, પ્રતિનિધિઓ અને હક્કદારોનો સમાવેશ થાય છે) — ",
        bold("પ્રથમ પક્ષ."),
      ]),
    );
  });

  tenants.forEach((p, i) => {
    blocks.push(
      para([
        bold(tenants.length > 1 ? `ભાડુઆત ${toGujaratiDigits(i + 1)}: ` : "ભાડુઆત: "),
        `${p.t("name")}, ${p.age("age")}, ધંધો: ${p.t("occupation")}, રહે: ${p.t("address")}`,
        " — જે હવે પછી આ કરારમાં ",
        bold("“ભાડુઆત”"),
        " તરીકે ઓળખાશે — ",
        bold("બીજો પક્ષ."),
      ]),
    );
  });

  blocks.push(
    para([
      bold("જ્યારે"),
      ` મકાનમાલિક નીચે મિલકત વર્ણનમાં જણાવેલ મિલકતના કાયદેસર માલિક અને કબજેદાર છે, અને ભાડુઆતે તે મિલકત ${useLabel} હેતુ માટે ભાડે (લીવ એન્ડ લાયસન્સથી) લેવાની ઈચ્છા દર્શાવી છે, અને મકાનમાલિક તે આપવા સંમત થયા છે;`,
    ]),
    para([bold("આથી બંને પક્ષો નીચે મુજબની શરતોએ સંમત થાય છે:")]),
  );

  let n = 0;
  const next = () => clauseNo(++n, "gu");

  blocks.push(
    clause(next(), [
      bold("મુદત: "),
      `આ કરારની મુદત તા. ${c.date("startDate").replace("તા. ", "")} થી શરૂ થઈ ${monthsWords} માસની રહેશે. મુદત પૂરી થયે, બંને પક્ષોની લેખિત સંમતિથી નવી શરતોએ કરાર તાજો (રિન્યૂ) કરી શકાશે.`,
    ]),
    clause(next(), [
      bold("માસિક ભાડું: "),
      `ભાડુઆતે મકાનમાલિકને માસિક ભાડું ${c.money("monthlyRent")} લેખે, દર અંગ્રેજી માસની ${c.num("rentDueDay")} તારીખ સુધીમાં, એડવાન્સમાં ચૂકવવાનું રહેશે.`,
    ]),
    clause(next(), [
      bold("ડિપોઝિટ: "),
      `ભાડુઆતે મકાનમાલિક પાસે ${c.money("deposit")} વગર વ્યાજની સિક્યુરિટી ડિપોઝિટ પેટે જમા કરાવેલ છે, જે કરાર પૂરો થયે, મિલકતનો ખાલી તથા સહી-સલામત કબજો પરત મળ્યેથી અને બાકી લેણાં (વીજળી-પાણી બિલ, નુકસાની વગેરે) કાપીને, ભાડુઆતને પરત કરવાની રહેશે.`,
    ]),
    clause(next(), [
      bold("ઉપયોગ: "),
      `ભાડુઆત મિલકતનો ઉપયોગ ફક્ત ${useLabel} હેતુ માટે કરશે. મિલકતમાં કોઈ ગેરકાયદેસર પ્રવૃત્તિ કરશે નહિ કે થવા દેશે નહિ.`,
    ]),
    clause(next(), [
      bold("વીજળી, પાણી અને વેરા: "),
      "કરારની મુદત દરમિયાનનાં વીજળી તથા પાણીનાં બિલ ભાડુઆતે ભરવાનાં રહેશે. મિલકતનો મ્યુનિસિપલ / પંચાયત વેરો મકાનમાલિક ભરશે.",
    ]),
    clause(next(), [
      bold("મરામત અને ફેરફાર: "),
      "રોજિંદી નાની મરામત ભાડુઆતે પોતાના ખર્ચે કરવાની રહેશે. મકાનમાલિકની લેખિત મંજૂરી વિના ભાડુઆત મિલકતમાં કોઈ કાયમી બાંધકામ કે ફેરફાર કરી શકશે નહિ.",
    ]),
    clause(next(), [
      bold("પેટા-ભાડું: "),
      "ભાડુઆત મિલકત કે તેનો કોઈ ભાગ અન્ય કોઈને પેટા-ભાડે, લાયસન્સથી કે અન્ય રીતે વાપરવા આપી શકશે નહિ.",
    ]),
    clause(next(), [
      bold("પ્રવેશ: "),
      "મકાનમાલિક કે તેમના પ્રતિનિધિ વ્યાજબી સમયે, આગોતરી જાણ કરીને, મિલકત જોવા-તપાસવા આવી શકશે.",
    ]),
    clause(next(), [
      bold("કરાર રદ કરવા બાબત: "),
      `કોઈપણ પક્ષ ${c.num("noticeMonths")} માસની આગોતરી લેખિત નોટિસ આપીને આ કરાર મુદત પહેલાં રદ કરી શકશે. ભાડુઆત સતત બે માસ ભાડું ન ચૂકવે અથવા આ કરારની કોઈ શરતનો ભંગ કરે, તો મકાનમાલિક કરાર રદ કરી મિલકતનો કબજો પરત લઈ શકશે.`,
    ]),
    clause(next(), [
      bold("કબજા બાબત: "),
      "આ કરાર ફક્ત લીવ એન્ડ લાયસન્સ સ્વરૂપનો છે. તેનાથી ભાડુઆતને મિલકતમાં કોઈ માલિકી હક્ક, ભાડૂતી હક્ક (ટેનન્સી) કે અન્ય કોઈ કાયમી હક્ક પ્રાપ્ત થતો નથી. મુદત પૂરી થયે અથવા કરાર રદ થયે ભાડુઆતે મિલકતનો ખાલી કબજો તુરંત મકાનમાલિકને સોંપી દેવાનો રહેશે.",
    ]),
  );

  if (c.has("extraClauses")) {
    blocks.push(
      clause(next(), [bold("વધારાની શરતો: "), c.t("extraClauses")]),
    );
  }

  blocks.push(
    spacer(),
    schedule(
      [
        { label: "મિલકતનું સરનામું", value: c.t("propAddress", "________________________") },
        { label: "મિલકતનું વર્ણન", value: c.t("propDescription", "________________________") },
        { label: "ઉપયોગનો હેતુ", value: useLabel },
      ],
      "મિલકતનું વર્ણન",
    ),
    para([
      "ઉપર જણાવેલ તમામ શરતો બંને પક્ષોએ વાંચી, સમજી અને સ્વેચ્છાએ કબૂલ રાખી, નીચે સહી કરનાર સાક્ષીઓની હાજરીમાં, સ્વસ્થ ચિત્તે અને કોઈ દબાણ વિના, આ કરાર ઉપર સહી કરેલ છે.",
    ]),
    signatures([
      ...landlords.map((p, i) => ({
        role: landlords.length > 1 ? `મકાનમાલિક ${toGujaratiDigits(i + 1)} (પ્રથમ પક્ષ)` : "મકાનમાલિક (પ્રથમ પક્ષ)",
        name: p.t("name"),
      })),
      ...tenants.map((p, i) => ({
        role: tenants.length > 1 ? `ભાડુઆત ${toGujaratiDigits(i + 1)} (બીજો પક્ષ)` : "ભાડુઆત (બીજો પક્ષ)",
        name: p.t("name"),
      })),
    ]),
    witnesses(
      "સાક્ષીઓ",
      wit.map((w) => `${w.t("name")}, રહે: ${w.t("address")}`),
    ),
  );

  return blocks;
}

function buildEn(values: FieldValues): DocBlock[] {
  const c = makeCtx(values, "en");
  const landlords = c.group("landlords");
  const tenants = c.group("tenants");
  const wit = c.group("witnesses");

  const months = c.raw("termMonths");
  const monthsText = months !== "" ? months : "________";
  const useLabel = c.raw("useType") === "commercial" ? "commercial" : "residential";

  const blocks: DocBlock[] = [
    stampSpace("Space reserved for e-stamp / franking"),
    title("LEAVE AND LICENCE (RENT) AGREEMENT"),
    subtitle(`Term: ${monthsText} months`),
    para([
      `This Leave and Licence Agreement is made at ${c.t("place")} on ${c.dateLong("agreementDate")} between the following parties:`,
    ]),
  ];

  landlords.forEach((p, i) => {
    blocks.push(
      para([
        bold(landlords.length > 1 ? `Licensor ${i + 1}: ` : "Licensor: "),
        `${p.t("name")}, ${p.age("age")}, occupation: ${p.t("occupation")}, residing at ${p.t("address")}`,
        " — hereinafter referred to as the ",
        bold("“Licensor”"),
        " (which expression includes their heirs, representatives and assigns) — ",
        bold("Party of the First Part."),
      ]),
    );
  });

  tenants.forEach((p, i) => {
    blocks.push(
      para([
        bold(tenants.length > 1 ? `Licensee ${i + 1}: ` : "Licensee: "),
        `${p.t("name")}, ${p.age("age")}, occupation: ${p.t("occupation")}, residing at ${p.t("address")}`,
        " — hereinafter referred to as the ",
        bold("“Licensee”"),
        " — ",
        bold("Party of the Second Part."),
      ]),
    );
  });

  blocks.push(
    para([
      bold("WHEREAS"),
      ` the Licensor is the lawful owner and occupant of the premises described in the Schedule below, and the Licensee has requested the Licensor to grant leave and licence to use the premises for ${useLabel} purposes, which the Licensor has agreed to grant;`,
    ]),
    para([bold("NOW THIS AGREEMENT WITNESSETH and the parties agree as follows:")]),
  );

  let n = 0;
  const next = () => clauseNo(++n, "en");

  blocks.push(
    clause(next(), [
      bold("Term: "),
      `The licence shall be for a period of ${monthsText} months commencing from ${c.date("startDate")}. It may be renewed on fresh terms with the written consent of both parties.`,
    ]),
    clause(next(), [
      bold("Licence fee: "),
      `The Licensee shall pay the Licensor a monthly licence fee (rent) of ${c.money("monthlyRent")}, payable in advance on or before the ${c.num("rentDueDay")} day of each English calendar month.`,
    ]),
    clause(next(), [
      bold("Deposit: "),
      `The Licensee has placed with the Licensor an interest-free refundable security deposit of ${c.money("deposit")}, to be returned on expiry of this agreement against peaceful vacant possession, after deducting outstanding dues (utility bills, damages, if any).`,
    ]),
    clause(next(), [
      bold("Use: "),
      `The premises shall be used only for ${useLabel} purposes. No unlawful activity shall be carried on in the premises.`,
    ]),
    clause(next(), [
      bold("Utilities and taxes: "),
      "Electricity and water charges for the licence period shall be borne by the Licensee. Municipal / panchayat property tax shall be borne by the Licensor.",
    ]),
    clause(next(), [
      bold("Repairs and alterations: "),
      "Day-to-day minor repairs shall be carried out by the Licensee at their own cost. The Licensee shall not make any permanent construction or alteration without the Licensor's written consent.",
    ]),
    clause(next(), [
      bold("No sub-letting: "),
      "The Licensee shall not sub-let, assign or part with possession of the premises or any part of it.",
    ]),
    clause(next(), [
      bold("Entry: "),
      "The Licensor or their representative may enter and inspect the premises at reasonable times with prior intimation.",
    ]),
    clause(next(), [
      bold("Termination: "),
      `Either party may terminate this agreement before expiry by giving ${c.num("noticeMonths")} month(s) prior written notice. If the Licensee defaults in paying the licence fee for two consecutive months or breaches any term of this agreement, the Licensor may terminate it and resume possession.`,
    ]),
    clause(next(), [
      bold("Nature of rights: "),
      "This agreement is a leave and licence only. It creates no tenancy, ownership or other permanent right in favour of the Licensee, who shall hand over vacant possession immediately on expiry or termination.",
    ]),
  );

  if (c.has("extraClauses")) {
    blocks.push(clause(next(), [bold("Additional terms: "), c.t("extraClauses")]));
  }

  blocks.push(
    spacer(),
    schedule(
      [
        { label: "Address of premises", value: c.t("propAddress", "________________________") },
        { label: "Description", value: c.t("propDescription", "________________________") },
        { label: "Permitted use", value: useLabel },
      ],
      "SCHEDULE OF THE PREMISES",
    ),
    para([
      "The parties, having read and understood the above terms, have signed this agreement of their own free will, in sound mind and without any coercion, in the presence of the witnesses below.",
    ]),
    signatures([
      ...landlords.map((p, i) => ({
        role: landlords.length > 1 ? `Licensor ${i + 1}` : "Licensor",
        name: p.t("name"),
      })),
      ...tenants.map((p, i) => ({
        role: tenants.length > 1 ? `Licensee ${i + 1}` : "Licensee",
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

export const bhadaKarar: DocTemplate = {
  slug: "bhada-karar",
  name: { gu: "ભાડા કરાર (લીવ એન્ડ લાયસન્સ)", en: "Rent agreement (leave & licence)" },
  shortName: { gu: "ભાડા કરાર", en: "Rent agreement" },
  category: "lease",
  description: {
    gu: "મકાન કે દુકાન ભાડે આપવા માટેનો ૧૧ માસનો પ્રમાણભૂત કરાર — મુદત, ભાડું, ડિપોઝિટ અને શરતો સાથે.",
    en: "The standard 11-month agreement for letting out a house or shop — term, rent, deposit and conditions.",
  },
  stampNote: {
    gu: "ગુજરાતમાં ભાડા કરાર સાધારણ રીતે ઈ-સ્ટેમ્પ પેપર પર થાય છે અને નોટરાઈઝ કરાવાય છે; ૧૧ માસથી લાંબી મુદતના કરારની નોંધણી જરૂરી બને છે. સ્ટેમ્પની રકમ જે-તે સમયના દરે ખાતરી કરવી.",
    en: "In Gujarat rent agreements are normally executed on e-stamp paper and notarised; agreements longer than 11 months need registration. Verify the current stamp amount before executing.",
  },
  languages: ["gu", "en"],
  sections: [
    {
      id: "basics",
      title: { gu: "કરારની વિગત", en: "Agreement details" },
      fields: [
        {
          id: "agreementDate",
          kind: "date",
          label: { gu: "કરારની તારીખ", en: "Agreement date" },
          required: true,
        },
        {
          id: "place",
          kind: "text",
          label: { gu: "સ્થળ (ગામ / શહેર)", en: "Place (village / city)" },
          placeholder: { gu: "દા.ત. અમદાવાદ", en: "e.g. Ahmedabad" },
          required: true,
          gujarati: true,
        },
        {
          id: "startDate",
          kind: "date",
          label: { gu: "ભાડું શરૂ થવાની તારીખ", en: "Licence start date" },
          required: true,
        },
        {
          id: "termMonths",
          kind: "number",
          label: { gu: "મુદત (માસ)", en: "Term (months)" },
          defaultValue: "11",
          required: true,
          help: {
            gu: "૧૧ માસથી લાંબી મુદતના કરારની નોંધણી ફરજિયાત બને છે.",
            en: "Terms longer than 11 months require registration.",
          },
        },
        {
          id: "useType",
          kind: "select",
          label: { gu: "ઉપયોગનો હેતુ", en: "Use" },
          defaultValue: "residential",
          options: [
            { value: "residential", label: { gu: "રહેણાક", en: "Residential" } },
            { value: "commercial", label: { gu: "ધંધાકીય", en: "Commercial" } },
          ],
        },
      ],
    },
    {
      id: "landlords",
      title: { gu: "મકાનમાલિકની વિગત", en: "Landlord details" },
      fields: [
        partyGroup(
          "landlords",
          { gu: "મકાનમાલિક", en: "Landlord" },
          { max: 3, addLabel: { gu: "મકાનમાલિક ઉમેરો", en: "Add landlord" } },
        ),
      ],
    },
    {
      id: "tenants",
      title: { gu: "ભાડુઆતની વિગત", en: "Tenant details" },
      fields: [
        partyGroup(
          "tenants",
          { gu: "ભાડુઆત", en: "Tenant" },
          { max: 3, addLabel: { gu: "ભાડુઆત ઉમેરો", en: "Add tenant" } },
        ),
      ],
    },
    {
      id: "money",
      title: { gu: "ભાડું અને ડિપોઝિટ", en: "Rent and deposit" },
      fields: [
        {
          id: "monthlyRent",
          kind: "money",
          label: { gu: "માસિક ભાડું (રૂ.)", en: "Monthly rent (Rs.)" },
          placeholder: { gu: "દા.ત. 12000", en: "e.g. 12000" },
          required: true,
        },
        {
          id: "deposit",
          kind: "money",
          label: { gu: "સિક્યુરિટી ડિપોઝિટ (રૂ.)", en: "Security deposit (Rs.)" },
          placeholder: { gu: "દા.ત. 50000", en: "e.g. 50000" },
          required: true,
        },
        {
          id: "rentDueDay",
          kind: "number",
          label: { gu: "ભાડું ભરવાની છેલ્લી તારીખ (દર માસે)", en: "Rent due by day (each month)" },
          defaultValue: "5",
        },
        {
          id: "noticeMonths",
          kind: "number",
          label: { gu: "નોટિસની મુદત (માસ)", en: "Notice period (months)" },
          defaultValue: "1",
        },
      ],
    },
    {
      id: "property",
      title: { gu: "મિલકતની વિગત", en: "Premises details" },
      fields: [
        {
          id: "propAddress",
          kind: "textarea",
          label: { gu: "મિલકતનું પૂરું સરનામું", en: "Full address of premises" },
          placeholder: {
            gu: "દા.ત. ફ્લેટ નં. ૩૦૨, શિવ રેસિડન્સી, નારણપુરા, અમદાવાદ — ૩૮૦૦૧૩",
            en: "e.g. Flat 302, Shiv Residency, Naranpura, Ahmedabad — 380013",
          },
          required: true,
          gujarati: true,
          colSpan: 2,
        },
        {
          id: "propDescription",
          kind: "textarea",
          label: { gu: "ટૂંકું વર્ણન (રૂમ, માળ, સુવિધા)", en: "Short description (rooms, floor, amenities)" },
          placeholder: {
            gu: "દા.ત. ૨ BHK ફ્લેટ, ત્રીજો માળ, ૧ પાર્કિંગ સાથે",
            en: "e.g. 2 BHK flat on the third floor with one parking",
          },
          gujarati: true,
          colSpan: 2,
        },
      ],
    },
    {
      id: "extra",
      title: { gu: "વધારાની શરતો", en: "Additional terms" },
      description: {
        gu: "જરૂર હોય તો જ — દા.ત. પાળતુ પ્રાણી, મેન્ટેનન્સ કોણ ભરશે, વગેરે.",
        en: "Only if needed — e.g. pets, who pays society maintenance, etc.",
      },
      fields: [
        {
          id: "extraClauses",
          kind: "textarea",
          label: { gu: "તમારી શરતો", en: "Your terms" },
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
    title: lang === "gu" ? "ભાડા કરાર" : "Rent agreement",
    blocks: lang === "gu" ? buildGu(values) : buildEn(values),
  }),
};
