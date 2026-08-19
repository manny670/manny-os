import React, { useState } from 'react';
import { X, Coffee, Sparkles, Clock, Check } from 'lucide-react';

export default function BreakModal({ isOpen, onClose, onConfirmBreak, currentTaskTitle }) {
  const [selectedDuration, setSelectedDuration] = useState(10);
  const [breakReason, setBreakReason] = useState('Mental reset & water');

  if (!isOpen) return null;

  const breakOptions = [
    { label: '5 min', value: 5, desc: 'Quick stretch & hydrate' },
    { label: '10 min', value: 10, desc: 'Step away from screen' },
    { label: '15 min', value: 15, desc: 'Full mental recharge' },
    { label: '20 min', value: 20, desc: 'Snack & breath reset' }
  ];

  const handleConfirm = () => {
    onConfirmBreak(selectedDuration, breakReason);
  };

  return (
    <div
      className="modal-backdrop animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(8, 9, 12, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '480px',
          padding: '28px',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--accent-emerald-faint)',
                color: 'var(--accent-emerald)',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '8px',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <Coffee size={12} />
              <span>PAUSE & RECHARGE</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Take a short break.
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Your progress on <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>"{currentTaskTitle}"</span> will be saved and resumed immediately after.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-surface)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Break Duration Options */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '24px' }}>
          {breakOptions.map((opt) => {
            const isSelected = selectedDuration === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setSelectedDuration(opt.value);
                  setBreakReason(opt.desc);
                }}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isSelected ? 'var(--bg-card)' : 'var(--bg-surface)',
                  border: isSelected ? '1.5px solid var(--accent-emerald)' : '1px solid var(--border-hairline)',
                  textAlign: 'left',
                  transition: 'all 0.18s ease'
                }}
              >
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: isSelected ? 'var(--accent-emerald)' : 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  {opt.label}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {opt.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.88rem'
            }}
          >
            Stay Focused
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-emerald)',
              color: '#08090C',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Coffee size={16} />
            <span>Start {selectedDuration}m Break →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
