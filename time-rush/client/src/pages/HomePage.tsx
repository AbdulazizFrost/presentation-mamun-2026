import { useState } from 'react';
import { normalizeRoomCode } from '@shared/protocol/validate';
import { useT } from '../i18n';
import '../styles/mobile.css';

/** Entry page: projector opens the host screen, phones enter a room code. */
export function HomePage() {
  const t = useT();
  const [code, setCode] = useState('');
  const valid = normalizeRoomCode(code);
  return (
    <main className="mobile home">
      <div className="mobile-brand">
        TIME<span>RUSH</span>
      </div>
      <p className="mobile-muted">{t.homeTagline}</p>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) window.location.href = `/join?room=${valid}`;
        }}
      >
        <label className="field-label" htmlFor="code">
          {t.roomCode}
        </label>
        <input
          id="code"
          className="input input-code mono"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={5}
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="ABCDE"
        />
        <button className="btn btn-primary btn-block" disabled={!valid}>
          {t.joinGame}
        </button>
      </form>
      <a className="home-host-link" href="/host">
        {t.openHost}
      </a>
    </main>
  );
}
