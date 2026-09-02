import type { DocBlock, DocTemplate, FieldValues, Lang } from "../types";
import {
  bold,
  clause,
  clauseNo,
  makeCtx,
  para,
  signatures,
  spacer,
  stampSpace,
  title,
} from "../build";
import { partyFields } from "../shared-fields";

/**
 * સોગંદનામું / Affidavit — general-purpose sworn declaration. The deponent's
 * introduction and closing verification follow the customary Gujarati
 * affidavit format used before notaries and executive magistrates.
 */

function buildGu(values: FieldValues): DocBlock[] {
  const c = makeCtx(values, "gu");
  const statements = c.group("statements");

  const blocks: DocBlock[] = [
    stampSpace("સ્ટેમ્પ પેપર / ઈ-સ્ટેમ્પ માટે જગ્યા"),
    title("સોગંદનામું"),
    para([
      `આથી હું નીચે સહી કરનાર ${c.t("name")}, ${c.age("age")}, ધંધો: ${c.t("occupation")}, રહેવાસી: ${c.t("address")}, તે મારા ધર્મના સોગંદ ઉપર જાહેર કરું છું કે:`,
    ]),
  ];

  if (statements.length === 0) {
    blocks.push(clause(clauseNo(1, "gu"), ["____________________________________________"]));
  }
  statements.forEach((s, i) => {
    blocks.push(clause(clauseNo(i + 1, "gu"), [s.t("statement", "____________________________________________")]));
  });

  blocks.push(
    spacer(),
    para([
      "ઉપર જણાવેલ તમામ માહિતી / વિગતો મારી અંગત જાણ મુજબ સાચી અને ખરી છે અને તેમાં મેં કોઈ તથ્યો છુપાવેલ નથી, જે હું મારા ધર્મના સોગંદ ઉપર જાહેર કરું છું. ખોટું સોગંદનામું કરવું તે ફોજદારી ગુનો બને છે તે હું સારી રીતે જાણું છું.",
    ]),
    para([`સ્થળ: ${c.t("place")}`], "left"),
    para([`તારીખ: ${c.date("date").replace("તા. ", "")}`], "left"),
    signatures([{ role: "સોગંદ લેનાર (ડિપોનન્ટ)", name: c.t("name") }]),
    spacer(),
    para(
      [
        bold("નોંધ: "),
        "આ સોગંદનામું નોટરી / એક્ઝિક્યુટિવ મેજિસ્ટ્રેટ સમક્ષ રૂબરૂ સહી કરી પ્રમાણિત કરાવવાનું રહે છે.",
      ],
      "left",
    ),
  );

  return blocks;
}

function buildEn(values: FieldValues): DocBlock[] {
  const c = makeCtx(values, "en");
  const statements = c.group("statements");

  const blocks: DocBlock[] = [
    stampSpace("Space reserved for stamp paper / e-stamp"),
    title("AFFIDAVIT"),
    para([
      `I, ${c.t("name")}, ${c.age("age")}, occupation: ${c.t("occupation")}, residing at ${c.t("address")}, do hereby solemnly affirm and state on oath as under:`,
    ]),
  ];

  if (statements.length === 0) {
    blocks.push(clause(clauseNo(1, "en"), ["____________________________________________"]));
  }
  statements.forEach((s, i) => {
    blocks.push(clause(clauseNo(i + 1, "en"), [s.t("statement", "____________________________________________")]));
  });

  blocks.push(
    spacer(),
    para([
      "I state that the contents above are true and correct to the best of my personal knowledge and belief, and nothing material has been concealed therefrom.",
    ]),
    para([`Place: ${c.t("place")}`], "left"),
    para([`Date: ${c.date("date")}`], "left"),
    signatures([{ role: "Deponent", name: c.t("name") }]),
    spacer(),
    para(
      [
        bold("Note: "),
        "This affidavit is to be signed before, and attested by, a notary / executive magistrate.",
      ],
      "left",
    ),
  );

  return blocks;
}

export const sogandnamu: DocTemplate = {
  slug: "sogandnamu",
  name: { gu: "સોગંદનામું", en: "Affidavit" },
  category: "declaration",
  description: {
    gu: "નોટરી સમક્ષ કરવાનું સામાન્ય સોગંદનામું — મિલકત, નામભેદ, રહેઠાણ કે અન્ય કોઈ પણ જાહેરાત માટે.",
    en: "General sworn declaration before a notary — for property, name mismatch, residence or any other statement.",
  },
  stampNote: {
    gu: "ગુજરાતમાં સોગંદનામું સામાન્ય રીતે રૂ. ૫૦ ના સ્ટેમ્પ પેપર પર થાય છે અને નોટરી સમક્ષ પ્રમાણિત કરાવાય છે. વર્તમાન દર ખાતરી કરવો.",
    en: "In Gujarat an affidavit is normally executed on Rs. 50 stamp paper and attested by a notary. Verify the current rate.",
  },
  languages: ["gu", "en"],
  sections: [
    {
      id: "deponent",
      title: { gu: "સોગંદ લેનારની વિગત", en: "Deponent details" },
      fields: partyFields().filter((f) => f.id !== "caste"),
    },
    {
      id: "statements",
      title: { gu: "જાહેર કરવાની હકીકતો", en: "Statements to declare" },
      description: {
        gu: "દરેક મુદ્દો અલગ ફકરા તરીકે ક્રમાંક સાથે આવશે.",
        en: "Each point becomes a numbered paragraph of the affidavit.",
      },
      fields: [
        {
          id: "statements",
          kind: "group",
          entryLabel: { gu: "વિધાન", en: "Statement" },
          addLabel: { gu: "વિધાન ઉમેરો", en: "Add statement" },
          min: 1,
          max: 10,
          fields: [
            {
              id: "statement",
              kind: "textarea",
              label: { gu: "હકીકત", en: "Statement" },
              placeholder: {
                gu: "દા.ત. મોજે બાવળા, સર્વે નં. ૧૪૨/૨ વાળી જમીન મારા કબજા-ભોગવટામાં છે…",
                en: "e.g. The land bearing survey no. 142/2 of Mouje Bavla is in my possession…",
              },
              required: true,
              gujarati: true,
              colSpan: 2,
            },
          ],
        },
      ],
    },
    {
      id: "execution",
      title: { gu: "સ્થળ અને તારીખ", en: "Place and date" },
      fields: [
        {
          id: "place",
          kind: "text",
          label: { gu: "સ્થળ", en: "Place" },
          required: true,
          gujarati: true,
        },
        {
          id: "date",
          kind: "date",
          label: { gu: "તારીખ", en: "Date" },
          required: true,
        },
      ],
    },
  ],
  build: (values, lang: Lang) => ({
    lang,
    title: lang === "gu" ? "સોગંદનામું" : "Affidavit",
    blocks: lang === "gu" ? buildGu(values) : buildEn(values),
  }),
};
