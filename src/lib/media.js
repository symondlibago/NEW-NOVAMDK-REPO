const U = (id, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const MEDIA = {
  // Hero / lifestyle
  heroCalm: U("1544161515-4ab6ce6db874"),        // calm man, daylight
  lifeGolden: U("1517841905240-472988babdf9"),   // people, golden hour
  womanPortrait: U("1494790108377-be9c29b29330"),
  manPortrait: U("1535713875002-d1d0cf377fde"),
  community: U("1529156069898-49953e39b3ac"),     // group together
  // Care / clinical
  doctor: U("1612349317150-e413f6a5b16d"),
  consult: U("1576091160399-112ba8d25d1d"),       // clinical/lab
  telehealth: U("1573496359142-b8d87734a5a2"),    // woman on laptop
  // Outcomes
  fitness: U("1571019613454-1cb2f99b2d8b"),
  skincare: U("1556228578-8c89e6adf883"),
  sleep: U("1541781774459-bb2af2f05b55"),
  nutrition: U("1490645935967-10de6ba17061"),
  // Texture / detail
  supplements: U("1607990281513-2c110a25bd8c"),
  serum: U("1620916566398-39f1143ab7be"),
  marble: U("1615873968403-89e068629265", 1200),
};

// Themed gradient fallback (uses live palette tokens).
export const FALLBACK_GRADIENT =
  "linear-gradient(135deg, var(--nv-primary) 0%, var(--nv-primary-deep) 100%)";
