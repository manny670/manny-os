import React, { useEffect } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const typeStyles = {
    success: {
      border: '1px solid rgba(52, 211, 153, 0.4)',
      bg: 'var(--bg-surface)',
      icon: <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)' }} />
    },
    warning: {
      border: '1px solid rgba(245, 158, 11, 0.4)',
      bg: 'var(--bg-surface)',
      icon: <AlertCircle size={16} style={{ color: 'var(--accent-gold)' }} />
    },
    info: {
      border: '1px solid var(--border-subtle)',
      bg: 'var(--bg-surface)',
      icon: <Sparkles size={16} style={{ color: 'var(--accent-gold)' }} />
    }
  };

  const style = typeStyles[toast.type] || typeStyles.info;

  return (
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 500,
        backgroundColor: style.bg,
        border: style.border,
        borderRadius: 'var(--radius-lg)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: 'var(--shadow-lg)',
        maxWidth: '400px',
        backdropFilter: 'blur(10px)'
      }}
    >
      {style.icon}
      <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', fontWeight: 500 }}>
        {toast.message}
      </div>
      <button
        onClick={onClose}
        style={{
          marginLeft: 'auto',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          padding: '2px'
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
