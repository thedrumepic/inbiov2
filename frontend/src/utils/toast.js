import { toast as sonnerToast } from 'sonner';

export const toast = {
  success: (msg, opts) => sonnerToast.success(msg, opts),
  error:   (msg, opts) => sonnerToast.error(msg, opts),
  info:    (msg, opts) => sonnerToast.info(msg, opts),
  warning: (msg, opts) => sonnerToast.warning(msg, opts),
  dismiss: (id) => sonnerToast.dismiss(id),
};
