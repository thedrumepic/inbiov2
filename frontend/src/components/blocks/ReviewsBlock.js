import React, { useState } from 'react';
import { api, getImageUrl } from '../../utils/api';
import { toast } from '../../utils/toast';
import { ArrowLeft, X, Star, Plus, Trash2, Loader2, GripVertical, Camera } from 'lucide-react';

const StarRating = ({ value, onChange, readonly = false }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange && onChange(i)}
          onMouseEnter={() => !readonly && setHovered(i)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              i <= (hovered || value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-transparent text-muted-foreground/30'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export const ReviewsBlockRenderer = ({ block }) => {
  const { title, reviews = [] } = block.content || {};
  if (!reviews.length) return null;
  return (
    <div className="p-4">
      {title && <h3 className="text-base font-bold mb-3 text-foreground">{title}</h3>}
      <div className="space-y-3">
        {reviews.map((r, i) => (
          <div key={i} className="flex gap-3 p-3 bg-secondary/40 rounded-xl border border-border/40">
            {r.photo ? (
              <img src={getImageUrl(r.photo)} alt={r.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 text-sm font-bold text-muted-foreground">
                {r.name ? r.name[0].toUpperCase() : '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-semibold text-sm text-foreground truncate">{r.name || 'Имя'}</span>
                <StarRating value={r.rating || 5} readonly />
              </div>
              {r.role && <div className="text-[11px] text-muted-foreground">{r.role}</div>}
              {r.text && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{r.text}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const emptyReview = () => ({ name: '', role: '', text: '', rating: 5, photo: '' });

export const ReviewsBlockEditor = ({ block, pageId, blocksCount, onClose, onSuccess }) => {
  const [title, setTitle] = useState(block?.content?.title || '');
  const [reviews, setReviews] = useState(block?.content?.reviews?.length ? block.content.reviews : [emptyReview()]);
  const [loading, setLoading] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);

  const updateReview = (idx, field, value) => {
    setReviews(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const addReview = () => setReviews(prev => [...prev, emptyReview()]);
  const removeReview = (idx) => setReviews(prev => prev.filter((_, i) => i !== idx));

  const handlePhotoUpload = async (idx, file) => {
    if (!file) return;
    setUploadingIdx(idx);
    try {
      const res = await api.uploadImage(file, 'avatars');
      if (res.ok) {
        const data = await res.json();
        updateReview(idx, 'photo', data.url);
      }
    } catch (e) {
      toast.error('Ошибка загрузки фото');
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleSubmit = async () => {
    const valid = reviews.filter(r => r.name.trim() || r.text.trim());
    if (!valid.length) { toast.error('Добавьте хотя бы один отзыв'); return; }
    setLoading(true);
    try {
      const content = { title, reviews: valid };
      let res;
      if (block) {
        res = await api.updateBlock(block.id, { content });
      } else {
        res = await api.createBlock({ page_id: pageId, block_type: 'reviews', content, order: blocksCount });
      }
      if (res.ok) {
        toast.success(block ? 'Отзывы обновлены' : 'Блок отзывов добавлен');
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
          <h2 className="font-bold text-base flex-1 text-center">{block ? 'Редактировать отзывы' : 'Блок отзывов'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-[440px] mx-auto px-4 py-4 space-y-4">
        <div className="space-y-2">
          <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Заголовок (необязательно)</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="input"
            placeholder="Что говорят клиенты"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Отзывы</label>
          {reviews.map((r, idx) => (
            <div key={idx} className="bg-secondary/30 border border-border rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Отзыв {idx + 1}</span>
                {reviews.length > 1 && (
                  <button onClick={() => removeReview(idx)} className="p-1 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Photo */}
              <div className="flex items-center gap-3">
                <label className="w-12 h-12 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-foreground/40 transition-colors overflow-hidden flex-shrink-0">
                  {uploadingIdx === idx ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : r.photo ? (
                    <img src={getImageUrl(r.photo)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-4 h-4 text-muted-foreground" />
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(idx, e.target.files[0])} />
                </label>
                <div className="flex-1 space-y-2">
                  <input type="text" value={r.name} onChange={e => updateReview(idx, 'name', e.target.value)} className="input text-sm" placeholder="Имя" />
                  <input type="text" value={r.role} onChange={e => updateReview(idx, 'role', e.target.value)} className="input text-sm" placeholder="Должность / город (необязательно)" />
                </div>
              </div>

              <StarRating value={r.rating} onChange={val => updateReview(idx, 'rating', val)} />

              <textarea
                value={r.text}
                onChange={e => updateReview(idx, 'text', e.target.value)}
                className="input text-sm resize-none"
                rows={3}
                placeholder="Текст отзыва..."
              />
            </div>
          ))}

          {reviews.length < 20 && (
            <button onClick={addReview} className="w-full py-3 border border-dashed border-border rounded-xl text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-all flex items-center justify-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              Добавить отзыв
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
