import React, { useState } from 'react';
import { api } from '../../utils/api';
import { toast } from '../../utils/toast';
import { ArrowLeft, X, Loader2, Plus, Trash2, Check, Star } from 'lucide-react';

const CURRENCIES = ['₽', '$', '₸', '€'];

const CurrencySelector = ({ value, onChange }) => (
  <div className="flex rounded-xl overflow-hidden border border-border w-full">
    {CURRENCIES.map(c => (
      <button
        key={c}
        type="button"
        onClick={() => onChange(c)}
        className={`flex-1 py-2 text-sm font-bold transition-colors text-center ${
          value === c
            ? 'bg-foreground text-background'
            : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
        }`}
      >
        {c}
      </button>
    ))}
  </div>
);

const Toggle = ({ checked, onChange, label }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="flex items-center gap-2 group"
  >
    <div className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-primary' : 'bg-secondary border border-border'}`}>
      <span className={`absolute top-1 left-1 w-4 h-4 rounded-full shadow transition-all ${checked ? 'translate-x-4 bg-primary-foreground' : 'bg-muted-foreground/60'}`} />
    </div>
    {label && <span className={`text-xs font-semibold transition-colors ${checked ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>}
  </button>
);

const emptyPlan = () => ({
  name: '',
  price: '',
  currency: '₽',
  period: 'мес',
  features: '',
  button_text: 'Выбрать',
  button_url: '',
  highlighted: false,
});

const PlanCard = ({ plan }) => {
  const features = (plan.features || '').split('\n').filter(f => f.trim());
  return (
    <div className={`relative rounded-xl border p-4 flex flex-col gap-3 transition-all ${
      plan.highlighted
        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
        : 'border-border bg-secondary/20'
    }`}>
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
            <Star className="w-3 h-3" /> Популярный
          </span>
        </div>
      )}
      <div className={plan.highlighted ? 'pt-2' : ''}>
        <div className="font-bold text-sm text-foreground">{plan.name || 'Тариф'}</div>
        <div className="flex items-baseline gap-1 mt-1 flex-wrap">
          <span className="text-2xl font-bold text-foreground">{plan.price || '0'}</span>
          <span className="text-sm text-muted-foreground">{plan.currency}</span>
          {plan.period && <span className="text-xs text-muted-foreground">/{plan.period}</span>}
        </div>
      </div>
      {features.length > 0 && (
        <ul className="space-y-1.5 flex-1">
          {features.map((f, fi) => (
            <li key={fi} className="flex items-start gap-2 text-xs text-muted-foreground">
              <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>{f.trim()}</span>
            </li>
          ))}
        </ul>
      )}
      {plan.button_text && (
        <a
          href={plan.button_url || '#'}
          target={plan.button_url ? '_blank' : undefined}
          rel="noopener noreferrer"
          className={`block text-center py-2 px-4 rounded-xl text-sm font-bold transition-all ${
            plan.highlighted
              ? 'bg-primary text-primary-foreground hover:opacity-90'
              : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
          }`}
        >
          {plan.button_text}
        </a>
      )}
    </div>
  );
};

export const PricingBlockRenderer = ({ block }) => {
  const { title, plans = [] } = block.content || {};
  if (!plans.length) return null;

  // Layout logic: 1=full, 2=50/50, 3=50/50+full, 4=50/50+50/50, etc.
  const renderPlans = () => {
    const rows = [];
    let i = 0;
    while (i < plans.length) {
      const remaining = plans.length - i;
      if (remaining === 1) {
        // Single full-width
        rows.push(
          <div key={i} className="w-full">
            <PlanCard plan={plans[i]} />
          </div>
        );
        i += 1;
      } else {
        // Two side by side 50/50
        rows.push(
          <div key={i} className="grid grid-cols-2 gap-3">
            <PlanCard plan={plans[i]} />
            <PlanCard plan={plans[i + 1]} />
          </div>
        );
        i += 2;
      }
    }
    return rows;
  };

  return (
    <div className="p-4">
      {title && <h3 className="text-base font-bold mb-4 text-foreground text-center">{title}</h3>}
      <div className="space-y-3">
        {renderPlans()}
      </div>
    </div>
  );
};

export const PricingBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
  const [title, setTitle] = useState(block?.content?.title || '');
  const [plans, setPlans] = useState(block?.content?.plans?.length ? block.content.plans : [emptyPlan()]);
  const [loading, setLoading] = useState(false);

  const updatePlan = (idx, field, value) => {
    setPlans(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };
  const addPlan = () => setPlans(prev => [...prev, emptyPlan()]);
  const removePlan = (idx) => setPlans(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    const valid = plans.filter(p => p.name.trim() || p.price.trim());
    if (!valid.length) { toast.error('Добавьте хотя бы один тариф'); return; }
    setLoading(true);
    try {
      const content = { title, plans: valid };
      let res;
      if (block) {
        res = await api.updateBlock(block.id, { content });
      } else {
        res = await api.createBlock({ page_id: pageId, block_type: 'pricing', content, order: blocksCount });
      }
      if (res.ok) {
        toast.success(block ? 'Тарифы обновлены' : 'Блок тарифов добавлен');
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
          <h2 className="font-bold text-base flex-1 text-center">{block ? 'Редактировать тарифы' : 'Блок тарифов'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-[440px] mx-auto px-4 py-4 space-y-4">
        <div className="space-y-2">
          <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Заголовок (необязательно)</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="Выберите тариф" />
        </div>

        <div className="space-y-3">
          <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Тарифы</label>
          {plans.map((plan, idx) => (
            <div key={idx} className="bg-secondary/30 border border-border rounded-xl p-3 space-y-3">
              {/* Header row */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground flex-shrink-0">Тариф {idx + 1}</span>
                <div className="flex items-center gap-3 ml-auto">
                  <Toggle
                    checked={plan.highlighted}
                    onChange={val => updatePlan(idx, 'highlighted', val)}
                    label="Популярный"
                  />
                  {plans.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePlan(idx)}
                      className="p-1 text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Name */}
              <input
                type="text"
                value={plan.name}
                onChange={e => updatePlan(idx, 'name', e.target.value)}
                className="input text-sm"
                placeholder="Название (Базовый, Про, Бизнес)"
              />

              {/* Price + Currency + Period */}
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Цена и валюта</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={plan.price}
                    onChange={e => updatePlan(idx, 'price', e.target.value)}
                    className="input text-sm"
                    placeholder="5000"
                  />
                  <CurrencySelector
                    value={plan.currency}
                    onChange={val => updatePlan(idx, 'currency', val)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground flex-shrink-0">Период:</span>
                  <input
                    type="text"
                    value={plan.period}
                    onChange={e => updatePlan(idx, 'period', e.target.value)}
                    className="input text-sm flex-1"
                    placeholder="мес"
                  />
                </div>
              </div>

              {/* Features */}
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Что включено (каждая фича с новой строки)</label>
                <textarea
                  value={plan.features}
                  onChange={e => updatePlan(idx, 'features', e.target.value)}
                  className="input text-sm resize-none"
                  rows={3}
                  placeholder={"Безлимитные страницы\nАналитика\nПриоритетная поддержка"}
                />
              </div>

              {/* Button */}
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Кнопка</label>
                <input
                  type="text"
                  value={plan.button_text}
                  onChange={e => updatePlan(idx, 'button_text', e.target.value)}
                  className="input text-sm"
                  placeholder="Текст кнопки"
                />
                <input
                  type="url"
                  value={plan.button_url}
                  onChange={e => updatePlan(idx, 'button_url', e.target.value)}
                  className="input text-sm"
                  placeholder="https://..."
                />
              </div>
            </div>
          ))}

          {plans.length < 4 && (
            <button
              type="button"
              onClick={addPlan}
              className="w-full py-3 border border-dashed border-border rounded-xl text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Добавить тариф
            </button>
          )}
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
