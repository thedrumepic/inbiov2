import React, { useState } from 'react';
import { api } from '../../utils/api';
import { toast } from '../../utils/toast';
import { ArrowLeft, X, Loader2 } from 'lucide-react';

const DAYS = [
  { id: 'mon', label: 'Понедельник', short: 'Пн' },
  { id: 'tue', label: 'Вторник', short: 'Вт' },
  { id: 'wed', label: 'Среда', short: 'Ср' },
  { id: 'thu', label: 'Четверг', short: 'Чт' },
  { id: 'fri', label: 'Пятница', short: 'Пт' },
  { id: 'sat', label: 'Суббота', short: 'Сб' },
  { id: 'sun', label: 'Воскресенье', short: 'Вс' },
];

const defaultSchedule = () =>
  DAYS.reduce((acc, d) => {
    acc[d.id] = { enabled: !['sat', 'sun'].includes(d.id), from: '09:00', to: '18:00', note: '' };
    return acc;
  }, {});

export const ScheduleBlockRenderer = ({ block }) => {
  const { title, schedule = {}, note } = block.content || {};
  const activeDays = DAYS.filter(d => schedule[d.id]?.enabled);
  if (!activeDays.length) return null;

  return (
    <div className="p-4">
      {title && <h3 className="text-base font-bold mb-3 text-foreground">{title}</h3>}
      <div className="space-y-1.5">
        {DAYS.map(d => {
          const s = schedule[d.id];
          if (!s?.enabled) return null;
          return (
            <div key={d.id} className="flex items-center justify-between py-2 px-3 bg-secondary/40 rounded-xl border border-border/30">
              <span className="text-sm font-semibold text-foreground w-28 flex-shrink-0">{d.label}</span>
              <span className="text-sm text-muted-foreground">
                {s.from} — {s.to}
              </span>
              {s.note && <span className="text-xs text-muted-foreground/70 ml-2 truncate hidden sm:block">{s.note}</span>}
            </div>
          );
        })}
        {DAYS.filter(d => !schedule[d.id]?.enabled).map(d => (
          <div key={d.id} className="flex items-center justify-between py-2 px-3 bg-secondary/40 rounded-xl border border-border/30 opacity-50">
            <span className="text-sm font-medium text-foreground w-28 flex-shrink-0">{d.label}</span>
            <span className="text-sm text-muted-foreground">Выходной</span>
          </div>
        ))}
      </div>
      {note && <p className="text-xs text-muted-foreground mt-3 px-1">{note}</p>}
    </div>
  );
};

export const ScheduleBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
  const [title, setTitle] = useState(block?.content?.title || 'Расписание');
  const [schedule, setSchedule] = useState(block?.content?.schedule || defaultSchedule());
  const [note, setNote] = useState(block?.content?.note || '');
  const [loading, setLoading] = useState(false);

  const updateDay = (dayId, field, value) => {
    setSchedule(prev => ({ ...prev, [dayId]: { ...prev[dayId], [field]: value } }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const content = { title, schedule, note };
      let res;
      if (block) {
        res = await api.updateBlock(block.id, { content });
      } else {
        res = await api.createBlock({ page_id: pageId, block_type: 'schedule', content, order: blocksCount });
      }
      if (res.ok) {
        toast.success(block ? 'Расписание обновлено' : 'Расписание добавлено');
        onSuccess();
      } else {
        toast.error('Ошибка сохранения');
      }
    } catch {
      toast.error('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-[440px] mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-base flex-1 text-center">{block ? 'Редактировать расписание' : 'Блок расписания'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-[440px] mx-auto px-4 py-4 space-y-4">
        <div className="space-y-2">
          <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Заголовок</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="Расписание" />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Дни и время</label>
          <div className="space-y-2">
            {DAYS.map(d => {
              const s = schedule[d.id] || { enabled: false, from: '09:00', to: '18:00', note: '' };
              return (
                <div key={d.id} className="rounded-xl border border-border bg-secondary/20 transition-all">
                  {/* Row 1: toggle + name + выходной */}
                  <div className="flex items-center gap-3 px-3 pt-3 pb-2">
                    <button
                      type="button"
                      onClick={() => updateDay(d.id, 'enabled', !s.enabled)}
                      className={`relative w-10 h-6 rounded-full transition-all duration-200 flex-shrink-0 ${
                        s.enabled ? 'bg-primary' : 'bg-muted/50 border border-border/60'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full shadow transition-all duration-200 ${
                        s.enabled ? 'left-5 bg-white' : 'left-1 bg-muted-foreground/50'
                      }`} />
                    </button>
                    <span className={`text-sm font-semibold flex-1 min-w-0 ${!s.enabled ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {d.label}
                    </span>
                    {!s.enabled && (
                      <span className="text-xs text-muted-foreground/60 flex-shrink-0">Выходной</span>
                    )}
                  </div>
                  {/* Row 2: time inputs */}
                  {s.enabled && (
                    <div className="px-3 pb-2 flex items-center gap-2">
                      <input
                        type="time"
                        value={s.from}
                        onChange={e => updateDay(d.id, 'from', e.target.value)}
                        className="bg-background border border-border rounded-lg text-sm px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary flex-1 min-w-0"
                      />
                      <span className="text-muted-foreground text-sm flex-shrink-0">—</span>
                      <input
                        type="time"
                        value={s.to}
                        onChange={e => updateDay(d.id, 'to', e.target.value)}
                        className="bg-background border border-border rounded-lg text-sm px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary flex-1 min-w-0"
                      />
                    </div>
                  )}
                  {/* Row 3: note */}
                  {s.enabled && (
                    <div className="px-3 pb-3">
                      <input
                        type="text"
                        value={s.note}
                        onChange={e => updateDay(d.id, 'note', e.target.value)}
                        className="input text-xs"
                        placeholder="Заметка (необязательно)"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Примечание (необязательно)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            className="input resize-none text-sm"
            rows={2}
            placeholder="Например: по предварительной записи"
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border p-4">
        <div className="max-w-[440px] mx-auto">
          <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {block ? 'Сохранить' : 'Добавить блок'}
          </button>
        </div>
      </div>
    </div>
  );
};
