import React, { useId } from "react";

/* A woman's or a man's body, neck to knee, with the eight shot spots on it.
 * Drawn rather than photographed so it stays light and calm, in the site's
 * champagne tones. Each outline is half a body, mirrored about the centre,
 * smoothed into curves once when this file loads. Points are
 * [x from centre, y, corner?]. Left and right are the patient's own, so their
 * right side is on the left of the picture.
 */
const CX = 160;

const SHAPES = {
  female: {
    outline: [
      [14, 0, 1], [15, 14], [22, 24], [40, 31], [54, 36], [62, 46], [66, 62],
      [68, 92], [72, 126], [76, 146], [82, 176], [88, 210], [92, 226], [95, 246],
      [91, 266], [83, 270], [79, 252], [78, 234], [74, 210], [67, 178], [60, 148],
      [55, 118], [51, 90], [45, 72, 1],
      [46, 92], [43, 112], [39, 132], [38, 148], [42, 168], [54, 190], [64, 212],
      [67, 236], [64, 268], [57, 306], [49, 340], [46, 372, 1],
      [17, 372, 1], [14, 340], [11, 300], [7, 262], [2, 240],
    ],
    navel: 150,
    contours: ["M -12 30 Q -28 31 -44 36", "M 12 30 Q 28 31 44 36"],
    clothes: [
      "M -40 32 L -30 31 Q -24 62 0 74 Q 24 62 30 31 L 40 32 Q 48 60 50 92 L 46 124 Q 0 130 -46 124 L -50 92 Q -48 60 -40 32 Z",
      "M -56 194 Q 0 190 56 194 L 62 208 Q 32 214 6 240 Q 0 244 -6 240 Q -32 214 -62 208 Z",
    ],
    seams: ["M -42 98 Q -26 118 -3 110", "M 42 98 Q 26 118 3 110", "M -45 117 Q 0 124 45 117", "M -55 199 Q 0 195 55 199"],
    spots: {
      "arm-r": [-60, 100, 8, 18],
      "arm-l": [60, 100, 8, 18],
      "belly-ur": [-17, 137, 11, 9],
      "belly-ul": [17, 137, 11, 9],
      "belly-lr": [-17, 166, 11, 9],
      "belly-ll": [17, 166, 11, 9],
      "thigh-r": [-35, 286, 12, 24],
      "thigh-l": [35, 286, 12, 24],
    },
  },
  male: {
    outline: [
      [17, 0, 1], [18, 14], [28, 23], [52, 30], [72, 36], [82, 48], [86, 66],
      [87, 96], [90, 128], [94, 150], [100, 182], [104, 212], [108, 226], [110, 248],
      [105, 270], [96, 274], [92, 256], [92, 236], [87, 212], [80, 180], [73, 150],
      [69, 120], [65, 92], [57, 72, 1],
      [56, 94], [52, 118], [48, 140], [47, 160], [50, 186], [54, 210],
      [56, 236], [55, 270], [50, 306], [46, 340], [44, 372, 1],
      [17, 372, 1], [14, 340], [11, 300], [7, 262], [2, 240],
    ],
    navel: 156,
    contours: [
      "M -14 30 Q -32 32 -52 37", "M 14 30 Q 32 32 52 37",
      "M -50 82 Q -42 100 -24 102 Q -10 102 -3 94", "M 50 82 Q 42 100 24 102 Q 10 102 3 94",
    ],
    clothes: ["M -52 196 Q 0 190 52 196 L 56 244 Q 30 248 6 244 Q 0 238 -6 244 Q -30 248 -56 244 Z"],
    seams: ["M -51 202 Q 0 196 51 202", "M 0 214 L 0 238"],
    spots: {
      "arm-r": [-77, 102, 9, 19],
      "arm-l": [77, 102, 9, 19],
      "belly-ur": [-19, 142, 12, 9],
      "belly-ul": [19, 142, 12, 9],
      "belly-lr": [-19, 171, 12, 9],
      "belly-ll": [19, 171, 12, 9],
      "thigh-r": [-33, 296, 12, 24],
      "thigh-l": [33, 296, 12, 24],
    },
  },
};

/* Catmull-Rom through the points as cubic Beziers; a corner point gets no
   tangent, so the line turns sharply there. */
function smooth(pts) {
  const n = pts.length;
  const at = (i) => pts[(i + n) % n];
  const tan = (i) => {
    if (at(i)[2]) return [0, 0];
    const a = at(i - 1);
    const b = at(i + 1);
    return [(b[0] - a[0]) / 6, (b[1] - a[1]) / 6];
  };
  const f = (v) => Math.round(v * 10) / 10;
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p = at(i);
    const q = at(i + 1);
    const t1 = tan(i);
    const t2 = tan(i + 1);
    d += ` C ${f(p[0] + t1[0])} ${f(p[1] + t1[1])} ${f(q[0] - t2[0])} ${f(q[1] - t2[1])} ${f(q[0])} ${f(q[1])}`;
  }
  return `${d} Z`;
}

function bodyPath(half) {
  const left = half.map(([x, y, c]) => [CX - x, y, c]);
  const right = half
    .slice()
    .reverse()
    .map(([x, y, c]) => [CX + x, y, c]);
  // The crotch point sits on both halves; one copy is enough.
  return smooth(left.concat(right.slice(1)));
}

// Detail paths are written about the centre line; this moves them onto it.
const centred = (d) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (m, x, y) => `${Number(x) + CX} ${y}`);

const FIGURES = Object.fromEntries(
  Object.entries(SHAPES).map(([sex, s]) => [
    sex,
    {
      body: bodyPath(s.outline),
      navel: s.navel,
      contours: s.contours.map(centred),
      clothes: s.clothes.map(centred),
      seams: s.seams.map(centred),
      spots: s.spots,
    },
  ])
);

/**
 * picked: the spot chosen now. suggested: the one to rotate to. used: spots
 * from recent weeks. onPick makes the spots tappable; without it the map is a
 * picture.
 */
export default function BodyMap({ sex = "female", picked = null, suggested = null, used = [], onPick, labels, className = "" }) {
  // React's ids carry colons or guillemets, which url(#...) cannot take.
  const uid = `bm${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const fig = FIGURES[sex] || FIGURES.female;
  const ref = (name) => `url(#${uid}-${name})`;

  return (
    <svg viewBox="0 0 320 380" role={onPick ? "group" : "img"} aria-label="Body map, front view" className={className}>
      <defs>
        <linearGradient id={`${uid}-skin`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3e7d4" />
          <stop offset="1" stopColor="#ecdcc2" />
        </linearGradient>
        <linearGradient id={`${uid}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.05" stopColor="#fff" />
          <stop offset="0.86" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${uid}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="320" height="380">
          <rect width="320" height="380" fill={ref("fade")} />
        </mask>
        <clipPath id={`${uid}-clip`}>
          <path d={fig.body} />
        </clipPath>
        <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id={`${uid}-soft2`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <radialGradient id={`${uid}-halo`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f5ecdd" />
          <stop offset="0.7" stopColor="#f9f3ea" />
          <stop offset="1" stopColor="#fbf8f2" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-cloth`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d3c0a1" />
          <stop offset="1" stopColor="#c6b08d" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="0.5" cy="0.4" r="0.5">
          <stop offset="0" stopColor="#fffaf1" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fffaf1" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx={CX} cy="196" rx="150" ry="184" fill={ref("halo")} />
      <g mask={ref("mask")}>
        <path d={fig.body} fill={ref("skin")} />
        <g clipPath={ref("clip")}>
          {/* A soft dark edge inside the outline gives the body its roundness. */}
          <path d={fig.body} fill="none" stroke="#c7a87c" strokeWidth="22" opacity="0.55" filter={ref("soft")} />
          <ellipse cx={CX} cy="160" rx="60" ry="120" fill={ref("glow")} opacity="0.6" />
          {fig.clothes.map((d) => (
            <path key={d} d={d} fill={ref("cloth")} stroke="#b39a76" strokeWidth="0.9" />
          ))}
          <g fill="none" stroke="#a88d68" strokeWidth="1" opacity="0.7">
            {fig.seams.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          <g fill="none" stroke="#b8976a" strokeWidth="1.3" strokeLinecap="round" opacity="0.55" filter={ref("soft2")}>
            {fig.contours.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          <ellipse cx={CX} cy={fig.navel} rx="2.2" ry="3.2" fill="#b8976a" opacity="0.6" />
        </g>
        <path d={fig.body} fill="none" stroke="#cdb38e" strokeWidth="1" />
      </g>

      {Object.entries(fig.spots).map(([id, [x, y, rx, ry]]) => {
        const isPicked = id === picked;
        const isSuggested = id === suggested && !isPicked;
        const isUsed = used.includes(id) && !isPicked;
        const look = isPicked
          ? "fill-primary stroke-primary-deep"
          : isSuggested
            ? "fill-primary/15 stroke-primary motion-safe:animate-pulse"
            : isUsed
              ? "fill-muted/25 stroke-line-strong"
              : "fill-primary/15 stroke-primary/50";
        const shape = (
          <>
            <ellipse
              cx={CX + x}
              cy={y}
              rx={rx}
              ry={ry}
              className={`${look} transition-colors ${onPick ? "group-focus-visible:stroke-ink" : ""}`}
              strokeWidth={isSuggested ? 1.8 : 1.2}
              strokeDasharray={isSuggested ? "3.5 2.5" : undefined}
            />
            {/* Picking the suggested spot keeps its dashed ring, so the legend
                still reads true. */}
            {isPicked && id === suggested && (
              <ellipse cx={CX + x} cy={y} rx={rx + 3.5} ry={ry + 3.5} fill="none" className="stroke-primary" strokeWidth="1.5" strokeDasharray="3.5 2.5" />
            )}
          </>
        );
        if (!onPick) return <g key={id}>{shape}</g>;
        const label = labels?.[id] || id;
        return (
          <g
            key={id}
            role="button"
            tabIndex={0}
            aria-label={label}
            aria-pressed={isPicked}
            className="group cursor-pointer outline-none"
            onClick={() => onPick(id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPick(id);
              }
            }}
          >
            {/* A wider invisible ring, so a fingertip doesn't have to land
                exactly on a small spot. */}
            <ellipse cx={CX + x} cy={y} rx={rx + 4} ry={ry + 4} fill="transparent" />
            <title>{label}</title>
            {shape}
          </g>
        );
      })}
    </svg>
  );
}
