import { setLang, useLang, type Lang } from '../i18n';

const LANGS: { id: Lang; label: string }[] = [
  { id: 'uz', label: 'UZ' },
  { id: 'en', label: 'EN' },
];

/** UZ | EN toggle on the projector; `onChange` also sends the choice to the room. */
export function LangSwitch({ className = '', onChange = setLang }: { className?: string; onChange?: (lang: Lang) => void }) {
  const lang = useLang();
  return (
    <div className={`lang-switch ${className}`} role="group" aria-label="Language / Til">
      {LANGS.map((l) => (
        <button key={l.id} type="button" className={lang === l.id ? 'is-active' : ''} aria-pressed={lang === l.id} onClick={() => onChange(l.id)}>
          {l.label}
        </button>
      ))}
    </div>
  );
}
