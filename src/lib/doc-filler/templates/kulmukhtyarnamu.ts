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
import { partyGroup, propertySection, witnessGroup } from "../shared-fields";

/**
 * સામાન્ય કુલમુખત્યારનામું / General power of attorney. Grants the customary
 * set of management powers; the power to sell/execute deeds is a separate
 * opt-in because it changes the stamp-duty treatment.
 */

function hasProperty(values: FieldValues): boolean {
  return ["propVillage", "surveyNo", "area"].some(
    (id) => String(values[id] ?? "").trim() !== "",
  );
}

function propertyRows(values: FieldValues, lang: Lang) {
  const c = makeCtx(values, lang);
  const gu = lang === "gu";
  const rows: { label: string; value: string }[] = [];
  const push = (id: string, guLabel: string, enLabel: string, num = false) => {
    if (c.has(id)) rows.push({ label: gu ? guLabel : enLabel, value: num ? c.num(id) : c.t(id) });
  };
  push("propVillage", "મોજે ગામ / શહેર", "Village / city");
  push("propTaluka", "તાલુકો", "Taluka");
  push("propDistrict", "જિલ્લો", "District");
  push("surveyNo", "સર્વે / બ્લોક નં.", "Survey / block no.", true);
  push("cityMeta", "ટી.પી. / એફ.પી. / સીટી સર્વે", "TP / FP / city survey");
  push("area", "ક્ષેત્રફળ", "Area");
  push("propDescription", "વર્ણન", "Description");
  return rows;
}

function buildGu(values: FieldValues): DocBlock[] {
  const c = makeCtx(values, "gu");
  const principals = c.group("principals");
  const attorneys = c.group("attorneys");
  const wit = c.group("witnesses");
  const withSale = c.raw("salePower") === "yes";

  const blocks: DocBlock[] = [
    stampSpace("સ્ટેમ્પ પેપર / ઈ-સ્ટેમ્પ માટે જગ્યા"),
    title("સામાન્ય કુલમુખત્યારનામું"),
    para([
      `આજરોજ ${c.dateLong("date")} ના રોજ, મુકામ ${c.t("place")} ખાતે, આ કુલમુખત્યારનામું લખી આપનાર:`,
    ]),
  ];

  principals.forEach((p, i) => {
    blocks.push(
      para([
        bold(principals.length > 1 ? `લખી આપનાર ${toGujaratiDigits(i + 1)}: ` : "લખી આપનાર: "),
        `${p.t("name")}, ${p.age("age")}, ધંધો: ${p.t("occupation")}, રહે: ${p.t("address")}`,
      ]),
    );
  });

  blocks.push(
    para([
      "આથી જાહેર કરું છું / કરીએ છીએ કે, અંગત રોકાણ તથા અન્ય કારણોસર હું / અમે અમારાં નીચે જણાવેલ કામકાજ જાતે હાજર રહી કરી શકીએ તેમ ન હોવાથી, નીચે જણાવેલ ઈસમને મારો / અમારો કુલમુખત્યાર નીમેલ છે:",
    ]),
  );

  attorneys.forEach((p, i) => {
    blocks.push(
      para([
        bold(attorneys.length > 1 ? `કુલમુખત્યાર ${toGujaratiDigits(i + 1)}: ` : "કુલમુખત્યાર: "),
        `${p.t("name")}, ${p.age("age")}, ધંધો: ${p.t("occupation")}, રહે: ${p.t("address")}`,
      ]),
    );
  });

  blocks.push(
    para([
      "અને તેમને નીચે મુજબની સત્તાઓ આપી છે, જે અન્વયે તેમણે કરેલાં તમામ કાયદેસર કૃત્યો મને / અમને પોતે કરેલાં હોય તેમ કબૂલ-મંજૂર રહેશે:",
    ]),
  );

  let n = 0;
  const next = () => clauseNo(++n, "gu");

  blocks.push(
    clause(next(), [
      bold("મિલકત વહીવટ: "),
      "મારી / અમારી સ્થાવર-જંગમ મિલકતોનો વહીવટ કરવો, સાચવણી કરવી, ભાડે આપવી, ભાડું-વસૂલાત કરવી અને પહોંચ આપવી.",
    ]),
    clause(next(), [
      bold("સરકારી કામકાજ: "),
      "મામલતદાર, તલાટી, સિટી સર્વે, સબ રજિસ્ટ્રાર, મહાનગરપાલિકા / પંચાયત સહિત કોઈપણ સરકારી / અર્ધ-સરકારી કચેરીમાં અરજીઓ કરવી, રજૂઆત કરવી, જવાબ આપવા, વેરા-ફી ભરવાં અને દાખલા-ઉતારા મેળવવા.",
    ]),
    clause(next(), [
      bold("બેંક વ્યવહાર: "),
      "મારા / અમારા નામનાં બેંક ખાતાં ચલાવવાં, રકમ ભરવી-ઉપાડવી, ચેક સહી કરવા તથા ડિમાન્ડ ડ્રાફ્ટ મેળવવા.",
    ]),
    clause(next(), [
      bold("કરાર અને લખાણ: "),
      "મારા / અમારા વતી કરાર કરવા, લખાણો કરવાં, સહી કરવી તથા જરૂરી હોય ત્યાં નોંધણી કરાવવી.",
    ]),
    clause(next(), [
      bold("કોર્ટ કામકાજ: "),
      "કોઈપણ કોર્ટ, ટ્રિબ્યુનલ કે સત્તામંડળ સમક્ષ દાવા-અરજી દાખલ કરવી, બચાવ કરવો, વકીલ રોકવા, સોગંદનામાં કરવાં, સમાધાન કરવું તથા હુકમનામાની બજવણી કરાવવી.",
    ]),
  );

  if (withSale) {
    blocks.push(
      clause(next(), [
        bold("વેચાણ / તબદીલીની સત્તા: "),
        "નીચે મિલકત વર્ણનમાં જણાવેલ મિલકત યોગ્ય અવેજથી વેચાણ, બાનાખત, ગીરો, ભાડાપટ્ટા કે અન્ય રીતે તબદીલ કરવા, અવેજ સ્વીકારી પહોંચ આપવી તથા સબ રજિસ્ટ્રાર સમક્ષ દસ્તાવેજ કરી, કબૂલાત આપી નોંધાવી આપવા.",
      ]),
    );
  }

  blocks.push(
    clause(next(), [
      bold("સામાન્ય સત્તા: "),
      "ઉપર જણાવેલ કામકાજ અંગે જરૂરી હોય તેવાં તમામ આનુષંગિક કૃત્યો કરવાં — જે હું / અમે જાતે હાજર હોઈએ તો કરી શકીએ.",
    ]),
    clause(next(), [
      bold("અવેજ તથા કબજો: "),
      withSale
        ? "આ કુલમુખત્યારનામું કરી આપવા માટે અમોએ કુલમુખત્યાર પાસેથી કોઈપણ જાતનો અવેજ મેળવેલ નથી — બિનઅવેજી કરી આપેલ છે. મિલકતના વેચાણ / તબદીલીની સત્તા આપેલ હોવા છતાં, આ લેખથી કોઈ મિલકતનો પ્રત્યક્ષ કબજો કુલમુખત્યારને સોંપેલ નથી."
        : "આ કુલમુખત્યારનામું કરી આપવા માટે અમોએ કુલમુખત્યાર પાસેથી કોઈપણ જાતનો અવેજ મેળવેલ નથી — બિનઅવેજી કરી આપેલ છે. અમોએ કોઈપણ મિલકતનો પ્રત્યક્ષ કબજો કુલમુખત્યારને સોંપેલ નથી.",
    ]),
    clause(next(), [
      bold("કબૂલાત: "),
      "કુલમુખત્યારે ઉપરની સત્તાઓ અન્વયે જે જે જરૂરી કાર્યો કર્યાં હશે તે તમામ કાર્યો મેં / અમે જાતે હાજર રહી કર્યા બરાબર ગણાશે, અને તેવાં કાર્યો હું / અમે પશ્ચાદ્વર્તી અસરથી રદ કરીશું નહિ.",
    ]),
    clause(next(), [
      bold("સમયમર્યાદા અને રદબાતલ: "),
      "આ કુલમુખત્યારનામું અમો લખી આપનારની ઈચ્છાનુસારના સમય સુધી ચાલુ રહેશે; પરંતુ પ્રતિપક્ષને એક માસની આગોતરી જાણ (ઈન્ટીમેશન નોટિસ) આપી, જરૂરી હોય ત્યાં રજિસ્ટર્ડ રદીકરણ લેખ કરીને, રદ કરી શકાશે. લખી આપનારના અવસાનથી તે આપોઆપ રદ થશે.",
    ]),
  );

  if (c.has("extraClauses")) {
    blocks.push(clause(next(), [bold("વિશેષ સૂચનાઓ: "), c.t("extraClauses")]));
  }

  if (hasProperty(values)) {
    blocks.push(spacer(), schedule(propertyRows(values, "gu"), "મિલકતનું વર્ણન"));
  }

  blocks.push(
    para([
      "ઉપર મુજબ મેં / અમે સ્વસ્થ ચિત્તે, સ્વેચ્છાએ, કોઈ દબાણ વિના આ કુલમુખત્યારનામું લખી આપેલ છે અને નીચેના સાક્ષીઓ સમક્ષ સહી કરેલ છે.",
    ]),
    signatures([
      ...principals.map((p, i) => ({
        role: principals.length > 1 ? `લખી આપનાર ${toGujaratiDigits(i + 1)}` : "લખી આપનાર",
        name: p.t("name"),
      })),
      ...attorneys.map((p, i) => ({
        role:
          attorneys.length > 1
            ? `કુલમુખત્યાર ${toGujaratiDigits(i + 1)} (સ્વીકાર સહી)`
            : "કુલમુખત્યાર (સ્વીકાર સહી)",
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
  const principals = c.group("principals");
  const attorneys = c.group("attorneys");
  const wit = c.group("witnesses");
  const withSale = c.raw("salePower") === "yes";

  const blocks: DocBlock[] = [
    stampSpace("Space reserved for stamp paper / e-stamp"),
    title("GENERAL POWER OF ATTORNEY"),
    para([
      `This General Power of Attorney is executed at ${c.t("place")} on ${c.dateLong("date")} by:`,
    ]),
  ];

  principals.forEach((p, i) => {
    blocks.push(
      para([
        bold(principals.length > 1 ? `Executant ${i + 1}: ` : "Executant: "),
        `${p.t("name")}, ${p.age("age")}, occupation: ${p.t("occupation")}, residing at ${p.t("address")}`,
      ]),
    );
  });

  blocks.push(
    para([
      "WHEREAS, owing to personal engagements and other reasons, I/we cannot personally attend to the matters set out below, I/we hereby nominate and appoint as my/our lawful attorney:",
    ]),
  );

  attorneys.forEach((p, i) => {
    blocks.push(
      para([
        bold(attorneys.length > 1 ? `Attorney ${i + 1}: ` : "Attorney: "),
        `${p.t("name")}, ${p.age("age")}, occupation: ${p.t("occupation")}, residing at ${p.t("address")}`,
      ]),
    );
  });

  blocks.push(
    para([
      "and confer the following powers, ratifying and confirming all lawful acts done thereunder as if done by me/us personally:",
    ]),
  );

  let n = 0;
  const next = () => clauseNo(++n, "en");

  blocks.push(
    clause(next(), [
      bold("Property management: "),
      "To manage and maintain my/our movable and immovable properties, let them out, recover rent and issue receipts.",
    ]),
    clause(next(), [
      bold("Government offices: "),
      "To make and pursue applications before the mamlatdar, talati, city survey, sub-registrar, municipal corporation / panchayat and any other government or semi-government office, pay taxes and fees, and obtain record extracts.",
    ]),
    clause(next(), [
      bold("Banking: "),
      "To operate my/our bank accounts, deposit and withdraw amounts, sign cheques and obtain demand drafts.",
    ]),
    clause(next(), [
      bold("Agreements: "),
      "To enter into agreements and writings on my/our behalf, sign them and have them registered where required.",
    ]),
    clause(next(), [
      bold("Litigation: "),
      "To institute and defend suits and applications before any court, tribunal or authority, engage advocates, swear affidavits, compromise and execute decrees.",
    ]),
  );

  if (withSale) {
    blocks.push(
      clause(next(), [
        bold("Power of sale / transfer: "),
        "To sell, agree to sell, mortgage, lease or otherwise transfer the property described in the Schedule below for proper consideration, receive the consideration and issue receipts, and to execute, admit and register the deeds before the sub-registrar.",
      ]),
    );
  }

  blocks.push(
    clause(next(), [
      bold("General: "),
      "To do all acts incidental to the above which I/we could do if personally present.",
    ]),
    clause(next(), [
      bold("Consideration and possession: "),
      "No consideration of any kind has been received from the attorney for executing this power of attorney — it is executed without consideration, and no possession of any property is handed over to the attorney under this deed.",
    ]),
    clause(next(), [
      bold("Ratification: "),
      "All lawful acts done by the attorney under these powers shall be treated as done by me/us personally, and I/we shall not revoke them with retrospective effect.",
    ]),
    clause(next(), [
      bold("Duration and revocation: "),
      "This power of attorney remains in force at the executant's pleasure; it may be revoked by giving one month's intimation notice to the other side and, where required, executing a registered deed of revocation. It stands revoked automatically on the death of the executant.",
    ]),
  );

  if (c.has("extraClauses")) {
    blocks.push(clause(next(), [bold("Special instructions: "), c.t("extraClauses")]));
  }

  if (hasProperty(values)) {
    blocks.push(spacer(), schedule(propertyRows(values, "en"), "SCHEDULE OF THE PROPERTY"));
  }

  blocks.push(
    para([
      "IN WITNESS WHEREOF I/we have signed this power of attorney voluntarily, in sound mind and without coercion, in the presence of the witnesses below.",
    ]),
    signatures([
      ...principals.map((p, i) => ({
        role: principals.length > 1 ? `Executant ${i + 1}` : "Executant",
        name: p.t("name"),
      })),
      ...attorneys.map((p, i) => ({
        role: attorneys.length > 1 ? `Attorney ${i + 1} (acceptance)` : "Attorney (acceptance)",
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

export const kulmukhtyarnamu: DocTemplate = {
  slug: "kulmukhtyarnamu",
  name: { gu: "સામાન્ય કુલમુખત્યારનામું", en: "General power of attorney" },
  shortName: { gu: "કુલમુખત્યારનામું", en: "Power of attorney" },
  category: "authority",
  description: {
    gu: "મિલકત વહીવટ, સરકારી કામકાજ, બેંક અને કોર્ટ કામકાજ માટે બીજી વ્યક્તિને સત્તા આપતું લખાણ — વેચાણની સત્તા વૈકલ્પિક.",
    en: "Authorises another person for property management, government offices, banking and court matters — power of sale optional.",
  },
  stampNote: {
    gu: "સામાન્ય કુલમુખત્યારનામા પર નિયત સ્ટેમ્પ ડ્યુટી લાગે છે; કુટુંબ બહારની વ્યક્તિને મિલકત વેચવાની સત્તા અપાય તો વેચાણ જેટલી ડ્યુટી લાગી શકે છે અને નોંધણી જરૂરી બની શકે. અમલ પહેલાં દર ખાતરી કરવા.",
    en: "A general POA attracts fixed stamp duty; granting power of sale to a non-family member can attract conveyance-level duty and need registration. Verify rates before executing.",
  },
  languages: ["gu", "en"],
  sections: [
    {
      id: "basics",
      title: { gu: "લખાણની વિગત", en: "Deed details" },
      fields: [
        { id: "date", kind: "date", label: { gu: "તારીખ", en: "Date" }, required: true },
        { id: "place", kind: "text", label: { gu: "સ્થળ", en: "Place" }, required: true, gujarati: true },
        {
          id: "salePower",
          kind: "select",
          label: { gu: "મિલકત વેચાણની સત્તા આપવી છે?", en: "Include power to sell property?" },
          defaultValue: "no",
          options: [
            { value: "no", label: { gu: "ના — માત્ર વહીવટી સત્તા", en: "No — management powers only" } },
            { value: "yes", label: { gu: "હા — વેચાણ / તબદીલી સહિત", en: "Yes — including sale / transfer" } },
          ],
          help: {
            gu: "વેચાણ સત્તાથી સ્ટેમ્પ ડ્યુટી બદલાય છે — ઉપરની નોંધ જુઓ.",
            en: "The sale power changes stamp duty — see the note above.",
          },
          colSpan: 2,
        },
      ],
    },
    {
      id: "principals",
      title: { gu: "લખી આપનારની વિગત", en: "Executant details" },
      fields: [
        partyGroup("principals", { gu: "લખી આપનાર", en: "Executant" }, {
          max: 2,
          addLabel: { gu: "લખી આપનાર ઉમેરો", en: "Add executant" },
        }),
      ],
    },
    {
      id: "attorneys",
      title: { gu: "કુલમુખત્યારની વિગત", en: "Attorney details" },
      fields: [
        partyGroup("attorneys", { gu: "કુલમુખત્યાર", en: "Attorney" }, {
          max: 2,
          addLabel: { gu: "કુલમુખત્યાર ઉમેરો", en: "Add attorney" },
        }),
      ],
    },
    propertySection({
      required: false,
      titleOverride: { gu: "મિલકતની વિગત (લાગુ પડે તો)", en: "Property details (if applicable)" },
    }),
    {
      id: "extra",
      title: { gu: "વિશેષ સૂચનાઓ", en: "Special instructions" },
      fields: [
        {
          id: "extraClauses",
          kind: "textarea",
          label: { gu: "વધારાની સૂચનાઓ (વૈકલ્પિક)", en: "Additional instructions (optional)" },
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
    title: lang === "gu" ? "કુલમુખત્યારનામું" : "Power of attorney",
    blocks: lang === "gu" ? buildGu(values) : buildEn(values),
  }),
};
