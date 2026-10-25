import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** Generates a real QR code (data URL) for the join link. */
export function useQrCode(text: string | null): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!text) return;
    let cancelled = false;
    QRCode.toDataURL(text, { margin: 1, width: 560, errorCorrectionLevel: 'M', color: { dark: '#0b1020', light: '#ffffff' } })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch((error: unknown) => {
        console.error('QR code generation failed', error);
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [text]);
  return dataUrl;
}
