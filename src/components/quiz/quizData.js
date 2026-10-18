import {
  Scale, Zap, Heart, Sparkles, Leaf, Compass, TrendingDown, Target, Mountain, Dumbbell, Salad,
  Smartphone, Syringe, Pill, CircleSlash, Utensils, Gauge, Repeat, Flame, Moon, Hourglass, Sun,
  Droplet, Stethoscope, Venus, Mars, Flower2, HeartHandshake, Smile, Wind, Hand, BadgeCheck,
  Footprints, Activity,
} from "lucide-react";
import { availableInState, isBlockedState } from "../../lib/serviceArea";

/* The quiz behind /start, from the client's prototype (2026-10-11), with its
   wording moved to the safer side for LegitScript at the client's request:
   no outcome claims, nothing that reads as our own recommendation, and the
   provider's review named wherever a treatment is. Answers stay in the
   browser: nothing here is sent anywhere, and the result only picks which
   product page to show.

   Each screen names the one after it with next(answers). `step` is the
   stage it belongs to: 0 your goal, 1 a few questions, 2 the result.

   Restyled after Noom and Hers (client, 2026-10-16): every option carries an
   icon, the last question is the state they live in, and a short matching
   screen comes before the result. The state only filters which treatments
   the result can show; like every answer, it stays in the browser. */

/* The products the quiz can land on. Names and format lines are the quiz's
   own; the price, photo and link come from the catalog by slug. */
export const PICKS = {
  sema: { name: "Semaglutide + Glycine + B12", form: "Weight management · weekly injection", slug: "semaglutide-glycine-b12-initial" },
  tirz: { name: "Tirzepatide + Glycine + B12", form: "Weight management · weekly injection", slug: "tirzepatide-glycine-b12-initial" },
  drops: { name: "Semaglutide Sublingual Drops", form: "Weight management · drops under the tongue", slug: "semaglutide-sublingual-drops" },
  nadinj: { name: "NAD+ Injection", form: "Longevity · at-home injection", slug: "nad-injection" },
  nadsl: { name: "NAD+ Sublingual Tablet", form: "Longevity · dissolves under the tongue", slug: "nad-sublingual-tablet" },
  serm: { name: "Sermorelin Nasal Spray", form: "Longevity · nasal spray", slug: "sermorelin-nasal-spray" },
  gluta: { name: "Glutathione Injection", form: "Skin health · at-home injection", slug: "glutathione-injection" },
  lumi: { name: "Luminance Brightening Cream", form: "Skin health · prescription topical", slug: "luminance-brightening-cream" },
  ldn: { name: "Low-Dose Naltrexone (LDN)", form: "Recovery and wellness · oral", slug: "low-dose-naltrexone-ldn-starter" },
  euph: { name: "Euphoria Cream O", form: "Sexual health · topical cream · for women", slug: "euphoria-cream-o" },
  olym: { name: "Olympus Peak", form: "Sexual health · sublingual tablet", slug: "olympus-peak" },
  bremi: { name: "Bremelanotide Injection", form: "Sexual health · at-home injection", slug: "bremelanotide-injection" },
  bremn: { name: "Bremelanotide Nasal Spray", form: "Sexual health · nasal spray", slug: "bremelanotide-nasal-spray" },
};

/* "Not sure" answers one more question, and that answer decides the path. */
export const pathOf = (a) => (a.goal === "notsure" ? a.vibe : a.goal);

const FIRST = { weight: "w1", energy: "e1", sexual: "s0", skin: "k1", recovery: "r1" };

/* /start/<slug> links from the menu and category pages skip the goal question. */
export const GOAL_FOR_SLUG = { "weight-loss": "weight", longevity: "energy", intimacy: "sexual", skin: "skin", recovery: "recovery" };
export const firstScreenFor = (goal) => FIRST[goal];

/* Sent with the quiz events: the category only, never an answer. */
export const CATEGORY_OF = { weight: "weight-loss", energy: "longevity", sexual: "sexual-health", skin: "skin-health", recovery: "recovery-wellness" };

const GOAL_CHIP = { weight: "Weight", energy: "Energy and aging", sexual: "Sexual wellness", skin: "Skin", recovery: "Recovery", notsure: "Exploring" };

export const SCREENS = {
  goal: {
    step: 0, type: "single", eyebrow: "Find a starting point", h: "What would you like help with?",
    sub: "Pick the one that matters most right now. It takes about a minute.",
    opts: [
      { v: "weight", t: "Managing my weight", icon: Scale },
      { v: "energy", t: "Energy and healthy aging", icon: Zap },
      { v: "sexual", t: "Sexual wellness and intimacy", icon: Heart },
      { v: "skin", t: "Brighter, more even-looking skin", icon: Sparkles },
      { v: "recovery", t: "Recovery and everyday balance", icon: Leaf },
      { v: "notsure", t: "I’m not sure yet", hint: "We’ll help you narrow it down", icon: Compass },
    ],
    chip: (v) => GOAL_CHIP[v],
    next: (a) => (a.goal === "notsure" ? "vibe" : FIRST[a.goal]),
  },
  vibe: {
    step: 0, type: "single", h: "Which sounds most like you?",
    opts: [
      { v: "weight", t: "I want to feel lighter and more in control of my appetite", icon: Scale },
      { v: "energy", t: "I’m running on empty by mid-afternoon", icon: Zap },
      { v: "sexual", t: "I want more spark in my intimate life", icon: Heart },
      { v: "skin", t: "I want my skin to look brighter and more even", icon: Sparkles },
    ],
    next: (a) => FIRST[a.vibe],
  },

  w1: {
    step: 1, type: "single", h: "What’s your goal?",
    opts: [
      { v: "20", t: "Lose up to 20 lbs", icon: TrendingDown },
      { v: "50", t: "Lose 20 to 50 lbs", icon: Target },
      { v: "50+", t: "Lose 50 lbs or more", icon: Mountain },
      { v: "maintain", t: "Maintain and feel stronger", icon: Dumbbell },
    ],
    next: () => "w2",
  },
  w2: {
    step: 1, type: "multi", h: "What have you tried before?", sub: "Select all that apply.",
    opts: [
      { v: "diet", t: "Diet and exercise on my own", icon: Salad },
      { v: "apps", t: "Apps or programs like WW or Noom", icon: Smartphone },
      { v: "glp1", t: "A GLP-1 (semaglutide or tirzepatide)", icon: Syringe },
      { v: "otherrx", t: "Another weight medication", icon: Pill },
      { v: "none", t: "Nothing yet", only: true, icon: CircleSlash },
    ],
    next: () => "w3",
  },
  w3: {
    step: 1, type: "multi", h: "What’s felt hardest?", sub: "Select all that apply.",
    opts: [
      { v: "cravings", t: "Cravings and constant food noise", icon: Utensils },
      { v: "plateau", t: "Hitting a plateau", icon: Gauge },
      { v: "consistency", t: "Staying consistent", icon: Repeat },
      { v: "metabolism", t: "A metabolism that feels slower", icon: Flame },
    ],
    next: () => "w4",
  },
  /* Asked so a needle-free answer can land on the drops, which have their own
     card on the weight loss page now (client, 2026-10-16). */
  w4: {
    step: 1, type: "single", h: "How do you feel about a weekly injection?",
    opts: [
      { v: "yes", t: "I’m comfortable with it", icon: Syringe },
      { v: "no", t: "I’d rather avoid needles", icon: Droplet },
      { v: "open", t: "Open to my provider’s recommendation", icon: Stethoscope },
    ],
    next: () => "state",
  },
  wf: {
    step: 1, type: "note", icon: Scale, h: "Weight is more than willpower.",
    p: "Appetite and fullness involve hormones such as GLP-1. Some prescription options act on these pathways, and a licensed provider can review whether one is appropriate for you.",
    fine: "A licensed provider decides what’s right for you. Individual results vary.",
    next: () => "matching",
  },

  e1: {
    step: 1, type: "single", h: "What would feeling your best look like?",
    opts: [
      { v: "energy", t: "Steady energy and sharper focus", icon: Zap },
      { v: "sleep", t: "Better sleep and recovery", icon: Moon },
      { v: "aging", t: "Aging well, overall", icon: Hourglass },
      { v: "glow", t: "A healthy glow", icon: Sun },
    ],
    next: () => "e2",
  },
  e2: {
    step: 1, type: "single", h: "How do you feel about at-home injections?",
    opts: [
      { v: "yes", t: "I’m comfortable with them", icon: Syringe },
      { v: "no", t: "I’d rather avoid needles", icon: Pill },
      { v: "open", t: "Open to my provider’s recommendation", icon: Stethoscope },
    ],
    next: () => "state",
  },
  ef: {
    step: 1, type: "note", icon: Zap, h: "About NAD+",
    p: "NAD+ is a coenzyme found in every cell, and research suggests levels tend to decline with age.",
    fine: "A licensed provider decides what’s right for you. Individual results vary.",
    next: () => "matching",
  },

  s0: {
    step: 1, type: "single", h: "What was your sex assigned at birth?",
    sub: "This helps us show the right options. Your provider confirms everything during your review.",
    opts: [{ v: "female", t: "Female", icon: Venus }, { v: "male", t: "Male", icon: Mars }],
    next: (a) => (a.s0 === "male" ? "sm1" : "sf1"),
  },
  sf1: {
    step: 1, type: "multi", h: "What would you like support with?", sub: "Select all that apply.",
    opts: [
      { v: "desire", t: "Desire and interest", icon: Heart },
      { v: "arousal", t: "Arousal and sensation", icon: Flower2 },
      { v: "comfort", t: "Comfort", icon: Smile },
      { v: "connection", t: "Confidence and connection", icon: HeartHandshake },
    ],
    next: () => "sf2",
  },
  sf2: {
    step: 1, type: "single", h: "Which format sounds best?",
    opts: [
      { v: "cream", t: "A topical cream", icon: Hand },
      { v: "nasal", t: "A nasal spray", icon: Wind },
      { v: "tablet", t: "A tablet that dissolves under the tongue", icon: Pill },
      { v: "inj", t: "An at-home injection", icon: Syringe },
      { v: "open", t: "Open to my provider’s recommendation", icon: Stethoscope },
    ],
    next: () => "state",
  },
  sff: {
    step: 1, type: "note", icon: HeartHandshake, h: "You’re far from alone.",
    p: "Shifts in desire and comfort are common, especially through busy seasons and hormonal change. They deserve real, judgment-free care.",
    fine: "A licensed provider decides what’s right for you. Individual results vary.",
    next: () => "matching",
  },
  sm1: {
    step: 1, type: "multi", h: "What are your goals?", sub: "Select all that apply.",
    opts: [
      { v: "reliable", t: "More reliable performance", icon: BadgeCheck },
      { v: "longer", t: "Lasting longer", icon: Hourglass },
      { v: "libido", t: "Stronger libido", icon: Flame },
      { v: "confidence", t: "More confidence in the moment", icon: Smile },
    ],
    next: () => "state",
  },
  smf: {
    step: 1, type: "note", icon: HeartHandshake, h: "Common, and worth addressing.",
    p: "Many men deal with this at some point. Care is private and provider-guided, and if a treatment is prescribed it ships in discreet packaging.",
    fine: "A licensed provider decides what’s right for you. Individual results vary.",
    next: () => "matching",
  },

  k1: {
    step: 1, type: "single", h: "What’s your main skin focus?",
    opts: [
      { v: "spots", t: "Dark spots and uneven tone", icon: Target },
      { v: "dull", t: "Dull, tired-looking skin", icon: Moon },
      { v: "glow", t: "A brighter overall glow", icon: Sun },
    ],
    next: () => "k2",
  },
  k2: {
    step: 1, type: "single", h: "Which kind of care do you prefer?",
    opts: [
      { v: "topical", t: "Something I apply to my skin", icon: Hand },
      { v: "inj", t: "Open to at-home injections", icon: Syringe },
      { v: "open", t: "Open to my provider’s recommendation", icon: Stethoscope },
    ],
    next: () => "state",
  },
  kf: {
    step: 1, type: "note", icon: Sparkles, h: "Prescription skincare, provider-guided.",
    p: "Prescription skincare is available only after a licensed provider reviews your skin goals and health history.",
    fine: "A licensed provider decides what’s right for you. Individual results vary.",
    next: () => "matching",
  },

  r1: {
    step: 1, type: "multi", h: "What would you like to feel more of?", sub: "Select all that apply.",
    opts: [
      { v: "ease", t: "Ease in my body day to day", icon: Footprints },
      { v: "recovery", t: "Better recovery after activity", icon: Activity },
      { v: "balance", t: "More balance overall", icon: Leaf },
    ],
    next: () => "state",
  },
  rf: {
    step: 1, type: "note", icon: Leaf, h: "About low-dose naltrexone",
    p: "Low-dose naltrexone (LDN) is naltrexone used at lower doses than its approved uses, which is considered off-label. A licensed provider reviews whether it may be appropriate for you.",
    fine: "A licensed provider decides what’s right for you. Individual results vary.",
    next: () => "matching",
  },

  /* Last question on every path. A state Nova MDK doesn't serve goes
     straight to the result, which says so. */
  state: {
    step: 1, type: "state", h: "Last one: which state do you live in?",
    sub: "Treatments can only ship to some states, so this keeps your options accurate.",
    next: (a) => (isBlockedState(a.state) ? "result" : NOTE_FOR[pathOf(a)](a)),
  },
  /* A beat before the result, after Noom: a ring fills while three lines tick.
     It moves on by itself. */
  matching: { step: 2, type: "matching", h: "Finding your starting point", next: () => "result" },
  result: { step: 2, type: "result" },
};

const NOTE_FOR = {
  weight: () => "wf",
  energy: () => "ef",
  sexual: (a) => (a.s0 === "male" ? "smf" : "sff"),
  skin: () => "kf",
  recovery: () => "rf",
};

/* Screens left from `key` to the result, for the progress bar. Unanswered
   questions are walked as if their first option were picked, which is close
   enough: paths differ by a screen at most. */
export function stepsLeft(key, answers) {
  let n = 0;
  let k = key;
  const a = { ...answers };
  while (k && k !== "result" && n < 20) {
    const s = SCREENS[k];
    if (a[k] == null && s.opts) a[k] = s.type === "multi" ? [s.opts[0].v] : s.opts[0].v;
    if (k === "state" && !a.state) a.state = "Texas";
    k = s.next(a);
    n += 1;
  }
  return n;
}

/* The prototype's matching rules: a lead option, a second one to look at,
   and lines under the lead that say which answers led there. The lines repeat
   what the person chose and describe the format; they make no claim about
   what a treatment will do. */
export function match(a) {
  const p = pathOf(a);
  const has = (key, v) => (a[key] || []).includes(v);
  let lead, alt;
  const why = [];
  if (p === "weight") {
    const big = a.w1 === "50+";
    const prior = has("w2", "glp1");
    [lead, alt] = big || prior ? ["tirz", "sema"] : ["sema", "tirz"];
    if (a.w4 === "no") {
      [lead, alt] = ["drops", "sema"];
      why.push("You’d rather avoid needles. These are drops taken under the tongue.");
    } else if (prior) why.push("You’ve used a GLP-1 before. A provider can review your history and current care.");
    else if (big) why.push("You chose a larger weight goal. A provider reviews whether this option is appropriate for you.");
    else why.push("A provider-guided option for weight management. If prescribed, your provider sets and adjusts your plan.");
    if (has("w3", "cravings")) why.push("You mentioned cravings. Your provider can explain how this option works and whether it fits you.");
    else if (has("w3", "plateau")) why.push("You mentioned a plateau. A provider can review whether a prescription option fits your plan.");
  } else if (p === "energy") {
    const noNeedle = a.e2 === "no";
    if (a.e1 === "sleep") {
      lead = "serm";
      alt = noNeedle ? "nadsl" : "nadinj";
      why.push("You put sleep and recovery first.", "A nasal spray, so there are no needles involved.");
    } else if (a.e1 === "glow") {
      lead = noNeedle ? "lumi" : "gluta";
      alt = noNeedle ? "gluta" : "lumi";
      why.push("You chose a healthy glow as your focus.");
    } else {
      lead = noNeedle ? "nadsl" : "nadinj";
      alt = noNeedle ? "serm" : "nadsl";
      why.push(a.e1 === "energy" ? "You chose steady energy and focus as your goal." : "You chose healthy aging as your focus.");
      if (noNeedle) why.push("A tablet that dissolves under the tongue, since you’d rather avoid needles.");
    }
  } else if (p === "sexual") {
    if (a.s0 === "male") {
      lead = "olym";
      alt = "bremn";
      why.push("You selected performance and confidence goals.", "A tablet that dissolves under the tongue. If prescribed, it ships discreetly.");
    } else {
      const desire = has("sf1", "desire");
      lead = { cream: "euph", nasal: "bremn", tablet: "olym", inj: "bremi" }[a.sf2] || (desire ? "bremn" : "euph");
      alt = lead === "euph" ? "bremn" : "euph";
      why.push(desire ? "You put desire and interest on your list." : "You selected arousal, comfort or connection.");
      why.push({
        euph: "A topical cream you apply at home.",
        bremn: "A nasal spray, so there are no needles involved.",
        bremi: "An at-home injection, the format you chose.",
        olym: "A tablet that dissolves under the tongue. If prescribed, it ships discreetly.",
      }[lead]);
    }
  } else if (p === "skin") {
    const topical = a.k2 === "topical" || (a.k1 === "spots" && a.k2 !== "inj");
    [lead, alt] = topical ? ["lumi", "gluta"] : ["gluta", "lumi"];
    why.push(a.k1 === "spots" ? "You’re focused on dark spots and uneven tone." : "You chose a brighter, more even look as your focus.");
    why.push(topical ? "A prescription cream you apply at home." : "An at-home injection, since you’re open to one.");
  } else {
    lead = "ldn";
    alt = "nadsl";
    why.push("You chose everyday ease and balance as your focus.", "A provider reviews whether LDN may be appropriate for you.");
  }
  return { lead, alt, why };
}

/* Every pick a path can land on, in the order to fall back through. */
const PATH_PICKS = {
  weight: ["sema", "tirz", "drops"],
  energy: ["nadinj", "nadsl", "serm", "gluta", "lumi"],
  sexual: ["euph", "bremn", "olym", "bremi"],
  skin: ["lumi", "gluta"],
  recovery: ["ldn", "nadsl"],
};

/* match(), kept to what ships to the state they gave (the same rule the
   sign-up and the server check, src/lib/serviceArea). When the matched
   option can't go there, the next one that can takes its place and the
   first line says why. `product` looks a pick up in the catalog. */
export function choose(a, product) {
  const m = match(a);
  const ok = (key) => {
    const p = product(key);
    return Boolean(p) && (!a.state || availableInState(a.state, p.id));
  };
  const order = [m.lead, m.alt, ...(PATH_PICKS[pathOf(a)] || [])].filter((k, i, all) => all.indexOf(k) === i);
  const shipping = order.filter(ok);
  const lead = shipping[0] || null;
  const alt = shipping.find((k) => k !== lead) || null;
  if (!lead || lead === m.lead) return { lead, alt, why: m.why };
  return {
    lead,
    alt,
    why: [`${PICKS[m.lead].name} isn’t available in ${a.state}, so this is an option that is.`, "A provider reviews whether it may be appropriate for you."],
  };
}
