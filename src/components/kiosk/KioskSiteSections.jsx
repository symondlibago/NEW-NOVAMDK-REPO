import React from "react";
import ProductMechanism from "../product/ProductMechanism";
import ProductWhy from "../product/ProductWhy";
import NadSections from "../product/NadSections";
import GlutathioneSections from "../product/GlutathioneSections";
import ScreamCreamSections from "../product/ScreamCreamSections";
import SermorelinSections from "../product/SermorelinSections";
import LdnSections from "../product/LdnSections";
import LuminanceSections from "../product/LuminanceSections";
import OlympusSections from "../product/OlympusSections";
import BremelanotideSections from "../product/BremelanotideSections";
import BremelanotideNasalSections from "../product/BremelanotideNasalSections";
import LipoCSections from "../product/LipoCSections";
import TirzepatideSections from "../product/TirzepatideSections";
import SubMagnaSections from "../product/SubMagnaSections";
import { productPath } from "../../lib/slug";
import { ScrollRoot } from "../../lib/scrollRoot";

/* The treatment's own editorial from its product page, matched on the name
   exactly as ProductPage matches it. Keep the two in step. */
function Editorial({ product }) {
  const name = product.name;
  const props = { product, startTo: `${productPath(product)}?start=1` };
  if (/nad\+/i.test(name)) return <NadSections {...props} format={/sublingual/i.test(name) ? "sublingual" : "injection"} />;
  if (/glutathione/i.test(name)) return <GlutathioneSections {...props} />;
  if (/euphoria cream|scream cream/i.test(name)) return <ScreamCreamSections {...props} />;
  if (/sermorelin/i.test(name)) return <SermorelinSections {...props} />;
  if (/naltrexone/i.test(name)) return <LdnSections {...props} />;
  if (/luminance/i.test(name)) return <LuminanceSections {...props} />;
  if (name === "Olympus Peak") return <OlympusSections {...props} />;
  if (name === "Bremelanotide Injection") return <BremelanotideSections {...props} />;
  if (name === "Bremelanotide Nasal Spray") return <BremelanotideNasalSections {...props} />;
  if (/lipo-c/i.test(name)) return <LipoCSections {...props} />;
  if (/^tirzepatide\//i.test(name)) return <TirzepatideSections {...props} />;
  if (/submagna/i.test(name)) return <SubMagnaSections {...props} />;
  return null;
}

/* The site sets these for a desktop read. Scaled up to sit with the kiosk's own
   type; the layout stays the desktop one, since breakpoints follow the screen. */
const SITE_ZOOM = 1.3;

/* The site's product sections as the website shows them. Their buttons and
   links would leave the kiosk for an intake on a shared screen, so a tap on
   any of them is caught here and handed to onLink instead. scrollRoot is the
   panel they scroll in, for the sections whose motion follows the scroll. */
export default function KioskSiteSections({ product, onLink, scrollRoot }) {
  const catchLinks = (e) => {
    if (!e.target.closest("a")) return;
    e.preventDefault();
    onLink();
  };
  return (
    <ScrollRoot.Provider value={scrollRoot}>
      <div onClickCapture={catchLinks} className="bg-bg" style={{ zoom: SITE_ZOOM }}>
        <ProductMechanism product={product} />
        <Editorial product={product} />
        {!product.otc && <ProductWhy />}
      </div>
    </ScrollRoot.Provider>
  );
}
