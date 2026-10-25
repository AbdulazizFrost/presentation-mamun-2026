import { useEffect, useState } from 'react';
import { useT } from '../../i18n';

/** Toggles fullscreen for the projector page (also with the F key). */
export function toggleFullscreen(): void {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen().catch(() => undefined);
}

export function FullscreenButton() {
  const t = useT();
  const [full, setFull] = useState(() => document.fullscreenElement !== null);
  useEffect(() => {
    const update = () => setFull(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);
  const label = full ? t.exitFullscreen : t.fullscreen;
  return (
    <button type="button" className="sound-btn" onClick={toggleFullscreen} aria-label={label} title={`${label} (F)`}>
      {full ? '🗗' : '⛶'}
    </button>
  );
}
