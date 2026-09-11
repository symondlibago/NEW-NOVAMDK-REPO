import { useEffect } from "react";
import { getLenis } from "./smoothScroll";

export default function useLockBodyScroll() {
  useEffect(() => {
    const lenis = getLenis();
    lenis?.stop();

    const y = window.scrollY;
    const { position, top, left, right, width } = document.body.style;
    Object.assign(document.body.style, {
      position: "fixed",
      top: `-${y}px`,
      left: "0",
      right: "0",
      width: "100%",
    });

    return () => {
      Object.assign(document.body.style, { position, top, left, right, width });
      window.scrollTo(0, y);
      lenis?.start();
    };
  }, []);
}
