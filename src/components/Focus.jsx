import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Lock,
  Square,
  AlertCircle
} from 'lucide-react';
import { formatDuration, getCurrentTimeString, getCurrentTimeMinutes } from '../utils/timeHelpers.js';

const TIMER_STORAGE_KEY = 'orbitActiveTimer';

export default function Focus({
  planState,
  onCompleteBlock,
  onCancelBlock,
  onAddTime,
  onOpenBreakModal,
  onOpenPushLaterModal,
  onNavigateToOverview,
  activeBreak,
  onEndBreakEarly,
  onShiftScheduleOnResume,
  onEndBlockEarly
}) {
  const { blocks = [], activeIndex = 0, scheduledEndTime, hardEndTime } = planState || {};
  const currentBlock = blocks[activeIndex];
  const nextBlock = blocks[activeIndex + 1];

  const [isRunning, setIsRunning] = useState(true);
  const [currentTimeStr, setCurrentTimeStr] = useState(() => getCurrentTimeString());
  const [secondsRemaining, setSecondsRemaining] = useState(
    (currentBlock?.remainingMinutes || currentBlock?.durationMinutes || 45) * 60
  );
  const [totalBlockSeconds, setTotalBlockSeconds] = useState(
    (currentBlock?.durationMinutes || 45) * 60
  );

  // Timestamp references for real-world elapsed time tracking across backgrounding / phone locking
  const timerStateRef = useRef({
    blockId: currentBlock?.id || null,
    targetTotalSeconds: (currentBlock?.durationMinutes || 45) * 60,
    startTimeStamp: Date.now(),
    elapsedBeforeResume: 0,
    isRunning: true
  });

  // Keep live clock updated every second
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTimeStr(getCurrentTimeString());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Calculate current exact remaining seconds based on real-time timestamps
  const computeExactRemainingSeconds = useCallback(() => {
    const state = timerStateRef.current;
    if (!state.blockId) return 0;

    let totalElapsed = state.elapsedBeforeResume;
    if (state.isRunning && state.startTimeStamp) {
      const currentSessionSec = Math.max(0, Math.floor((Date.now() - state.startTimeStamp) / 1000));
      totalElapsed += currentSessionSec;
    }

    return Math.max(0, state.targetTotalSeconds - totalElapsed);
  }, []);

  // Calculate actual elapsed seconds worked on this block
  const computeActualElapsedSeconds = useCallback(() => {
    const state = timerStateRef.current;
    if (!state.blockId) return 0;

    let totalElapsed = state.elapsedBeforeResume;
    if (state.isRunning && state.startTimeStamp) {
      const currentSessionSec = Math.max(0, Math.floor((Date.now() - state.startTimeStamp) / 1000));
      totalElapsed += currentSessionSec;
    }

    return totalElapsed;
  }, []);

  // Sync / Initialize timer when active block changes
  useEffect(() => {
    if (!currentBlock) return;

    const blockId = currentBlock.id;
    const blockDurationSec = (currentBlock.durationMinutes || 45) * 60;
    const initialRemainingSec = (currentBlock.remainingMinutes ?? currentBlock.durationMinutes ?? 45) * 60;

    setTotalBlockSeconds(blockDurationSec);

    // Check stored timer state
    let loadedFromStorage = false;
    try {
      const stored = localStorage.getItem(TIMER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.blockId === blockId) {
          timerStateRef.current = {
            blockId,
            targetTotalSeconds: parsed.targetTotalSeconds || blockDurationSec,
            startTimeStamp: parsed.startTimeStamp || Date.now(),
            elapsedBeforeResume: parsed.elapsedBeforeResume || 0,
            isRunning: parsed.isRunning !== false
          };
          setIsRunning(parsed.isRunning !== false);
          loadedFromStorage = true;
        }
      }
    } catch (e) {}

    if (!loadedFromStorage) {
      const elapsedAlready = Math.max(0, blockDurationSec - initialRemainingSec);
      timerStateRef.current = {
        blockId,
        targetTotalSeconds: blockDurationSec,
        startTimeStamp: Date.now(),
        elapsedBeforeResume: elapsedAlready,
        isRunning: true
      };
      setIsRunning(true);
      try {
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerStateRef.current));
      } catch (e) {}
    }

    const exact = computeExactRemainingSeconds();
    setSecondsRemaining(exact);
  }, [currentBlock?.id, currentBlock?.remainingMinutes, currentBlock?.durationMinutes, computeExactRemainingSeconds]);

  // Main real-time timestamp interval loop & visibilitychange / phone unlock listener
  useEffect(() => {
    const updateTick = () => {
      const exact = computeExactRemainingSeconds();
      setSecondsRemaining(exact);
    };

    const interval = setInterval(updateTick, 500);

    const handleVisibilityOrFocus = () => {
      updateTick();
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [computeExactRemainingSeconds]);

  // Handle Play / Pause with dynamic schedule recalculation
  const handleTogglePlayPause = () => {
    const state = timerStateRef.current;
    if (isRunning) {
      // PAUSE: record accumulated elapsed seconds and freeze
      const currentSessionSec = Math.max(0, Math.floor((Date.now() - state.startTimeStamp) / 1000));
      state.elapsedBeforeResume += currentSessionSec;
      state.isRunning = false;
      state.startTimeStamp = null;
      setIsRunning(false);
    } else {
      // RESUME: unfreeze, set new start timestamp, and shift the downstream schedule!
      state.startTimeStamp = Date.now();
      state.isRunning = true;
      setIsRunning(true);

      const exactRemainingSec = Math.max(0, state.targetTotalSeconds - state.elapsedBeforeResume);
      const remainingMinutes = Math.max(1, Math.round(exactRemainingSec / 60));

      if (onShiftScheduleOnResume) {
        onShiftScheduleOnResume(activeIndex, remainingMinutes);
      }
    }

    try {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}

    const exact = computeExactRemainingSeconds();
    setSecondsRemaining(exact);
  };

  // Complete block: passes actual elapsed worked minutes
  const handleBlockCompletion = () => {
    try {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    } catch (e) {}

    const actualSec = computeActualElapsedSeconds();
    const actualWorkedMinutes = Math.max(1, Math.round(actualSec / 60));

    onCompleteBlock(currentBlock, actualWorkedMinutes);
  };

  // End early: immediately stops timer, logs exact worked minutes, shifts remaining schedule to now
  const handleEndEarly = () => {
    try {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    } catch (e) {}

    const actualSec = computeActualElapsedSeconds();
    const actualWorkedMinutes = Math.max(1, Math.round(actualSec / 60));

    if (onEndBlockEarly) {
      onEndBlockEarly(currentBlock, actualWorkedMinutes);
    } else {
      onCompleteBlock(currentBlock, actualWorkedMinutes);
    }
  };

  const handleBlockCancellation = () => {
    try {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    } catch (e) {}
    onCancelBlock(currentBlock);
  };

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
      100 - (secondsRemaining / (totalBlockSeconds || 1)) * 100
    )
  );

  const actualElapsedSec = computeActualElapsedSeconds();
  const actualWorkedMinutes = Math.max(0, Math.round(actualElapsedSec / 60));

  return (
    <div
      className="focus-view animate-fade-in"
      style={{
        padding: '24px 20px 48px',
        maxWidth: '740px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%'
      }}
    >
      {/* Top Breadcrumb & Live Clock */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '18px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: isBusy ? 'var(--text-muted)' : isBreak ? 'var(--accent-emerald)' : !isRunning ? 'var(--accent-amber, #f59e0b)' : 'var(--accent-primary)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {isBusy ? 'BUSY / UNAVAILABLE' : isBreak ? 'RECHARGE IN PROGRESS' : !isRunning ? 'PAUSED' : 'FOCUS IN PROGRESS'}
          </span>
          <span style={{ color: 'var(--border-medium)' }}>•</span>
          <span
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            Block {activeIndex + 1} of {blocks.length}
          </span>
        </div>

        {/* Live Real-Time Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <Clock size={12} style={{ color: 'var(--accent-primary)' }} />
            <span>Now: {currentTimeStr}</span>
          </div>

          <button
            onClick={onNavigateToOverview}
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface)'
            }}
          >
            <span>Overview</span>
            <ChevronRight size={13} />
          </button>
        </div>
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
            : !isRunning
            ? '1.5px solid var(--accent-amber, #f59e0b)'
            : '1.5px solid var(--accent-primary-faint)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 20px',
          textAlign: 'center',
          boxShadow: isBusy
            ? '0 0 20px rgba(0, 0, 0, 0.4)'
            : isBreak
            ? '0 0 30px rgba(16, 185, 129, 0.12)'
            : '0 0 30px rgba(56, 189, 248, 0.12)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '18px'
        }}
      >
        {/* Category / Goal Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 14px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-hairline)',
            fontSize: '0.84rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '12px'
          }}
        >
          <span>{currentBlock.icon || '🎯'}</span>
          <span>{currentBlock.title}</span>
        </div>

        {/* Note / Context description */}
        {currentBlock.note && (
          <p
            style={{
              fontSize: '0.84rem',
              color: 'var(--text-secondary)',
              maxWidth: '460px',
              margin: '0 auto 20px',
              lineHeight: 1.4
            }}
          >
            {currentBlock.note}
          </p>
        )}

        {/* Circular / Large Timer Display */}
        <div
          style={{
            position: 'relative',
            width: '230px',
            height: '230px',
            maxWidth: '100%',
            margin: '0 auto 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* SVG Progress Ring */}
          <svg
            viewBox="0 0 230 230"
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
              cx="115"
              cy="115"
              r="102"
              stroke="var(--bg-card)"
              strokeWidth="9"
              fill="none"
            />
            <circle
              cx="115"
              cy="115"
              r="102"
              stroke={isBusy ? 'var(--text-muted)' : isBreak ? 'var(--accent-emerald)' : !isRunning ? 'var(--accent-amber, #f59e0b)' : 'var(--accent-primary)'}
              strokeWidth="9"
              fill="none"
              strokeDasharray={2 * Math.PI * 102}
              strokeDashoffset={2 * Math.PI * 102 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>

          {/* Time digits */}
          <div
            style={{
              fontSize: '3.2rem',
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
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              marginTop: '4px',
              zIndex: 2
            }}
          >
            {currentBlock.startTime} — {currentBlock.endTime}
          </div>

          {/* Worked vs Remaining Live Tracker */}
          <div
            style={{
              fontSize: '0.68rem',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              marginTop: '2px',
              zIndex: 2
            }}
          >
            Worked: {actualWorkedMinutes}m · Remaining: {mins}m
          </div>
        </div>

        {/* Primary Controls: Play/Pause, Complete, and End Early */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <button
            onClick={handleTogglePlayPause}
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: isRunning ? 'var(--bg-card)' : 'var(--accent-primary)',
              color: isRunning ? 'var(--text-primary)' : '#06070a',
              border: '1px solid var(--border-subtle)',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isRunning ? (
              <>
                <Pause size={17} />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play size={17} fill="#06070a" />
                <span>Resume Schedule</span>
              </>
            )}
          </button>

          {isBreak ? (
            <button
              onClick={onEndBreakEarly}
              style={{
                padding: '12px 24px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--accent-emerald)',
                color: '#06070a',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.25)'
              }}
            >
              <Sparkles size={17} />
              <span>I'm Ready Early →</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleBlockCompletion}
                style={{
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#06070a',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 18px rgba(56, 189, 248, 0.25)'
                }}
              >
                <CheckCircle2 size={17} />
                <span>{isBusy ? 'Finish Busy Block →' : 'Complete Block →'}</span>
              </button>

              {/* Explicit End Early Button */}
              {actualWorkedMinutes > 0 && (
                <button
                  onClick={handleEndEarly}
                  style={{
                    padding: '12px 18px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-hairline)',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--accent-primary)';
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border-hairline)';
                  }}
                  title="Finish now and log actual worked time"
                >
                  <Square size={14} />
                  <span>End Early ({actualWorkedMinutes}m)</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Secondary Action Bar: +15, +30, Need Break, Push Later, Cancel Block */}
        {!isBreak && !isBusy && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '6px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-hairline)'
            }}
          >
            {/* +15 min */}
            <button
              onClick={() => onAddTime(15)}
              style={{
                padding: '7px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-hairline)',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <Plus size={13} />
              <span>+15 min</span>
            </button>

            {/* +30 min */}
            <button
              onClick={() => onAddTime(30)}
              style={{
                padding: '7px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-hairline)',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <Plus size={13} />
              <span>+30 min</span>
            </button>

            {/* Need a Break */}
            <button
              onClick={() => onOpenBreakModal(currentBlock)}
              style={{
                padding: '7px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--accent-emerald)',
                border: '1px solid var(--border-hairline)',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Coffee size={13} />
              <span>Need a Break</span>
            </button>

            {/* Push Later */}
            <button
              onClick={() => onOpenPushLaterModal(currentBlock)}
              style={{
                padding: '7px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-hairline)',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <ArrowDown size={13} />
              <span>Push Later</span>
            </button>

            {/* Cancel Block */}
            <button
              onClick={handleBlockCancellation}
              style={{
                padding: '7px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--accent-coral)',
                border: '1px solid var(--border-hairline)',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Trash2 size={12} />
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
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{nextBlock.icon || '📌'}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Up Next ({nextBlock.startTime})
              </div>
              <div
                style={{
                  fontSize: '0.86rem',
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
              fontSize: '0.76rem',
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
