import React, { useState } from 'react';
import { api, getImageUrl } from '../../utils/api';
import { toast } from '../../utils/toast';
import { ArrowLeft, X, Loader2, Calendar, MapPin, Ticket, Camera, Plus, Trash2, Check, CircleOff, Hourglass, ChevronDown, Edit3 } from 'lucide-react';
import { DateTimePicker } from '../ui/datetime-picker';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Tooltip } from '../ui/Tooltip';
import { cn } from '../../lib/utils';

export const EventsBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
    const [isTour, setIsTour] = useState(block?.content?.isTour || false);
    const [tourTitle, setTourTitle] = useState(block?.content?.tourTitle || '');
    const [cover, setCover] = useState(block?.content?.cover || '');
    const [events, setEvents] = useState(block?.content?.events || [
        {
            id: Date.now().toString(),
            title: '',
            date: new Date().toISOString(),
            location: '',
            venue: '',
            ticketLink: '',
            buttonText: 'Билеты',
            status: 'active'
        }
    ]);
    const [openDropdownId, setOpenDropdownId] = useState(null);

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const response = await api.uploadImage(file, 'others');
            if (response.ok) {
                const data = await response.json();
                setCover(data.url);
                toast.success('Обложка загружена');
            } else {
                toast.error('Ошибка загрузки');
            }
        } catch (error) {
            toast.error('Ошибка соединения');
        } finally {
            setUploading(false);
        }
    };

    const addEvent = () => {
        setEvents([...events, {
            id: Date.now().toString(),
            title: '',
            date: new Date().toISOString(),
            location: '',
            venue: '',
            ticketLink: '',
            buttonText: 'Билеты',
            status: 'active'
        }]);
    };

    const updateEvent = (id, updates) => {
        setEvents(events.map(ev => ev.id === id ? { ...ev, ...updates } : ev));
    };

    const removeEvent = (id) => {
        if (events.length <= 1) {
            toast.error('Должно быть хотя бы одно событие');
            return;
        }
        setEvents(events.filter(ev => ev.id !== id));
    };

    const handleSave = async () => {
        if (isTour && !tourTitle) {
            toast.error('Введите название тура');
            return;
        }

        const validEvents = events.filter(ev => isTour ? ev.location : (ev.title || ev.location));
        if (validEvents.length === 0) {
            toast.error(isTour ? 'Добавьте хотя бы один город' : 'Введите название или город');
            return;
        }

        const activeWithoutLink = validEvents.find(ev => ev.status === 'active' && !ev.ticketLink);
        if (activeWithoutLink) {
            toast.error('Введите ссылку для афишы');
            return;
        }

        const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

        setSaving(true);
        try {
            const content = {
                isTour,
                tourTitle,
                cover,
                events: isTour ? sortedEvents : [events[0]]
            };

            let response;
            if (block?.id) {
                response = await api.updateBlock(block.id, { content });
            } else {
                response = await api.createBlock({
                    page_id: pageId,
                    block_type: 'events',
                    content,
                    order: blocksCount || 0,
                });
            }

            if (response.ok) {
                toast.success('Настройки сохранены');
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

    const buttonPresets = ['Билеты'];

    return (
        <div className="min-h-screen bg-background text-foreground pb-32">
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
                <div className="max-w-[440px] mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-sm font-black uppercase tracking-widest">Афиша событий</h1>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="max-w-[440px] mx-auto px-4 py-6 space-y-8">
                <div className="bg-card p-4 rounded-[24px] border border-border shadow-sm space-y-4">
                    <div className="flex items-center justify-between p-1 bg-secondary rounded-[14px]">
                        {[
                            { id: false, label: 'Одиночное', icon: Calendar },
                            { id: true, label: 'Тур / Серия', icon: MapPin }
                        ].map((mode) => (
                            <button
                                key={mode.label}
                                onClick={() => setIsTour(mode.id)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 h-10 rounded-[10px] text-xs font-bold transition-all",
                                    isTour === mode.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <mode.icon className="w-3.5 h-3.5" />
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Обложка {isTour ? 'тура' : 'события'}</label>
                        <div className="relative aspect-video w-full bg-secondary rounded-[24px] overflow-hidden border-2 border-dashed border-border group transition-colors hover:border-primary/20">
                            {cover ? (
                                <>
                                    <img src={getImageUrl(cover)} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => setCover('')}
                                        className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-all shadow-lg"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50 transition-all">
                                    {uploading ? (
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    ) : (
                                        <>
                                            <Camera className="w-8 h-8 text-muted-foreground mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Загрузить фото</span>
                                        </>
                                    )}
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                </label>
                            )}
                        </div>
                    </div>

                    {isTour && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Название тура</label>
                            <input
                                type="text"
                                value={tourTitle}
                                onChange={(e) => setTourTitle(e.target.value)}
                                className="w-full h-12 px-4 bg-secondary rounded-[16px] border border-transparent focus:border-primary focus:bg-background focus:outline-none transition-all text-sm font-bold"
                                placeholder="Напр: World Tour 2026"
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {(isTour ? events : [events[0]]).map((event, index) => (
                        <div
                            key={event.id}
                            style={{ zIndex: openDropdownId === event.id ? 40 : 10 }}
                            className="bg-card p-5 rounded-[28px] border border-border space-y-5 animate-in fade-in zoom-in-95 relative transition-all hover:shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-3 py-1 bg-secondary rounded-full">
                                    {isTour ? `Локация #${index + 1}` : 'Детали события'}
                                </span>
                                {isTour && (
                                    <button onClick={() => removeEvent(event.id)} className="p-2 text-muted-foreground hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Дата и время</label>
                                    <DateTimePicker
                                        date={new Date(event.date)}
                                        setDate={(d) => updateEvent(event.id, { date: d.toISOString() })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">
                                        {isTour ? 'Город' : 'Название'}
                                    </label>
                                    <input
                                        type="text"
                                        value={isTour ? event.location : event.title}
                                        onChange={(e) => updateEvent(event.id, isTour ? { location: e.target.value } : { title: e.target.value })}
                                        className="w-full h-11 px-4 bg-secondary/50 rounded-[12px] border border-transparent focus:border-primary focus:outline-none transition-all text-sm font-medium"
                                        placeholder={isTour ? "Напр: Алматы" : "Напр: Сольный концерт"}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">
                                        {isTour ? 'Площадка' : 'Город'}
                                    </label>
                                    <input
                                        type="text"
                                        value={isTour ? event.venue : event.location}
                                        onChange={(e) => updateEvent(event.id, isTour ? { venue: e.target.value } : { location: e.target.value })}
                                        className="w-full h-11 px-4 bg-secondary/50 rounded-[12px] border border-transparent focus:border-primary focus:outline-none transition-all text-sm font-medium"
                                        placeholder={isTour ? "Напр: Olympic Arena" : "Напр: Нью-Йорк"}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Ссылка на {event.buttonText.toLowerCase()}</label>
                                    <div className="relative">
                                        <Ticket className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="url"
                                            value={event.ticketLink}
                                            onChange={(e) => updateEvent(event.id, { ticketLink: e.target.value })}
                                            className="w-full h-11 pl-10 pr-4 bg-secondary/50 rounded-[12px] border border-transparent focus:border-primary focus:outline-none transition-all text-sm font-medium"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1 block">Текст кнопки</label>
                                        <div className="relative">
                                            <button
                                                onClick={() => setOpenDropdownId(openDropdownId === event.id ? null : event.id)}
                                                className={cn(
                                                    "w-full h-11 px-4 bg-secondary/50 rounded-[12px] border border-transparent flex items-center justify-between transition-all outline-none group/btn",
                                                    openDropdownId === event.id && "bg-background border-primary shadow-sm"
                                                )}
                                            >
                                                <span className="text-sm font-bold">
                                                    {buttonPresets.includes(event.buttonText) ? event.buttonText : 'Своя надпись'}
                                                </span>
                                                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", openDropdownId === event.id && "rotate-180 text-primary")} />
                                            </button>

                                            {openDropdownId === event.id && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />
                                                    <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-card border border-border/40 rounded-[18px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl origin-top">
                                                        <div className="p-1.5 flex flex-col gap-1">
                                                            {buttonPresets.map((preset) => (
                                                                <button
                                                                    key={preset}
                                                                    onClick={() => {
                                                                        updateEvent(event.id, { buttonText: preset });
                                                                        setOpenDropdownId(null);
                                                                    }}
                                                                    className={cn(
                                                                        "w-full px-4 py-2.5 rounded-[12px] text-sm font-bold flex items-center justify-between transition-all",
                                                                        event.buttonText === preset ? "bg-foreground text-background" : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                                                                    )}
                                                                >
                                                                    {preset}
                                                                    {event.buttonText === preset && <Check className="w-3.5 h-3.5" />}
                                                                </button>
                                                            ))}
                                                            <div className="h-[1px] bg-border/40 my-0.5 mx-2" />
                                                            <button
                                                                onClick={() => {
                                                                    if (buttonPresets.includes(event.buttonText)) {
                                                                        updateEvent(event.id, { buttonText: '' });
                                                                    }
                                                                    setOpenDropdownId(null);
                                                                }}
                                                                className={cn(
                                                                    "w-full px-4 py-2.5 rounded-[12px] text-sm font-bold flex items-center gap-2 transition-all",
                                                                    !buttonPresets.includes(event.buttonText) ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                                                                )}
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                                <span>Своя надпись</span>
                                                                {!buttonPresets.includes(event.buttonText) && event.buttonText !== '' && <Check className="w-3.5 h-3.5 ml-auto" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {!buttonPresets.includes(event.buttonText) && (
                                            <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <input
                                                    type="text"
                                                    value={event.buttonText}
                                                    onChange={(e) => updateEvent(event.id, { buttonText: e.target.value })}
                                                    className="w-full h-11 px-4 bg-secondary rounded-[12px] border border-primary/20 focus:border-primary focus:bg-background focus:outline-none transition-all text-sm font-bold"
                                                    placeholder="Введите свою надпись..."
                                                    autoFocus
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1 block">Статус</label>
                                        <div className="flex bg-secondary/50 rounded-[12px] p-1 h-11">
                                            {[
                                                { id: 'active', label: Check },
                                                { id: 'sold_out', label: CircleOff },
                                                { id: 'upcoming', label: Hourglass }
                                            ].map((st) => (
                                                <Tooltip
                                                    key={st.id}
                                                    content={st.id === 'active' ? 'Активно' : st.id === 'sold_out' ? 'Билетов нет' : 'Скоро'}
                                                    className="flex-1 flex h-full p-0.5"
                                                >
                                                    <button
                                                        onClick={() => updateEvent(event.id, { status: st.id })}
                                                        className={cn(
                                                            "w-full h-full flex items-center justify-center rounded-[8px] transition-all",
                                                            event.status === st.id ? "bg-background shadow-sm scale-110 text-primary" : "grayscale opacity-40 hover:opacity-100 hover:grayscale-0 text-muted-foreground"
                                                        )}
                                                    >
                                                        <st.label className="w-4 h-4" />
                                                    </button>
                                                </Tooltip>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {isTour && (
                        <button
                            onClick={addEvent}
                            className="w-full h-14 border-2 border-dashed border-border rounded-[24px] flex items-center justify-center gap-2 text-muted-foreground hover:bg-secondary/50 hover:border-primary/20 transition-all group"
                        >
                            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-bold uppercase tracking-widest">Добавить город</span>
                        </button>
                    )}
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-50">
                <div className="max-w-[440px] mx-auto">
                    <button
                        onClick={handleSave}
                        disabled={saving || uploading}
                        className="w-full h-14 bg-foreground text-background rounded-[20px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-foreground/10"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Сохранить блок'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const EventsBlockRenderer = ({ block }) => {
    const { isTour, tourTitle, cover, events = [] } = block.content || {};

    const displayEvents = isTour ? events : (events.length > 0 ? [events[0]] : []);
    const sortedEvents = [...displayEvents].sort((a, b) => new Date(a.date) - new Date(b.date))
        .filter(ev => isTour ? ev.location : (ev.title || ev.location));

    return (
        <div className="w-full bg-card border border-zinc-300/50 dark:border-border/50 rounded-[32px] overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md min-h-[100px]">
            {cover && (
                <div className="w-full aspect-video overflow-hidden relative">
                    <img src={getImageUrl(cover)} alt={tourTitle || 'Обложка'} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
            )}

            <div className="p-5 space-y-5">
                {(isTour || sortedEvents.length > 0) ? (
                    <>
                        {isTour && tourTitle && (
                            <div className="px-1">
                                <h2 className="text-lg font-black uppercase tracking-tight leading-tight">{tourTitle}</h2>
                                <div className="h-1 w-12 bg-primary rounded-full mt-2" />
                            </div>
                        )}

                        <div className="space-y-3">
                            {sortedEvents.length > 0 ? (
                                sortedEvents.map((event, index) => {
                                    const eventDate = event.date ? new Date(event.date) : null;
                                    const isSoldOut = event.status === 'sold_out';
                                    const isUpcoming = event.status === 'upcoming';

                                    return (
                                        <div
                                            key={event.id || index}
                                            className={cn(
                                                "flex items-center gap-4 p-3 rounded-[20px] transition-all bg-secondary/30",
                                                isUpcoming && "opacity-60 grayscale-[0.5]"
                                            )}
                                        >
                                            <div className="flex-shrink-0 w-12 h-12 rounded-[14px] bg-background border border-zinc-300 dark:border-white/10 flex flex-col items-center justify-center shadow-sm">
                                                {eventDate ? (
                                                    <>
                                                        <span className="text-[10px] font-bold uppercase text-primary leading-none mb-0.5">{format(eventDate, 'MMM', { locale: ru })}</span>
                                                        <span className="text-base font-black leading-none">{format(eventDate, 'd')}</span>
                                                    </>
                                                ) : (
                                                    <Calendar className="w-5 h-5 text-muted-foreground" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm uppercase tracking-tight whitespace-pre-wrap break-words">
                                                    {isTour ? event.location : (event.title || event.location || tourTitle)}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-0.5" >
                                                    {(isTour ? event.venue : event.location) && (
                                                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium whitespace-pre-wrap break-words">
                                                            <MapPin className="w-3 h-3 flex-shrink-0" />
                                                            <span>{isTour ? event.venue : event.location}</span>
                                                        </div>
                                                    )}
                                                    {eventDate && (
                                                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>{format(eventDate, 'p', { locale: ru })}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                disabled={isSoldOut || isUpcoming || !event.ticketLink}
                                                onClick={() => { if (event.ticketLink) { const url = !event.ticketLink.startsWith('http') ? 'https://' + event.ticketLink : event.ticketLink; window.open(url, '_blank'); } }}
                                                className={cn(
                                                    "h-10 px-4 rounded-[12px] font-black text-[11px] uppercase tracking-wider transition-all whitespace-nowrap",
                                                    isSoldOut
                                                        ? "bg-secondary text-muted-foreground/50 line-through cursor-not-allowed"
                                                        : isUpcoming
                                                            ? "bg-secondary text-muted-foreground cursor-wait"
                                                            : "bg-foreground text-background hover:scale-[1.05] active:scale-[0.95]"
                                                )}
                                            >
                                                {isSoldOut ? 'Sold Out' : isUpcoming ? 'Скоро' : (event.buttonText || 'Билеты')}
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground opacity-50 italic">
                                    <Calendar className="w-8 h-8 mb-2" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Афиша и Тур</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-50">
                        <Calendar className="w-10 h-10 mb-3" />
                        <p className="text-sm font-black uppercase tracking-[0.2em]">Афиша событий</p>
                        <p className="text-[10px] mt-1 uppercase font-bold tracking-widest">Настройте блок в редакторе</p>
                    </div>
                )}
            </div>
        </div>
    );
};
