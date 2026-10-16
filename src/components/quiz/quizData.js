/* The quiz behind /start, from the client's prototype (2026-10-11), with its
   wording moved to the safer side for LegitScript at the client's request:
   no outcome claims, nothing that reads as our own recommendation, and the
   provider's review named wherever a treatment is. Answers stay in the
   browser: nothing here is sent anywhere, and the result only picks which
   product page to show.

   Each screen names the one after it with next(answers). `step` is the
   sidebar stage it belongs to: 0 your goal, 1 a few questions, 2 the result. */

/* The products the quiz can land on. Names and format lines are the quiz's
   own; the price, photo and link come from the catalog by slug. */
export const PICKS = {
  sema: { name: "Semaglutide + Glycine + B12", form: "Weight management · weekly injection", slug: "semaglutide-glycine-b12-initial" },
  tirz: { name: "Tirzepatide + Glycine + B12", form: "Weight management · weekly injection", slug: "tirzepatide-glycine-b12-initial" },
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
      { v: "weight", t: "Managing my weight" },
      { v: "energy", t: "Energy and healthy aging" },
      { v: "sexual", t: "Sexual wellness and intimacy" },
      { v: "skin", t: "Brighter, more even-looking skin" },
      { v: "recovery", t: "Recovery and everyday balance" },
      { v: "notsure", t: "I’m not sure yet", hint: "We’ll help you narrow it down" },
    ],
    chip: (v) => GOAL_CHIP[v],
    next: (a) => (a.goal === "notsure" ? "vibe" : FIRST[a.goal]),
  },
  vibe: {
    step: 0, type: "single", h: "Which sounds most like you?",
    opts: [
      { v: "weight", t: "I want to feel lighter and more in control of my appetite" },
      { v: "energy", t: "I’m running on empty by mid-afternoon" },
      { v: "sexual", t: "I want more spark in my intimate life" },
      { v: "skin", t: "I want my skin to look brighter and more even" },
    ],
    next: (a) => FIRST[a.vibe],
  },

  w1: {
    step: 1, type: "single", h: "What’s your goal?",
    opts: [
      { v: "20", t: "Lose up to 20 lbs" },
      { v: "50", t: "Lose 20 to 50 lbs" },
      { v: "50+", t: "Lose 50 lbs or more" },
      { v: "maintain", t: "Maintain and feel stronger" },
    ],
    next: () => "w2",
  },
  w2: {
    step: 1, type: "multi", h: "What have you tried before?", sub: "Select all that apply.",
    opts: [
      { v: "diet", t: "Diet and exercise on my own" },
      { v: "apps", t: "Apps or programs like WW or Noom" },
      { v: "glp1", t: "A GLP-1 (semaglutide or tirzepatide)" },
      { v: "otherrx", t: "Another weight medication" },
      { v: "none", t: "Nothing yet", only: true },
    ],
    next: () => "w3",
  },
  w3: {
    step: 1, type: "multi", h: "What’s felt hardest?", sub: "Select all that apply.",
    opts: [
      { v: "cravings", t: "Cravings and constant food noise" },
      { v: "plateau", t: "Hitting a plateau" },
      { v: "consistency", t: "Staying consistent" },
      { v: "metabolism", t: "A metabolism that feels slower" },
    ],
    next: () => "wf",
  },
  wf: {
    step: 1, type: "note", eyebrow: "A note from Nova", h: "Weight is more than willpower.",
    p: "Appetite and fullness involve hormones such as GLP-1. Some prescription options act on these pathways, and a licensed provider can review whether one is appropriate for you.",
    fine: "A licensed provider decides what’s right for you. Individual results vary.",
    next: () => "result",
  },

  e1: {
    step: 1, type: "single", h: "What would feeling your best look like?",
    opts: [
      { v: "energy", t: "Steady energy and sharper focus" },
      { v: "sleep", t: "Better sleep and recovery" },
      { v: "aging", t: "Aging well, overall" },
      { v: "glow", t: "A healthy glow" },
    ],
    next: () => "e2",
  },
  e2: {
    step: 1, type: "single", h: "How do you feel about at-home injections?",
    opts: [
      { v: "yes", t: "I’m comfortable with them" },
      { v: "no", t: "I’d rather avoid needles" },
      { v: "open", t: "Open to my provider’s recommendation" },
    ],
    next: () => "ef",
  },
  ef: {
    step: 1, type: "note", eyebrow: "A note from Nova", h: "About NAD+",
    p: "NAD+ is a coenzyme found in every cell, and research suggests levels tend to decline with age.",
    fine: "A licensed provider decides what’s right for you. Individual results vary.",
    next: () => "result",
  },

  s0: {
    step: 1, type: "single", h: "What was your sex assigned at birth?",
    sub: "This helps us show the right options. Your provider confirms everything during your review.",
    opts: [{ v: "female", t: "Female" }, { v: "male", t: "Male" }],
    next: (a) => (a.s0 === "male" ? "sm1" : "sf1"),
  },
  sf1: {
    step: 1, type: "multi", h: "What would you like support with?", sub: "Select all that apply.",
    opts: [
      { v: "desire", t: "Desire and interest" },
      { v: "arousal", t: "Arousal and sensation" },
      { v: "comfort", t: "Comfort" },
      { v: "connection", t: "Confidence and connection" },
    ],
    next: () => "sf2",
  },
  sf2: {
    step: 1, type: "single", h: "Which format sounds best?",
    opts: [
      { v: "cream", t: "A topical cream" },
      { v: "nasal", t: "A nasal spray" },
      { v: "inj", t: "An at-home injection" },
      { v: "open", t: "Open to my provider’s recommendation" },
    ],
    next: () => "sff",
  },
  sff: {
    step: 1, type: "note", eyebrow: "A note from Nova", h: "You’re far from alone.",
    p: "Shifts in desire and comfort are common, especially through busy seasons and hormonal change. They deserve real, judgment-free care.",
    fine: "A licensed provider decides what’s right for you. Individual results vary.",
    next: () => "result",
  },
  sm1: {
    step: 1, type: "multi", h: "What are your goals?", sub: "Select all that apply.",
    opts: [
      { v: "reliable", t: "More reliable performance" },
      { v: "longer", t: "Lasting longer" },
      { v: "libido", t: "Stronger libido" },
      { v: "confidence", t: "More confidence in the moment" },
    ],
    next: () => "smf",
  },
  smf: {
    step: 1, type: "note", eyebrow: "A note from Nova", h: "Common, and worth addressing.",
    p: "Many men deal with this at some point. Care is private and provider-guided, and if a treatment is prescribed it ships in discreet packaging.",
    fine: "A licensed provider decides what’s right for you. Individual results vary.",
    next: () => "result",
  },

  k1: {
    step: 1, type: "single", h: "What’s your main skin focus?",
    opts: [
      { v: "spots", t: "Dark spots and uneven tone" },
      { v: "dull", t: "Dull, tired-looking skin" },
      { v: "glow", t: "A brighter overall glow" },
    ],
    next: () => "k2",
  },
  k2: {
    step: 1, type: "single", h: "Which kind of care do you prefer?",
    opts: [
      { v: "topical", t: "Something I apply to my skin" },
      { v: "inj", t: "Open to at-home injections" },
      { v: "open", t: "Open to my provider’s recommendation" },
    ],
    next: () => "kf",
  },
  kf: {
    step: 1, type: "note", eyebrow: "A note from Nova", h: "Prescription skincare, provider-guided.",
    p: "Prescription skincare is available only after a licensed provider reviews your skin goals and health history.",
    fine: "A licensed provider decides what’s right for you. Individual results vary.",
    next: () => "result",
  },

  r1: {
    step: 1, type: "multi", h: "What would you like to feel more of?", sub: "Select all that apply.",
    opts: [
      { v: "ease", t: "Ease in my body day to day" },
      { v: "recovery", t: "Better recovery after activity" },
      { v: "balance", t: "More balance overall" },
    ],
    next: () => "rf",
  },
  rf: {
    step: 1, type: "note", eyebrow: "A note from Nova", h: "About low-dose naltrexone",
    p: "Low-dose naltrexone (LDN) is naltrexone used at lower doses than its approved uses, which is considered off-label. A licensed provider reviews whether it may be appropriate for you.",
    fine: "A licensed provider decides what’s right for you. Individual results vary.",
    next: () => "result",
  },

  result: { step: 2, type: "result" },
};

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
    if (prior) why.push("You’ve used a GLP-1 before. A provider can review your history and current care.");
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
      lead = { cream: "euph", nasal: "bremn", inj: "bremi" }[a.sf2] || (desire ? "bremn" : "euph");
      alt = lead === "euph" ? "bremn" : "euph";
      why.push(desire ? "You put desire and interest on your list." : "You selected arousal, comfort or connection.");
      why.push({
        euph: "A topical cream you apply at home.",
        bremn: "A nasal spray, so there are no needles involved.",
        bremi: "An at-home injection, the format you chose.",
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
