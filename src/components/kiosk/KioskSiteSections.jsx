import React from "react";
import ProductMechanism from "../product/ProductMechanism";
import ProductWhy from "../product/ProductWhy";
import NadSupport from "../product/NadSupport";
import NadDirected from "../product/NadDirected";
import NadSublingual from "../product/NadSublingual";
import GlutathioneSections from "../product/GlutathioneSections";
import ScreamCreamSections from "../product/ScreamCreamSections";
import SermorelinSections from "../product/SermorelinSections";
import LdnSections from "../product/LdnSections";
import LuminanceSections from "../product/LuminanceSections";
import OlympusSections from "../product/OlympusSections";
import BremelanotideSections from "../product/BremelanotideSections";
import BremelanotideNasalSections from "../product/BremelanotideNasalSections";
import LipoCSections from "../product/LipoCSections";
import { productPath } from "../../lib/slug";

/* The treatment's own editorial from its product page, matched on the name
   exactly as ProductPage matches it. Keep the two in step. */
function Editorial({ product }) {
  const name = product.name;
  const startTo = `${productPath(product)}?start=1`;
  if (/nad\+/i.test(name)) {
    const sublingual = /sublingual/i.test(name);
    return (
      <>
        <NadSupport withCoenzyme={!sublingual} />
        {sublingual ? <NadSublingual /> : <NadDirected />}
      </>
    );
  }
  if (/glutathione/i.test(name)) return <GlutathioneSections startTo={startTo} />;
  if (/euphoria cream|scream cream/i.test(name)) return <ScreamCreamSections startTo={startTo} />;
  if (/sermorelin/i.test(name)) return <SermorelinSections startTo={startTo} />;
  if (/naltrexone/i.test(name)) return <LdnSections startTo={startTo} />;
  if (/luminance/i.test(name)) return <LuminanceSections startTo={startTo} />;
  if (name === "Olympus Peak") return <OlympusSections startTo={startTo} />;
  if (name === "Bremelanotide Injection") return <BremelanotideSections startTo={startTo} />;
  if (name === "Bremelanotide Nasal Spray") return <BremelanotideNasalSections startTo={startTo} />;
  if (/lipo-c/i.test(name)) return <LipoCSections startTo={startTo} />;
  return null;
}

/* The site sets these for a desktop read. Scaled up to sit with the kiosk's own
   type; the layout stays the desktop one, since breakpoints follow the screen. */
const SITE_ZOOM = 1.3;

/* The site's product sections as the website shows them. Their buttons and
   links would leave the kiosk for an intake on a shared screen, so a tap on
   any of them is caught here and handed to onLink instead. */
export default function KioskSiteSections({ product, onLink }) {
  const catchLinks = (e) => {
    if (!e.target.closest("a")) return;
    e.preventDefault();
    onLink();
  };
  return (
    <div onClickCapture={catchLinks} className="bg-bg" style={{ zoom: SITE_ZOOM }}>
      <Editorial product={product} />
      <ProductMechanism product={product} />
      {!product.otc && <ProductWhy />}
    </div>
  );
}
