import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';
import { toast } from '../../utils/toast';
import { ArrowLeft, X, Loader2, MapPin, AlertCircle } from 'lucide-react';

export const MapBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
    const [mapUrl, setMapUrl] = useState(block?.content?.map_url || '');
    const [title, setTitle] = useState(block?.content?.title || '');
    const [saving, setSaving] = useState(false);
    const [parseError, setParseError] = useState(null);
    const [isResolving, setIsResolving] = useState(false);

    const resolveTimerRef = useRef(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    // Auto-resolve short links
    useEffect(() => {
        if (!mapUrl) return;

        // Check for Google Maps short links or Yandex short links (containing /-/ segment)
        const isGoogleShort = mapUrl.includes('maps.app.goo.gl') || mapUrl.includes('goo.gl/maps');
        const isYandexShort = mapUrl.includes('yandex') && mapUrl.includes('/-/');

        if (isGoogleShort || isYandexShort) {
            const resolveShortLink = async () => {
                setIsResolving(true);
                try {
                    const res = await api.resolveUrl(mapUrl);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.url && data.url !== mapUrl && isMountedRef.current) {
                            setMapUrl(data.url);
                            toast.success("Ссылка успешно развернута");
                        }
                    }
                } catch (e) {
                    console.error("Error resolving map url:", e);
                } finally {
                    if (isMountedRef.current) setIsResolving(false);
                }
            };

            if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
            resolveTimerRef.current = setTimeout(resolveShortLink, 800);
        }

        return () => {
            if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
        };
    }, [mapUrl]);

    const parseMapUrl = (input) => {
        if (!input) return null;
        let url = input.trim();

        // 1. Check for iframe src
        const srcMatch = url.match(/src="([^"]+)"/);
        if (srcMatch && srcMatch[1]) {
            return srcMatch[1];
        }

        // 2. Yandex Maps (ru, kz, com, by)
        // Transforms https://yandex.ru/maps/213/moscow/?ll=... -> https://yandex.ru/map-widget/v1/?ll=...
        if (url.match(/yandex\.(ru|kz|com|by)\/maps/)) {
            // Keep query params, remove path segments between /maps/ and ?
            const hasQuery = url.indexOf('?') !== -1;
            if (hasQuery) {
                return url.replace(/\/maps\/.*?\?/, '/map-widget/v1/?');
            } else {
                return url.replace(/\/maps\/.*?$/, '/map-widget/v1/');
            }
        }
        // Yandex Widget (already correct)
        if (url.includes('map-widget/v1')) {
            return url;
        }

        // 3. Google Maps
        // Already embed format
        if (url.includes('google.com/maps/embed') || url.includes('output=embed')) {
            return url;
        }
        // Direct Place Link -> Old Embed Format
        // https://www.google.com/maps/place/Eiffel+Tower/@...
        if (url.includes('google.com/maps/place')) {
            const placeMatch = url.match(/\/maps\/place\/([^/]+)/);
            if (placeMatch && placeMatch[1]) {
                const query = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
                return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
            }
        }
        // Direct Search Link
        // https://www.google.com/maps/search/Restaurants/@...
        if (url.includes('google.com/maps/search')) {
            const searchMatch = url.match(/\/maps\/search\/([^/]+)/);
            if (searchMatch && searchMatch[1]) {
                const query = decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));
                return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
            }
        }

        // Coordinates Fallback (e.g. if place/search failed or just moving map)
        // Matches @lat,lng
        const coordsMatch = url.match(/@([-0-9.]+),([-0-9.]+)/);
        if (coordsMatch) {
            const [_, lat, lng] = coordsMatch;
            return `https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        }

        // If it looks like a Google Maps link but we couldn't parse it strategies above,
        // it's likely not compatible with iframe (X-Frame-Options) or needs manual embed code.
        // We strictly return null here to trigger the error prompt.
        if (url.includes('google.com/maps') || url.includes('maps.google.com')) {
            return null;
        }

        // 4. Generic check (if user pasted a direct src that looks valid)
        if (url.startsWith('http') && !url.includes('<iframe')) {
            // Assume it might be a valid embed url if completely unknown, but warn user
            // Or better, return as is but UI will show preview.
            return url;
        }

        return null;
    };

    const handleSave = async () => {
        setParseError(null);
        if (!mapUrl) {
            toast.error('Введите ссылку или код для вставки');
            return;
        }

        if (isResolving) {
            toast.message('Подождите завершения обработки ссылки...');
            return;
        }

        const validUrl = parseMapUrl(mapUrl);
        if (!validUrl) {
            setParseError('Не удалось распознать ссылку. Пожалуйста, используйте "Код для вставки" (iframe).');
            return;
        }

        setSaving(true);
        try {
            const content = { map_url: validUrl, title };
            let response;

            if (block?.id) {
                response = await api.updateBlock(block.id, { content });
            } else {
                response = await api.createBlock({
                    page_id: pageId,
                    block_type: 'map',
                    content,
                    order: blocksCount || 0,
                });
            }

            if (response.ok) {
                toast.success(block?.id ? 'Блок обновлён' : 'Блок создан');
                onSuccess();
            } else {
                toast.error('Ошибка сохранения');
            }
        } catch (error) {
            toast.error('Ошибка соединения');
        } finally {
            setSaving(false);
        }
    };

    const previewUrl = parseMapUrl(mapUrl);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-50 bg-background border-b border-border">
                <div className="max-w-[440px] mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-bold">Карта</h1>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="max-w-[440px] mx-auto px-4 pt-6 pb-32 space-y-6">
                {/* Title Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Заголовок (необязательно)</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full h-12 px-4 bg-secondary rounded-[12px] border border-transparent focus:border-primary focus:outline-none transition-all text-sm"
                        placeholder="Например: Наш офис"
                    />
                </div>

                <div className="bg-secondary/50 p-4 rounded-xl border border-border text-sm text-muted-foreground">
                    <p className="mb-2 font-medium text-foreground">Инструкция:</p>
                    <ol className="list-decimal list-inside space-y-1">
                        <li>Откройте Google Maps или Яндекс.Карты</li>
                        <li>Найдите нужную точку, скопируйте ссылку и всьтавте</li>
                    </ol>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Код для вставки или ссылка</label>
                        <div className="relative">
                            <textarea
                                value={mapUrl}
                                onChange={(e) => {
                                    setMapUrl(e.target.value);
                                    setParseError(null);
                                }}
                                disabled={isResolving}
                                className={`w-full p-4 bg-secondary rounded-[12px] border focus:outline-none transition-all resize-none h-32 text-xs font-mono ${parseError ? 'border-red-500' : 'border-transparent focus:border-primary'} ${isResolving ? 'opacity-50' : ''}`}
                                placeholder={'<iframe src="https://..." ...></iframe> или прямая ссылка'}
                            />
                            {isResolving && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            )}
                        </div>
                        {parseError && (
                            <p className="text-red-500 text-xs flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {parseError}
                            </p>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                            Поддерживаются ссылки Google Maps и Яндекс.Карты.
                        </p>
                    </div>

                    {previewUrl && !parseError && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Предпросмотр</label>
                            <div className="w-full h-[200px] rounded-[12px] overflow-hidden border border-border bg-secondary relative">
                                <iframe
                                    src={previewUrl}
                                    className="w-full h-full border-0"
                                    title="Preview"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border mt-auto">
                <div className="max-w-[440px] mx-auto">
                    <button
                        onClick={handleSave}
                        disabled={saving || isResolving}
                        className="w-full h-12 bg-foreground text-background rounded-[14px] font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const MapBlockRenderer = ({ block }) => {
    const { map_url, title } = block.content || {};

    if (!map_url) return null;

    return (
        <div className="w-full bg-card border border-border rounded-[24px] p-6 shadow-sm">
            {title && (
                <h3 className="text-xl font-bold mb-4 text-center">{title}</h3>
            )}
            <div className="w-full h-[250px] md:h-[300px] rounded-[16px] overflow-hidden bg-secondary">
                <iframe
                    src={map_url}
                    className="w-full h-full border-0 block"
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={title || "Map"}
                />
            </div>
        </div>
    );
};
