'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createArtFinder, looselyMatches } = require('../src/art');
const { createStore, MAX_RECENT } = require('../src/store');

test('looselyMatches: büyük/küçük harf, aksan ve kısmi eşleşme', () => {
  assert.equal(looselyMatches('Gülümse', 'gulumse'), true);
  assert.equal(looselyMatches('Shape of You', 'Shape of You - Remix'), true);
  assert.equal(looselyMatches('Adele', 'Metallica'), false);
  assert.equal(looselyMatches('', 'x'), false);
});

test('createArtFinder: eşleşen parçanın kapağını 600px olarak döndürür', async () => {
  const finder = createArtFinder({
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        results: [
          { trackName: 'Başka Şarkı', artistName: 'Başka', artworkUrl100: 'https://x/a/100x100bb.jpg' },
          { trackName: 'Kuzu Kuzu', artistName: 'Tarkan', collectionName: 'Single', artworkUrl100: 'https://x/t/100x100bb.jpg' },
        ],
      }),
    }),
  });
  const art = await finder.find({ artist: 'Tarkan', title: 'Kuzu Kuzu' });
  assert.equal(art.artUrl, 'https://x/t/600x600bb.jpg');
  assert.equal(art.album, 'Single');
});

test('createArtFinder: yanlış sanatçı eşleşirse kapak gösterilmez', async () => {
  const finder = createArtFinder({
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ results: [{ trackName: 'Kuzu Kuzu', artistName: 'Başkası', artworkUrl100: 'https://x/100x100bb.jpg' }] }),
    }),
  });
  assert.equal(await finder.find({ artist: 'Tarkan', title: 'Kuzu Kuzu' }), null);
});

test('createArtFinder: sonuç önbelleğe alınır, ağ hatası alınmaz', async () => {
  let calls = 0;
  const finder = createArtFinder({
    fetchImpl: async () => {
      calls++;
      return { ok: true, json: async () => ({ results: [{ trackName: 'A Song', artistName: 'B', artworkUrl100: 'https://x/100x100bb.jpg' }] }) };
    },
  });
  await finder.find({ artist: 'B', title: 'A Song' });
  await finder.find({ artist: 'B', title: 'A Song' });
  assert.equal(calls, 1);

  let failing = 0;
  const flaky = createArtFinder({
    fetchImpl: async () => { failing++; throw new Error('kapalı'); },
  });
  assert.equal(await flaky.find({ title: 'Song' }), null);
  assert.equal(await flaky.find({ title: 'Song' }), null);
  assert.equal(failing, 2, 'hata sonucu önbelleğe alınmamalı');
});

const sample = (n) => ({
  uuid: `uuid-${n}`,
  name: `Radyo ${n}`,
  url: `https://stream.test/${n}`,
  favicon: '',
  country: 'Türkiye',
  countryCode: 'TR',
  tags: [],
  codec: 'MP3',
  bitrate: 128,
  votes: 1,
  language: '',
});

test('store: favori aç/kapa, kalıcılık ve geri yükleme', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'radyo-test-'));
  const file = path.join(dir, 'veri.json');
  try {
    const store = createStore(file);
    assert.equal(store.toggleFavorite(sample(1)).length, 1);
    assert.equal(store.toggleFavorite(sample(2)).length, 2);
    assert.equal(store.toggleFavorite(sample(1)).length, 1);
    store.setSetting('volume', 0.42);
    store.flush();

    const reloaded = createStore(file);
    const all = reloaded.getAll();
    assert.deepEqual(all.favorites.map((f) => f.uuid), ['uuid-2']);
    assert.equal(all.settings.volume, 0.42);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('store: son dinlenenler tekrarsız ve en fazla MAX_RECENT kadar', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'radyo-test-'));
  try {
    const store = createStore(path.join(dir, 'veri.json'));
    for (let i = 0; i < MAX_RECENT + 5; i++) store.addRecent(sample(i));
    store.addRecent(sample(MAX_RECENT + 4)); // başa taşınmalı, tekrar etmemeli
    const recent = store.getAll().recent;
    assert.equal(recent.length, MAX_RECENT);
    assert.equal(recent[0].uuid, `uuid-${MAX_RECENT + 4}`);
    assert.equal(new Set(recent.map((r) => r.uuid)).size, MAX_RECENT);
    store.flush();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('store: bozuk veri dosyası uygulamayı çökertmez', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'radyo-test-'));
  try {
    const file = path.join(dir, 'veri.json');
    fs.writeFileSync(file, '{bozuk json', 'utf8');
    const store = createStore(file);
    assert.deepEqual(store.getAll().favorites, []);
    assert.equal(store.getAll().settings.volume, 0.8);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
