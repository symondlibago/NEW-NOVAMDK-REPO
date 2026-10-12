import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";

/* The start button pinned to the foot of the screen on phones (client,
   2026-10-12, after agelessrx.com). On a phone the hero's own button sits
   below the fold, so this one shows from the top of the page; it steps aside
   while the hero button is on screen, so there are never two of it, and over
   the footer. Desktop keeps the hero button alone. */

export default function ProductStickyStart({ anchor, name, price, note, fromPrice, onStart, to, cta, loading }) {
  const [heroOn, setHeroOn] = React.useState(false);
  const [footerOn, setFooterOn] = React.useState(false);

  React.useEffect(() => {
    const watch = [];
    const hero = anchor?.current;
    if (hero) {
      const io = new IntersectionObserver(([e]) => setHeroOn(e.isIntersecting));
      io.observe(hero);
      watch.push(io);
    }
    const footer = document.querySelector("footer");
    if (footer) {
      const io = new IntersectionObserver(([e]) => setFooterOn(e.isIntersecting));
      io.observe(footer);
      watch.push(io);
    }
    return () => watch.forEach((io) => io.disconnect());
  }, [anchor]);

  const show = !heroOn && !footerOn;
  const btn =
    "group flex shrink-0 items-center gap-2 rounded-full bg-[#977e43] px-5 py-3 text-[0.95rem] font-semibold text-white transition-colors hover:bg-[#836c39] disabled:opacity-70";

  return (
    <div
      inert={!show}
      className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out md:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex items-center gap-3 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur-md nv-shadow-lg">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.82rem] font-semibold text-ink">{name}</p>
          <p className="truncate text-[0.8rem] text-muted">
            {fromPrice && "Starts at "}
            <span className="text-[0.95rem] font-extrabold text-ink">{price}</span>
            {note && ` · ${note}`}
          </p>
        </div>
        {to ? (
          <Link to={to} className={btn}>
            {cta} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        ) : (
          <button type="button" onClick={onStart} disabled={loading} className={btn}>
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Starting…</>
            ) : (
              <>{cta} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
