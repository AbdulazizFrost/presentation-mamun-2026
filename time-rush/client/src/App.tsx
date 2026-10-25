import { lazy, Suspense } from 'react';
import { useT } from './i18n';
import { HomePage } from './pages/HomePage';
import { JoinPage } from './pages/JoinPage';

// The projector page pulls in Three.js; loading it lazily keeps the phone bundle small.
const HostPage = lazy(() => import('./pages/HostPage').then((m) => ({ default: m.HostPage })));

/** Three pages, chosen by path; no router library needed. */
export function App() {
  const t = useT();
  const path = window.location.pathname.replace(/\/+$/, '');
  if (path === '/host') {
    return (
      <Suspense fallback={<div className="host-loading">{t.loading}</div>}>
        <HostPage />
      </Suspense>
    );
  }
  if (path === '/join') return <JoinPage />;
  return <HomePage />;
}
