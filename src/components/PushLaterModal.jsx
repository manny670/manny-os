import React, { useState } from 'react';
import { X, ArrowDown, Clock, ShieldAlert, Sparkles } from 'lucide-react';
import { formatDuration } from '../utils/timeHelpers';

export default function PushLaterModal({
  isOpen,
  onClose,
  onConfirmPushLater,
  activeBlock,
  remainingBlocks = []
}) {
  const candidateBlocks = remainingBlocks.slice(1).filter((b) => b.type !== 'freetime');
  const [targetDestinationIndex, setTargetDestinationIndex] = useState(0);

  if (!isOpen || !activeBlock) return null;

  const handleConfirm = () => {
    onConfirmPushLater(targetDestinationIndex);
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
          maxWidth: '520px',
          padding: '28px',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--accent-primary-faint)',
                color: 'var(--accent-primary)',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '8px',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <ArrowDown size={12} />
              <span>REARRANGE SCHEDULE</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Push "{activeBlock.title}" later
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Where would you like Orbit to place this task? Orbit will keep your protected Free Time at the end.
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

        {/* Destination Choices */}
        {candidateBlocks.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              textAlign: 'center',
              marginBottom: '20px'
            }}
          >
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              No other intermediate blocks remain. Orbit will shift this task directly before your evening Free Time.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', maxHeight: '240px', overflowY: 'auto' }}>
            {candidateBlocks.map((b, idx) => {
              const isSelected = targetDestinationIndex === idx;
              return (
                <button
                  key={b.id || idx}
                  type="button"
                  onClick={() => setTargetDestinationIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isSelected ? 'var(--bg-card)' : 'var(--bg-surface)',
                    border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-hairline)',
                    textAlign: 'left',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{b.icon || '📌'}</span>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                        After: {b.title}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Scheduled around {b.endTime || 'upcoming'} ({formatDuration(b.durationMinutes)})
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                      Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Protection Note */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--accent-emerald-faint)',
            marginBottom: '20px'
          }}
        >
          <Sparkles size={14} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Free Time remains protected at the end. End-time & sleep constraints preserved.
          </span>
        </div>

        {/* Buttons */}
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
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-primary)',
              color: '#08090C',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <ArrowDown size={16} />
            <span>Confirm Placement →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
