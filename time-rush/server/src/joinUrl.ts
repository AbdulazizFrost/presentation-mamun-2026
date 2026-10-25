import { networkInterfaces } from 'node:os';

/** First non-internal IPv4 address of this machine, used for the development QR code. */
export function lanAddress(): string | null {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === 'IPv4' && !address.internal) return address.address;
    }
  }
  return null;
}

export interface JoinUrlOptions {
  publicUrl: string | undefined;
  /** Port the phones should open in development (the Vite dev server) or production (this server). */
  clientPort: number;
}

/**
 * Builds the phone join URL. A configured PUBLIC_URL wins; otherwise a LAN address is used and
 * flagged as non-public so the host screen can warn that only phones on the same network can join.
 */
export function createJoinUrlBuilder({ publicUrl, clientPort }: JoinUrlOptions) {
  const base = publicUrl?.trim().replace(/\/+$/, '');
  return (code: string): { url: string; isPublic: boolean } => {
    if (base) return { url: `${base}/join?room=${code}`, isPublic: true };
    const host = lanAddress() ?? 'localhost';
    return { url: `http://${host}:${clientPort}/join?room=${code}`, isPublic: false };
  };
}
