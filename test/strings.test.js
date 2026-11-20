'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { STRINGS, SUPPORTED_LANGS, resolveLang, translate } = require('../src/strings');

test('her desteklenen dilde aynı anahtarlar tanımlı (İngilizce referans)', () => {
  const reference = Object.keys(STRINGS.en).sort();
  for (const lang of SUPPORTED_LANGS) {
    const keys = Object.keys(STRINGS[lang]).sort();
    assert.deepEqual(keys, reference, `${lang} anahtarları eksik ya da fazla`);
  }
});

test('resolveLang: sistem dilinden desteklenen dil, yoksa İngilizce', () => {
  assert.equal(resolveLang('de-DE'), 'de');
  assert.equal(resolveLang('TR'), 'tr');
  assert.equal(resolveLang('ja-JP'), 'en');
  assert.equal(resolveLang(''), 'en');
  assert.equal(resolveLang(undefined), 'en');
});

test('translate: değişkenler doldurulur, eksik anahtar İngilizceye düşer', () => {
  assert.equal(translate('tr', 'home_label', { name: 'Türkiye' }), 'Konumunuz: Türkiye');
  assert.equal(translate('fr', 'count_stations', { n: 3 }), '3 stations');
  assert.equal(translate('xx', 'play'), 'Play');
  assert.equal(translate('de', 'anahtar_yok'), 'anahtar_yok');
});
