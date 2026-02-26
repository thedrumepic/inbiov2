import React from 'react';
import { getImageUrl } from '../utils/api';

// ===== STREAMING SERVICE ICONS =====
export const StreamingIcons = {
    spotify: '/uploads/music-platform/spotify.svg',
    appleMusic: '/uploads/music-platform/applemusic.svg',
    itunes: '/uploads/music-platform/itunes.svg',
    youtubeMusic: '/uploads/music-platform/youtubemusic.svg',
    youtube: '/uploads/music-platform/youtube.svg',
    yandex: '/uploads/music-platform/yandexmusic.svg',
    vk: '/uploads/music-platform/vkmusic.svg',
    soundcloud: '/uploads/music-platform/soundcloud.svg',
    deezer: '/uploads/music-platform/deezer.svg',
    tidal: '/uploads/music-platform/tidal.svg',
    amazon: '/uploads/music-platform/amazonmusic.svg',
    amazonMusic: '/uploads/music-platform/amazonmusic.svg',
    amazonStore: '/uploads/music-platform/amazonstore.svg',
    pandora: '/uploads/music-platform/pandora.svg',
    bandcamp: '/uploads/music-platform/bandcamp.svg',
    boomplay: '/uploads/music-platform/boomplay.svg',
    tiktok: '/uploads/music-platform/tiktok.svg',
    anghami: '/uploads/music-platform/anghami.svg',
    audius: '/uploads/music-platform/audius.svg',
    audiomack: '/uploads/music-platform/audiomack.svg',
};

// ===== STREAMING SERVICES CONFIG =====
export const STREAMING_SERVICES = [
    { id: 'spotify', name: 'Spotify', color: '#1ED760' },
    { id: 'appleMusic', name: 'Apple Music', color: '#FA243C' },
    { id: 'itunes', name: 'iTunes', color: '#FB5BC5' },
    { id: 'youtubeMusic', name: 'YouTube Music', color: '#FF0000' },
    { id: 'youtube', name: 'YouTube', color: '#FF0000' },
    { id: 'yandex', name: 'Yandex Music', color: '#000000' },
    { id: 'vk', name: 'VK Music', color: '#0077FF' },
    { id: 'deezer', name: 'Deezer', color: '#A238FF' },
    { id: 'tidal', name: 'Tidal', color: '#ffffff' },
    { id: 'soundcloud', name: 'SoundCloud', color: '#ffffff' },
    { id: 'amazon', name: 'Amazon Music', color: '#ffffff' },
    { id: 'amazonMusic', name: 'Amazon Music', color: '#ffffff' },
    { id: 'amazonStore', name: 'Amazon Store', color: '#ffffff' },
    { id: 'pandora', name: 'Pandora', color: '#ffffff' },
    { id: 'bandcamp', name: 'Bandcamp', color: '#ffffff' },
    { id: 'audiomack', name: 'Audiomack', color: '#FFA200' },
    { id: 'tiktok', name: 'TikTok', color: '#000000' },
    { id: 'anghami', name: 'Anghami', color: '#f300f9' },
    { id: 'boomplay', name: 'Boomplay', color: '#00ffff' },
    { id: 'audius', name: 'Audius', color: '#000000' },
];

export const getServiceIcon = (serviceId) => {
    const icon = StreamingIcons[serviceId] || StreamingIcons.spotify;
    if (typeof icon === 'string') {
        return <img src={getImageUrl(icon)} className="w-6 h-6 object-contain" alt="" />;
    }
    return icon;
};

export const getServiceName = (serviceId) => {
    if (serviceId.toLowerCase().includes('yandex')) return 'Yandex Music';
    const service = STREAMING_SERVICES.find(s => s.id === serviceId);
    return service?.name || serviceId;
};

export const getServiceColor = (serviceId) => {
    if (serviceId.toLowerCase().includes('yandex')) return '#000000';
    const service = STREAMING_SERVICES.find(s => s.id === serviceId);
    return service?.color || '#888888';
};
