'use strict';

/**
 * Linux MPRIS entegrasyonu. GNOME/KDE/Budgie medya panelinde ve klavyedeki
 * medya tuşlarında "şu an çalan" bilgisini ve kontrolleri gösterir.
 * Yalnızca Linux'ta ve mpris-service yüklüyse etkindir; aksi halde null döner.
 */

function createMpris({ onCommand }) {
  if (process.platform !== 'linux') return null;

  let Player;
  try {
    Player = require('mpris-service');
  } catch {
    return null;
  }

  let player;
  try {
    player = Player({
      name: 'radyn',
      identity: 'Radyn',
      supportedInterfaces: ['player'],
    });
  } catch (err) {
    console.error('MPRIS başlatılamadı:', err.message);
    return null;
  }

  player.canPlay = true;
  player.canPause = true;
  player.canGoNext = true;
  player.canGoPrevious = true;
  player.canControl = true;
  player.playbackStatus = 'Stopped';

  player.on('playpause', () => onCommand('toggle'));
  player.on('play', () => onCommand('play'));
  player.on('pause', () => onCommand('pause'));
  player.on('stop', () => onCommand('stop'));
  player.on('next', () => onCommand('next'));
  player.on('previous', () => onCommand('prev'));

  return {
    update({ active, stationName, title, artist, artUrl }) {
      try {
        player.playbackStatus = active ? 'Playing' : 'Stopped';
        player.metadata = {
          'mpris:trackid': player.objectPath('track/0'),
          'xesam:title': title || stationName || 'Radyn',
          'xesam:artist': [artist || stationName || ''],
          'xesam:album': stationName || '',
          'mpris:artUrl': artUrl || '',
        };
      } catch (err) {
        console.error('MPRIS güncellenemedi:', err.message);
      }
    },
  };
}

module.exports = { createMpris };
