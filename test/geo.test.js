'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { detectCountryCode, validCode } = require('../src/geo');

const textRes = (body, ok = true) => ({ ok, text: async () => body });
const jsonRes = (body, ok = true) => ({ ok, json: async () => body });

test('validCode: yalnızca iki harfli kodları kabul eder', () => {
  assert.equal(validCode(' tr '), 'TR');
  assert.equal(validCode('Rate limit exceeded'), null);
  assert.equal(validCode(''), null);
  assert.equal(validCode(undefined), null);
});

test('detectCountryCode: IP servisi ülke kodunu döner', async () => {
  const result = await detectCountryCode({
    fetchImpl: async () => textRes('TR\n'),
  });
  assert.deepEqual(result, { code: 'TR', source: 'ip' });
});

test('detectCountryCode: ilk servis hata verirse ikincisine geçer', async () => {
  const seen = [];
  const result = await detectCountryCode({
    fetchImpl: async (url) => {
      seen.push(url);
      if (url.includes('ipapi')) return textRes('RateLimited', false);
      return jsonRes({ success: true, country_code: 'DE' });
    },
  });
  assert.deepEqual(result, { code: 'DE', source: 'ip' });
  assert.equal(seen.length, 2);
});

test('detectCountryCode: anlamsız yanıt (ör. limit mesajı) geçersiz sayılır', async () => {
  const result = await detectCountryCode({
    fetchImpl: async (url) =>
      url.includes('ipapi') ? textRes('Rate limit exceeded. Subscribe to continue.') : jsonRes({ success: false }),
    localeCountry: () => 'FR',
  });
  assert.deepEqual(result, { code: 'FR', source: 'locale' });
});

test('detectCountryCode: ağ yoksa işletim sistemi bölgesine düşer', async () => {
  const result = await detectCountryCode({
    fetchImpl: async () => { throw new Error('ağ yok'); },
    localeCountry: () => 'TR',
  });
  assert.deepEqual(result, { code: 'TR', source: 'locale' });
});

test('detectCountryCode: hiçbir kaynak yoksa null', async () => {
  const result = await detectCountryCode({
    fetchImpl: async () => { throw new Error('ağ yok'); },
    localeCountry: () => '',
  });
  assert.equal(result, null);
});
