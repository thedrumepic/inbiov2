import React, { useState, useRef } from 'react';
import { X, User, Link2, LayoutGrid, ArrowUpDown, Eye, Moon, Sun, BadgeCheck, ShieldCheck, Heart, ShoppingBag, Calendar, Timer, QrCode, ChevronRight } from 'lucide-react';

const EditorHelpModal = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        { id: 'profile', label: 'Профиль', icon: User },
        { id: 'links', label: 'Ссылки', icon: Link2 },
        { id: 'blocks', label: 'Блоки', icon: LayoutGrid },
        { id: 'sort', label: 'Сортировка', icon: ArrowUpDown },
        { id: 'theme', label: 'Тема', icon: Moon },
        { id: 'publish', label: 'Публикация', icon: Eye },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h3 className="text-lg font-bold">Настройка профиля</h3>
                        <p className="text-muted-foreground">
                            Здесь вы можете изменить основную информацию о себе.
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-sm text-foreground/80">
                            <li>
                                <strong>Аватар:</strong> Нажмите на круглую иконку с камерой или плюсом, чтобы загрузить фото профиля.
                            </li>
                            <li>
                                <strong>Обложка:</strong> Нажмите на верхнюю область (баннер), чтобы загрузить фоновое изображение.
                            </li>
                            <li>
                                <strong>Имя и Описание:</strong> Просто кликните на поле ввода имени или описания ("О себе") и начните печатать. Сохранение происходит автоматически.
                            </li>
                            <li>
                                <strong>Верификация:</strong> Значок <span className="inline-flex items-center text-foreground"><BadgeCheck className="w-3.5 h-3.5 ml-1" /></span> рядом с именем означает подтвержденный профиль, а <span className="inline-flex items-center text-foreground"><ShieldCheck className="w-3.5 h-3.5 ml-1" /></span> — подтвержденный бренд. Статус можно получить в настройках Dashboard.
                            </li>
                            <li>
                                <strong>Никнейм (ссылка):</strong> Чтобы изменить адрес страницы (inbio.one/...), перейдите в Настройки (шестеренка на главной панели).
                            </li>
                        </ul>
                    </div>
                );
            case 'links':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h3 className="text-lg font-bold">Добавление ссылок</h3>
                        <p className="text-muted-foreground">
                            Ссылки — это основной способ направить аудиторию на ваши ресурсы.
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-sm text-foreground/80">
                            <li>
                                Нажмите кнопку <strong>"Добавить ссылку"</strong> под блоком профиля.
                            </li>
                            <li>
                                В открывшемся окне введите URL (например, <code>https://t.me/yourchannel</code>).
                            </li>
                            <li>
                                Система автоматически попытается определить соцсеть и подставит нужную иконку (Telegram, Instagram, YouTube и т.д.).
                            </li>
                            <li>
                                Если иконка не определилась, будет использована стандартная иконка ссылки.
                            </li>
                            <li>
                                Чтобы <strong>изменить</strong> или <strong>удалить</strong> ссылку, нажмите на иконку карандаша или корзины на самом блоке ссылки.
                            </li>
                        </ul>
                    </div>
                );
            case 'blocks':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 text-sm">
                        <h3 className="text-lg font-bold mb-2">Типы блоков</h3>
                        <p className="text-muted-foreground mb-4">
                            Нажмите <strong>"Добавить новый блок"</strong> внизу страницы, чтобы выбрать тип контента:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    <LayoutGrid className="w-4 h-4 text-blue-400" /> Текст
                                </div>
                                <p className="text-[12px] text-muted-foreground leading-snug">
                                    Полноценный редактор: жирный, курсив, ссылки и <strong>выделение цветом</strong>. Кликабельность всего блока.
                                </p>
                            </div>

                            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    <Link2 className="w-4 h-4 text-purple-400" /> Музыка
                                </div>
                                <p className="text-[12px] text-muted-foreground leading-snug">
                                    6 стильных пресетов (Brutal, Cyber, Glass и др.). Поиск по URL или <strong>UPC/ISRC кодам</strong>.
                                </p>
                            </div>

                            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    <LayoutGrid className="w-4 h-4 text-green-400" /> FAQ
                                </div>
                                <p className="text-[12px] text-muted-foreground leading-snug">
                                    Вопросы и ответы в виде аккордеона. Экономит место и отвечает на частые вопросы.
                                </p>
                            </div>

                            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    <LayoutGrid className="w-4 h-4 text-orange-400" /> Галерея
                                </div>
                                <p className="text-[12px] text-muted-foreground leading-snug">
                                    Несколько фото с горизонтальной прокруткой и полноэкранным просмотром.
                                </p>
                            </div>

                            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    <LayoutGrid className="w-4 h-4 text-pink-400" /> Соцсети
                                </div>
                                <p className="text-[12px] text-muted-foreground leading-snug">
                                    Компактный ряд иконок для всех платформ. Лучшее решение для подвала страницы.
                                </p>
                            </div>

                            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    <Eye className="w-4 h-4 text-red-400" /> YouTube
                                </div>
                                <p className="text-[12px] text-muted-foreground leading-snug">
                                    Встраивание видео с YouTube. Контент виден прямо на вашей странице.
                                </p>
                            </div>

                            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    <Eye className="w-4 h-4 text-green-500" /> Spotify
                                </div>
                                <p className="text-[12px] text-muted-foreground leading-snug">
                                    Плеер Spotify: треки, альбомы, плейлисты. Вставьте ссылку — получите рабочий плеер.
                                </p>
                            </div>

                            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    <Eye className="w-4 h-4 text-pink-500" /> Apple Music
                                </div>
                                <p className="text-[12px] text-muted-foreground leading-snug">
                                    Плеер Apple Music: песни, альбомы, плейлисты. Полная интеграция с платформой.
                                </p>
                            </div>

                            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    <Eye className="w-4 h-4 text-red-500" /> Pinterest
                                </div>
                                <p className="text-[12px] text-muted-foreground leading-snug">
                                    Встраивание пинов и досок из Pinterest. Визуальный контент прямо на странице.
                                </p>
                            </div>

                            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    <Eye className="w-4 h-4 text-cyan-400" /> TikTok / Instagram
                                </div>
                                <p className="text-[12px] text-muted-foreground leading-snug">
                                    Встраивание TikTok видео и постов из Instagram/Threads прямо на странице.
                                </p>
                            </div>

                            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    <LayoutGrid className="w-4 h-4 text-blue-500" /> Форма контактов
                                </div>
                                <p className="text-[12px] text-muted-foreground leading-snug">
                                    Собирайте заявки (Имя, Email, Телефон). Данные сохраняются в настройках.
                                </p>
                            </div>

                            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    <LayoutGrid className="w-4 h-4 text-green-500" /> Мессенджеры
                                </div>
                                <p className="text-[12px] text-muted-foreground leading-snug">
                                    Кнопки WhatsApp и Telegram с поддержкой предзаполненных сообщений.
                                </p>
                            </div>

                            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    <Heart className="w-4 h-4 text-red-400" /> Донаты
                                </div>
                                <p className="text-[12px] text-muted-foreground leading-snug">
                                    Прием поддержки: QR-коды (Kaspi, PayPal) или ссылки. <strong>3 стиля</strong> и удобное модальное окно.
                                </p>
                            </div>

                            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    <LayoutGrid className="w-4 h-4 text-red-500" /> Карта
                                </div>
                                <p className="text-[12px] text-muted-foreground leading-snug">
                                    Встраивание карт Google или Яндекс для указания локации.
                                </p>
                            </div>

                            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    <LayoutGrid className="w-4 h-4 text-purple-600" /> Кнопка
                                </div>
                                <p className="text-[12px] text-muted-foreground leading-snug">
                                    Для ссылок или файлов. <strong>9 дизайнерских стилей</strong> (Cyber, Liquid, Luxury и др.), иконки и подписи.
                                </p>
                            </div>

                            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    <LayoutGrid className="w-4 h-4 text-orange-500" /> Таймер
                                </div>
                                <p className="text-[12px] text-muted-foreground leading-snug">
                                    Обратный отсчет до события. Идеально для анонсов и запуска продаж.
                                </p>
                            </div>

                            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    <LayoutGrid className="w-4 h-4 text-gray-400" /> Разделитель
                                </div>
                                <p className="text-[12px] text-muted-foreground leading-snug">
                                    Пустое пространство или линия-разделитель для визуального разделения контента.
                                </p>
                            </div>

                            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    <ShoppingBag className="w-4 h-4 text-emerald-400" /> Витрина
                                </div>
                                <p className="text-[12px] text-muted-foreground leading-snug">
                                    Мини-магазин: цены, валюты и два режима (список или сетка). Заявки на товары приходят в Dashboard.
                                </p>
                            </div>

                            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    <Calendar className="w-4 h-4 text-amber-500" /> Афиша
                                </div>
                                <p className="text-[12px] text-muted-foreground leading-snug">
                                    Расписание событий с обложками, локацией и билетами. Умная сортировка по дате.
                                </p>
                            </div>

                            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    <QrCode className="w-4 h-4 text-indigo-400" /> QR-код
                                </div>
                                <p className="text-[12px] text-muted-foreground leading-snug">
                                    Автогенерация кода для ссылки. Настройка цвета и подписи для стильного вида.
                                </p>
                            </div>
                        </div>
                    </div >
                );
            case 'sort':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h3 className="text-lg font-bold">Управление порядком</h3>
                        <p className="text-muted-foreground">
                            Вы можете легко менять блоки местами.
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-sm text-foreground/80">
                            <li>
                                <strong>Перетаскивание:</strong> Зажмите иконку "шести точек" (слева от названия блока) и перетащите блок вверх или вниз.
                            </li>
                            <li>
                                <strong>Стрелки:</strong> Используйте кнопки со стрелками Вверх/Вниз в панели управления блока для перемещения на одну позицию.
                            </li>
                            <li>
                                <strong>Свернуть/Развернуть:</strong> Нажмите на иконку глаза, чтобы свернуть содержимое блока для удобства сортировки (это не скрывает блок на публичной странице, только в редакторе).
                            </li>
                        </ul>
                    </div>
                );
            case 'theme':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h3 className="text-lg font-bold">Оформление и Тема</h3>
                        <p className="text-muted-foreground">
                            Выбранная вами тема редактора влияет на внешний вид публичной страницы.
                        </p>

                        <div className="grid grid-cols-1 gap-4 mt-4">
                            <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 text-white">
                                <div className="flex items-center gap-2 mb-2 font-bold">
                                    <Moon className="w-4 h-4 text-purple-400" /> Тёмная тема
                                </div>
                                <p className="text-sm text-zinc-400">
                                    Переключатель находится в верхней панели навигации. В тёмном режиме ваша публичная страница будет оформлена в тёмных, стильных тонах.
                                </p>
                            </div>

                            <div className="p-4 bg-white rounded-xl border border-gray-200 text-black">
                                <div className="flex items-center gap-2 mb-2 font-bold">
                                    <Sun className="w-4 h-4 text-yellow-500" /> Светлая тема
                                </div>
                                <p className="text-sm text-gray-600">
                                    В светлом режиме страница станет более легкой и минималистичной. Настройка темы в редакторе мгновенно меняет вид вашей публичной страницы.
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case 'publish':
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h3 className="text-lg font-bold">Публикация и Сохранение</h3>
                        <p className="text-muted-foreground">
                            Как работает сохранение изменений.
                        </p>

                        <div className="space-y-3 mt-4">
                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0" />
                                <div>
                                    <strong className="block text-foreground">Автосохранение</strong>
                                    <span className="text-muted-foreground text-sm">
                                        Все текстовые изменения (имя, био) и перемещения блоков сохраняются автоматически через несколько секунд после ввода.
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                                <div>
                                    <strong className="block text-foreground">Редактирование блоков</strong>
                                    <span className="text-muted-foreground text-sm">
                                        Когда вы редактируете содержимое блока (например, меняете текст или настройки музыки) и нажимаете кнопку <strong>"Сохранить"</strong> внутри блока — изменения применяются мгновенно.
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 shrink-0" />
                                <div>
                                    <strong className="block text-foreground">Просмотр</strong>
                                    <span className="text-muted-foreground text-sm">
                                        Нажмите кнопку <strong>"Перейти"</strong> в правом верхнем углу (если статус "Сохранено"), чтобы открыть вашу публичную страницу в новой вкладке и увидеть, как она выглядит для посетителей.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 z-[100]"
            onClick={onClose}
        >
            <div
                className="bg-card w-full max-w-2xl h-full sm:h-[80vh] sm:rounded-[20px] border-l sm:border border-border shadow-2xl flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between bg-card shrink-0">
                    <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent truncate pr-4">
                        Как пользоваться редактором?
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-full transition-colors shrink-0"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Content Layout */}
                <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
                    {/* Sidebar / Top Tabs */}
                    <div className="relative w-full sm:w-1/3 border-b sm:border-b-0 sm:border-r border-border bg-secondary/20 p-2 sm:p-4 flex sm:flex-col gap-1 sm:gap-2 overflow-x-auto sm:overflow-y-auto no-scrollbar scroll-smooth shrink-0">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 sm:gap-3 px-4 py-2 sm:py-3 rounded-[12px] text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${activeTab === tab.id
                                        ? 'bg-primary text-primary-foreground shadow-md'
                                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                        }`}
                                >
                                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                        {/* Стрелка вправо - только на мобильных */}
                        <div className="sm:hidden flex-shrink-0 flex items-center pr-1 pointer-events-none">
                            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-60" />
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-card">
                        {renderContent()}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-border bg-secondary/10 shrink-0 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-primary/5 rounded-xl border border-primary/10">
                        <div className="text-left">
                            <h4 className="text-sm font-bold text-primary">Нужна персональная помощь?</h4>
                            <p className="text-[12px] text-muted-foreground">Напишите нашему боту поддержки в Telegram</p>
                        </div>
                        <a
                            href="https://t.me/inbiosup_bot"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-6 py-2 bg-[#229ED9] text-white rounded-lg font-bold hover:opacity-90 transition-all text-xs flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.37.74-.57 2.91-1.27 4.85-2.11 5.82-2.52 2.77-1.16 3.35-1.36 3.72-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06-.01.12-.02.19z" /></svg>
                            Открыть поддержку
                        </a>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-8 py-3 bg-foreground text-background rounded-full font-bold hover:opacity-90 transition-all shadow-lg text-sm active:scale-[0.98]"
                    >
                        Всё понятно, спасибо!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditorHelpModal;
