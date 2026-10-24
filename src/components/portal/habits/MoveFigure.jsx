import React from "react";
import { motion as Motion, useReducedMotion } from "framer-motion";

/* A drawn figure doing each Strength in 10 move, side on, looping between the
   start and end of the move. It stands in for a demo video until the clips are
   chosen (client, 2026-10-24), and stays as the fallback after. Each pose is a
   set of joints in a 200 by 150 space with the floor at 134; "f" joints are
   the far arm and leg, drawn fainter, for the one move where they differ. */
const POSES = {
  sitStand: {
    a: { head: [84, 45], sh: [78, 60], el: [93, 72], ha: [108, 74], hip: [66, 96], kn: [96, 97], an: [99, 131], to: [110, 133] },
    b: { head: [98, 13], sh: [97, 29], el: [117, 30], ha: [133, 30], hip: [97, 67], kn: [99, 97], an: [99, 131], to: [110, 133] },
    props: "chair",
  },
  wallPush: {
    a: { head: [138, 40], sh: [128, 53], el: [148, 54], ha: [164, 55], hip: [103, 82], kn: [84, 105], an: [62, 131], to: [72, 133] },
    b: { head: [150, 51], sh: [138, 63], el: [157, 69], ha: [164, 55], hip: [110, 88], kn: [87, 108], an: [62, 131], to: [72, 133] },
    props: "wall",
  },
  bridge: {
    a: { head: [34, 120], sh: [50, 126], el: [68, 129], ha: [84, 130], hip: [88, 126], kn: [110, 106], an: [133, 131], to: [143, 132] },
    b: { head: [34, 120], sh: [50, 126], el: [68, 129], ha: [84, 130], hip: [85, 110], kn: [114, 103], an: [133, 131], to: [143, 132] },
    props: "mat",
  },
  calfRaise: {
    a: { head: [95, 12], sh: [94, 29], el: [98, 49], ha: [112, 56], hip: [94, 67], kn: [95, 97], an: [95, 131], to: [106, 133] },
    b: { head: [96, 5], sh: [95, 22], el: [102, 41], ha: [112, 53], hip: [95, 60], kn: [96, 90], an: [97, 124], to: [106, 133] },
    props: "counter",
  },
  birdDog: {
    a: {
      head: [131, 94], sh: [116, 101], el: [116, 117], ha: [116, 134], hip: [78, 101], kn: [78, 131], an: [44, 131], to: [36, 133],
      fel: [116, 117], fha: [116, 134], fkn: [78, 131], fan: [44, 131], fto: [36, 133],
    },
    b: {
      head: [132, 92], sh: [116, 101], el: [116, 117], ha: [116, 134], hip: [78, 101], kn: [48, 100], an: [14, 99], to: [12, 108],
      fel: [136, 100], fha: [152, 99], fkn: [78, 131], fan: [44, 131], fto: [36, 133],
    },
    props: "mat",
  },
};

const NEAR = [["sh", "hip"], ["hip", "kn"], ["kn", "an"], ["an", "to"], ["sh", "el"], ["el", "ha"]];
const FAR = [["sh", "fel"], ["fel", "fha"], ["hip", "fkn"], ["fkn", "fan"], ["fan", "fto"]];

// Where each prop sits, so the frame below takes it in: x0, y0, x1, y1.
const PROP_BOX = { chair: [46, 58, 80, 133], wall: [168, 18, 168, 135], counter: [106, 58, 150, 133] };

/* Crops each move to its own figure and prop, widened to the box's shape
   (16:9 for the demo) with the floor kept at the bottom, so a lying move fills
   the frame as much as a standing one. */
function frameOf(p, ratio) {
  const pts = [...Object.values(p.a), ...Object.values(p.b)];
  const box = PROP_BOX[p.props] || [Infinity, Infinity, -Infinity, -Infinity];
  const x0 = Math.min(box[0], ...pts.map((q) => q[0] - 9)) - 8;
  const x1 = Math.max(box[2], ...pts.map((q) => q[0] + 9)) + 8;
  const y0 = Math.min(box[1], ...pts.map((q) => q[1] - 9)) - 8;
  const y1 = 142;
  const w = x1 - x0;
  const h = y1 - y0;
  if (w / h < ratio) return [x0 - (h * ratio - w) / 2, y0, h * ratio, h];
  return [x0, y1 - w / ratio, w, w / ratio];
}

function Props({ kind, frame }) {
  const [x, , w] = frame;
  return (
    <g className="text-line-strong" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none">
      <line x1={x + 4} y1="135" x2={x + w - 4} y2="135" />
      {kind === "chair" && <path d="M46 58 V133 M46 99 H80 M78 99 V133" />}
      {kind === "wall" && <line x1="168" y1="18" x2="168" y2="135" />}
      {kind === "counter" && <path d="M106 58 H150 M144 58 V133" />}
      {kind === "mat" && <line x1={x + 12} y1="138" x2={x + w - 12} y2="138" strokeWidth="2" opacity="0.6" />}
    </g>
  );
}

export default function MoveFigure({ pose, still = false, ratio = 16 / 9, className = "" }) {
  const reduce = useReducedMotion();
  const p = POSES[pose];
  if (!p) return null;
  const moving = !still && !reduce;
  // Out, hold, back, hold: about three seconds a rep.
  const motion = (key, i) => {
    const a = p.a[key][i];
    const b = p.b[key][i];
    return moving ? [a, b, b, a, a] : b;
  };
  const transition = moving ? { duration: 3, times: [0, 0.35, 0.55, 0.9, 1], ease: "easeInOut", repeat: Infinity } : { duration: 0 };
  const seg = ([from, to], key) => (
    <Motion.line
      key={key}
      initial={false}
      animate={{ x1: motion(from, 0), y1: motion(from, 1), x2: motion(to, 0), y2: motion(to, 1) }}
      transition={transition}
    />
  );

  const frame = frameOf(p, ratio);
  return (
    <svg viewBox={frame.join(" ")} className={className} aria-hidden="true">
      <Props kind={p.props} frame={frame} />
      <g className="text-primary" stroke="currentColor" strokeWidth="7" strokeLinecap="round" fill="none">
        {p.a.fel && <g opacity="0.4">{FAR.map((s) => seg(s, s.join("-")))}</g>}
        {NEAR.map((s) => seg(s, s.join("-")))}
        <Motion.circle r="9" fill="currentColor" stroke="none" initial={false} animate={{ cx: motion("head", 0), cy: motion("head", 1) }} transition={transition} />
      </g>
    </svg>
  );
}
