'use client';

import { ReactNode, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Expose addToast globally
  useEffect(() => {
    (window as any).addToast = addToast;
  }, []);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const styles = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg min-w-[320px] max-w-md ${styles[toast.type]}`}
            >
              {icons[toast.type]}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{toast.title}</p>
                <p className="text-sm text-gray-600 mt-1">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

export function showToast(type: Toast['type'], title: string, message: string) {
  if (typeof window !== 'undefined' && (window as any).addToast) {
    (window as any).addToast({ type, title, message });
  }
}

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ children, content, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`absolute ${positions[position]} z-50 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap pointer-events-none`}
          >
            {content}
            <div className={`absolute ${position === 'top' ? 'top-full' : position === 'bottom' ? 'bottom-full' : position === 'left' ? 'left-full' : 'right-full'} left-1/2 -translate-x-1/2 border-4 border-transparent ${position === 'top' ? 'border-t-gray-900' : position === 'bottom' ? 'border-b-gray-900' : position === 'left' ? 'border-l-gray-900' : 'border-r-gray-900'}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Badge({ 
  children, 
  variant = 'default',
  animated = false 
}: { 
  children: ReactNode; 
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  animated?: boolean;
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <motion.span
      animate={animated ? { scale: [1, 1.1, 1] } : undefined}
      transition={animated ? { duration: 2, repeat: Infinity } : undefined}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </motion.span>
  );
}

export function NotificationBadge({ count }: { count: number }) {
  return (
    <div className="relative">
      <Bell className="w-6 h-6 text-gray-600" />
      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
        >
          {count > 9 ? '9+' : count}
        </motion.span>
      )}
    </div>
  );
}

export function Confetti({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string }>>([]);

  useEffect(() => {
    if (trigger) {
      const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
      setParticles(newParticles);
      
      setTimeout(() => setParticles([]), 3000);
    }
  }, [trigger]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ y: -20, x: `${particle.x}%`, opacity: 1, rotate: 0 }}
          animate={{ 
            y: '100vh', 
            opacity: 0, 
            rotate: Math.random() * 360,
            x: `${particle.x + (Math.random() - 0.5) * 20}%`,
          }}
          transition={{ duration: 2 + Math.random() * 2, ease: 'easeOut' }}
          className="absolute w-2 h-2 rounded-full"
          style={{ backgroundColor: particle.color }}
        />
      ))}
    </div>
  );
}
