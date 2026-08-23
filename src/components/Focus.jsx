import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  CheckCircle2,
  Coffee,
  ArrowDown,
  Trash2,
  Clock,
  Sparkles,
  ChevronRight,
  Plus,
  RotateCcw,
  Lock
} from 'lucide-react';
import { formatDuration } from '../utils/timeHelpers';

export default function Focus({
  planState,
  onCompleteBlock,
  onCancelBlock,
  onAddTime,
  onOpenBreakModal,
  onOpenPushLaterModal,
  onNavigateToOverview,
  activeBreak,
  onEndBreakEarly
}) {
  const { blocks = [], activeIndex = 0, scheduledEndTime, hardEndTime } = planState || {};
  const currentBlock = blocks[activeIndex];
  const nextBlock = blocks[activeIndex + 1];

  const [isRunning, setIsRunning] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState(
    (currentBlock?.remainingMinutes || currentBlock?.durationMinutes || 45) * 60
  );

  const initialTotalSecondsRef = useRef(
    (currentBlock?.durationMinutes || 45) * 60
  );

  // Sync timer when active block or remainingMinutes changes
  useEffect(() => {
    if (currentBlock) {
      const initialSec = (currentBlock.remainingMinutes ?? currentBlock.durationMinutes ?? 45) * 60;
      setSecondsRemaining(initialSec);
      initialTotalSecondsRef.current = (currentBlock.durationMinutes || 45) * 60;
      setIsRunning(true);
    }
  }, [currentBlock?.id, currentBlock?.remainingMinutes, currentBlock?.durationMinutes]);

  // Countdown timer loop
  useEffect(() => {
    let interval = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsRemaining]);

  if (!currentBlock) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>No active block found.</h2>
        <button
          onClick={onNavigateToOverview}
          style={{
            marginTop: '16px',
            padding: '12px 24px',
            backgroundColor: 'var(--accent-primary)',
            color: '#06070a',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700
          }}
        >
          View Overview Timeline
        </button>
      </div>
    );
  }

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeDisplay = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const isBreak = currentBlock.type === 'break';
  const isBusy = currentBlock.type === 'busy' || currentBlock.isBusy;
  const progressPercent = Math.max(
    0,
    Math.min(
      100,
      100 - (secondsRemaining / (initialTotalSecondsRef.current || 1)) * 100
    )
  );

  return (
    <div
      className="focus-view animate-fade-in"
      style={{
        padding: '32px 24px 60px',
        maxWidth: '800px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%'
      }}
    >
      {/* Top Breadcrumb / Navigation */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.76rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: isBusy ? 'var(--text-muted)' : isBreak ? 'var(--accent-emerald)' : 'var(--accent-primary)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {isBusy ? 'BUSY / UNAVAILABLE' : isBreak ? 'RECHARGE IN PROGRESS' : 'FOCUS IN PROGRESS'}
          </span>
          <span style={{ color: 'var(--border-medium)' }}>•</span>
          <span
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            Block {activeIndex + 1} of {blocks.length}
          </span>
        </div>

        <button
          onClick={onNavigateToOverview}
          style={{
            fontSize: '0.84rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-surface)'
          }}
        >
          <span>View All Blocks</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Main Focus Card */}
      <div
        className="focus-card"
        style={{
          width: '100%',
          backgroundColor: 'var(--bg-surface)',
          border: isBusy
            ? '1.5px dashed rgba(126, 139, 160, 0.4)'
            : isBreak
            ? '1.5px solid var(--accent-emerald)'
            : '1.5px solid var(--accent-primary-faint)',
          borderRadius: 'var(--radius-xl)',
          padding: '40px 24px',
          textAlign: 'center',
          boxShadow: isBusy
            ? '0 0 20px rgba(0, 0, 0, 0.4)'
            : isBreak
            ? '0 0 35px rgba(16, 185, 129, 0.12)'
            : '0 0 35px rgba(56, 189, 248, 0.14)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '24px'
        }}
      >
        {/* Category / Goal Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-hairline)',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '16px'
          }}
        >
          <span>{currentBlock.icon || '🎯'}</span>
          <span>{currentBlock.title}</span>
        </div>

        {/* Note / Context description */}
        {currentBlock.note && (
          <p
            style={{
              fontSize: '0.88rem',
              color: 'var(--text-secondary)',
              maxWidth: '480px',
              margin: '0 auto 28px',
              lineHeight: 1.45
            }}
          >
            {currentBlock.note}
          </p>
        )}

        {/* Circular / Large Timer Display */}
        <div
          style={{
            position: 'relative',
            width: '260px',
            height: '260px',
            maxWidth: '100%',
            margin: '0 auto 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* SVG Progress Ring */}
          <svg
            viewBox="0 0 260 260"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              transform: 'rotate(-90deg)'
            }}
          >
            <circle
              cx="130"
              cy="130"
              r="115"
              stroke="var(--bg-card)"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="130"
              cy="130"
              r="115"
              stroke={isBusy ? 'var(--text-muted)' : isBreak ? 'var(--accent-emerald)' : 'var(--accent-primary)'}
              strokeWidth="10"
              fill="none"
              strokeDasharray={2 * Math.PI * 115}
              strokeDashoffset={2 * Math.PI * 115 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>

          {/* Time digits */}
          <div
            style={{
              fontSize: '3.6rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '-0.04em',
              lineHeight: 1,
              zIndex: 2
            }}
          >
            {timeDisplay}
          </div>

          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              marginTop: '6px',
              zIndex: 2
            }}
          >
            {currentBlock.startTime} — {currentBlock.endTime}
          </div>
        </div>

        {/* Primary Controls: Play/Pause & Complete */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          <button
            onClick={() => setIsRunning(!isRunning)}
            style={{
              padding: '14px 28px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: isRunning ? 'var(--bg-card)' : 'var(--accent-primary)',
              color: isRunning ? 'var(--text-primary)' : '#06070a',
              border: '1px solid var(--border-subtle)',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isRunning ? (
              <>
                <Pause size={18} />
                <span>Pause Timer</span>
              </>
            ) : (
              <>
                <Play size={18} fill="#06070a" />
                <span>Resume Timer</span>
              </>
            )}
          </button>

          {isBreak ? (
            <button
              onClick={onEndBreakEarly}
              style={{
                padding: '14px 28px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--accent-emerald)',
                color: '#06070a',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.25)'
              }}
            >
              <Sparkles size={18} />
              <span>I'm Ready Early →</span>
            </button>
          ) : (
            <button
              onClick={() => onCompleteBlock(currentBlock)}
              style={{
                padding: '14px 28px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--accent-primary)',
                color: '#06070a',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 20px rgba(56, 189, 248, 0.25)'
              }}
            >
              <CheckCircle2 size={18} />
              <span>{isBusy ? 'Finish Busy Block →' : 'Complete Block →'}</span>
            </button>
          )}
        </div>

        {/* Secondary Action Bar: +15, +30, Need Break, Push Later, Cancel Block */}
        {!isBreak && !isBusy && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '8px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-hairline)'
            }}
          >
            {/* +15 min */}
            <button
              onClick={() => onAddTime(15)}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-hairline)',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <Plus size={14} />
              <span>+15 min</span>
            </button>

            {/* +30 min */}
            <button
              onClick={() => onAddTime(30)}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-hairline)',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <Plus size={14} />
              <span>+30 min</span>
            </button>

            {/* Need a Break */}
            <button
              onClick={() => onOpenBreakModal(currentBlock)}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--accent-emerald)',
                border: '1px solid var(--border-hairline)',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Coffee size={14} />
              <span>Need a Break</span>
            </button>

            {/* Push Later */}
            <button
              onClick={() => onOpenPushLaterModal(currentBlock)}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-hairline)',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <ArrowDown size={14} />
              <span>Push Later</span>
            </button>

            {/* Cancel Block */}
            <button
              onClick={() => onCancelBlock(currentBlock)}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--accent-coral)',
                border: '1px solid var(--border-hairline)',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Trash2 size={13} />
              <span>Cancel Block</span>
            </button>
          </div>
        )}
      </div>

      {/* Next Up Preview */}
      {nextBlock && (
        <div
          style={{
            width: '100%',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{nextBlock.icon || '📌'}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Up Next ({nextBlock.startTime})
              </div>
              <div
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {nextBlock.title}
              </div>
            </div>
          </div>

          <span
            style={{
              fontSize: '0.78rem',
              color: 'var(--accent-primary)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              flexShrink: 0
            }}
          >
            {formatDuration(nextBlock.durationMinutes)}
          </span>
        </div>
      )}
    </div>
  );
}
