import type { DocBlock, DocTemplate, FieldValues } from "../types";
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
 * રીલીઝ લેખ (હક કમી) / Release–relinquishment deed — encoded from the
 * Gujarat model drafts (અવેજી / બિન અવેજી રીલીઝ, see
 * research/templates/*_release.txt). Typically used between co-heirs to
 * release an inherited share; the consideration choice switches between the
 * two official variants. Gujarati-only, matching the model drafts.
 */

function buildGu(values: FieldValues): DocBlock[] {
  const c = makeCtx(values, "gu");
  const takers = c.group("takers"); // પહેલા પક્ષ — રીલીઝ કરાવી લેનાર
  const releasors = c.group("releasors"); // બીજા પક્ષ — રીલીઝ કરી આપનાર
  const wit = c.group("witnesses");
  const withConsideration = c.raw("consideration") === "yes";
  const kindLabel = withConsideration ? "અવેજી" : "બિન અવેજી";

  const blocks: DocBlock[] = [
    stampSpace("ઈ-સ્ટેમ્પ / સ્ટેમ્પ પેપર માટે જગ્યા"),
    title(`${kindLabel} રીલીઝનો લેખ (હક કમી)`),
    para(
      [
        `મોજે ${c.t("propVillage")}, તા. ${c.t("propTaluka")}, જિ. ${c.t("propDistrict")} ના સર્વે/બ્લોક નં. ${c.num("surveyNo")} વાળી મિલકતનો ${kindLabel} રીલીઝનો દસ્તાવેજ.`,
      ],
      "center",
    ),
    para([`આજરોજ ${c.dateLong("deedDate")} ના અંગ્રેજી દિને.`]),
  ];

  takers.forEach((p, i) => {
    blocks.push(
      para([
        bold(
          takers.length > 1
            ? `રીલીઝ કરાવી લેનાર (પહેલા પક્ષ) ${toGujaratiDigits(i + 1)}: `
            : "રીલીઝ કરાવી લેનાર (પહેલા પક્ષ): ",
        ),
        partyLine(p, "gu"),
        " (જેમને હવે પછી આ રીલીઝ લેખમાં ",
        bold("“રીલીઝ કરાવી લેનાર”"),
        " યાને “તમો” એ રીતે સંબોધવામાં આવ્યા છે; જે શબ્દના અર્થમાં તેમના વંશ, વાલી, વારસો, સક્સેસરો, એસાઈનીઓ, એડમિનિસ્ટ્રેટર્સ, એકઝીક્યુટર્સ ઇત્યાદિ તમામનો સમાવેશ થાય છે.)",
      ]),
    );
  });

  releasors.forEach((p, i) => {
    blocks.push(
      para([
        bold(
          releasors.length > 1
            ? `રીલીઝ કરી આપનાર (બીજા પક્ષ) ${toGujaratiDigits(i + 1)}: `
            : "રીલીઝ કરી આપનાર (બીજા પક્ષ): ",
        ),
        partyLine(p, "gu"),
        " (જેમને હવે પછી આ રીલીઝ લેખમાં ",
        bold("“રીલીઝ કરી આપનાર”"),
        " યાને “અમો” એ રીતે સંબોધવામાં આવ્યા છે; સમાન વ્યાપક અર્થ સાથે.)",
      ]),
    );
  });

  blocks.push(
    clause("(૧)", [
      `જત અમો બીજા પક્ષના આ રીલીઝનામાના લેખથી રીલીઝનો લેખ કરી આપી જણાવીએ છીએ કે, નીચે પરિશિષ્ટમાં જણાવેલ વિગત અને વર્ણનવાળી મિલકત બંને પક્ષોને ${c.t("acquisitionMode", "વારસાઈ હક્કે")} પ્રાપ્ત થયેલી છે અને આપણી સંયુક્ત માલિકી, કબજા-ભોગવટાની અને પ્રત્યક્ષ કબજાની છે. સદરહુ મિલકત આ અગાઉ અમો બીજા પક્ષનાઓએ કોઈને ગીરો, વેચાણ, રીલીઝ, વીલ, વહેંચણ વગેરેથી યા અન્ય હરકોઈ પ્રકારથી વ્યવસ્થા કરેલ નથી, અને તેની હરકોઈ પ્રકારે વ્યવસ્થા કરવાનો અમોને સંપૂર્ણ હક્ક અને અધિકાર છે.`,
    ]),
    clause("(૨)", [
      `તમો રીલીઝ કરાવી લેનાર અમારા સગા ${c.t("relationship")} થાઓ છો. અમોને વખતોવખત અમારી જિંદગીમાં, માંદગીમાં તેમજ અન્ય કામોમાં તમોએ વારંવાર મદદ કરેલી છે અને દેખભાળ કરેલ છે, તેમજ તમારા પ્રત્યે અમોને કુદરતી પ્રેમ અને સ્નેહની લાગણી છે. ઉપરોક્ત કારણોસર પરિશિષ્ટમાં જણાવેલ મિલકતમાંનો અમારો ${c.t("share", "તમામ")} હક્ક-હિસ્સો, તમામ પ્રકારના હક્કો સાથે, ${kindLabel} રીલીઝથી આપીએ છીએ.`,
    ]),
    withConsideration
      ? clause("(૩)", [
          bold("અવેજ: "),
          `આ રીલીઝ લેખ પેટે અમો રીલીઝ કરી આપનારે તમારી પાસેથી ${c.money("amount")} નો અવેજ સ્વીકારેલ છે, જે મળ્યાની આથી કબૂલાત તથા પહોંચ આપીએ છીએ.`,
        ])
      : clause("(૩)", [
          bold("અવેજ બાબત: "),
          "મજકૂર લેખ બિન અવેજી કરેલ હોઈ કોઈ નાણાકીય પહોંચ સ્વીકારેલ નથી, અને કોઈપણ જાતનો અવેજ લીધા સિવાય આ લેખ બિન અવેજી કરી આપેલ છે.",
        ]),
    clause("(૪)", [
      "સદરહુ તમોને રીલીઝ કરી આપેલ મિલકતના અંદરના તથા બહારના, લાગતા-વળગતા તમામ પ્રકારના હક્કો સહિત, ઊંચે આકાશ-નીચે પાતાળ સુધી, યાવત્ ચંદ્ર-દિવાકરૌ સુધીને માટે, કુલ અને સ્વતંત્ર રીતે રીલીઝ કરી આપેલ છે; અને રીલીઝ કરી આપેલી મિલકત અમારા પ્રત્યક્ષ માલિકી કબજા-ભોગવટામાંથી કાઢી, આજરોજ તમારા પ્રત્યક્ષ માલિકી ભોગવટામાં સુપરત કરી છે, જે તમોએ સ્વીકારી લીધી છે.",
    ]),
    clause("(૫)", [
      "સદરહુ મિલકત આ અગાઉ અમોએ કોઈને ગીરોમાં લખી આપેલ નથી કે એસાઈન કરેલ નથી; ઈન્કમ ટેક્ષ, સેલ ટેક્ષ કે કોઈ સરકારી / અર્ધ-સરકારી સંસ્થા કે બેંકના બોજામાં નથી; જમીન સંપાદનની કોઈ નોટિસ બજેલ નથી; કોઈનો ખોરાકી-પોષાકીનો હક્ક નથી; કોઈ પ્રકરણ ચાલુ નથી; અને કોઈ કોર્ટની ટાંચ, જપ્તી કે મનાઈ હુકમમાં ચાલી આવેલ નથી — જેથી ટાઈટલ ચોખ્ખાં અને માર્કેટેબલ છે તેની ખાતરી કરાવી આપીએ છીએ. ટાઈટલમાં કોઈ ખામી કે ન્યૂનતા જણાય તો તે અમો રીલીઝ કરી આપનારે દૂર કરી-કરાવી આપવાની રહેશે.",
    ]),
    clause("(૬)", [
      "સદરહુ મિલકત હાલમાં સરકારશ્રીના / પંચાયત દફતરે આપણા સંયુક્ત નામે ચાલે છે, તે તમો તમારા નામે માલિકી હક્કે રેકોર્ડ ઓફ રાઈટ્સ દફતરે દાખલ કરાવી શકો છો; અને તેમ કરતાં જ્યાં જરૂર જણાય ત્યાં અમારે જરૂરી જવાબો, કબૂલાતો, સહી-સાટાં, સંમતિ આપવા કે રૂબરૂ હાજર થવા બંધાયેલા છીએ — અગર આ લેખને જ અમારી કબૂલાત ગણી તમારા નામે દાખલ કરાવી લેવી.",
    ]),
    clause("(૭)", [
      "મિલકતનાં જમીન મહેસૂલ, શિક્ષણ ઉપકર, સિંચાઈ દર વગેરે લેણાં આજદિન સુધીનાં ભરપાઈ થયેલ છે; હવે પછીના તમામ વેરા તમો રીલીઝ કરાવી લેનારે ભરવાના રહેશે, અને અગાઉનું કાંઈ બાકી નીકળે તો તે અમારે ભરવાનું રહેશે.",
    ]),
    clause("(૮)", [
      "હવે પછી સદરહુ મિલકતની તમો વેચાણ, ગીરો, રીલીઝ, વીલ, વહેંચણ વગેરેથી યા તમારું દિલ ચાહે તે રીતે વ્યવસ્થા કરવા-કરાવવા માલિક મુખત્યાર છો; તેમજ મિલકતમાં અવર-જવર તથા માલ-સામાન, વાહનો લાવવા-લઈ જવાના પરાપૂર્વના રસ્તા તથા પાણી-નિકાલના હક્ક-હિત-સંબંધ સાથે આ રીલીઝ આપેલ છે.",
    ]),
    clause("(૯)", [
      "આ રીલીઝ લેખ અંગેનો દસ્તાવેજ ખર્ચ, સ્ટેમ્પ પેપર, નોંધણી ફી, વકીલ ફી વગેરે આનુષંગિક ખર્ચ તમો રીલીઝ કરાવી લેનારે ભોગવવાના છે.",
    ]),
  );

  if (c.has("extraClauses")) {
    blocks.push(clause("(૧૦)", [bold("વધારાની શરતો: "), c.t("extraClauses")]));
  }

  blocks.push(
    spacer(),
    schedule(propertyScheduleRows(values, "gu"), `-: ${kindLabel} કરેલી મિલકતની વિગત :-`),
    para([
      `એણી વિગતનો આ ${kindLabel} રીલીઝનો લેખ અમો બીજા પક્ષનાઓએ અમારી રાજીખુશીથી તથા અક્કલ હોંશિયારીમાં, વાંચી, વંચાવી, પરિણામ સમજીને, કોઈના કોઈપણ જાતના દાબ-દબાણ સિવાય, સ્વખુશીથી, બિનકેફ હાલતમાં તમોને લખી આપેલ છે; જે અમોને તથા અમારા તમામ વંશ, વાલી, વારસોને હરેક રીતે કબૂલ, મંજૂર અને બંધનકર્તા છે અને રહેશે.`,
    ]),
    signatures([
      ...releasors.map((p, i) => ({
        role:
          releasors.length > 1
            ? `રીલીઝ કરી આપનાર ${toGujaratiDigits(i + 1)}`
            : "રીલીઝ કરી આપનાર",
        name: p.t("name"),
      })),
      ...takers.map((p, i) => ({
        role:
          takers.length > 1
            ? `રીલીઝ કરાવી લેનાર ${toGujaratiDigits(i + 1)}`
            : "રીલીઝ કરાવી લેનાર",
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

export const releaseLekh: DocTemplate = {
  slug: "release-lekh",
  name: { gu: "રીલીઝ લેખ (હક કમી)", en: "Release / relinquishment deed" },
  shortName: { gu: "હક કમી", en: "Release deed" },
  category: "family",
  description: {
    gu: "વારસાઈ મિલકતમાંનો પોતાનો હિસ્સો સહ-વારસદારની તરફેણમાં છોડી આપતો લેખ — અવેજ સાથે કે અવેજ વગર, મોડેલ ડ્રાફ્ટ મુજબ.",
    en: "Releases one's share in inherited property in favour of a co-heir — with or without consideration, per the model drafts.",
  },
  stampNote: {
    gu: "કુટુંબના સભ્ય / સહ-વારસદારની તરફેણમાં બિન અવેજી રીલીઝ પર નિયત (નજીવી) સ્ટેમ્પ ડ્યુટી લાગે છે; અવેજ સાથે અથવા કુટુંબ બહાર હોય તો વેચાણ જેટલી ડ્યુટી લાગી શકે. વર્તમાન દર ખાતરી કરવો. રીલીઝ પછી ૭/૧૨ માં હક કમી નોંધ પડાવવી.",
    en: "A no-consideration release to a family member / co-heir attracts nominal fixed duty; with consideration or outside the family it can attract conveyance-level duty. Verify current rates. After release, get the haq-kami mutation entered in the 7/12.",
  },
  languages: ["gu"],
  sections: [
    {
      id: "basics",
      title: { gu: "લેખની વિગત", en: "Deed details" },
      fields: [
        { id: "deedDate", kind: "date", label: { gu: "તારીખ", en: "Date" }, required: true },
        {
          id: "consideration",
          kind: "select",
          label: { gu: "અવેજ લેવાનો છે?", en: "Any consideration?" },
          defaultValue: "no",
          options: [
            { value: "no", label: { gu: "ના — બિન અવેજી (કુટુંબમાં સામાન્ય)", en: "No — without consideration (usual in family)" } },
            { value: "yes", label: { gu: "હા — અવેજી", en: "Yes — with consideration" } },
          ],
        },
        {
          id: "amount",
          kind: "money",
          label: { gu: "અવેજની રકમ (અવેજી હોય તો)", en: "Consideration amount (if any)" },
        },
        {
          id: "relationship",
          kind: "text",
          label: { gu: "રીલીઝ લેનારનો સંબંધ", en: "Taker's relation to releasor" },
          placeholder: { gu: "દા.ત. ભાઈ / બહેન / માતા / પુત્ર", en: "e.g. brother / sister / mother / son" },
          required: true,
          gujarati: true,
        },
        {
          id: "acquisitionMode",
          kind: "text",
          label: { gu: "મિલકત કઈ રીતે મળી? (ખાલી = વારસાઈ હક્કે)", en: "How was the property acquired? (empty = by inheritance)" },
          placeholder: { gu: "દા.ત. વારસાઈ હક્કે / વડીલોપાર્જિત", en: "e.g. by inheritance / ancestral" },
          gujarati: true,
        },
        {
          id: "share",
          kind: "text",
          label: { gu: "છોડવાનો હિસ્સો (ખાલી = તમામ)", en: "Share released (empty = entire)" },
          placeholder: { gu: "દા.ત. ૧/૩ (ત્રીજા ભાગનો)", en: "e.g. 1/3rd" },
          gujarati: true,
        },
      ],
    },
    {
      id: "releasors",
      title: { gu: "રીલીઝ કરી આપનાર (હક છોડનાર)ની વિગત", en: "Releasor details" },
      fields: [
        partyGroup("releasors", { gu: "રીલીઝ કરી આપનાર", en: "Releasor" }, {
          withPan: true,
          withAadhaar: true,
          addLabel: { gu: "રીલીઝ કરી આપનાર ઉમેરો", en: "Add releasor" },
        }),
      ],
    },
    {
      id: "takers",
      title: { gu: "રીલીઝ કરાવી લેનારની વિગત", en: "Release taker details" },
      fields: [
        partyGroup("takers", { gu: "રીલીઝ કરાવી લેનાર", en: "Release taker" }, {
          withPan: true,
          withAadhaar: true,
          addLabel: { gu: "રીલીઝ કરાવી લેનાર ઉમેરો", en: "Add taker" },
        }),
      ],
    },
    propertySection({ titleOverride: { gu: "રીલીઝ કરવાની મિલકત", en: "Property being released" } }),
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
  build: (values) => ({
    lang: "gu",
    title: "રીલીઝ લેખ (હક કમી)",
    blocks: buildGu(values),
  }),
};
