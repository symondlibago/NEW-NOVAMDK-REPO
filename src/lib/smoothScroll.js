let _lenis = null;

export const setLenis = (l) => { _lenis = l; };
export const getLenis = () => _lenis;

/** Smooth-scroll to an element id, clearing the sticky header. */
export const scrollToId = (id, offset = -84) => {
  const sel = String(id).startsWith("#") ? id : `#${id}`;
  const el = typeof document !== "undefined" ? document.querySelector(sel) : null;
  if (!el) return;
  if (_lenis) _lenis.scrollTo(el, { offset });
  else el.scrollIntoView({ behavior: "smooth", block: "start" });
};
