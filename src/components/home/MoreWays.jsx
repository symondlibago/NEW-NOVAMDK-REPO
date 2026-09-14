import React from "react";
import Reveal from "../ui/Reveal";

/**
 * "More Ways To Care For You" — the band under how-it-works (2026-09-11).
 *
 * Three glass cards orbit a phone mockup. The middle station is the promoted
 * one: bigger and fully opaque, with the two flanking it held back. The cards
 * are handed a new station each tick and CSS transitions carry them between
 * the stations, the same mechanism the goals ring uses, so nothing is animated
 * per card and the cycle can never drift out of order.
 */

/*
|--------------------------------------------------------------------------
| GLASS
|--------------------------------------------------------------------------
| Off the Figma layers (Frame 23 and Frame 24 carry the same recipe, so the
| middle card's prominence is size and opacity, not a different material):
|
|   Fill    FFFFFF 12%
|   Stroke  linear gradient, inside, 0.5
|   Effect  inner shadow  0 -2  blur 4  #000000 20%
|   Effect  inner shadow  0  2  blur 4  #FFFFFF 40%
|   Effect  glass: light -45 / 80%, refraction 75, depth 1,
|           dispersion 35, frost 10, splay 0
*/
const CARD = {
  background: "rgba(255,255,255,0.12)",
  /* Frost 10 of 100. Read literally as 10px it turned the promoted card into
     an opaque white slab over the phone screen; the comp keeps the screen
     legible through it. */
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  boxShadow:
    "inset 0 2px 4px rgba(255,255,255,0.40), inset 0 -2px 4px rgba(0,0,0,0.20)",
};

/* The 0.5px stroke, as a gradient ramped along the -45 light. */
const RIM = {
  padding: "0.5px",
  background:
    "linear-gradient(145deg, rgba(255,255,255,0.90) 0%, rgba(255,255,255,0.34) 40%, rgba(255,255,255,0.24) 66%, rgba(255,255,255,0.70) 100%)",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude",
};

/* D9D9D9 at 0% down to DFB578, straight off the fill panel. The top stop is
   fully transparent, so the band grows out of the page rather than starting on
   an edge.
   The bloom in front of it is the light the mockup was shot on, rebuilt in CSS
   and sampled from the original file (#fbe5c1 by the phone, falling to #dabb8b
   at the frame edge). It used to arrive baked into the image, which meant the
   image had to be big enough to carry it and its edges showed as a pasted
   rectangle over the gradient. As a radial it covers the whole band and there
   is no edge to hide, so the phone can be cropped to just the phone. */
/* 2026-09-15: the copy went white at the client's request, and white type
   cannot sit on the comp's original ground, which started fully transparent
   (so, on the now-white page, white) and bloomed to near-white behind the
   heading. The band is tan from its top edge instead, and the bloom is pulled
   down behind the phone and toned back so it lifts the mockup without
   washing out the cards in front of it. */
const GROUND = [
  "radial-gradient(38% 44% at 50% 58%, rgba(255,246,226,0.5) 0%, rgba(255,240,210,0.2) 52%, rgba(255,240,210,0) 80%)",
  "linear-gradient(180deg, #cfac78 0%, #dab47b 55%, #c89d60 100%)",
].join(", ");

const HEADING = "#ffffff";
const TITLE = "#ffffff";
const BODY = "rgba(255,255,255,0.9)";
/* A low warm shade under the white, just enough to hold its edge where the
   bloom is brightest. */
const SHADE = "0 1px 14px rgba(90,62,24,0.3)";

const SLOT_MS = 4000;
const FADE_MS = 320;
const GLIDE = "900ms cubic-bezier(0.22,1,0.36,1)";

/* Three stations across the stage. Every card is the same size in the markup
   and the flanking pair is scaled down rather than given its own dimensions:
   animating width and height instead reflows the copy mid-flight, which reads
   as the cards resizing rather than moving. 0.86 lands the sides on the comp's
   356x172 against the middle's 408x200. */
/* Flank opacity went 0.58 to 0.72 with the white copy (2026-09-15): white at
   58% over tan read as a smudge rather than as text held back. */
const WIDE = [
  { left: "14.4%", scale: 0.86, opacity: 0.72, z: 10 },
  { left: "50%", scale: 1, opacity: 1, z: 20 },
  { left: "85.6%", scale: 0.86, opacity: 0.72, z: 10 },
];

/* A phone cannot hold three of these side by side, so the flanking stations
   move off stage and it becomes one card at a time. */
const NARROW = [
  { left: "-45%", scale: 0.86, opacity: 0, z: 10 },
  { left: "50%", scale: 1, opacity: 1, z: 20 },
  { left: "145%", scale: 0.86, opacity: 0, z: 10 },
];

const CARDS = [
  {
    top: "Licensed provider",
    bottom: "oversight",
    body: "Your medical information is reviewed by a licensed healthcare provider, who determines whether treatment is medically appropriate",
  },
  {
    top: "Care That Continues",
    body: "Access follow-up guidance and support as your treatment plan continues",
  },
  {
    top: "More ways to focus",
    bottom: "on your health",
    body: "Explore treatment options across weight management, longevity, skin health, sexual wellness, recovery, and more",
  },
];

function useWide() {
  const [wide, setWide] = React.useState(true);

  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const read = () => setWide(mq.matches);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);

  return wide;
}

function GlassCard({ card, style }) {
  return (
    <article
      className="absolute top-[70%] flex h-56 w-[86vw] max-w-116 flex-col justify-center rounded-3xl px-8 py-7 lg:h-60 lg:max-w-124 [@media(max-height:820px)]:lg:h-52"
      style={{ ...CARD, ...style }}
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-3xl" style={RIM} />

      <h3
        className="relative font-display text-[clamp(1.6rem,2.2vw,2rem)] font-bold leading-[1.2]"
        style={{ color: TITLE, textShadow: SHADE }}
      >
        {card.top}
        {card.bottom && (
          <>
            <br />
            {card.bottom}
          </>
        )}
      </h3>
      <p className="relative mt-3 text-[1.02rem] leading-relaxed" style={{ color: BODY, textShadow: SHADE }}>
        {card.body}
      </p>
    </article>
  );
}

export default function MoreWays() {
  /* `hidden` is the card that has to go from the right-hand station back to
     the left-hand one this tick. Left to slide, it crosses the entire stage
     and ploughs through the other two, which reads as a collision rather than
     a rotation. So it fades out where it is, teleports while invisible, and
     fades back in on the left. The other two always move one station and slide
     normally. */
  const [{ step, hidden }, setPhase] = React.useState({ step: 0, hidden: -1 });
  const wide = useWide();
  const stations = wide ? WIDE : NARROW;

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const timers = [];

    const tick = () => {
      setPhase((s) => ({ ...s, hidden: (3 - ((s.step + 1) % 3)) % 3 }));
      timers.push(
        window.setTimeout(() => {
          setPhase((s) => ({ ...s, step: s.step + 1 }));
          timers.push(window.setTimeout(() => setPhase((s) => ({ ...s, hidden: -1 })), 60));
        }, FADE_MS)
      );
    };

    const iv = setInterval(tick, SLOT_MS);
    return () => {
      clearInterval(iv);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    /* From md the band fills one screen under the sticky header (68px bar
       plus its 1px rule) and the stage takes whatever the heading leaves. */
    <section
      className="relative w-full overflow-hidden md:flex md:min-h-[calc(100svh-69px)] md:flex-col"
      style={{ background: GROUND }}
    >
      <div className="mx-auto flex w-full max-w-330 flex-col px-5 pb-[clamp(1.5rem,3vw,2.5rem)] pt-[clamp(2rem,4vw,3rem)] md:flex-1 md:px-10">
        <Reveal className="text-center">
          <span
            className="text-[0.8rem] font-semibold uppercase tracking-[0.2em]"
            style={{ color: BODY, textShadow: SHADE }}
          >
            Why NovaMDK
          </span>
          {/* 64/62 with 1px of tracking in the file. */}
          <h2
            className="nv-weight-keep mt-4 font-display text-[clamp(2.2rem,4.8vw,4.4rem)] font-extrabold leading-[0.97] tracking-[0.01em]"
            style={{ color: HEADING, textShadow: SHADE }}
          >
            <span className="block">More Ways To</span>
            <span className="block">Care For You</span>
          </h2>
        </Reveal>

        {/* ---- the stage. The phone is the backdrop the glass has to frost,
                so it sits behind and fades out where the cards take over.
                A floor keeps it from collapsing on a short window. ---- */}
        <div className="relative mt-[clamp(1rem,2.5vw,2rem)] h-[clamp(360px,34vw,480px)] md:h-auto md:min-h-96 md:flex-1">
          {/* Only a vertical fade now. With the backdrop out of the file there
              are no side edges left to hide, so the phone runs at the comp's
              367 rather than being sized to carry its own glow. */}
          <img
            src="/site/phone.avif"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute left-1/2 top-0 w-[clamp(250px,30vw,440px)] max-w-none -translate-x-1/2"
            style={{
              WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 24%, transparent 42%)",
              maskImage: "linear-gradient(180deg, #000 0%, #000 24%, transparent 42%)",
            }}
          />

          {CARDS.map((card, i) => {
            const s = stations[(i + step) % stations.length];
            const out = i === hidden;
            return (
              <GlassCard
                key={card.top}
                card={card}
                style={{
                  left: s.left,
                  opacity: out ? 0 : s.opacity,
                  zIndex: s.z,
                  transform: `translate(-50%, -50%) scale(${s.scale})`,
                  /* While hidden it gets no position transition at all, so the
                     jump across the stage happens in one frame, unseen. */
                  transition: out
                    ? `opacity ${FADE_MS}ms ease`
                    : `left ${GLIDE}, transform ${GLIDE}, opacity 600ms ease`,
                }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
