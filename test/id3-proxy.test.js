'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { parseId3 } = require('../src/id3');
const { createStreamProxy } = require('../src/stream-proxy');

// ---------- ID3 yardımcıları ----------

function frame(id, encoding, payload, major = 3) {
  const body = Buffer.concat([Buffer.from([encoding]), payload]);
  const size = Buffer.alloc(4);
  if (major === 4) {
    size[0] = (body.length >> 21) & 0x7f;
    size[1] = (body.length >> 14) & 0x7f;
    size[2] = (body.length >> 7) & 0x7f;
    size[3] = body.length & 0x7f;
  } else {
    size.writeUInt32BE(body.length);
  }
  return Buffer.concat([Buffer.from(id, 'ascii'), size, Buffer.from([0, 0]), body]);
}

function id3Tag(frames, major = 3) {
  const body = Buffer.concat(frames);
  const size = [(body.length >> 21) & 0x7f, (body.length >> 14) & 0x7f, (body.length >> 7) & 0x7f, body.length & 0x7f];
  return Buffer.concat([Buffer.from('ID3'), Buffer.from([major, 0, 0]), Buffer.from(size), body]);
}

test('parseId3: UTF-8 TIT2/TPE1 çerçeveleri okunur', () => {
  const tag = id3Tag([
    frame('TIT2', 3, Buffer.from('Şarkı Adı', 'utf8')),
    frame('TPE1', 3, Buffer.from('Sanatçı', 'utf8')),
  ]);
  assert.deepEqual(parseId3(new Uint8Array(tag)), { title: 'Şarkı Adı', artist: 'Sanatçı' });
});

test('parseId3: UTF-16 (BOM) ve ID3v2.4 syncsafe boyutları', () => {
  const utf16 = Buffer.from('﻿Canlı Parça', 'utf16le');
  const tag = id3Tag([frame('TIT2', 1, utf16, 4)], 4);
  assert.deepEqual(parseId3(new Uint8Array(tag)), { title: 'Canlı Parça', artist: '' });
});

test('parseId3: ID3 olmayan veya bilgisiz veri null döner', () => {
  assert.equal(parseId3(new Uint8Array([1, 2, 3])), null);
  assert.equal(parseId3(new Uint8Array(Buffer.from('ID3\x03\x00\x00\x00\x00\x00\x00'))), null);
});

// ---------- Yerel aktarıcı ----------

function metaBlock(text) {
  if (!text) return Buffer.from([0]);
  const padded = Buffer.alloc(Math.ceil(text.length / 16) * 16);
  Buffer.from(text, 'utf8').copy(padded);
  return Buffer.concat([Buffer.from([padded.length / 16]), padded]);
}

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
}

function fetchAll(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        const parts = [];
        res.on('data', (c) => parts.push(c));
        res.on('end', () => resolve({ status: res.statusCode, type: res.headers['content-type'], data: Buffer.concat(parts) }));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

test('stream-proxy: metadata ayrılır, ses verisi değişmeden iletilir, şarkı adı gelir', async () => {
  const metaint = 16;
  const upstream = http.createServer((req, res) => {
    assert.equal(req.headers['icy-metadata'], '1');
    res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'icy-metaint': String(metaint) });
    res.write(Buffer.alloc(16, 0x41));
    res.write(metaBlock("StreamTitle='Artist A - Song 1';StreamUrl='';"));
    res.write(Buffer.alloc(16, 0x42));
    res.write(metaBlock(''));
    res.end(Buffer.alloc(16, 0x43));
  });
  const upPort = await listen(upstream);

  const titles = [];
  const proxy = createStreamProxy();
  try {
    const proxyUrl = await proxy.open(`http://127.0.0.1:${upPort}/live`, { onTitle: (t) => titles.push(t) });
    const body = await fetchAll(proxyUrl);

    assert.equal(body.status, 200);
    assert.equal(body.type, 'audio/mpeg');
    assert.deepEqual(body.data, Buffer.concat([Buffer.alloc(16, 0x41), Buffer.alloc(16, 0x42), Buffer.alloc(16, 0x43)]));
    assert.deepEqual(titles, ['Artist A - Song 1']);

    // Oturum tek kullanımlık: aynı adres ikinci kez 404 döner
    const again = await fetchAll(proxyUrl);
    assert.equal(again.status, 404);
  } finally {
    proxy.close();
    upstream.close();
    upstream.closeAllConnections();
  }
});

test('stream-proxy: metadata olmayan akış olduğu gibi iletilir', async () => {
  const upstream = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'audio/aac' });
    res.end(Buffer.from('ses-verisi'));
  });
  const upPort = await listen(upstream);
  const proxy = createStreamProxy();
  try {
    const proxyUrl = await proxy.open(`http://127.0.0.1:${upPort}/plain`);
    const body = await fetchAll(proxyUrl);
    assert.equal(body.status, 200);
    assert.equal(body.type, 'audio/aac');
    assert.equal(body.data.toString(), 'ses-verisi');
  } finally {
    proxy.close();
    upstream.close();
    upstream.closeAllConnections();
  }
});

test('stream-proxy: yayın sunucusu hata verirse 502 döner, geçersiz adres reddedilir', async () => {
  const upstream = http.createServer((req, res) => {
    res.writeHead(503);
    res.end();
  });
  const upPort = await listen(upstream);
  const proxy = createStreamProxy();
  try {
    const proxyUrl = await proxy.open(`http://127.0.0.1:${upPort}/down`);
    const body = await fetchAll(proxyUrl);
    assert.equal(body.status, 502);
    await assert.rejects(proxy.open('ftp://nope'), /Geçersiz/);
  } finally {
    proxy.close();
    upstream.close();
    upstream.closeAllConnections();
  }
});
