import { addWeeks } from "date-fns";
import { weekStart } from "./habits";

/* Two-minute weekly lessons (client, 2026-10-22, after WW and Noom). One
 * opens each week, counted from the first check-in or the first lesson read.
 *
 * General wellness only: no doses, no promises, nothing that reads as medical
 * advice. Anything about treatment goes to the care team through Messages.
 * Titles are how "read" is remembered, so an old title must not change. */
export const LESSONS = [
  {
    title: "Small steps add up",
    cards: [
      "Big changes are hard to keep. Small ones stick, and they add up week after week.",
      "Pick one habit at a time, and make it easy enough to do on a busy day.",
      "Tie it to something you already do, like a glass of water with your morning coffee.",
    ],
    tryThis: "Choose one small goal on this page and keep it all week.",
  },
  {
    title: "Make water easy",
    cards: [
      "Water helps you feel your best through the day, and thirst can feel a lot like hunger.",
      "Keep a bottle where you can see it: your desk, your car, your bag.",
      "Have a glass with each meal. Add lemon, cucumber or berries if plain water feels boring.",
    ],
    tryThis: "Fill a bottle each morning and finish it by lunch.",
  },
  {
    title: "Start with protein",
    cards: [
      "Protein helps you feel full, and it helps you keep the muscle you have.",
      "Eat the protein on your plate first. Easy picks: eggs, Greek yogurt, cottage cheese, chicken, fish, beans and tofu.",
      "Your care team can tell you what amount is right for you.",
    ],
    tryThis: "Add one protein to breakfast every day this week.",
  },
  {
    title: "Short walks count",
    cards: [
      "You don't need a gym. A walk is one of the easiest ways to move more.",
      "Ten minutes after a meal is a great start. Add a few minutes when it feels easy.",
      "The same time each day turns it into a routine. Bring a friend, a podcast or the dog.",
    ],
    tryThis: "Take a 10-minute walk after dinner on three days this week.",
  },
  {
    title: "Keep your strength",
    cards: [
      "Muscle matters at every age. It helps with balance, posture and everyday tasks.",
      "Two short sessions a week is a good start, and Strength in 10 needs no equipment.",
      "Go slowly and stop if something hurts. Check with your care team before anything new and strenuous.",
    ],
    tryThis: "Do two Strength in 10 sessions this week.",
  },
  {
    title: "A steady bedtime",
    cards: [
      "Sleep shapes your energy, your mood and your appetite the next day.",
      "Aim for the same bedtime most nights, weekends too.",
      "Dim screens 30 minutes before bed, and keep the bedroom cool and dark.",
    ],
    tryThis: "Pick a lights-out time and keep it on weeknights.",
  },
  {
    title: "Slow down at meals",
    cards: [
      "It takes a little while to notice you're full. Eating slowly gives your body that time.",
      "Sit down to eat, put your fork down between bites, and leave the phone in another room.",
      "Stop when you feel comfortably full. A smaller plate makes a portion look generous.",
    ],
    tryThis: "Make one meal a day a screen-free meal.",
  },
  {
    title: "Plan your week",
    cards: [
      "A little planning makes the healthy choice the easy one.",
      "Shop with a list, and prep two or three simple meals on the weekend.",
      "Keep a snack with protein on hand for busy afternoons.",
    ],
    tryThis: "Write down three dinners for next week before you shop.",
  },
  {
    title: "Eating out made simple",
    cards: [
      "You can enjoy a meal out and still keep your habits.",
      "Look at the menu before you go. Choose a protein, add vegetables, and ask for sauces on the side.",
      "Eat slowly and take home what you don't finish. There's no need to clear the plate.",
    ],
    tryThis: "Next time you eat out, pick your meal before you arrive.",
  },
  {
    title: "Handling cravings",
    cards: [
      "Cravings come in waves, and waves pass.",
      "Pause and ask yourself: am I hungry, thirsty, tired or bored? Water or a short walk can help.",
      "If you still want the treat, have a small portion, sit down and enjoy it.",
    ],
    tryThis: "When a craving hits, drink a glass of water and wait 10 minutes.",
  },
  {
    title: "When progress slows",
    cards: [
      "Progress isn't a straight line. The scale goes up and down from day to day.",
      "Look at the trend over a few weeks, and at the other wins: energy, sleep, how your clothes fit.",
      "Keep up the habits that are working. Questions about your treatment? Message your care team.",
    ],
    tryThis: "Write down three wins from this month that aren't on the scale.",
  },
  {
    title: "Be kind to yourself",
    cards: [
      "One off day doesn't undo a good week.",
      "Notice what got in the way, without judging it. Stress, a long day, a bad night's sleep?",
      "Start again at the next meal, and talk to yourself the way you'd talk to a friend.",
    ],
    tryThis: "At the end of each day, name one thing that went well.",
  },
];

const weeksApart = (a, b) => Math.round((weekStart(b) - weekStart(a)) / (7 * 864e5));

/** Which lessons are open this week, which one to offer, and when the next
 *  one opens. Week keys sort as text, so the smallest is the earliest. */
export function lessonState(data, thisWeek) {
  const firstCheckin = Object.keys(data.weeks || {}).sort()[0];
  const start = [data.lessonStart, firstCheckin, thisWeek].filter(Boolean).sort()[0];
  const unlocked = Math.min(LESSONS.length, weeksApart(start, thisWeek) + 1);
  const read = new Set(data.read || []);
  const open = LESSONS.slice(0, unlocked);
  const current = open.find((l) => !read.has(l.title)) || open[open.length - 1];
  return {
    start,
    unlocked,
    read,
    current,
    number: LESSONS.indexOf(current) + 1,
    opensOn: (i) => addWeeks(weekStart(start), i),
  };
}
