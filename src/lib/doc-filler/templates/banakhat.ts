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
import { rupeesInWords, toGujaratiDigits } from "../gujarati";
import { partyGroup, partyLine, propertySection, witnessGroup } from "../shared-fields";

/**
 * બાનાખત (વેચાણ કરાર) / Agreement to sell — encoded from the Gujarat
 * registration department's model drafts (કબજા વગરનો / કબજા સાથેનો વેચાણ
 * કરાર યાને બાનાખત), see research/templates/banakhat_kabja_*.txt. The
 * "possession" choice switches between the two variants, mirroring the
 * official pair, and drives the stamp-duty note.
 */

function balanceAmount(values: FieldValues): number | null {
  const totalRaw = String(values["totalAmount"] ?? "").trim();
  const earnestRaw = String(values["earnestAmount"] ?? "").trim();
  if (totalRaw === "" || earnestRaw === "") return null;
  const total = Number(totalRaw.replace(/[,\s]/g, ""));
  const earnest = Number(earnestRaw.replace(/[,\s]/g, ""));
  if (!Number.isFinite(total) || !Number.isFinite(earnest)) return null;
  const balance = total - earnest;
  return balance >= 0 ? balance : null;
}

function paymentModeLabel(values: FieldValues, lang: Lang): string {
  const mode = String(values["paymentMode"] ?? "");
  const ref = String(values["paymentRef"] ?? "").trim();
  const labels: Record<string, { gu: string; en: string }> = {
    cash: { gu: "રોકડેથી", en: "in cash" },
    cheque: { gu: "ચેકથી", en: "by cheque" },
    bank: { gu: "બેંક ટ્રાન્સફર (RTGS/NEFT/UPI)થી", en: "by bank transfer (RTGS/NEFT/UPI)" },
  };
  const base = labels[mode]?.[lang] ?? (lang === "gu" ? "________થી" : "by ________");
  if (ref === "") return base;
  return lang === "gu" ? `${base} (નં. ${ref})` : `${base} (no. ${ref})`;
}

export function propertyScheduleRows(values: FieldValues, lang: Lang) {
  const c = makeCtx(values, lang);
  const gu = lang === "gu";
  const rows = [
    { label: gu ? "મોજે ગામ / શહેર" : "Village / city (mouje)", value: c.t("propVillage") },
    { label: gu ? "તાલુકો" : "Taluka", value: c.t("propTaluka") },
    { label: gu ? "જિલ્લો (ડિસ્ટ્રિક્ટ)" : "District", value: c.t("propDistrict") },
    { label: gu ? "બ્લોક / સર્વે નંબર" : "Survey / block no.", value: c.num("surveyNo") },
    { label: gu ? "ક્ષેત્રફળ" : "Area", value: c.t("area") },
  ];
  if (c.has("propSubDistrict")) {
    rows.splice(3, 0, {
      label: gu ? "સબ-ડિસ્ટ્રિક્ટ" : "Sub-district",
      value: c.t("propSubDistrict"),
    });
  }
  if (c.has("khataNo")) {
    rows.push({ label: gu ? "ખાતા નંબર" : "Khata no.", value: c.num("khataNo") });
  }
  if (c.has("akar")) {
    rows.push({ label: gu ? "આકાર (રૂ. પૈસા)" : "Assessment (aakar)", value: c.num("akar") });
  }
  if (c.has("cityMeta")) {
    rows.push({ label: gu ? "ટી.પી. / એફ.પી. / સીટી સર્વે" : "TP / FP / city survey", value: c.t("cityMeta") });
  }
  if (c.has("propDescription")) {
    rows.push({ label: gu ? "વર્ણન" : "Description", value: c.t("propDescription") });
  }
  const bounds = [
    { id: "boundEast", gu: "પૂર્વે", en: "East" },
    { id: "boundWest", gu: "પશ્ચિમે", en: "West" },
    { id: "boundNorth", gu: "ઉત્તરે", en: "North" },
    { id: "boundSouth", gu: "દક્ષિણે", en: "South" },
  ];
  for (const b of bounds) {
    rows.push({ label: gu ? `ચતુર્દિશા — ${b.gu}` : `Boundary — ${b.en}`, value: c.t(b.id) });
  }
  return rows;
}

function buildGu(values: FieldValues): DocBlock[] {
  const c = makeCtx(values, "gu");
  const sellers = c.group("sellers");
  const buyers = c.group("buyers");
  const wit = c.group("witnesses");
  const balance = balanceAmount(values);
  const withPossession = c.raw("possession") === "yes";
  const kind = withPossession ? "કબજા સાથેનો" : "કબજા વગરનો";

  const blocks: DocBlock[] = [
    stampSpace("ઈ-સ્ટેમ્પ / ફ્રેન્કિંગ માટે જગ્યા"),
    title(`${kind} વેચાણ કરાર યાને બાનાખત`),
    para([
      `આજરોજ ${c.dateLong("agreementDate")}, મુકામ ${c.t("place")} ખાતે.`,
    ]),
  ];

  buyers.forEach((p, i) => {
    blocks.push(
      para([
        bold(buyers.length > 1 ? `લખી લેનાર ${toGujaratiDigits(i + 1)}: ` : "લખી લેનાર: "),
        partyLine(p, "gu"),
        " (જેમને હવે પછી આ બાનાખતમાં ",
        bold("“લખી લેનાર”"),
        " એ રીતે સંબોધવામાં આવ્યા છે; જે શબ્દના અર્થમાં તેમના વંશ, વાલી, વારસો, એસાઈનીઓ, એકઝીક્યુટર્સ, મુખત્યારો વગેરે તમામનો સમાવેશ થાય છે.)",
      ]),
    );
  });

  sellers.forEach((p, i) => {
    blocks.push(
      para([
        bold(sellers.length > 1 ? `લખી આપનાર ${toGujaratiDigits(i + 1)}: ` : "લખી આપનાર: "),
        partyLine(p, "gu"),
        " (જેમને હવે પછી આ બાનાખતમાં ",
        bold("“લખી આપનાર”"),
        " એ રીતે સંબોધવામાં આવ્યા છે; જે શબ્દના અર્થમાં તેમના વંશ, વાલી, વારસો, એસાઈનીઓ, એકઝીક્યુટર્સ, મુખત્યારો વગેરે તમામનો સમાવેશ થાય છે.)",
      ]),
    );
  });

  blocks.push(
    clause("(૧)", [
      `જત અમો લખી આપનાર તમો લખી લેનારને આ ${kind} વેચાણ કરાર યાને બાનાખત લખી આપીએ છીએ કે, નીચે પરિશિષ્ટમાં જણાવેલ મિલકત અમો લખી આપનારની સ્વતંત્ર માલિકી, કબજા-ભોગવટાની આવેલ છે. તે મિલકત અમો લખી આપનારે તમો લખી લેનારને વેચાણ આપવાનું નક્કી કરેલ છે. સદરહુ પરિશિષ્ટમાં જણાવેલ મિલકત ચાર્જ-બોજા વગરની અને બિનજોખમી છે, અને તે કોઈને કોઈપણ પ્રકારે લખી આપેલ નથી. તેમજ એ મિલકતના તમામ રાઈટ્સ, ટાઈટલ અને ઈન્ટરેસ્ટ ક્લિયર કરીને એ મિલકત બિનજોખમી બનાવીને તમોને વેચાણ આપવાની છે.`,
    ]),
    clause("(૨)", [
      `ઉપરોક્ત પરિશિષ્ટમાં જણાવેલ મિલકત અમો લખી આપનારે તમો લખી લેનારને ${c.money("totalAmount")} માં વેચાણ આપવાનું નક્કી કીધું છે. એ વેચાણ કિંમત પૈકીના બાનાના ${c.money("earnestAmount")} આજરોજ ${paymentModeLabel(values, "gu")} અમો લખી આપનારે લીધા છે, જેની આથી અમો લખી આપનાર તમો લખી લેનારને આ બાનાખતમાં કબૂલાત તથા પહોંચ આપીએ છીએ.`,
    ]),
    clause("(૩)", [
      `ઉપરોક્ત વેચાણ કિંમત પૈકીની બાકી પડતી રકમ ${
        balance !== null
          ? rupeesInWords(balance, "gu")
          : "રૂ. ________/- (અંકે રૂપિયા ____________________ પૂરા)"
      } તા. ${c.date("saleDeedDeadline").replace("તા. ", "")} સુધીમાં અમો લખી આપનારને ચૂકવી આપવાની છે, અને તે લઈને સદર મિલકતનો પાકો વેચાણ દસ્તાવેજ તમો લખી લેનારના નામનો, તમારા ખર્ચે, કરી આપી સબ રજિસ્ટ્રાર કચેરીમાં રજિસ્ટર્ડ કરાવી આપવાનો છે.`,
    ]),
    withPossession
      ? clause("(૪)", [
          bold("કબજા બાબત: "),
          "સદર મિલકતનો સંપૂર્ણ પ્રત્યક્ષ કબજો આજરોજ અમો લખી આપનારે તમો લખી લેનારને સુપ્રત કરેલ છે, જેની આ લખાણથી કબૂલાત આપીએ છીએ.",
        ])
      : clause("(૪)", [
          bold("કબજા બાબત: "),
          "હાલમાં સદર મિલકતનો પ્રત્યક્ષ કબજો અમો લખી આપનારે તમો લખી લેનારને સુપ્રત કરેલ નથી. વેચાણ દસ્તાવેજ થાય તે સમયે એ મિલકત તમો લખી લેનારના પ્રત્યક્ષ કબજામાં સોંપી દેવાની છે.",
        ]),
    clause("(૫)", [
      "વધુમાં અમો બાનાખત લખી આપનાર તમો લખાવી લેનારને ખાતરી અને બાંહેધરી આપીએ છીએ કે, સદર મિલકત અંગે સરકારી, અર્ધ-સરકારી, ખાનગી અથવા અન્ય કોઈ સંસ્થા પાસેથી લોન અગર સહાય મેળવેલ નથી, અને આ બાનાખત બાદ મજકૂર મિલકત ઉપર કોઈપણ જાતની લોન કે સહાય મેળવવાની નથી.",
    ]),
    clause("(૬)", [
      `વેચાણ આપવા નક્કી કરેલ મિલકત અંગેના તમામ પ્રકારના ટાઈટલ આ બાનાખતની તારીખથી ${c.num("titleClearMonths")} માસની સમયમર્યાદામાં ચોખ્ખાં કરાવી આપવાનાં રહેશે; ત્યારબાદ સદર મિલકતનો વેચાણ દસ્તાવેજ કરવાનો રહેશે.`,
    ]),
    clause("(૭)", [
      "સદર ઉપર જણાવેલ શરતો મુજબ અમો લખી આપનાર વેચાણ કિંમતના પૂરેપૂરા રૂપિયા લઈ તમોને વેચાણનો પાકો દસ્તાવેજ ન કરી આપીએ, તો તમો લખી લેનાર અમો લખી આપનારના ખર્ચે અને જોખમે કોર્ટ મારફતે કાયદેસર રીતે વેચાણ દસ્તાવેજ કરાવી લેવા તેમજ સદર મિલકતનો કબજો લેવા હક્કદાર યાને અધિકારી છો; તેમાં અમો લખી આપનારની કે અમારા વંશ, વાલી, વારસોની કોઈપણ તકરાર ચાલશે નહિ.",
    ]),
    clause("(૮)", [
      "તેવી જ રીતે, ઉપરોક્ત વેચાણ કિંમતનાં બાકી પડતાં નાણાં ઉપર જણાવેલી મુદતમાં તમો લખી લેનાર ચૂકવવામાં નિષ્ફળ જાઓ, તો તમો લખી લેનારે આપેલ બાના પેટેની રકમ જપ્ત (ફોરફીટ) ગણવાની રહેશે અને સદર બાનાખત રદ ગણવાનું રહેશે.",
    ]),
    clause("(૯)", [
      `સદર મિલકતનો વેચાણ દસ્તાવેજ કરતી વખતે જે કાંઈ ખર્ચ — સ્ટેમ્પ ડ્યુટી, નોંધણી ફી વગેરે — થાય તે ${
        c.raw("expenseBearer") === "seller"
          ? "અમો લખી આપનારે"
          : c.raw("expenseBearer") === "both"
            ? "બંને પક્ષોએ અડધો-અડધ"
            : "તમો લખી લેનારે"
      } ભોગવવાનો છે.`,
    ]),
  );

  if (c.has("extraClauses")) {
    blocks.push(clause("(૧૦)", [bold("વધારાની શરતો: "), c.t("extraClauses")]));
  }

  blocks.push(
    spacer(),
    schedule(propertyScheduleRows(values, "gu"), "-: પરિશિષ્ટ :-"),
    para([
      `આ ${kind} વેચાણ કરાર યાને બાનાખત અમો લખી આપનારે અમારી રાજીખુશીથી તથા અક્કલ હોંશિયારીથી, બિનદબાણે, પૂરેપૂરું વાંચી-વંચાવી, શુદ્ધબુદ્ધિથી લખી આપેલ છે, જે અમો લખી આપનારને તથા અમારા વંશ, વાલી, વારસોને હરેક રીતે કબૂલ, મંજૂર અને બંધનકર્તા છે. આ લખ્યું તે સહી.`,
    ]),
    signatures([
      ...sellers.map((p, i) => ({
        role: sellers.length > 1 ? `લખી આપનાર ${toGujaratiDigits(i + 1)}` : "લખી આપનાર",
        name: p.t("name"),
      })),
      ...buyers.map((p, i) => ({
        role: buyers.length > 1 ? `લખી લેનાર ${toGujaratiDigits(i + 1)}` : "લખી લેનાર",
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
  const sellers = c.group("sellers");
  const buyers = c.group("buyers");
  const wit = c.group("witnesses");
  const balance = balanceAmount(values);
  const withPossession = c.raw("possession") === "yes";

  const blocks: DocBlock[] = [
    stampSpace("Space reserved for e-stamp / franking"),
    title(`AGREEMENT TO SELL (BANAKHAT) — ${withPossession ? "WITH" : "WITHOUT"} POSSESSION`),
    para([
      `This Agreement to Sell is made at ${c.t("place")} on ${c.dateLong("agreementDate")} between:`,
    ]),
  ];

  sellers.forEach((p, i) => {
    blocks.push(
      para([
        bold(sellers.length > 1 ? `Seller ${i + 1}: ` : "Seller: "),
        partyLine(p, "en"),
        " — hereinafter the ",
        bold("“Seller”"),
        " (which expression includes their heirs, guardians, successors, assignees, executors and attorneys) — ",
        bold("Party of the First Part."),
      ]),
    );
  });

  buyers.forEach((p, i) => {
    blocks.push(
      para([
        bold(buyers.length > 1 ? `Purchaser ${i + 1}: ` : "Purchaser: "),
        partyLine(p, "en"),
        " — hereinafter the ",
        bold("“Purchaser”"),
        " (with the same inclusive meaning) — ",
        bold("Party of the Second Part."),
      ]),
    );
  });

  let n = 0;
  const next = () => clauseNo(++n, "en");

  blocks.push(
    clause(next(), [
      "The Seller declares that the property described in the Schedule below is of the Seller's independent ownership, possession and enjoyment, free from charge and encumbrance, not committed to anyone in any manner, and that the Seller shall convey it to the Purchaser with all rights, title and interest made clear.",
    ]),
    clause(next(), [
      `The property shall be sold for a total consideration of ${c.money("totalAmount")}. Out of it, the Purchaser has this day paid ${c.money("earnestAmount")} as earnest money ${paymentModeLabel(values, "en")}, receipt whereof the Seller hereby acknowledges.`,
    ]),
    clause(next(), [
      `The balance consideration of ${
        balance !== null ? rupeesInWords(balance, "en") : "Rs. ________/- (Rupees ____________________ only)"
      } shall be paid on or before ${c.date("saleDeedDeadline")}, whereupon the Seller shall execute the registered sale deed in the Purchaser's name at the Purchaser's cost before the sub-registrar.`,
    ]),
    withPossession
      ? clause(next(), [
          bold("Possession: "),
          "Actual physical possession of the property has been handed over to the Purchaser this day, which the Seller hereby confirms.",
        ])
      : clause(next(), [
          bold("Possession: "),
          "Possession of the property is not handed over under this agreement; it shall be delivered to the Purchaser at the time of execution of the sale deed.",
        ]),
    clause(next(), [
      "The Seller assures that no loan or assistance has been taken against the property from any government, semi-government, private or other institution, and none shall be taken after this agreement.",
    ]),
    clause(next(), [
      `The Seller shall have the title of the property made clear within ${c.num("titleClearMonths")} month(s) from the date of this agreement, after which the sale deed shall be executed.`,
    ]),
    clause(next(), [
      "If the Seller fails to execute the sale deed after receiving the full consideration as agreed, the Purchaser shall be entitled to have the sale deed executed through court at the Seller's cost and risk and to take possession of the property, without objection from the Seller or the Seller's heirs.",
    ]),
    clause(next(), [
      "Likewise, if the Purchaser fails to pay the balance within the stipulated period, the earnest money paid shall stand forfeited and this agreement shall stand cancelled.",
    ]),
    clause(next(), [
      `All expenses of the sale deed — stamp duty, registration fee and incidental costs — shall be borne by the ${
        c.raw("expenseBearer") === "seller"
          ? "Seller"
          : c.raw("expenseBearer") === "both"
            ? "parties equally"
            : "Purchaser"
      }.`,
    ]),
  );

  if (c.has("extraClauses")) {
    blocks.push(clause(next(), [bold("Additional terms: "), c.t("extraClauses")]));
  }

  blocks.push(
    spacer(),
    schedule(propertyScheduleRows(values, "en"), "SCHEDULE OF THE PROPERTY"),
    para([
      "The Seller has executed this agreement voluntarily, with full understanding, without any coercion, having read it completely and in sound mind; it binds the parties and their heirs in every way.",
    ]),
    signatures([
      ...sellers.map((p, i) => ({
        role: sellers.length > 1 ? `Seller ${i + 1}` : "Seller",
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
  );

  return blocks;
}

export const banakhat: DocTemplate = {
  slug: "banakhat",
  name: { gu: "બાનાખત (વેચાણ કરાર)", en: "Agreement to sell (Banakhat)" },
  shortName: { gu: "બાનાખત", en: "Banakhat" },
  category: "sale",
  description: {
    gu: "વેચાણ દસ્તાવેજ પહેલાં થતો બાનાનો કરાર — સરકારી મોડેલ ડ્રાફ્ટ મુજબ, કબજા સાથે કે કબજા વગર.",
    en: "The earnest-money agreement made before the sale deed — per the government model draft, with or without possession.",
  },
  stampNote: {
    gu: "કબજા વગરના બાનાખત ઉપર નિયત (નજીવી) સ્ટેમ્પ ડ્યુટી લાગે છે, જે વેચાણ દસ્તાવેજ વખતે મજરે મળે છે; બાનાખતથી કબજો સોંપાય તો વેચાણ જેટલી પૂરી ડ્યુટી (~૪.૯%) લાગે છે. વર્તમાન દર ગાર્વી/સબ રજિસ્ટ્રાર કચેરીએ ખાતરી કરવા.",
    en: "A banakhat without possession attracts nominal stamp duty (adjustable against the sale deed); with possession it attracts full conveyance duty (~4.9%). Verify current rates on Garvi / at the sub-registrar office.",
  },
  languages: ["gu", "en"],
  sections: [
    {
      id: "basics",
      title: { gu: "કરારની વિગત", en: "Agreement details" },
      fields: [
        { id: "agreementDate", kind: "date", label: { gu: "બાનાખતની તારીખ", en: "Agreement date" }, required: true },
        {
          id: "place",
          kind: "text",
          label: { gu: "સ્થળ (ગામ / શહેર)", en: "Place (village / city)" },
          required: true,
          gujarati: true,
        },
        {
          id: "possession",
          kind: "select",
          label: { gu: "કબજો આજે સોંપો છો?", en: "Possession handed over now?" },
          defaultValue: "no",
          options: [
            { value: "no", label: { gu: "ના — દસ્તાવેજ વખતે (સામાન્ય)", en: "No — at sale deed (usual)" } },
            { value: "yes", label: { gu: "હા — બાનાખતથી જ", en: "Yes — under this banakhat" } },
          ],
          help: {
            gu: "કબજા સાથેના બાનાખત પર વેચાણ જેટલી સ્ટેમ્પ ડ્યુટી લાગે છે.",
            en: "A banakhat with possession attracts conveyance-level stamp duty.",
          },
          colSpan: 2,
        },
      ],
    },
    {
      id: "sellers",
      title: { gu: "લખી આપનાર (વેચનાર)ની વિગત", en: "Seller details" },
      fields: [
        partyGroup("sellers", { gu: "લખી આપનાર", en: "Seller" }, {
          withPan: true,
          withAadhaar: true,
          addLabel: { gu: "લખી આપનાર ઉમેરો", en: "Add seller" },
        }),
      ],
    },
    {
      id: "buyers",
      title: { gu: "લખી લેનાર (ખરીદનાર)ની વિગત", en: "Purchaser details" },
      fields: [
        partyGroup("buyers", { gu: "લખી લેનાર", en: "Purchaser" }, {
          withPan: true,
          withAadhaar: true,
          addLabel: { gu: "લખી લેનાર ઉમેરો", en: "Add purchaser" },
        }),
      ],
    },
    {
      id: "consideration",
      title: { gu: "અવેજ અને બાનું", en: "Consideration and earnest" },
      fields: [
        {
          id: "totalAmount",
          kind: "money",
          label: { gu: "કુલ વેચાણ કિંમત (રૂ.)", en: "Total consideration (Rs.)" },
          placeholder: { gu: "દા.ત. 5500000", en: "e.g. 5500000" },
          required: true,
        },
        {
          id: "earnestAmount",
          kind: "money",
          label: { gu: "બાનાની રકમ (રૂ.)", en: "Earnest money (Rs.)" },
          placeholder: { gu: "દા.ત. 500000", en: "e.g. 500000" },
          required: true,
        },
        {
          id: "paymentMode",
          kind: "select",
          label: { gu: "બાનું ચૂકવવાની રીત", en: "Earnest paid by" },
          defaultValue: "cheque",
          options: [
            { value: "cash", label: { gu: "રોકડ", en: "Cash" } },
            { value: "cheque", label: { gu: "ચેક", en: "Cheque" } },
            { value: "bank", label: { gu: "બેંક ટ્રાન્સફર (RTGS/NEFT/UPI)", en: "Bank transfer (RTGS/NEFT/UPI)" } },
          ],
        },
        {
          id: "paymentRef",
          kind: "text",
          label: { gu: "ચેક / ટ્રાન્ઝેક્શન નંબર (હોય તો)", en: "Cheque / transaction no. (if any)" },
        },
        {
          id: "saleDeedDeadline",
          kind: "date",
          label: { gu: "દસ્તાવેજ કરવાની છેલ્લી તારીખ", en: "Deadline for sale deed" },
          required: true,
        },
        {
          id: "titleClearMonths",
          kind: "number",
          label: { gu: "ટાઈટલ ચોખ્ખાં કરવાની મુદત (માસ)", en: "Time to clear title (months)" },
          defaultValue: "3",
        },
        {
          id: "expenseBearer",
          kind: "select",
          label: { gu: "સ્ટેમ્પ-નોંધણી ખર્ચ કોણ ભરશે?", en: "Who bears stamp & registration costs?" },
          defaultValue: "buyer",
          options: [
            { value: "buyer", label: { gu: "લખી લેનાર (ખરીદનાર)", en: "Purchaser" } },
            { value: "seller", label: { gu: "લખી આપનાર (વેચનાર)", en: "Seller" } },
            { value: "both", label: { gu: "બંને અડધો-અડધ", en: "Both equally" } },
          ],
        },
      ],
    },
    propertySection(),
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
    title: lang === "gu" ? "બાનાખત" : "Agreement to sell",
    blocks: lang === "gu" ? buildGu(values) : buildEn(values),
  }),
};
