import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ICONS = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

const Toast = ({ toast }) => {
  const { removeToast } = useToast();
  const Icon = ICONS[toast.type] || Info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95, x: 20 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.22, 1.2, 0.36, 1] }}
      className={`toast toast-${toast.type}`}
      style={{ '--toast-duration': `${toast.duration}ms` }}
    >
      <div className="toast-icon">
        <Icon size={13} />
      </div>

      <div className="toast-content">
        {toast.title && <div className="toast-title">{toast.title}</div>}
        {toast.message && <div className="toast-message">{toast.message}</div>}
      </div>

      <button
        className="toast-close"
        onClick={() => removeToast(toast.id)}
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>

      {/* Progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: 'rgba(255,255,255,0.04)', overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          style={{
            height: '100%', borderRadius: 99,
            background: toast.type === 'success' ? '#6b8f71'
              : toast.type === 'error' ? '#c44536'
              : toast.type === 'warning' ? '#daa520'
              : '#2dd4bf',
          }}
        />
      </div>
    </motion.div>
  );
};

const Toaster = () => {
  const { toasts } = useToast();

  return (
    <div className="toast-container">
      <AnimatePresence mode="popLayout">
        {toasts.map(t => <Toast key={t.id} toast={t} />)}
      </AnimatePresence>
    </div>
  );
};

export default Toaster;
