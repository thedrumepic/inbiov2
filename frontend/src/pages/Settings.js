import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { toast } from '../utils/toast';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { ArrowLeft, Lock, Trash2, BarChart, MessageSquare, Download, Filter, ChevronDown, Globe, Copy, Check, Loader2, Send, Webhook, Link2, CheckCircle2, AlertCircle, Mail } from 'lucide-react';
import { Tooltip } from '../components/ui/Tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import { getImageUrl } from '../utils/api';
import { cn } from '../lib/utils';

const Settings = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);

  // Analytics State
  const [gaPixelId, setGaPixelId] = useState('');
  const [fbPixelId, setFbPixelId] = useState('');
  const [vkPixelId, setVkPixelId] = useState('');
  // Webhook State
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookTestStatus, setWebhookTestStatus] = useState(null); // null | 'ok' | 'error'
  // Leads State
  const [leads, setLeads] = useState([]);
  const [pages, setPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [telegramChatId, setTelegramChatId] = useState(null);
  const [tgLoading, setTgLoading] = useState(false);

  React.useEffect(() => {
    loadSettings();
    // Mark that user visited settings to clear lead indicator in dashboard
    localStorage.setItem('lastLeadsCheck', new Date().toISOString());
  }, []);

  const contactLeads = leads.filter(l => l.form_type !== 'email_subscribe');
  const emailLeads = leads.filter(l => l.form_type === 'email_subscribe');

  const loadSettings = async () => {
    try {
      const [meRes, pagesRes] = await Promise.all([
        api.getMe(),
        api.getPages()
      ]);

      if (meRes.ok) {
        const data = await meRes.json();
        if (data.ga_pixel_id) setGaPixelId(data.ga_pixel_id);
        if (data.fb_pixel_id) setFbPixelId(data.fb_pixel_id);
        if (data.vk_pixel_id) setVkPixelId(data.vk_pixel_id);
        if (data.webhook_url) setWebhookUrl(data.webhook_url);
        if (data.email) setUserEmail(data.email);
        if (data.leads) setLeads(data.leads.reverse());
        if (data.telegram_chat_id) setTelegramChatId(data.telegram_chat_id);
      }

      if (pagesRes.ok) {
        const pagesData = await pagesRes.json();
        setPages(pagesData);
      }
    } catch (error) {
      // Silently handle settings load error
    }
  };

  const handleSaveAnalytics = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.updateUser({
        ga_pixel_id: gaPixelId,
        fb_pixel_id: fbPixelId,
        vk_pixel_id: vkPixelId,
      });
      if (response.ok) {
        toast.success('Настройки аналитики сохранены');
      } else {
        toast.error('Ошибка сохранения');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWebhook = async (e) => {
    e.preventDefault();
    setWebhookLoading(true);
    try {
      const response = await api.updateUser({ webhook_url: webhookUrl });
      if (response.ok) {
        toast.success('Вебхук сохранён');
      } else {
        toast.error('Ошибка сохранения');
      }
    } catch {
      toast.error('Ошибка соединения');
    } finally {
      setWebhookLoading(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl.startsWith('http')) { toast.error('Укажите корректный URL'); return; }
    setWebhookLoading(true);
    setWebhookTestStatus(null);
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'test', source: 'inbio.one', message: 'Тестовый вызов вебхука с inbio.one' }),
      });
      setWebhookTestStatus(res.ok ? 'ok' : 'error');
      if (res.ok) toast.success('Webhook ответил успешно');
      else toast.error('Вебхук вернул ошибку');
    } catch {
      setWebhookTestStatus('error');
      toast.error('Не удалось достучься до URL');
    } finally {
      setWebhookLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Заполните все поля');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Новый пароль должен быть не менее 6 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      const response = await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (response.ok) {
        toast.success('Пароль успешно изменён');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Ошибка изменения пароля');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const response = await api.deleteAccount();
      if (response.ok) {
        toast.success('Аккаунт успешно удален');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Ошибка удаления аккаунта');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLead = (leadId) => {
    setLeadToDelete(leadId);
  };

  const confirmDeleteLead = async () => {
    if (!leadToDelete) return;
    try {
      const res = await api.deleteLead(leadToDelete);
      if (res.ok) {
        setLeads(prev => prev.filter(l => l.id !== leadToDelete));
        toast.success('Заявка удалена');
      }
    } catch (e) {
      toast.error('Ошибка удаления');
    } finally {
      setLeadToDelete(null);
    }
  };

  const handleUpdateStatus = async (leadId, newStatus) => {
    setUpdatingId(leadId);
    try {
      const res = await api.updateLeadStatus(leadId, newStatus);
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
        toast.success('Статус обновлен');
      } else {
        const data = await res.json();
        toast.error(data.detail || 'Не удалось обновить статус');
      }
    } catch (e) {
      toast.error('Ошибка соединения');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCopy = (text, id) => {
    if (!text || text === '—') return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Скопировано в буфер');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'working': return { label: 'В работе', color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/15', border: 'border-yellow-500/30' };
      case 'completed': return { label: 'Завершено', color: 'text-green-600 dark:text-green-400 bg-green-500/15', border: 'border-green-500/30' };
      default: return { label: 'Новая', color: 'text-black dark:text-white bg-foreground/10', border: 'border-foreground/20' };
    }
  };

  const handleConnectTelegram = async () => {
    setTgLoading(true);
    try {
      const res = await api.getTelegramLink();
      if (res.ok) {
        const { link } = await res.json();
        window.open(link, '_blank');
        toast.info('Бот открыт в новой вкладке. Нажмите "Старт" в Telegram.');
      } else {
        toast.error('Не удалось получить ссылку на бота');
      }
    } catch (e) {
      toast.error('Ошибка соединения');
    } finally {
      setTgLoading(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    if (!window.confirm('Вы уверены, что хотите отключить Telegram уведомления?')) return;
    setTgLoading(true);
    try {
      const res = await api.disconnectTelegram();
      if (res.ok) {
        setTelegramChatId(null);
        toast.success('Telegram уведомления отключены');
      }
    } catch (e) {
      toast.error('Ошибка соединения');
    } finally {
      setTgLoading(false);
    }
  };

  const filteredLeads = selectedPageId === 'all'
    ? contactLeads
    : contactLeads.filter(l => l.page_id === selectedPageId);

  const filteredEmailLeads = selectedPageId === 'all'
    ? emailLeads
    : emailLeads.filter(l => l.page_id === selectedPageId);

  const handleExportCSV = () => {
    if (!filteredLeads.length) return;

    // Russian headers
    const headers = ['Дата и время', 'Страница', 'Имя клиента', 'Email', 'Телефон', 'Текст сообщения', 'Статус'];

    // Helper for formatting date: DD.MM.YYYY HH:MM
    const formatDate = (isoString) => {
      const d = new Date(isoString);
      const pad = (n) => n.toString().padStart(2, '0');
      return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    // Use semicolon (;) for better compatibility with regional Excel settings
    const csvContent = [
      headers.join(';'),
      ...filteredLeads.map(l => [
        formatDate(l.created_at),
        l.page_name || '—',
        l.name || '—',
        l.email || '—',
        l.phone || '—',
        `"${(l.message || '').replace(/"/g, '""')}"` || '—',
        getStatusInfo(l.status).label
      ].join(';'))
    ].join('\n');

    // Add Byte Order Mark (BOM) for Excel compatibility with Russian characters
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Generate professional filename: [PageName]_[Date].csv
    const pageName = selectedPageId === 'all'
      ? 'Vse_Stranici'
      : (pages.find(p => p.id === selectedPageId)?.name || 'Stranica').replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${pageName}_${dateStr}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen p-6" data-testid="settings-page">
      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-ghost flex items-center gap-2"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
          {userEmail && (
            <div className="text-[13px] font-medium text-muted-foreground px-4 py-2 bg-secondary/30 rounded-lg border border-border/40 h-10 flex items-center shadow-sm">
              {userEmail}
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold">Настройки</h1>

        {/* Analytics Section */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <BarChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Аналитика</h2>
              <p className="text-sm text-muted-foreground">Глобальные настройки для всех страниц</p>
            </div>
          </div>

          <form onSubmit={handleSaveAnalytics} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Google Analytics ID</label>
              <input
                type="text"
                value={gaPixelId}
                onChange={(e) => setGaPixelId(e.target.value)}
                className="input"
                placeholder="G-DQJ17..."
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Facebook Pixel ID</label>
              <input
                type="text"
                value={fbPixelId}
                onChange={(e) => setFbPixelId(e.target.value)}
                className="input"
                placeholder="123456789..."
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">VK Pixel ID</label>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#0077FF]/10 text-[#0077FF] rounded-full">ВКонтакте</span>
              </div>
              <input
                type="text"
                value={vkPixelId}
                onChange={(e) => setVkPixelId(e.target.value)}
                className="input"
                placeholder="VK-XXXXXXXX-X"
                disabled={loading}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-8 w-full sm:w-auto"
              >
                {loading ? 'Сохранение...' : 'Сохранить'}
              </button>
              <p className="text-xs text-muted-foreground text-center sm:text-right">
                ID будут автоматически добавлены на все ваши страницы
              </p>
            </div>
          </form>
        </div>

        {/* Form Data Section */}
        <div className="card overflow-visible">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Данные с формы</h2>
                <p className="text-sm text-muted-foreground">Заявки и контакты посетителей</p>
              </div>
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 border border-border rounded-[12px] text-sm font-medium transition-all"
              >
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span>{selectedPageId === 'all' ? 'Все страницы' : (pages.find(p => p.id === selectedPageId)?.name || 'Выбрано')}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                  <div className="absolute top-full right-0 mt-2 w-56 bg-card border border-border rounded-[16px] shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-1.5">
                      <button
                        onClick={() => { setSelectedPageId('all'); setIsFilterOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedPageId === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
                      >
                        Все страницы
                      </button>
                      <div className="h-px bg-border my-1 mx-1" />
                      {pages.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedPageId(p.id); setIsFilterOpen(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedPageId === p.id ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
                        >
                          <div className="font-medium truncate">{p.name}</div>
                          <div className="text-[10px] opacity-70 truncate">inbio.one/{p.username}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {leads.length === 0 ? (
              <div className="text-center py-16 px-4 bg-secondary/20 rounded-[20px] border border-dashed border-border/50">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <h3 className="text-lg font-medium mb-1">Здесь появятся лиды из ваших форм.</h3>
                <p className="text-sm text-muted-foreground">Добавьте блок "Форма контактов" на любую из своих страниц.</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground italic border border-dashed border-border rounded-xl">
                На выбранной странице пока нет заявок
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Список заявок ({filteredLeads.length})</span>
                  <button onClick={handleExportCSV} className="text-xs flex items-center gap-1.5 text-primary hover:text-primary/80 font-bold transition-colors">
                    <Download className="w-3.5 h-3.5" /> ЭКСПОРТ CSV
                  </button>
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden lg:block overflow-hidden border border-border rounded-[20px] bg-card">
                  <div className="overflow-x-auto scrollbar-none">
                    <table className="w-full text-[13px] text-left border-collapse table-fixed">
                      <thead>
                        <tr className="bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                          <th className="px-4 py-4 w-[130px] border-r border-border/20">Дата и время</th>
                          <th className="px-4 py-4 w-[130px] border-r border-border/20 uppercase">Страница</th>
                          <th className="px-4 py-4 w-[130px] border-r border-border/20">Клиент</th>
                          <th className="px-4 py-4 w-[130px] border-r border-border/20">Email</th>
                          <th className="px-4 py-4 w-[130px] border-r border-border/20">Телефон</th>
                          <th className="px-4 py-4 uppercase border-r border-border/20">Сообщение</th>
                          <th className="px-4 py-4 w-[130px] border-r border-border/20">Статус</th>
                          <th className="p-4 w-[60px]"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLeads.map(lead => (
                          <tr key={lead.id} className="border-t border-border/30 hover:bg-secondary/20 transition-colors">
                            <td className="px-4 py-4 text-[11px] font-medium border-r border-border/10 whitespace-nowrap text-center">
                              {new Date(lead.created_at).toLocaleString('ru-RU', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </td>
                            <td className="px-4 py-4 border-r border-border/10">
                              <div className="flex items-center gap-2 text-primary font-bold text-[11px]">
                                <Globe className="w-3 h-3 opacity-50 flex-shrink-0" />
                                <span className="truncate">{lead.page_name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 font-bold border-r border-border/10 truncate">
                              {lead.name || '—'}
                            </td>
                            <td className="px-4 py-4 border-r border-border/10">
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate max-w-[100px] text-muted-foreground">{lead.email || '—'}</span>
                                {lead.email && (
                                  <button onClick={() => handleCopy(lead.email, `${lead.id}-email`)} className="p-1 hover:bg-secondary rounded transition-colors text-muted-foreground/40 hover:text-primary">
                                    {copiedId === `${lead.id}-email` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 border-r border-border/10">
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate max-w-[100px] text-muted-foreground">{lead.phone || '—'}</span>
                                {lead.phone && (
                                  <button onClick={() => handleCopy(lead.phone, `${lead.id}-phone`)} className="p-1 hover:bg-secondary rounded transition-colors text-muted-foreground/40 hover:text-primary">
                                    {copiedId === `${lead.id}-phone` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-xs text-muted-foreground/80 italic border-r border-border/10 overflow-hidden">
                              <Tooltip content={lead.message || '—'} side="top">
                                <div className="truncate cursor-help w-full max-w-[200px]" title="">
                                  {lead.message ? lead.message : '—'}
                                </div>
                              </Tooltip>
                            </td>
                            <td className="px-4 py-4 border-r border-border/10">
                              <Select
                                value={lead.status || 'new'}
                                onValueChange={(value) => handleUpdateStatus(lead.id, value)}
                                disabled={updatingId === lead.id}
                              >
                                <SelectTrigger
                                  className={cn(
                                    "h-8 w-full border text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all px-2",
                                    getStatusInfo(lead.status).color,
                                    getStatusInfo(lead.status).border
                                  )}
                                >
                                  {updatingId === lead.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                                  ) : (
                                    <SelectValue />
                                  )}
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border animate-none">
                                  <SelectItem value="new" className="text-[10px] font-bold uppercase tracking-wider focus:bg-foreground/10">Новая</SelectItem>
                                  <SelectItem value="working" className="text-[10px] font-bold uppercase tracking-wider focus:bg-yellow-500/10">В работе</SelectItem>
                                  <SelectItem value="completed" className="text-[10px] font-bold uppercase tracking-wider focus:bg-green-500/10">Завершено</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <button
                                onClick={() => handleDeleteLead(lead.id)}
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile & Mid Layout (Aesthetic List) */}
                <div className="lg:hidden space-y-4">
                  {filteredLeads.map(lead => (
                    <div key={lead.id} className="overflow-hidden border border-border rounded-[20px] bg-card divide-y divide-border/30 shadow-sm transition-all hover:border-primary/30">
                      {/* Header info */}
                      <div className="p-4 bg-secondary/20 flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{new Date(lead.created_at).toLocaleString('ru-RU', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}</span>
                          <div className="flex items-center gap-1.5 text-primary font-bold text-xs uppercase tracking-tight">
                            <Globe className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
                            {lead.page_name}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>

                      {/* Main Data Area */}
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold uppercase text-muted-foreground/60 tracking-wider">Клиент</span>
                            <div className="font-bold text-foreground truncate">{lead.name || '—'}</div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold uppercase text-muted-foreground/60 tracking-wider">Статус</span>
                            <Select
                              value={lead.status || 'new'}
                              onValueChange={(value) => handleUpdateStatus(lead.id, value)}
                              disabled={updatingId === lead.id}
                            >
                              <SelectTrigger
                                className={cn(
                                  "h-9 w-full border text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all px-3",
                                  getStatusInfo(lead.status).color,
                                  getStatusInfo(lead.status).border
                                )}
                              >
                                {updatingId === lead.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                                ) : (
                                  <SelectValue />
                                )}
                              </SelectTrigger>
                              <SelectContent className="bg-popover border-border">
                                <SelectItem value="new" className="text-[10px] font-bold uppercase tracking-wider">Новая</SelectItem>
                                <SelectItem value="working" className="text-[10px] font-bold uppercase tracking-wider">В работе</SelectItem>
                                <SelectItem value="completed" className="text-[10px] font-bold uppercase tracking-wider">Завершено</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 pt-3 border-t border-border/10">
                          <div className="flex flex-col gap-2">
                            <span className="text-[9px] font-bold uppercase text-muted-foreground/60 tracking-wider text-[8px]">Контактные данные</span>
                            <div className="flex flex-col gap-2">
                              {lead.email && (
                                <div className="flex items-center justify-between bg-secondary/30 p-2 rounded-lg group/copy" onClick={() => handleCopy(lead.email, `${lead.id}-email-mob`)}>
                                  <span className="text-sm font-medium text-foreground/90 truncate">{lead.email}</span>
                                  <div className="flex-shrink-0 ml-2">
                                    {copiedId === `${lead.id}-email-mob` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground/40 group-hover/copy:text-primary transition-colors" />}
                                  </div>
                                </div>
                              )}
                              {lead.phone && (
                                <div className="flex items-center justify-between bg-secondary/30 p-2 rounded-lg group/copy" onClick={() => handleCopy(lead.phone, `${lead.id}-phone-mob`)}>
                                  <span className="text-sm font-medium text-foreground/90">{lead.phone}</span>
                                  <div className="flex-shrink-0 ml-2">
                                    {copiedId === `${lead.id}-phone-mob` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground/40 group-hover/copy:text-primary transition-colors" />}
                                  </div>
                                </div>
                              )}
                              {!lead.email && !lead.phone && <div className="text-sm italic opacity-50">—</div>}
                            </div>
                          </div>
                        </div>

                        {lead.message && (
                          <div className="pt-3 border-t border-border/10">
                            <span className="text-[9px] font-bold uppercase text-muted-foreground/60 tracking-wider block mb-1.5">Текст сообщения</span>
                            <div className="text-sm text-muted-foreground/90 leading-relaxed italic bg-secondary/40 p-3.5 rounded-[16px] border border-border/20">
                              {lead.message}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Email Subscriptions Section */}
        <div className="card overflow-visible">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Email-подписки</h2>
                <p className="text-sm text-muted-foreground">Адреса из блока подписки</p>
              </div>
            </div>
            {filteredEmailLeads.length > 0 && (
              <button
                onClick={() => {
                  const headers = ['Дата и время', 'Страница', 'Email'];
                  const rows = filteredEmailLeads.map(l => [
                    new Date(l.created_at).toLocaleString('ru-RU'),
                    l.page_name || '—',
                    l.email || l.contact || '—',
                  ]);
                  const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
                  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = 'email-subscriptions.csv'; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-xs flex items-center gap-1.5 text-primary hover:text-primary/80 font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> ЭКСПОРТ CSV
              </button>
            )}
          </div>

          {emailLeads.length === 0 ? (
            <div className="text-center py-16 px-4 bg-secondary/20 rounded-[20px] border border-dashed border-border/50">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-medium mb-1">Подписчиков пока нет</h3>
              <p className="text-sm text-muted-foreground">Добавьте блок "Email-подписка" на страницу</p>
            </div>
          ) : filteredEmailLeads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground italic border border-dashed border-border rounded-xl">
              На выбранной странице пока нет подписчиков
            </div>
          ) : (
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 block">
                Подписчики ({filteredEmailLeads.length})
              </span>

              {/* Desktop table */}
              <div className="hidden lg:block overflow-hidden border border-border rounded-[20px] bg-card">
                <table className="w-full text-[13px] text-left border-collapse">
                  <thead>
                    <tr className="bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-4 w-[160px] border-r border-border/20">Дата и время</th>
                      <th className="px-4 py-4 w-[160px] border-r border-border/20">Страница</th>
                      <th className="px-4 py-4">Email</th>
                      <th className="px-4 py-4 w-[60px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmailLeads.map(lead => (
                      <tr key={lead.id} className="border-t border-border/30 hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3 text-[11px] font-medium border-r border-border/10 whitespace-nowrap">
                          {new Date(lead.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 border-r border-border/10">
                          <div className="flex items-center gap-2 text-primary font-bold text-[11px]">
                            <Globe className="w-3 h-3 opacity-50 flex-shrink-0" />
                            <span className="truncate">{lead.page_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-foreground truncate">{lead.email || lead.contact || '—'}</span>
                            {(lead.email || lead.contact) && (
                              <button
                                onClick={() => handleCopy(lead.email || lead.contact, `esub-${lead.id}`)}
                                className="p-1 hover:bg-secondary rounded transition-colors text-muted-foreground/40 hover:text-primary flex-shrink-0"
                              >
                                {copiedId === `esub-${lead.id}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className="lg:hidden space-y-3">
                {filteredEmailLeads.map(lead => (
                  <div key={lead.id} className="overflow-hidden border border-border rounded-[20px] bg-card shadow-sm">
                    <div className="p-4 flex items-center justify-between gap-3">
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {new Date(lead.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                          <Globe className="w-3 h-3 opacity-60 flex-shrink-0" />
                          {lead.page_name}
                        </div>
                        <div
                          className="flex items-center gap-2 bg-secondary/30 px-2 py-1.5 rounded-lg mt-1 cursor-pointer"
                          onClick={() => handleCopy(lead.email || lead.contact, `esub-mob-${lead.id}`)}
                        >
                          <Mail className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
                          <span className="text-sm font-medium text-foreground truncate">{lead.email || lead.contact || '—'}</span>
                          {copiedId === `esub-mob-${lead.id}` ? <Check className="w-3 h-3 text-green-500 ml-auto flex-shrink-0" /> : <Copy className="w-3 h-3 text-muted-foreground/40 ml-auto flex-shrink-0" />}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Webhook Section */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Webhook</h2>
              <p className="text-sm text-muted-foreground">Автоматически отправлять лиды на ваш сервер / Zapier / Make</p>
            </div>
          </div>

          <form onSubmit={handleSaveWebhook} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">URL для отправки данных</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => { setWebhookUrl(e.target.value); setWebhookTestStatus(null); }}
                  className="input flex-1"
                  placeholder="https://hooks.zapier.com/..."
                  disabled={webhookLoading}
                />
                {webhookUrl && (
                  <button
                    type="button"
                    onClick={handleTestWebhook}
                    disabled={webhookLoading}
                    className="px-4 py-2 bg-secondary border border-border rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                  >
                    {webhookLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
                      webhookTestStatus === 'ok' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                      webhookTestStatus === 'error' ? <AlertCircle className="w-4 h-4 text-red-500" /> :
                      null}
                    Тест
                  </button>
                )}
              </div>
              {webhookTestStatus === 'ok' && <p className="text-xs text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Webhook ответил успешно</p>}
              {webhookTestStatus === 'error' && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Ошибка — проверьте URL</p>}
            </div>

            <div className="p-3 bg-secondary/30 rounded-xl text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground/80">Что будет отправлено:</p>
              <p>POST запрос при каждой новой заявке с контактной формы или email-подписки.</p>
              <p className="font-mono text-[10px] bg-secondary p-2 rounded-lg mt-2 break-all">
                {`{ "event": "new_lead", "name": "Иван", "email": "ivan@example.com", "phone": "+7...", "message": "..." }`}
              </p>
            </div>

            <button
              type="submit"
              disabled={webhookLoading}
              className="btn-primary px-8 w-full sm:w-auto"
            >
              {webhookLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </form>
        </div>

        {/* Telegram Notifications Section */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#0088cc]/10 flex items-center justify-center">
              <Send className="w-5 h-5 text-[#0088cc]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Уведомления Telegram</h2>
              <p className="text-sm text-muted-foreground">Мгновенные заявки прямо в ваш мессенджер</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-secondary/20 rounded-[20px] border border-border/40">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">
                  {telegramChatId ? 'Telegram подключён' : 'Подключите Telegram'}
                </h3>
                {telegramChatId && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-green-500/15 text-green-500 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Активен
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                {telegramChatId
                  ? 'Вы получаете уведомления о новых лидах с именем, контактами и текстом сообщения мгновенно.'
                  : 'Получайте уведомления о новых лидах в режиме реального времени. Просто нажмите кнопку и запустите бота в Telegram.'}
              </p>
              {telegramChatId && (
                <p className="text-xs text-muted-foreground/60">Уведомления приходят при каждой новой заявке с контактных форм и email-подписок.</p>
              )}
            </div>

            <div className="flex-shrink-0 w-full md:w-auto">
              {telegramChatId ? (
                <button
                  onClick={handleDisconnectTelegram}
                  disabled={tgLoading}
                  className="w-full md:w-auto btn-ghost text-destructive hover:bg-destructive/10 border-destructive/20"
                >
                  {tgLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Отключить'}
                </button>
              ) : (
                <button
                  onClick={handleConnectTelegram}
                  disabled={tgLoading}
                  className="w-full md:w-auto btn-primary bg-[#0088cc] hover:bg-[#0088cc]/90 border-none px-6 py-3 flex items-center justify-center gap-2 shadow-lg shadow-[#0088cc]/20"
                >
                  {tgLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Подключить Telegram
                </button>
              )}
            </div>
          </div>

          {!telegramChatId && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-card border border-border/40 rounded-xl space-y-1">
                <div className="text-[10px] font-bold text-primary uppercase">Шаг 1</div>
                <div className="text-xs font-medium">Нажмите на кнопку подключения</div>
              </div>
              <div className="p-4 bg-card border border-border/40 rounded-xl space-y-1">
                <div className="text-[10px] font-bold text-primary uppercase">Шаг 2</div>
                <div className="text-xs font-medium">Запустите бота кнопкой "/start"</div>
              </div>
              <div className="p-4 bg-card border border-border/40 rounded-xl space-y-1">
                <div className="text-[10px] font-bold text-primary uppercase">Шаг 3</div>
                <div className="text-xs font-medium">Готово! Аккаунт привязан автоматически</div>
              </div>
            </div>
          )}
        </div>

        {/* Security Section */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Безопасность</h2>
              <p className="text-sm text-muted-foreground">Смена пароля</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Текущий пароль</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                disabled={loading}
                data-testid="current-password-input"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Новый пароль</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input"
                placeholder="Минимум 6 символов"
                disabled={loading}
                data-testid="new-password-input"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Подтвердите новый пароль</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                disabled={loading}
                data-testid="confirm-password-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full sm:w-auto"
              data-testid="change-password-button"
            >
              {loading ? 'Изменение...' : 'Изменить пароль'}
            </button>
          </form>
        </div>



        {/* Danger Zone */}
        <div className="card border-destructive/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-destructive">Удаление аккаунта</h2>
              <p className="text-sm text-muted-foreground">Удаление данных без возможности восстановления</p>
            </div>
          </div>

          <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/10 mb-6">
            <p className="text-sm text-muted-foreground">
              При удалении аккаунта все ваши страницы, ссылки и статистика будут удалены навсегда.
              Это действие нельзя отменить или восстановить.
            </p>
          </div>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-medium transition-colors disabled:opacity-50"
            data-testid="delete-account-button"
          >
            {loading ? 'Удаление...' : 'Удалить аккаунт'}
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Удалить аккаунт?"
        message="Это действие необратимо. Все ваши страницы, блоки и данные будут удалены навсегда."
        confirmText="Удалить навсегда"
        cancelText="Отмена"
      />

      <ConfirmationModal
        isOpen={!!leadToDelete}
        onClose={() => setLeadToDelete(null)}
        onConfirm={confirmDeleteLead}
        title="Удалить заявку?"
        message="Вы уверены, что хотите удалить эту заявку? Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
      />
    </div>
  );
};

export default Settings;