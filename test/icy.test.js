'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { IcyParser, parseStreamTitle, splitArtistTitle, openIcyMetadata } = require('../src/icy');

/** Bir ICY bloğu üretir: ses parçası + uzunluk baytı + metadata (16'nın katına tamamlanır). */
function metaBlock(text) {
  if (!text) return Buffer.from([0]);
  const padded = Buffer.alloc(Math.ceil(text.length / 16) * 16);
  Buffer.from(text, 'utf8').copy(padded);
  return Buffer.concat([Buffer.from([padded.length / 16]), padded]);
}

test('parseStreamTitle: standart, tek tırnaklı ve StreamUrl sonrası biçimleri', () => {
  assert.equal(parseStreamTitle("StreamTitle='Tarkan - Kuzu Kuzu';StreamUrl='';"), 'Tarkan - Kuzu Kuzu');
  assert.equal(parseStreamTitle("StreamTitle='Don't Stop';"), "Don't Stop");
  assert.equal(parseStreamTitle("StreamTitle='';"), '');
  assert.equal(parseStreamTitle('bilinmeyen format'), '');
});

test('splitArtistTitle: ilk " - " ayraç olarak kullanılır', () => {
  assert.deepEqual(splitArtistTitle('Sezen Aksu - Gülümse - Canlı'), { artist: 'Sezen Aksu', title: 'Gülümse - Canlı' });
  assert.deepEqual(splitArtistTitle('Reklam Arası'), { artist: '', title: 'Reklam Arası' });
  assert.deepEqual(splitArtistTitle(''), { artist: '', title: '' });
});

test('IcyParser: parça parça (1–7 bayt) beslense de her başlık bir kez çıkar', () => {
  const metaint = 16;
  const audio = (n) => Buffer.alloc(n, 0x41);
  const stream = Buffer.concat([
    audio(metaint), metaBlock("StreamTitle='Artist A - Song 1';"),
    audio(metaint), metaBlock(''),                       // boş metadata: başlık yok
    audio(metaint), metaBlock("StreamTitle='Artist B - Song 2';"),
    audio(5),
  ]);

  const titles = [];
  const parser = new IcyParser(metaint);
  let offset = 0;
  const sizes = [1, 3, 7, 2, 13, 5];
  let s = 0;
  while (offset < stream.length) {
    const size = sizes[s++ % sizes.length];
    parser.push(stream.subarray(offset, offset + size), (t) => titles.push(t));
    offset += size;
  }
  assert.deepEqual(titles, ['Artist A - Song 1', 'Artist B - Song 2']);
});

test('IcyParser: ses verisi metadata gibi yorumlanmaz', () => {
  const metaint = 8;
  const titles = [];
  const parser = new IcyParser(metaint);
  // Ses baytları 0x01 gibi küçük değerler içerir; yalnız metaint konumundaki uzunluk okunmalı.
  parser.push(Buffer.from([1, 1, 1, 1, 1, 1, 1, 1]), (t) => titles.push(t));
  parser.push(metaBlock("StreamTitle='Gerçek';"), (t) => titles.push(t));
  assert.deepEqual(titles, ['Gerçek']);
});

test('openIcyMetadata: yerel ICY sunucusundan gerçek başlığı okur ve durdurulabilir', async () => {
  const metaint = 32;
  const server = http.createServer((req, res) => {
    assert.equal(req.headers['icy-metadata'], '1');
    res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'icy-metaint': String(metaint) });
    res.write(Buffer.alloc(metaint, 0x33));
    res.write(metaBlock("StreamTitle='Yerel Sanatçı - Yerel Parça';StreamUrl='';"));
    res.write(Buffer.alloc(metaint, 0x33));
    // Bağlantıyı açık tut: istemci durdurana kadar
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  const title = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('başlık zaman aşımına uğradı')), 5000);
    const conn = openIcyMetadata(`http://127.0.0.1:${port}/live`, {
      onTitle: (t) => {
        clearTimeout(timer);
        conn.stop();
        resolve(t);
      },
    });
  });

  assert.equal(title, 'Yerel Sanatçı - Yerel Parça');
  await new Promise((resolve) => server.close(resolve));
});

test('openIcyMetadata: ICY desteklemeyen akış no-metadata ile bildirilir', async () => {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/vnd.apple.mpegurl' });
    res.end('#EXTM3U');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  const reason = await new Promise((resolve) => {
    openIcyMetadata(`http://127.0.0.1:${port}/hls`, { onTitle: () => {}, onEnd: resolve });
  });
  assert.equal(reason, 'no-metadata');
  await new Promise((resolve) => server.close(resolve));
});
