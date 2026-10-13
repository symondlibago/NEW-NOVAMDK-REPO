import { createContext, useContext } from "react";

/* The element a screen scrolls in when it isn't the window. The kiosk's product
   screen scrolls its own panel under the pinned QR, so scroll-linked motion in
   the site's sections has to watch that panel instead. */
export const ScrollRoot = createContext(null);

export const useScrollRoot = () => useContext(ScrollRoot) || undefined;
