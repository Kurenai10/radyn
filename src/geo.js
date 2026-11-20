'use strict';

/**
 * Uygulamanın açıldığı ülkeyi bulur.
 * 1) IP tabanlı konum servisleri (ülke kodu döner)
 * 2) Servisler yanıt vermezse işletim sisteminin bölge ayarı
 * Hiçbiri sonuç vermezse null döner.
 */

const USER_AGENT = 'Radyn/1.0';
const TIMEOUT_MS = 5000;

const SERVICES = [
  {
    url: 'https://ipapi.co/country/',
    read: async (res) => (await res.text()).trim(),
  },
  {
    url: 'https://ipwho.is/',
    read: async (res) => {
      const data = await res.json();
      return data && data.success ? data.country_code : '';
    },
  },
];

function validCode(value) {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

/**
 * @returns {Promise<{ code: string, source: 'ip' | 'locale' } | null>}
 */
async function detectCountryCode({ fetchImpl = globalThis.fetch, localeCountry = () => null } = {}) {
  for (const service of SERVICES) {
    try {
      const res = await fetchImpl(service.url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json, text/plain' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) continue;
      const code = validCode(await service.read(res));
      if (code) return { code, source: 'ip' };
    } catch {
      // bir sonraki servise geç
    }
  }

  const local = validCode(localeCountry());
  return local ? { code: local, source: 'locale' } : null;
}

module.exports = { detectCountryCode, validCode };
