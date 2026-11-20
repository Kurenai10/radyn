'use strict';

/**
 * ID3v2 metin çerçevelerinden (TIT2 = parça adı, TPE1 = sanatçı) bilgi okur.
 * HLS yayınlarındaki zamanlanmış metadata bu biçimdedir. Node (test) ve
 * tarayıcıda (renderer) aynı şekilde çalışır.
 */

function syncsafe(b) {
  return ((b[0] & 0x7f) << 21) | ((b[1] & 0x7f) << 14) | ((b[2] & 0x7f) << 7) | (b[3] & 0x7f);
}

function ascii(bytes, start, length) {
  let out = '';
  for (let i = start; i < start + length && i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
}

function decodeUtf16(bytes, littleEndian) {
  let data = bytes;
  if (!littleEndian) {
    // Büyük endian → küçük endian: baytları yer değiştir
    data = new Uint8Array(bytes.length - (bytes.length % 2));
    for (let i = 0; i + 1 < bytes.length; i += 2) {
      data[i] = bytes[i + 1];
      data[i + 1] = bytes[i];
    }
  }
  return new TextDecoder('utf-16le').decode(data);
}

/** Çerçeve metnini çözer. İlk bayt kodlamayı belirtir (0: Latin-1, 1: UTF-16 BOM'lu, 2: UTF-16BE, 3: UTF-8). */
function decodeText(bytes) {
  if (!bytes || bytes.length < 2) return '';
  const encoding = bytes[0];
  const body = bytes.subarray(1);
  let text;
  switch (encoding) {
    case 0: {
      text = '';
      for (const b of body) text += String.fromCharCode(b);
      break;
    }
    case 1: {
      if (body[0] === 0xff && body[1] === 0xfe) text = decodeUtf16(body.subarray(2), true);
      else if (body[0] === 0xfe && body[1] === 0xff) text = decodeUtf16(body.subarray(2), false);
      else text = decodeUtf16(body, true);
      break;
    }
    case 2:
      text = decodeUtf16(body, false);
      break;
    case 3:
      text = new TextDecoder('utf-8').decode(body);
      break;
    default:
      return '';
  }
  // Birden çok değer NUL ile ayrılır; ilkini al
  return text.split('\u0000')[0].trim();
}

/**
 * ID3v2 etiketinden { title, artist } çıkarır. ID3 değilse veya bilgi yoksa null.
 * @param {Uint8Array} bytes
 */
function parseId3(bytes) {
  if (!bytes || bytes.length < 10 || ascii(bytes, 0, 3) !== 'ID3') return null;
  const major = bytes[3];
  const tagSize = syncsafe(bytes.subarray(6, 10));
  const end = Math.min(bytes.length, 10 + tagSize);
  const frames = {};
  let pos = 10;

  while (pos + 10 <= end) {
    const id = ascii(bytes, pos, 4);
    if (!/^[A-Z0-9]{4}$/.test(id)) break;
    const sizeBytes = bytes.subarray(pos + 4, pos + 8);
    const frameSize = major === 4
      ? syncsafe(sizeBytes)
      : ((sizeBytes[0] << 24) | (sizeBytes[1] << 16) | (sizeBytes[2] << 8) | sizeBytes[3]) >>> 0;
    if (frameSize <= 0 || pos + 10 + frameSize > end) break;
    frames[id] = bytes.subarray(pos + 10, pos + 10 + frameSize);
    pos += 10 + frameSize;
  }

  const title = frames.TIT2 ? decodeText(frames.TIT2) : '';
  const artist = frames.TPE1 ? decodeText(frames.TPE1) : '';
  if (!title && !artist) return null;
  return { title, artist };
}

const radynId3 = { parseId3, decodeText };

if (typeof module !== "undefined" && module.exports) module.exports = radynId3;
if (typeof window !== "undefined") window.RadynId3 = radynId3;
