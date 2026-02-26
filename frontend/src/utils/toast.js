import { toast as sonnerToast } from 'sonner';

const TOAST_ID = 'app-toast';

const show = (fn, message, opts = {}) => {
  sonnerToast.dismiss(TOAST_ID);
  return fn(message, { id: TOAST_ID, ...opts });
};

export const toast = {
  success: (msg, opts) => show(sonnerToast.success, msg, opts),
  error:   (msg, opts) => show(sonnerToast.error,   msg, opts),
  info:    (msg, opts) => show(sonnerToast.info,     msg, opts),
  warning: (msg, opts) => show(sonnerToast.warning,  msg, opts),
  dismiss: (id) => sonnerToast.dismiss(id),
};
