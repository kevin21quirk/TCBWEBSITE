export type Geo = {
  country: string | null;
  region: string | null;
  city: string | null;
  isp: string | null;
};

const PRIVATE_IP = /^(::1|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|fc|fd|fe80|unknown$)/i;

/** Best-effort IP geolocation via ipwho.is (free, no key). Never throws. */
export async function lookupGeo(ip: string): Promise<Geo> {
  if (PRIVATE_IP.test(ip)) {
    return { country: "Local network", region: null, city: null, isp: null };
  }
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    const d = await res.json();
    if (!d?.success) {
      return { country: null, region: null, city: null, isp: null };
    }
    return {
      country: d.country ?? null,
      region: d.region ?? null,
      city: d.city ?? null,
      isp: d.connection?.isp ?? d.connection?.org ?? null,
    };
  } catch {
    return { country: null, region: null, city: null, isp: null };
  }
}

/** Rough device/browser/OS summary from a user-agent string. */
export function describeUA(ua: string | null): {
  device: string;
  browser: string;
  os: string;
} {
  const s = ua ?? "";
  const browser = /edg(e|a|ios)?\//i.test(s)
    ? "Edge"
    : /opr\/|opera/i.test(s)
      ? "Opera"
      : /chrome\/|crios\//i.test(s)
        ? "Chrome"
        : /firefox\/|fxios\//i.test(s)
          ? "Firefox"
          : /safari\//i.test(s)
            ? "Safari"
            : "Other";
  const os = /windows/i.test(s)
    ? "Windows"
    : /android/i.test(s)
      ? "Android"
      : /iphone|ipad|ipod/i.test(s)
        ? "iOS"
        : /mac os|macintosh/i.test(s)
          ? "macOS"
          : /linux/i.test(s)
            ? "Linux"
            : "Other";
  const device = /ipad|tablet/i.test(s)
    ? "Tablet"
    : /mobi|iphone|android/i.test(s)
      ? "Mobile"
      : "Desktop";
  return { device, browser, os };
}
