import { useEffect, useRef } from "react";
export default function KioskQr({ value, size = 168, onError }) {
  const canvasRef = useRef(null);

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { default: QRCode } = await import("qrcode");
        if (cancelled || !canvasRef.current) return;
        await QRCode.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 1,
          errorCorrectionLevel: "L",
          color: { dark: "#000000", light: "#ffffff" },
        });
      } catch (err) {
        if (!cancelled) onErrorRef.current?.(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  return <canvas ref={canvasRef} className="h-full w-full object-contain" role="img" aria-label="QR code to continue on your phone" />;
}
