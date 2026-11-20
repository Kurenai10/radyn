'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRadioApi, normalizeStation, sanitizeStation, USER_AGENT } = require('../src/radio-api');

const rawStation = {
  stationuuid: 'abc-123',
  name: '  Virgin Radio Türkiye ',
  url: 'http://example.com/pls',
  url_resolved: 'http://stream.example.com/live',
  favicon: 'https://img.example.com/icon.png',
  country: 'Türkiye',
  countrycode: 'TR',
  tags: 'pop, rock,,',
  codec: 'MP3',
  bitrate: 128,
  votes: 20801,
  language: 'turkish',
};

test('normalizeStation: çözümlenmiş URL tercih edilir, etiketler ayrılır', () => {
  const s = normalizeStation(rawStation);
  assert.equal(s.uuid, 'abc-123');
  assert.equal(s.name, 'Virgin Radio Türkiye');
  assert.equal(s.url, 'http://stream.example.com/live');
  assert.deepEqual(s.tags, ['pop', 'rock']);
  assert.equal(s.bitrate, 128);
});

test('normalizeStation: geçersiz kayıtlar elenir', () => {
  assert.equal(normalizeStation(null), null);
  assert.equal(normalizeStation({ stationuuid: 'x', url: 'ftp://nope' }), null);
  assert.equal(normalizeStation({ url: 'http://a.b/c' }), null);
});

test('sanitizeStation: http dışı favicon boşaltılır, isim varsayılanı', () => {
  const s = sanitizeStation({ uuid: 'u1', url: 'https://a.b/s', favicon: 'javascript:alert(1)', name: '' });
  assert.equal(s.favicon, '');
  assert.equal(s.name, 'İsimsiz istasyon');
});

test('createRadioApi: ilk sunucu hata verirse sıradakine geçer ve User-Agent gönderir', async () => {
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push({ url, ua: opts.headers['User-Agent'] });
    if (url.startsWith('https://de1')) throw new Error('bağlantı reddedildi');
    return { ok: true, json: async () => [rawStation] };
  };
  const api = createRadioApi({ fetchImpl, mirrors: ['https://de1.test', 'https://nl1.test'] });
  const list = await api.stationsFor({ type: 'top' });

  assert.equal(list.length, 1);
  assert.equal(calls[0].url.startsWith('https://de1.test'), true);
  assert.equal(calls[1].url.startsWith('https://nl1.test'), true);
  assert.equal(calls[1].ua, USER_AGENT);
});

test('createRadioApi: tüm sunucular düşerse anlaşılır hata verir', async () => {
  const api = createRadioApi({
    fetchImpl: async () => { throw new Error('ağ yok'); },
    mirrors: ['https://a.test'],
  });
  await assert.rejects(api.stationsFor({ type: 'top' }), /ulaşılamadı.*ağ yok/);
});

test('stationsFor: ülke isteği doğru uç noktayı ve parametreleri kullanır', async () => {
  let requested = '';
  const api = createRadioApi({
    fetchImpl: async (url) => { requested = url; return { ok: true, json: async () => [] }; },
    mirrors: ['https://m.test'],
  });
  await api.stationsFor({ type: 'country', value: 'tr' });
  assert.match(requested, /\/json\/stations\/bycountrycodeexact\/TR\?/);
  assert.match(requested, /hidebroken=true/);
  assert.match(requested, /order=votes/);
});

test('stationsFor: geçersiz girdiler reddedilir', async () => {
  const api = createRadioApi({ fetchImpl: async () => ({ ok: true, json: async () => [] }), mirrors: ['https://m.test'] });
  await assert.rejects(api.stationsFor({ type: 'country', value: 'TURKEY' }), /ülke kodu/);
  await assert.rejects(api.stationsFor({ type: 'search', value: '   ' }), /boş/);
  await assert.rejects(api.stationsFor({ type: 'drop-tables' }), /kategori/);
});

test('countries: boş ülkeler elenir, Türkçe ad ve sayıya göre sıralanır', async () => {
  const api = createRadioApi({
    fetchImpl: async () => ({
      ok: true,
      json: async () => [
        { name: 'Turkey', iso_3166_1: 'TR', stationcount: 900 },
        { name: 'Andorra', iso_3166_1: 'AD', stationcount: 5 },
        { name: 'Empty', iso_3166_1: 'ZZ', stationcount: 0 },
      ],
    }),
    mirrors: ['https://m.test'],
  });
  const list = await api.countries();
  assert.equal(list.length, 2);
  assert.equal(list.find((c) => c.code === 'TR').name, 'Türkiye');
  assert.equal(list.find((c) => c.code === 'AD').name, 'Andorra');
});

test('stationList: aynı uuid tekrar etmez', async () => {
  const api = createRadioApi({
    fetchImpl: async () => ({ ok: true, json: async () => [rawStation, rawStation] }),
    mirrors: ['https://m.test'],
  });
  const list = await api.stationsFor({ type: 'tag', value: 'jazz' });
  assert.equal(list.length, 1);
});
