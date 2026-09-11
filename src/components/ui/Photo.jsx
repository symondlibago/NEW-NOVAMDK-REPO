import React, { useState } from "react";
import { FALLBACK_GRADIENT } from "../../lib/media";

/**
 * Resilient image. Renders the CDN photo; on load failure it reveals a themed
 * gradient so the layout never shows a broken-image glyph.
 */
export default function Photo({
  src,
  alt = "",
  className = "",
  imgClassName = "",
  position = "center",
  loading = "lazy",
}) {
  const [err, setErr] = useState(false);
  return (
    <div
      className={`relative overflow-hidden bg-surface-2 ${className}`}
      style={err ? { backgroundImage: FALLBACK_GRADIENT } : undefined}
    >
      {!err && (
        <img
          src={src}
          alt={alt}
          loading={loading}
          onError={() => setErr(true)}
          style={{ objectPosition: position }}
          className={`w-full h-full object-cover ${imgClassName}`}
        />
      )}
    </div>
  );
}
