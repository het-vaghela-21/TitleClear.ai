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
  title,
  witnesses,
} from "../build";
import { toGujaratiDigits } from "../gujarati";
import { partyFields, witnessGroup } from "../shared-fields";

/**
 * વીલ યાને વસિયતનામું / Will — encoded from the Gujarat model draft
 * (research/templates/vasiyatnamu.txt): sound-mind opening, mortality
 * recital, revocation of prior wills, family list, immovable/movable
 * schedules, bequests, executor, and the two-witness attestation.
 * A will needs no stamp paper; registration is optional but advisable.
 */

function buildGu(values: FieldValues): DocBlock[] {
  const c = makeCtx(values, "gu");
  const family = c.group("family");
  const immovables = c.group("immovables");
  const movables = c.group("movables");
  const beneficiaries = c.group("beneficiaries");
  const wit = c.group("witnesses");

  const blocks: DocBlock[] = [
    title("વીલ યાને વસિયતનામું"),
    para([
      `મારું છેવટનું વીલ યાને વસિયતનામું કરું છું કે, હું ${c.t("name")}, ${c.age("age")}, ધંધો: ${c.t("occupation")}, રહેવાસી: ${c.t("address")}, મારા તન-મનની સંપૂર્ણ સાવધ સ્થિતિમાં, કોઈના કોઈપણ પ્રકારના દબાણ કે લાગવગ વિના, મારા મૃત્યુ પછી મારી સ્થાવર તથા જંગમ મિલકત અંગે કોઈ વિવાદ ન થાય તે હેતુથી આ વીલ કરું છું; જેનો અમલ એકંદરે મારી હયાતી બાદ કરવાનો છે.`,
    ]),
    clause("૧.", [
      "આ દેહ ક્ષણભંગુર છે અને ભગવાન મને ક્યારે બોલાવે અને ક્યારે મારે આ સુંદર જગત છોડી જવાનું થાય તે હું જાણતો/જાણતી નથી. જેથી મારી સ્થાવર તથા જંગમ મિલકતની વહેંચણી બાબતે કાયદેસરના વારસદારો વચ્ચે કોઈ ટંટો-ફિસાદ ન થાય તે હેતુથી હું મારી હયાતીમાં મિલકતની વહેંચણી અંગે આ વીલ કરી રાખું છું.",
    ]),
    clause("૨.", [
      "આ અગાઉ મેં મારી મિલકત અંગે કોઈ જ વીલ યા વીલ સ્વરૂપનું કોઈ લખાણ કર્યાનું મારા ધ્યાનમાં નથી; છતાં તેવું કોઈ લખાણ મળી આવે તો તે આથી રદબાતલ કરું છું.",
    ]),
  ];

  if (family.length > 0) {
    blocks.push(
      clause("૩.", [
        "મારા નજીકનાં સગાં (કાયદેસરના વારસદારો)ની વિગત નીચે મુજબ છે:",
      ]),
      schedule(
        family.map((f, i) => ({
          label: `${toGujaratiDigits(i + 1)}. ${f.t("name")}`,
          value: `સંબંધ: ${f.t("relation")}${f.has("age") ? `, ઉ.વ. ${f.num("age")}` : ""}`,
        })),
      ),
    );
  }

  if (immovables.length > 0) {
    blocks.push(
      clause("૪.", ["મારા નામે નીચે પરિશિષ્ટમાં જણાવેલ સ્થાવર મિલકતો છે:"]),
    );
    immovables.forEach((prop, i) => {
      blocks.push(
        schedule(
          [
            { label: "જિલ્લો / તાલુકો / ગામ", value: `${prop.t("district")} / ${prop.t("taluka")} / ${prop.t("village")}` },
            { label: "રે.સ.નં. / સીટી સર્વે / પ્લોટ નં.", value: prop.t("surveyNo") },
            { label: "ક્ષેત્રફળ", value: prop.t("area") },
            { label: "મિલકતનું વર્ણન", value: prop.t("description") },
          ],
          `પરિશિષ્ટ — સ્થાવર મિલકત ${toGujaratiDigits(i + 1)}`,
        ),
      );
    });
  }

  if (movables.length > 0) {
    blocks.push(
      clause("૫.", ["હું નીચે મુજબની જંગમ મિલકતો (બેંક ખાતાંની વિગત સહિત) ધરાવું છું:"]),
      schedule(
        movables.map((m, i) => ({
          label: toGujaratiDigits(i + 1),
          value: m.t("description"),
        })),
      ),
    );
  }

  blocks.push(
    clause("૬.", [
      "ઉપર જણાવેલ તમામ મિલકત તથા તેના આધારે મળવાપાત્ર તમામ હક્કો, મારી હયાતી બાદ, મારા નીચે મુજબના વારસદારોને સ્વતંત્ર કબજા-ભોગવટા-માલિકી હક્કમાં સોંપવાનું હું ઠરાવું છું:",
    ]),
  );

  if (beneficiaries.length === 0) {
    blocks.push(para(["________________________________________________"]));
  }
  beneficiaries.forEach((b, i) => {
    blocks.push(
      clause(`૬.${toGujaratiDigits(i + 1)}`, [
        `${b.t("name")} (સંબંધ: ${b.t("relation")}) — ${b.t("share", "____________________")}`,
      ]),
    );
  });

  blocks.push(
    clause("૭.", [
      `હું ${c.t("executorName")}, રહેવાસી ${c.t("executorAddress")},${
        c.has("altExecutorName")
          ? ` અને તેમના અવસાનના કિસ્સામાં ${c.t("altExecutorName")}, રહેવાસી ${c.t("altExecutorAddress", "________")},`
          : ""
      } ને મારા વીલના એકઝીક્યુટર તરીકે નીમું છું.`,
    ]),
    clause("૮.", [
      "મારી હયાતી સુધી ઉપરની તમામ મિલકતો ઉપર મારો સંપૂર્ણ હક્ક-અધિકાર રહેશે — હું ખાઉં, વાપરું, ભોગવું, વેચું, સાટું યા મારું દિલ ચાહે તેમ કરું; આ વીલનો અમલ ફક્ત મારી હયાતી બાદ જ થવાનો છે, અને હું મારી હયાતીમાં આ વીલ ગમે ત્યારે રદ કરી કે બદલી શકું છું.",
    ]),
  );

  if (c.has("extraClauses")) {
    blocks.push(clause("૯.", [bold("વિશેષ સૂચનાઓ: "), c.t("extraClauses")]));
  }

  blocks.push(
    spacer(),
    para([
      `હું ${c.t("name")}, ઉપર મુજબના વીલની વિગતો વાંચી, સમજી, વિચારી, સારી માનસિક અવસ્થામાં અને મારી સભાન અવસ્થામાં, મારી સહી આજરોજ ${c.dateLong("date")}, મુકામ ${c.t("place")} ખાતે કરેલ છે; તથા મારા આ વીલના બે સાક્ષીઓએ આ વીલમાં સાક્ષી તરીકે પોતાની સહીઓ મારી રૂબરૂમાં કરેલ છે.`,
    ]),
    signatures([{ role: "વીલ કરનાર", name: c.t("name") }]),
    witnesses(
      "સાક્ષીઓ",
      wit.map(
        (w) =>
          `${w.t("name")}, રહે: ${w.t("address")} — અમો અમારી એકમેકની હાજરીમાં, અમારી સામે વીલ કરનારે આ વીલ ઉપર સહી કરેલ છે તેની સાક્ષી આપીએ છીએ.`,
      ),
    ),
    spacer(),
    para(
      [
        bold("નોંધ: "),
        "વસિયતનામું સાદા કાગળ પર થઈ શકે છે — સ્ટેમ્પ પેપર જરૂરી નથી; નોંધણી વૈકલ્પિક છે પણ હિતાવહ છે. લાભાર્થી (વારસદાર) સાક્ષી ન બને તે જરૂરી છે. વૃદ્ધ કે બીમાર વીલ કરનાર માટે ડૉક્ટરનું માનસિક-શારીરિક સ્વસ્થતાનું પ્રમાણપત્ર જોડવું હિતાવહ છે.",
      ],
      "left",
    ),
  );

  return blocks;
}

function buildEn(values: FieldValues): DocBlock[] {
  const c = makeCtx(values, "en");
  const family = c.group("family");
  const immovables = c.group("immovables");
  const movables = c.group("movables");
  const beneficiaries = c.group("beneficiaries");
  const wit = c.group("witnesses");

  const blocks: DocBlock[] = [
    title("LAST WILL AND TESTAMENT"),
    para([
      `I, ${c.t("name")}, ${c.age("age")}, occupation: ${c.t("occupation")}, residing at ${c.t("address")}, being of sound mind and full awareness, without any pressure or influence, make this my last will so that no dispute arises over my immovable and movable property after my death. It shall take effect only after my lifetime.`,
    ]),
  ];

  let n = 0;
  const next = () => clauseNo(++n, "en");

  blocks.push(
    clause(next(), [
      "Life is uncertain, and so that no quarrel arises among my legal heirs over the division of my property, I make this will during my lifetime.",
    ]),
    clause(next(), [
      "I have made no earlier will or writing in the nature of a will to my knowledge; should any such writing be found, I hereby revoke it.",
    ]),
  );

  if (family.length > 0) {
    blocks.push(
      clause(next(), ["My near relatives (legal heirs) are:"]),
      schedule(
        family.map((f, i) => ({
          label: `${i + 1}. ${f.t("name")}`,
          value: `relation: ${f.t("relation")}${f.has("age") ? `, age ${f.num("age")}` : ""}`,
        })),
      ),
    );
  }

  if (immovables.length > 0) {
    blocks.push(clause(next(), ["I own the following immovable properties:"]));
    immovables.forEach((prop, i) => {
      blocks.push(
        schedule(
          [
            { label: "District / taluka / village", value: `${prop.t("district")} / ${prop.t("taluka")} / ${prop.t("village")}` },
            { label: "Survey / city survey / plot no.", value: prop.t("surveyNo") },
            { label: "Area", value: prop.t("area") },
            { label: "Description", value: prop.t("description") },
          ],
          `SCHEDULE — IMMOVABLE PROPERTY ${i + 1}`,
        ),
      );
    });
  }

  if (movables.length > 0) {
    blocks.push(
      clause(next(), ["I own the following movable properties (with bank account details):"]),
      schedule(
        movables.map((m, i) => ({ label: String(i + 1), value: m.t("description") })),
      ),
    );
  }

  const bequestNo = next();
  blocks.push(
    clause(bequestNo, [
      "I direct that after my lifetime all the above properties and every right flowing from them shall pass to the following persons in full independent ownership and possession:",
    ]),
  );
  if (beneficiaries.length === 0) {
    blocks.push(para(["________________________________________________"]));
  }
  beneficiaries.forEach((b, i) => {
    blocks.push(
      clause(`${bequestNo.replace(".", "")}.${i + 1}`, [
        `${b.t("name")} (relation: ${b.t("relation")}) — ${b.t("share", "____________________")}`,
      ]),
    );
  });

  blocks.push(
    clause(next(), [
      `I appoint ${c.t("executorName")}, residing at ${c.t("executorAddress")},${
        c.has("altExecutorName")
          ? ` and in case of their demise ${c.t("altExecutorName")}, residing at ${c.t("altExecutorAddress", "________")},`
          : ""
      } as the executor of this will.`,
    ]),
    clause(next(), [
      "During my lifetime I retain full rights over all my properties — to use, enjoy, sell or deal with them as I please; this will operates only after my lifetime, and I may revoke or alter it at any time.",
    ]),
  );

  if (c.has("extraClauses")) {
    blocks.push(clause(next(), [bold("Special instructions: "), c.t("extraClauses")]));
  }

  blocks.push(
    spacer(),
    para([
      `I, ${c.t("name")}, having read and understood this will, in sound mind and full consciousness, sign it on ${c.dateLong("date")} at ${c.t("place")}; and my two witnesses have signed it as witnesses in my presence.`,
    ]),
    signatures([{ role: "Testator", name: c.t("name") }]),
    witnesses(
      "WITNESSES",
      wit.map(
        (w) =>
          `${w.t("name")}, address: ${w.t("address")} — we certify that the testator signed this will before us, in the presence of each of us.`,
      ),
    ),
    spacer(),
    para(
      [
        bold("Note: "),
        "A will needs no stamp paper — plain paper is valid; registration is optional but advisable. A beneficiary must not be a witness. For an elderly or ailing testator, attach a doctor's certificate of fitness.",
      ],
      "left",
    ),
  );

  return blocks;
}

export const vasiyatnamu: DocTemplate = {
  slug: "vasiyatnamu",
  name: { gu: "વીલ યાને વસિયતનામું", en: "Will (testament)" },
  shortName: { gu: "વસિયતનામું", en: "Will" },
  category: "family",
  description: {
    gu: "હયાતી બાદ મિલકતની વહેંચણી ઠરાવતું લખાણ — સ્થાવર-જંગમ મિલકતની યાદી, વારસદારો અને એકઝીક્યુટર સાથે, મોડેલ ડ્રાફ્ટ મુજબ.",
    en: "Directs how your property passes after your lifetime — with property schedules, beneficiaries and an executor, per the model draft.",
  },
  stampNote: {
    gu: "વસિયતનામા માટે સ્ટેમ્પ પેપર જરૂરી નથી — સાદા કાગળ પર માન્ય છે. નોંધણી વૈકલ્પિક છે પણ હિતાવહ છે (નજીવી ફી). બે સાક્ષી ફરજિયાત છે અને લાભાર્થી સાક્ષી ન બની શકે.",
    en: "No stamp paper is needed for a will — plain paper is valid. Registration is optional but advisable (nominal fee). Two witnesses are mandatory and a beneficiary cannot be one.",
  },
  languages: ["gu", "en"],
  sections: [
    {
      id: "testator",
      title: { gu: "વીલ કરનારની વિગત", en: "Testator details" },
      fields: partyFields().filter((f) => f.id !== "caste"),
    },
    {
      id: "familySection",
      title: { gu: "નજીકનાં સગાં (કાયદેસરના વારસદારો)", en: "Near relatives (legal heirs)" },
      description: {
        gu: "બધા કાયદેસરના વારસદારો જણાવવા — પરિણીત પુત્રીઓ સહિત.",
        en: "List all legal heirs — including married daughters.",
      },
      fields: [
        {
          id: "family",
          kind: "group",
          entryLabel: { gu: "સગું", en: "Relative" },
          addLabel: { gu: "સગું ઉમેરો", en: "Add relative" },
          min: 1,
          max: 10,
          fields: [
            { id: "name", kind: "text", label: { gu: "નામ", en: "Name" }, required: true, gujarati: true },
            {
              id: "relation",
              kind: "text",
              label: { gu: "સંબંધ", en: "Relation" },
              placeholder: { gu: "દા.ત. પત્ની / પુત્ર / પુત્રી", en: "e.g. wife / son / daughter" },
              required: true,
              gujarati: true,
            },
            { id: "age", kind: "number", label: { gu: "ઉંમર", en: "Age" } },
          ],
        },
      ],
    },
    {
      id: "immovableSection",
      title: { gu: "સ્થાવર મિલકતો", en: "Immovable properties" },
      fields: [
        {
          id: "immovables",
          kind: "group",
          entryLabel: { gu: "સ્થાવર મિલકત", en: "Immovable property" },
          addLabel: { gu: "મિલકત ઉમેરો", en: "Add property" },
          min: 1,
          max: 8,
          fields: [
            { id: "village", kind: "text", label: { gu: "ગામ / શહેર", en: "Village / city" }, gujarati: true },
            { id: "taluka", kind: "text", label: { gu: "તાલુકો", en: "Taluka" }, gujarati: true },
            { id: "district", kind: "text", label: { gu: "જિલ્લો", en: "District" }, gujarati: true },
            {
              id: "surveyNo",
              kind: "text",
              label: { gu: "રે.સ.નં. / સીટી સર્વે / પ્લોટ નં.", en: "Survey / city survey / plot no." },
            },
            { id: "area", kind: "text", label: { gu: "ક્ષેત્રફળ", en: "Area" }, gujarati: true },
            {
              id: "description",
              kind: "textarea",
              label: { gu: "વર્ણન", en: "Description" },
              gujarati: true,
              colSpan: 2,
            },
          ],
        },
      ],
    },
    {
      id: "movableSection",
      title: { gu: "જંગમ મિલકતો", en: "Movable properties" },
      description: {
        gu: "બેંક ખાતાં, એફ.ડી., શેર, દાગીના વગેરે — દરેક એક લીટીમાં.",
        en: "Bank accounts, FDs, shares, ornaments etc. — one entry each.",
      },
      fields: [
        {
          id: "movables",
          kind: "group",
          entryLabel: { gu: "જંગમ મિલકત", en: "Movable item" },
          addLabel: { gu: "જંગમ મિલકત ઉમેરો", en: "Add item" },
          min: 0,
          max: 10,
          fields: [
            {
              id: "description",
              kind: "text",
              label: { gu: "વિગત", en: "Detail" },
              placeholder: {
                gu: "દા.ત. SBI બચત ખાતું નં. …, શાખા …",
                en: "e.g. SBI savings a/c no. …, branch …",
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
      id: "beneficiarySection",
      title: { gu: "કોને શું આપવું છે?", en: "Bequests — who gets what" },
      fields: [
        {
          id: "beneficiaries",
          kind: "group",
          entryLabel: { gu: "વારસદાર", en: "Beneficiary" },
          addLabel: { gu: "વારસદાર ઉમેરો", en: "Add beneficiary" },
          min: 1,
          max: 10,
          fields: [
            { id: "name", kind: "text", label: { gu: "નામ", en: "Name" }, required: true, gujarati: true },
            {
              id: "relation",
              kind: "text",
              label: { gu: "સંબંધ", en: "Relation" },
              required: true,
              gujarati: true,
            },
            {
              id: "share",
              kind: "textarea",
              label: { gu: "શું મળશે? (મિલકત / હિસ્સો)", en: "What do they receive? (property / share)" },
              placeholder: {
                gu: "દા.ત. સ્થાવર મિલકત ૧ સંપૂર્ણ તથા SBI ખાતાની અડધી રકમ",
                en: "e.g. immovable property 1 fully, and half of the SBI account",
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
      id: "executorSection",
      title: { gu: "એકઝીક્યુટર (વીલનો અમલ કરનાર)", en: "Executor" },
      fields: [
        {
          id: "executorName",
          kind: "text",
          label: { gu: "એકઝીક્યુટરનું નામ", en: "Executor's name" },
          required: true,
          gujarati: true,
        },
        {
          id: "executorAddress",
          kind: "text",
          label: { gu: "એકઝીક્યુટરનું સરનામું", en: "Executor's address" },
          required: true,
          gujarati: true,
        },
        {
          id: "altExecutorName",
          kind: "text",
          label: { gu: "વૈકલ્પિક એકઝીક્યુટર (વૈકલ્પિક)", en: "Alternate executor (optional)" },
          gujarati: true,
        },
        {
          id: "altExecutorAddress",
          kind: "text",
          label: { gu: "વૈકલ્પિક એકઝીક્યુટરનું સરનામું", en: "Alternate executor's address" },
          gujarati: true,
        },
      ],
    },
    {
      id: "execution",
      title: { gu: "સહી — સ્થળ અને તારીખ", en: "Signing — place and date" },
      fields: [
        { id: "date", kind: "date", label: { gu: "તારીખ", en: "Date" }, required: true },
        { id: "place", kind: "text", label: { gu: "સ્થળ", en: "Place" }, required: true, gujarati: true },
        {
          id: "extraClauses",
          kind: "textarea",
          label: { gu: "વિશેષ સૂચનાઓ (વૈકલ્પિક)", en: "Special instructions (optional)" },
          gujarati: true,
          colSpan: 2,
        },
      ],
    },
    {
      id: "witnessSection",
      title: { gu: "સાક્ષીઓ (બે ફરજિયાત)", en: "Witnesses (two mandatory)" },
      fields: [witnessGroup()],
    },
  ],
  build: (values, lang: Lang) => ({
    lang,
    title: lang === "gu" ? "વસિયતનામું" : "Will",
    blocks: lang === "gu" ? buildGu(values) : buildEn(values),
  }),
};
