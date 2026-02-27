import React, { useState, useEffect, useRef } from 'react';
import { Tooltip } from './ui/Tooltip';
import { api, getImageUrl } from '../utils/api';
import { toast } from '../utils/toast';
import { Logo } from './Logo';
import ConfirmationModal from './ui/ConfirmationModal';
import { ThemeToggle } from './ThemeToggle';
import {
  Trash2,
  Camera,
  Plus,
  X,
  Type,
  Music,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Pencil,
  Link2,
  Eye,
  EyeOff,
  HelpCircle,
  ShoppingBag,
  Calendar,
  MessageSquare,
  MapPin,
  Heart,
  Timer,
  Minus,
  ArrowLeft,
  QrCode,
  Settings,
  Star,
} from 'lucide-react';
import { TextBlockEditor, TextBlockRenderer } from './blocks/TextBlock';
import { MusicBlockEditor, MusicBlockRenderer } from './blocks/MusicBlock';
import { LinkBlockRenderer, LinkModal, SOCIAL_PLATFORMS } from './blocks/LinkBlock';
import { ButtonBlockEditor, ButtonBlockRenderer } from './blocks/ButtonBlock';
import { FAQBlockEditor, FAQBlockRenderer } from './blocks/FAQBlock';
import { YouTubeBlockEditor, YouTubeBlockRenderer } from './blocks/YouTubeBlock';
import { ImageGalleryBlockEditor, ImageGalleryBlockRenderer } from './blocks/ImageGalleryBlock';
import { CountdownBlockEditor, CountdownBlockRenderer } from './blocks/CountdownBlock';
import { TikTokBlockEditor, TikTokBlockRenderer } from './blocks/TikTokBlock';
import { SocialIconsBlockEditor, SocialIconsBlockRenderer } from './blocks/SocialIconsBlock';
import { InstagramPostBlockEditor, InstagramPostBlockRenderer } from './blocks/InstagramPostBlock';
import { SpotifyBlockEditor, SpotifyBlockRenderer } from './blocks/SpotifyBlock';
import { AppleMusicBlockEditor, AppleMusicBlockRenderer } from './blocks/AppleMusicBlock';
import { PinterestBlockEditor, PinterestBlockRenderer } from './blocks/PinterestBlock';
import { DividerBlockEditor, DividerBlockRenderer } from './blocks/DividerBlock';
import { ContactFormBlockEditor, ContactFormBlockRenderer } from './blocks/ContactFormBlock';
import { MessengersBlockEditor, MessengersBlockRenderer } from './blocks/MessengersBlock';
import { MapBlockEditor, MapBlockRenderer } from './blocks/MapBlock';
import { DonationBlockEditor, DonationBlockRenderer } from './blocks/DonationBlock';
import { ShowcaseBlockEditor, ShowcaseBlockRenderer } from './blocks/ShowcaseBlock';
import { EventsBlockEditor, EventsBlockRenderer } from './blocks/EventsBlock';
import { QRBlockEditor, QRBlockRenderer } from './blocks/QRBlock';
import EditorHelpModal from './EditorHelpModal';
import { ReviewsBlockEditor, ReviewsBlockRenderer } from './blocks/ReviewsBlock';
import { ScheduleBlockEditor, ScheduleBlockRenderer } from './blocks/ScheduleBlock';
import { EmailSubscribeBlockEditor, EmailSubscribeBlockRenderer } from './blocks/EmailSubscribeBlock';
import { PricingBlockEditor, PricingBlockRenderer } from './blocks/PricingBlock';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';
import { useMediaQuery } from '../hooks/use-media-query';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from './ui/drawer';

const SortableItem = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
    scale: isDragging ? 1.02 : 1,
  };

  // Pass listeners only to the drag handle
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {React.cloneElement(children, { dragHandleProps: listeners })}
    </div>
  );
};

const PageEditor = ({ page, onClose }) => {
  const [pageData, setPageData] = useState({
    name: page.name,
    bio: page.bio || '',
    avatar: page.avatar,
    cover: page.cover,
    cover_position: page.cover_position || 50,
    theme: page.theme || 'auto',
  });
  const [blocks, setBlocks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [blockToDeleteId, setBlockToDeleteId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // idle, saving, saved, error
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const [isCoverPositionMode, setIsCoverPositionMode] = useState(false);
  const coverDragRef = useRef(null);
  const coverDragStartX = useRef(null);
  const coverDragStartY = useRef(null);
  const coverDragStartPosX = useRef(null);
  const coverDragStartPosY = useRef(null);
  const [showFloatingButton, setShowFloatingButton] = useState(false);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const hasLoadedInitially = useRef(false);
  const autosaveTimerRef = useRef(null);
  const addBlockButtonRef = useRef(null);
  const mainContainerRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadPageContent();
  }, [page.id]);

  // Отслеживание скролла для плавающей кнопки
  useEffect(() => {
    const handleScroll = () => {
      if (!addBlockButtonRef.current) return;
      
      const buttonRect = addBlockButtonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Кнопка видна, если она находится в пределах viewport
      const isButtonVisible = buttonRect.top >= 0 && buttonRect.top <= viewportHeight - 100;
      
      // Показываем плавающую кнопку только если основная кнопка не видна и есть хотя бы 2 блока
      setShowFloatingButton(!isButtonVisible && blocks.length >= 2);
    };

    // Слушаем скролл на window для корректной работы на всех устройствах
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    handleScroll(); // Проверяем сразу

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [blocks.length]);

  // Эффект для автосохранения
  useEffect(() => {
    if (!hasLoadedInitially.current) return;

    setSaveStatus('idle');
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(() => {
      handleSave(true);
    }, 5000);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [pageData, blocks]);

  const loadPageContent = async () => {
    try {
      const response = await api.getPageByUsername(page.username);
      if (response.ok) {
        const data = await response.json();
        setBlocks(data.blocks || []);
        // Помечаем, что первичная загрузка завершена, ПОСЛЕ установки блоков
        setTimeout(() => {
          hasLoadedInitially.current = true;
        }, 100);
      }
    } catch (error) {
      console.error('Error loading page content:', error);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const handleImageUpload = async (file, type) => {
    if (!file) return;

    // Use specific categories for uploads
    const category = type === 'avatar' ? 'avatars' : 'covers';

    try {
      const response = await api.uploadImage(file, category);
      if (response.ok) {
        const data = await response.json();
        setPageData((prev) => ({ ...prev, [type]: data.url }));
        toast.success('Изображение загружено');
      } else {
        toast.error('Ошибка загрузки');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  const handleRemoveImage = (type) => {
    setPageData((prev) => ({ ...prev, [type]: null }));
  };

  const handleSave = async (isAuto = false) => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    setSaving(true);
    setSaveStatus('saving');
    try {
      const pagePromise = api.updatePage(page.id, pageData);
      const blocksPromise = api.reorderBlocks(blocks.map(b => b.id));

      const [pageRes, blocksRes] = await Promise.all([pagePromise, blocksPromise]);

      if (pageRes.ok && blocksRes.ok) {
        if (!isAuto) toast.success('Изменения сохранены');
        setSaveStatus('saved');
      } else {
        if (!isAuto) toast.error('Ошибка сохранения');
        setSaveStatus('error');
      }
    } catch (error) {
      if (!isAuto) toast.error('Ошибка соединения');
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlock = async (blockId) => {
    try {
      const response = await api.deleteBlock(blockId);
      if (response.ok) {
        toast.success('Блок удалён');
        loadPageContent();
      }
    } catch (error) {
      console.error('Error deleting block:', error);
      toast.error('Ошибка удаления');
    }
  };

  const savedScrollY = useRef(0);

  const handleEditBlock = (block) => {
    savedScrollY.current = window.scrollY;
    setEditingBlock(block);
  };

  const handleMoveBlock = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const newBlocks = arrayMove(blocks, index, newIndex);
    setBlocks(newBlocks);
  };

  const handleSwapBlocks = (blockA, blockB) => {
    const idxA = blocks.findIndex(b => b.id === blockA.id);
    const idxB = blocks.findIndex(b => b.id === blockB.id);
    if (idxA === -1 || idxB === -1) return;

    const newBlocks = [...blocks];
    newBlocks[idxA] = blockB;
    newBlocks[idxB] = blockA;
    setBlocks(newBlocks);
  };

  const handleInternalMove = (list, index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    handleSwapBlocks(list[index], list[targetIndex]);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newBlocks = arrayMove(blocks, oldIndex, newIndex);
    setBlocks(newBlocks);
  };

  const handleBlockUpdateSuccess = async () => {
    setEditingBlock(null);
    await loadPageContent();
    handleSave(true);
    requestAnimationFrame(() => window.scrollTo({ top: savedScrollY.current, behavior: 'instant' }));
  };

  const handleCloseEditor = () => {
    setEditingBlock(null);
    requestAnimationFrame(() => window.scrollTo({ top: savedScrollY.current, behavior: 'instant' }));
  };

  const linkBlocks = blocks.filter(b => b.block_type === 'link');
  const otherBlocks = blocks.filter(b => b.block_type !== 'link');

  if (editingBlock) {
    if (editingBlock.block_type === 'text' || editingBlock === 'new_text') {
      return (
        <TextBlockEditor
          block={editingBlock === 'new_text' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'music' || editingBlock === 'new_music') {
      return (
        <MusicBlockEditor
          block={editingBlock === 'new_music' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'link') {
      return (
        <LinkModal
          block={editingBlock}
          pageId={page.id}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'button' || editingBlock === 'new_button') {
      return (
        <ButtonBlockEditor
          block={editingBlock === 'new_button' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'faq' || editingBlock === 'new_faq') {
      return (
        <FAQBlockEditor
          block={editingBlock === 'new_faq' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'youtube' || editingBlock === 'new_youtube') {
      return (
        <YouTubeBlockEditor
          block={editingBlock === 'new_youtube' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'gallery' || editingBlock === 'new_gallery') {
      return (
        <ImageGalleryBlockEditor
          block={editingBlock === 'new_gallery' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'countdown' || editingBlock === 'new_countdown') {
      return (
        <CountdownBlockEditor
          block={editingBlock === 'new_countdown' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'tiktok' || editingBlock === 'new_tiktok') {
      return (
        <TikTokBlockEditor
          block={editingBlock === 'new_tiktok' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'social_icons' || editingBlock === 'new_social_icons') {
      return (
        <SocialIconsBlockEditor
          block={editingBlock === 'new_social_icons' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'instagram_post' || editingBlock === 'new_instagram_post') {
      return (
        <InstagramPostBlockEditor
          block={editingBlock === 'new_instagram_post' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'spotify' || editingBlock === 'new_spotify') {
      return (
        <SpotifyBlockEditor
          block={editingBlock === 'new_spotify' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'applemusic' || editingBlock === 'new_applemusic') {
      return (
        <AppleMusicBlockEditor
          block={editingBlock === 'new_applemusic' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'pinterest' || editingBlock === 'new_pinterest') {
      return (
        <PinterestBlockEditor
          block={editingBlock === 'new_pinterest' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'divider' || editingBlock === 'new_divider') {
      return (
        <DividerBlockEditor
          block={editingBlock === 'new_divider' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'contact_form' || editingBlock === 'new_contact_form') {
      return (
        <ContactFormBlockEditor
          block={editingBlock === 'new_contact_form' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'messengers' || editingBlock === 'new_messengers') {
      return (
        <MessengersBlockEditor
          block={editingBlock === 'new_messengers' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'map' || editingBlock === 'new_map') {
      return (
        <MapBlockEditor
          block={editingBlock === 'new_map' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'donation' || editingBlock === 'new_donation') {
      return (
        <DonationBlockEditor
          block={editingBlock === 'new_donation' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'showcase' || editingBlock === 'new_showcase') {
      return (
        <ShowcaseBlockEditor
          block={editingBlock === 'new_showcase' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'events' || editingBlock === 'new_events') {
      return (
        <EventsBlockEditor
          block={editingBlock === 'new_events' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'qr_code' || editingBlock === 'new_qr_code') {
      return (
        <QRBlockEditor
          block={editingBlock === 'new_qr_code' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'reviews' || editingBlock === 'new_reviews') {
      return (
        <ReviewsBlockEditor
          block={editingBlock === 'new_reviews' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'schedule' || editingBlock === 'new_schedule') {
      return (
        <ScheduleBlockEditor
          block={editingBlock === 'new_schedule' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'email_subscribe' || editingBlock === 'new_email_subscribe') {
      return (
        <EmailSubscribeBlockEditor
          block={editingBlock === 'new_email_subscribe' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
    if (editingBlock.block_type === 'pricing' || editingBlock === 'new_pricing') {
      return (
        <PricingBlockEditor
          block={editingBlock === 'new_pricing' ? null : editingBlock}
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={handleCloseEditor}
          onSuccess={handleBlockUpdateSuccess}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="page-editor">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-[440px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a
              href="/dashboard"
              className="flex items-center gap-2 text-foreground font-bold text-sm truncate hover:opacity-70 transition-opacity min-w-0 max-w-[200px]"
            >
              <ArrowLeft className="w-4 h-4 flex-shrink-0" />
              /{page.username}
              {/* Компактный индикатор статуса */}
              {saveStatus === 'saving' && (
                <Tooltip content="Сохранение...">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse shrink-0" />
                </Tooltip>
              )}
              {saveStatus === 'saved' && (
                <Tooltip content="Сохранено">
                  <div className="w-2 h-2 bg-[#7dd3a8] rounded-full shrink-0" />
                </Tooltip>
              )}
              {saveStatus === 'idle' && (
                <Tooltip content="Не сохранено">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full shrink-0" />
                </Tooltip>
              )}
              {saveStatus === 'error' && (
                <Tooltip content="Ошибка при сохранении">
                  <div className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                </Tooltip>
              )}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle
              value={pageData.theme}
              onChange={(newTheme) => {
                setPageData(prev => {
                  const updated = { ...prev, theme: newTheme };
                  api.updatePage(page.id, updated).catch(() => {});
                  return updated;
                });
              }}
            />
            <Tooltip content="Как это работает?">
              <button
                onClick={() => setShowHelpModal(true)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-all"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </Tooltip>
            <button
              onClick={() => {
                if (saveStatus === 'saved') {
                  window.open(`/${page.username}`, '_blank');
                } else {
                  handleSave(false);
                }
              }}
              disabled={saving}
              className={`min-w-[100px] px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${saveStatus === 'saved'
                ? 'bg-secondary text-foreground hover:bg-secondary/80'
                : 'bg-foreground text-background hover:bg-foreground/90'
                } disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {saveStatus === 'saving' ? 'Сохраняем...' : saveStatus === 'saved' ? 'Перейти' : 'Сохранить'}
            </button>
          </div>
        </div>
      </header>

      <main ref={mainContainerRef} className="max-w-[440px] mx-auto px-4 py-6 overflow-y-auto">
        {/* Banner Section */}
        <div className="relative mb-2">
          <div
            ref={coverDragRef}
            className={`relative h-[215px] bg-card rounded-t-[12px] overflow-hidden border border-border select-none ${
              !pageData.cover ? 'cursor-pointer' :
              isCoverPositionMode ? (isDraggingCover ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-pointer'
            }`}
            onClick={(e) => { if (!pageData.cover) coverInputRef.current?.click(); }}
            onMouseDown={(e) => {
              if (!pageData.cover || !isCoverPositionMode) return;
              e.preventDefault();
              setIsDraggingCover(true);
              coverDragStartX.current = e.clientX;
              coverDragStartY.current = e.clientY;
              coverDragStartPosX.current = pageData.cover_position_x ?? 50;
              coverDragStartPosY.current = pageData.cover_position ?? 50;
            }}
            onMouseMove={(e) => {
              if (!isDraggingCover || !isCoverPositionMode) return;
              const rect = coverDragRef.current?.getBoundingClientRect();
              if (!rect) return;
              const dx = e.clientX - coverDragStartX.current;
              const dy = coverDragStartY.current - e.clientY;
              const sensitivityX = 100 / rect.width;
              const sensitivityY = 100 / rect.height;
              const newX = Math.min(100, Math.max(0, coverDragStartPosX.current - dx * sensitivityX));
              const newY = Math.min(100, Math.max(0, coverDragStartPosY.current + dy * sensitivityY));
              setPageData(prev => ({ ...prev, cover_position: Math.round(newY), cover_position_x: Math.round(newX) }));
            }}
            onMouseUp={() => setIsDraggingCover(false)}
            onMouseLeave={() => setIsDraggingCover(false)}
            onTouchStart={(e) => {
              if (!pageData.cover || !isCoverPositionMode) return;
              setIsDraggingCover(true);
              coverDragStartX.current = e.touches[0].clientX;
              coverDragStartY.current = e.touches[0].clientY;
              coverDragStartPosX.current = pageData.cover_position_x ?? 50;
              coverDragStartPosY.current = pageData.cover_position ?? 50;
            }}
            onTouchMove={(e) => {
              if (!isDraggingCover || !isCoverPositionMode) return;
              e.preventDefault();
              const rect = coverDragRef.current?.getBoundingClientRect();
              if (!rect) return;
              const dx = e.touches[0].clientX - coverDragStartX.current;
              const dy = coverDragStartY.current - e.touches[0].clientY;
              const sensitivityX = 100 / rect.width;
              const sensitivityY = 100 / rect.height;
              const newX = Math.min(100, Math.max(0, coverDragStartPosX.current - dx * sensitivityX));
              const newY = Math.min(100, Math.max(0, coverDragStartPosY.current + dy * sensitivityY));
              setPageData(prev => ({ ...prev, cover_position: Math.round(newY), cover_position_x: Math.round(newX) }));
            }}
            onTouchEnd={() => setIsDraggingCover(false)}
          >
            {pageData.cover ? (
              <>
                <img
                  src={getImageUrl(pageData.cover)}
                  alt="Обложка"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: `${pageData.cover_position_x ?? 50}% ${pageData.cover_position ?? 50}%` }}
                  draggable={false}
                />
                {isCoverPositionMode && (
                  <div className="absolute top-0 inset-x-0 flex items-center justify-center pt-3 pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-3 py-1.5 rounded-full">
                      Перетаскивайте для позиции
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-start justify-center pt-10">
                <div className="text-center group">
                  <Camera className="w-8 h-8 text-gray-500 mx-auto mb-2 group-hover:text-gray-300 transition-colors" />
                  <span className="text-[10px] text-gray-500 group-hover:text-gray-300">Рекомендуемый размер 1500x500 px</span>
                </div>
              </div>
            )}
          </div>

          {pageData.cover && (
            <div className="absolute top-3 right-3 flex gap-2 z-20">
              <button
                onClick={(e) => { e.stopPropagation(); setIsCoverPositionMode(v => !v); }}
                className={`w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 ${isCoverPositionMode ? 'bg-white text-black' : 'bg-black/60 text-white hover:bg-black/80'}`}
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleRemoveImage('cover'); }}
                className="w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-500 hover:scale-110 transition-all duration-200"
              >
                <Trash2 className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          )}


          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageUpload(e.target.files[0], 'cover')}
          />
        </div>

        {/* Profile & Links Card */}
        <div className="relative -mt-12 z-10 space-y-4">
          <div className="relative">
            <div className="absolute left-1/2 -translate-x-1/2 -top-12 z-20">
              <div className="relative group">
                <div
                  className="w-24 h-24 rounded-full bg-card border-4 border-background cursor-pointer overflow-hidden shadow-2xl"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {pageData.avatar ? (
                    <img src={getImageUrl(pageData.avatar)} alt="Аватар" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                </div>

                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center z-30">
                  <div className="relative">
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      className="w-6 h-6 bg-foreground text-background rounded-full flex items-center justify-center border border-border hover:bg-foreground/90 hover:scale-110 transition-all duration-200 shadow-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    {pageData.avatar && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveImage('avatar'); }}
                        className="absolute left-[calc(100%+4px)] top-1/2 -translate-y-1/2 w-7 h-7 bg-black/80 rounded-full flex items-center justify-center border border-white/20 hover:bg-red-500 hover:scale-110 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-white" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-[12px] border border-border pt-16 pb-6 px-4 shadow-xl">
              <div className="space-y-4 mb-4">
                <input
                  type="text"
                  value={pageData.name}
                  onChange={(e) => setPageData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-[12px] text-foreground text-left font-medium text-base placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
                  placeholder="Имя или название страницы"
                />
                <textarea
                  value={pageData.bio}
                  onChange={(e) => setPageData((prev) => ({ ...prev, bio: e.target.value }))}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-[12px] text-foreground text-sm text-left placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all resize-y min-h-[100px]"
                  placeholder="О себе, описание или подпись."
                  rows={3}
                />
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={linkBlocks.map(b => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4 mb-4">
                    {linkBlocks.map((block, index) => (
                      <SortableItem key={block.id} id={block.id}>
                        <EditableBlockWrapper
                          block={block}
                          index={index}
                          isFirst={index === 0}
                          isLast={index === linkBlocks.length - 1}
                          onDelete={() => setBlockToDeleteId(block.id)}
                          onEdit={() => handleEditBlock(block)}
                          onMove={(dir) => handleInternalMove(linkBlocks, index, dir)}
                        />
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <button
                onClick={() => setShowLinkModal(true)}
                className="w-full py-3 bg-secondary border border-dashed border-border rounded-[12px] text-muted-foreground font-medium hover:border-foreground/40 hover:bg-secondary/80 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Добавить ссылку</span>
              </button>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(e.target.files[0], 'avatar')}
            />
          </div>

          {/* Other Blocks Section */}
          <div className="space-y-4">
            {otherBlocks.length > 0 && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={otherBlocks.map(b => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {otherBlocks.map((block, index) => (
                      <SortableItem key={block.id} id={block.id}>
                        <EditableBlockWrapper
                          block={block}
                          index={index}
                          isFirst={index === 0}
                          isLast={index === otherBlocks.length - 1}
                          onDelete={() => setBlockToDeleteId(block.id)}
                          onEdit={() => handleEditBlock(block)}
                          onMove={(dir) => handleInternalMove(otherBlocks, index, dir)}
                        />
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            <button
              ref={addBlockButtonRef}
              onClick={() => setShowBlockModal(true)}
              className="w-full py-4 bg-card border border-border rounded-[12px] text-gray-400 font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-2 shadow-sm group"
            >
              <Plus className="w-5 h-5 group-hover:text-foreground transition-colors" />
              <span className="group-hover:text-foreground transition-colors">Добавить новый блок</span>
            </button>

            {loadingBlocks && (
              <div className="py-4 text-center">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-16 pb-8">
          <a
            href="https://inbio.one"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-gray-700 hover:text-gray-400 transition-colors"
          >
            <span className="text-[10px] tracking-wider uppercase opacity-50">Powered by</span>
            <Logo size="xs" className="opacity-40" forceTheme={pageData.theme} />
          </a>
        </div>

        {/* Floating Add Block Button */}
        {showFloatingButton && (
          <button
            onClick={() => setShowBlockModal(true)}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center group animate-in fade-in slide-in-from-bottom-4"
            aria-label="Добавить блок"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </main>

      {showLinkModal && (
        <LinkModal
          pageId={page.id}
          blocksCount={blocks.length}
          onClose={() => setShowLinkModal(false)}
          onSuccess={() => { setShowLinkModal(false); toast.success('Ссылка добавлена'); handleBlockUpdateSuccess(); }}
        />
      )}

      {showBlockModal && (
        <BlockTypeModal
          onClose={() => setShowBlockModal(false)}
          onSelectType={(type) => {
            setShowBlockModal(false);
            if (type === 'text') setEditingBlock('new_text');
            else if (type === 'music') setEditingBlock('new_music');
            else if (type === 'button') setEditingBlock('new_button');
            else if (type === 'faq') setEditingBlock('new_faq');
            else if (type === 'youtube') setEditingBlock('new_youtube');
            else if (type === 'gallery') setEditingBlock('new_gallery');
            else if (type === 'countdown') setEditingBlock('new_countdown');
            else if (type === 'tiktok') setEditingBlock('new_tiktok');
            else if (type === 'social_icons') setEditingBlock('new_social_icons');
            else if (type === 'instagram_post') setEditingBlock('new_instagram_post');
            else if (type === 'spotify') setEditingBlock('new_spotify');
            else if (type === 'applemusic') setEditingBlock('new_applemusic');
            else if (type === 'pinterest') setEditingBlock('new_pinterest');
            else if (type === 'divider') setEditingBlock('new_divider');
            else if (type === 'contact_form') setEditingBlock('new_contact_form');
            else if (type === 'messengers') setEditingBlock('new_messengers');
            else if (type === 'map') setEditingBlock('new_map');
            else if (type === 'donation') setEditingBlock('new_donation');
            else if (type === 'showcase') setEditingBlock('new_showcase');
            else if (type === 'events') setEditingBlock('new_events');
            else if (type === 'qr_code') setEditingBlock('new_qr_code');
            else if (type === 'reviews') setEditingBlock('new_reviews');
            else if (type === 'schedule') setEditingBlock('new_schedule');
            else if (type === 'email_subscribe') setEditingBlock('new_email_subscribe');
            else if (type === 'pricing') setEditingBlock('new_pricing');
          }}
        />
      )}

      <ConfirmationModal
        isOpen={!!blockToDeleteId}
        onClose={() => setBlockToDeleteId(null)}
        onConfirm={() => handleDeleteBlock(blockToDeleteId)}
        title="Удалить блок?"
        message="Вы уверены, что хотите удалить этот блок? Данное действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
      />

      {showHelpModal && (
        <EditorHelpModal onClose={() => setShowHelpModal(false)} />
      )}
    </div>
  );
};

const EditableBlockWrapper = ({ block, index, isFirst, isLast, onDelete, onEdit, onMove, dragHandleProps }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderBlock = () => {
    switch (block.block_type) {
      case 'text':
        return <TextBlockRenderer block={block} />;
      case 'music':
        return <MusicBlockRenderer block={block} isPreview={true} />;
      case 'link':
        return <LinkBlockRenderer block={block} />;
      case 'button':
        return <ButtonBlockRenderer block={block} />;
      case 'faq':
        return <FAQBlockRenderer block={block} />;
      case 'youtube':
        return <YouTubeBlockRenderer block={block} />;
      case 'gallery':
        return <ImageGalleryBlockRenderer block={block} />;
      case 'countdown':
        return <CountdownBlockRenderer block={block} />;
      case 'tiktok':
        return <TikTokBlockRenderer block={block} />;
      case 'social_icons':
        return <SocialIconsBlockRenderer block={block} />;
      case 'instagram_post':
        return <InstagramPostBlockRenderer block={block} />;
      case 'spotify':
        return <SpotifyBlockRenderer block={block} />;
      case 'applemusic':
        return <AppleMusicBlockRenderer block={block} />;
      case 'pinterest':
        return <PinterestBlockRenderer block={block} />;
      case 'divider':
        return <DividerBlockRenderer block={block} />;
      case 'contact_form':
        return <ContactFormBlockRenderer block={block} />;
      case 'messengers':
        return <MessengersBlockRenderer block={block} />;
      case 'map':
        return <MapBlockRenderer block={block} />;
      case 'donation':
        return <DonationBlockRenderer block={block} />;
      case 'showcase':
        return <ShowcaseBlockRenderer block={block} />;
      case 'events':
        return <EventsBlockRenderer block={block} />;
      case 'qr_code':
        return <QRBlockRenderer block={block} />;
      case 'reviews':
        return <ReviewsBlockRenderer block={block} />;
      case 'schedule':
        return <ScheduleBlockRenderer block={block} />;
      case 'email_subscribe':
        return <EmailSubscribeBlockRenderer block={block} />;
      case 'pricing':
        return <PricingBlockRenderer block={block} />;
      default:
        return <div className="p-4 bg-white/5 rounded-lg">Unknown Block Type</div>;
    }
  };

  const getBlockLabel = () => {
    switch (block.block_type) {
      case 'text': return 'Текст';
      case 'music': return block.content?.title ? `Музыка: ${block.content.title} ` : 'Музыка';
      case 'link': {
        if (block.content?.platform && block.content.platform !== 'custom') {
          const platform = SOCIAL_PLATFORMS.find(p => p.id === block.content.platform);
          return platform ? platform.name : 'Ссылка';
        }
        return block.content?.title || 'Ссылка';
      }
      case 'button': return block.content?.title || 'Кнопка';
      case 'faq': return block.content?.title || 'FAQ (Аккордеон)';
      case 'youtube': return block.content?.title || 'YouTube Видео';
      case 'gallery': return block.content?.title || 'Галерея фото';
      case 'countdown': return block.content?.title || 'Таймер';
      case 'tiktok': return 'TikTok Видео';
      case 'social_icons': return 'Социальные иконки';
      case 'instagram_post': return 'Threads / Instagram';
      case 'spotify': return block.content?.title || 'Spotify';
      case 'applemusic': return block.content?.title || 'Apple Music';
      case 'pinterest': return block.content?.title || 'Pinterest';
      case 'divider': return 'Разделитель';
      case 'contact_form': return 'Форма контактов';
      case 'messengers': return block.content?.button_label || 'Мессенджеры';
      case 'map': return 'Карта';
      case 'donation': return 'Донаты / Поддержка';
      case 'showcase': return block.content?.title || 'Витрина';
      case 'events': return block.content?.title || 'Афиша событий';
      case 'qr_code': return block.content?.title || 'QR-код';
      case 'reviews': return block.content?.title || 'Отзывы';
      case 'schedule': return block.content?.title || 'Расписание';
      case 'email_subscribe': return block.content?.title || 'Email-подписка';
      case 'pricing': return block.content?.title || 'Тарифы';
      default: return block.block_type;
    }
  };

  return (
    <div className="relative group/block max-w-[440px] mx-auto mb-4 last:mb-0 transition-all duration-300">
      {/* Control Bar */}
      <div className={`flex items-center justify-between px-3 py-2 bg-secondary border border-border ${isCollapsed ? 'rounded-[18px]' : 'rounded-t-[18px] border-b-0'} transition-all duration-300 relative z-10`}>
        <div className="flex items-center gap-3">
          <Tooltip content="Удерживайте, чтобы перетащить">
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/5 rounded transition-colors">
              <GripVertical className="w-4 h-4 text-gray-500" />
            </div>
          </Tooltip>
          <span className="text-[13px] font-bold text-foreground tracking-wide">{getBlockLabel()}</span>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip content={isCollapsed ? "Развернуть" : "Свернуть"}>
            <button
              onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-foreground hover:bg-white/5 rounded-lg transition-all"
            >
              {isCollapsed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </Tooltip>
          <Tooltip content="Вверх">
            <button
              onClick={(e) => { e.stopPropagation(); onMove(-1); }}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-foreground hover:bg-white/5 rounded-lg transition-all disabled:opacity-20"
              disabled={isFirst}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="Вниз">
            <button
              onClick={(e) => { e.stopPropagation(); onMove(1); }}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-foreground hover:bg-white/5 rounded-lg transition-all disabled:opacity-20"
              disabled={isLast}
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="Редактировать блок">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-foreground hover:bg-white/5 rounded-lg transition-all"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="Удалить блок">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-8 h-8 flex items-center justify-center text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Stack Effect for Collapsed State */}
      {isCollapsed && (
        <div className="absolute -bottom-1.5 inset-x-3 h-4 bg-card/60 border-b border-x border-white/5 rounded-b-[18px] -z-10 animate-in slide-in-from-top-1 duration-300" />
      )}

      {/* Block Content Container */}
      {!isCollapsed && (
        <div
          className="bg-card border-b border-x border-border rounded-b-[18px] overflow-hidden cursor-pointer active:scale-[0.995] transition-all duration-300 [&_.mb-6]:mb-0 shadow-xl"
          onClick={onEdit}
        >
          <div className="pointer-events-none select-none">
            {renderBlock()}
          </div>
        </div>
      )}
    </div>
  );
};

const BlockTypeModal = ({ onClose, onSelectType }) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const categories = {
    formatting: {
      title: 'Форматирование',
      items: [
        { id: 'text', label: 'Текст', icon: Type, description: 'Текстовый блок с форматированием' },
        { id: 'faq', label: 'FAQ', icon: HelpCircle, description: 'Раскрывающийся список вопросов и ответов' },
        { id: 'button', label: 'Кнопка', icon: Plus, description: 'Кнопка для ссылок или скачивания файлов' },
        { id: 'divider', label: 'Разделитель', icon: Minus, description: 'Пустое пространство или линия-разделитель' },
      ]
    },
    media: {
      title: 'Медиа',
      items: [
        { id: 'gallery', label: 'Фотографии', icon: Camera, description: 'Галерея из одного или нескольких фото' },
        { id: 'music', label: 'Музыкальный релиз', icon: Music, description: 'Музыкальный релиз со ссылками' },
        {
          id: 'youtube',
          label: 'YouTube',
          icon: () => <img src={getImageUrl('/uploads/social-logo/youtube.svg')} alt="YouTube" className="w-5 h-5" />,
          description: 'Вставка видео с YouTube'
        },
        {
          id: 'spotify',
          label: 'Spotify',
          icon: () => <img src={getImageUrl('/uploads/social-logo/spotify.svg')} alt="Spotify" className="w-5 h-5" />,
          description: 'Плеер Spotify (треки, альбомы, плейлисты)'
        },
        {
          id: 'applemusic',
          label: 'Apple Music',
          icon: () => <img src={getImageUrl('/uploads/music-platform/applemusic.svg')} alt="Apple Music" className="w-5 h-5" />,
          description: 'Плеер Apple Music (песни, альбомы, плейлисты)'
        },
        {
          id: 'pinterest',
          label: 'Pinterest',
          icon: () => <img src={getImageUrl('/uploads/social-logo/pinterest.svg')} alt="Pinterest" className="w-5 h-5" />,
          description: 'Пины и доски из Pinterest'
        },
      ]
    },
    social: {
      title: 'Социальные сети',
      items: [
        {
          id: 'social_icons',
          label: 'Социальные иконки',
          icon: () => <img src={getImageUrl('/uploads/social-logo/instagram.svg')} alt="Social" className="w-5 h-5" />,
          description: 'Горизонтальный ряд иконок соцсетей'
        },
        {
          id: 'instagram_post',
          label: 'Threads / Instagram',
          icon: () => <img src={getImageUrl('/uploads/social-logo/threads.svg') + '?v=2'} alt="Threads" className="w-5 h-5 dark:invert" />,
          description: 'Встроить пост из Threads или Instagram'
        },
        {
          id: 'tiktok',
          label: 'TikTok',
          icon: () => <img src={getImageUrl('/uploads/social-logo/tiktok.svg') + '?v=2'} alt="TikTok" className="w-5 h-5 dark:invert" />,
          description: 'Вставка видео из TikTok'
        },
      ]
    },
    communication: {
      title: 'Связь и контакты',
      items: [
        {
          id: 'messengers',
          label: 'Мессенджеры',
          icon: () => <img src={getImageUrl('/uploads/social-logo/whatsapp.svg')} alt="Messengers" className="w-5 h-5" />,
          description: 'Кнопки WhatsApp и Telegram'
        },
        {
          id: 'contact_form',
          label: 'Форма заявок',
          icon: MessageSquare,
          description: 'Сбор данных от посетителей'
        },
        {
          id: 'map',
          label: 'Карта',
          icon: MapPin,
          description: 'Google / Яндекс Карты'
        },
        {
          id: 'donation',
          label: 'Донаты',
          icon: Heart,
          description: 'Сбор поддержки и QR-коды'
        },
        {
          id: 'email_subscribe',
          label: 'Email-подписка',
          icon: MessageSquare,
          description: 'Форма подписки, лиды в настройки'
        },
      ]
    },
    business: {
      title: 'Бизнес',
      items: [
        { id: 'showcase', label: 'Витрина', icon: ShoppingBag, description: 'Карточка товара с кнопкой заказа' },
        { id: 'pricing', label: 'Тарифы', icon: Star, description: 'Карточки тарифов с ценами и функциями' },
        { id: 'reviews', label: 'Отзывы', icon: Heart, description: 'Карточки с именем, фото и звёздами' },
        { id: 'schedule', label: 'Расписание', icon: Calendar, description: 'Рабочие часы по дням недели' },
        { id: 'events', label: 'Афиша', icon: Calendar, description: 'Список или блок предстоящих событий' },
        { id: 'countdown', label: 'Таймер', icon: Timer, description: 'Обратный отсчет до события' },
        { id: 'qr_code', label: 'QR-код', icon: QrCode, description: 'Брендированный код для ссылок' },
      ]
    }
  };

  const content = (
    <div className="space-y-6">
      {Object.entries(categories).map(([key, category]) => (
        <div key={key}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">{category.title}</h3>
          <div className="space-y-2">
            {category.items.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => onSelectType(type.id)}
                  className="w-full flex items-center gap-4 p-4 bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border rounded-[16px] transition-all group text-left"
                >
                  <div className="w-10 h-10 bg-background rounded-[10px] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground mb-0.5">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  if (isDesktop) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="w-full max-w-[440px] bg-card rounded-t-[24px] sm:rounded-[24px] animate-slide-up border border-border max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 pb-4 shrink-0 bg-card z-10">
            <h2 className="text-xl font-bold text-foreground">Выберите тип блока</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-secondary rounded-full transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <div className="p-6 pt-2 overflow-y-auto">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Drawer open={true} onOpenChange={(open) => { if (!open) onClose(); }} modal={true} dismissible={false}>
      <DrawerContent className="max-h-[85vh] focus-within:max-h-[80vh]">
        <DrawerHeader className="text-left px-6 pt-6 pb-4 flex items-center justify-between">
          <DrawerTitle className="text-xl font-bold text-foreground">Выберите тип блока</DrawerTitle>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }} 
            className="w-8 h-8 flex items-center justify-center hover:bg-secondary rounded-full transition-colors shrink-0"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </DrawerHeader>
        <div className="px-6 pb-8 overflow-y-auto">
          {content}
        </div>
      </DrawerContent>
    </Drawer>
  );
};


export default PageEditor;
