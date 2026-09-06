import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Clock,
  Play,
  RotateCcw,
  Edit3,
  CheckCircle2,
  Coffee,
  Dumbbell,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Lock,
  Plus,
  Trash2,
  Target,
  ChevronRight
} from 'lucide-react';
import { formatDuration, getCurrentTimeString } from '../utils/timeHelpers.js';

export default function Overview({
  planState,
  onStartDay,
  onResumeDay,
  onRebuildDay,
  onEditCheckIn,
  onUpdateBlockDuration,
  onDeleteBlock
}) {
  const [currentTimeStr, setCurrentTimeStr] = useState(() => getCurrentTimeString());

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTimeStr(getCurrentTimeString());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  if (!planState || !planState.blocks || planState.blocks.length === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', maxWidth: '560px', margin: '0 auto' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🪐</div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '6px' }}>No active schedule yet.</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontStyle: 'italic', fontSize: '0.88rem' }}>
          "Your life doesn't need a blueprint. You just need to decide what's next."
        </p>
        <button
          onClick={onEditCheckIn}
          style={{
            padding: '12px 24px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--accent-primary)',
            color: '#06070a',
            fontWeight: 700,
            fontSize: '0.92rem'
          }}
        >
          Build My Day (Block by Block) →
        </button>
      </div>
    );
  }

  const {
    blocks = [],
    totalFocusedFormatted = '0m',
    totalFreeFormatted = '0m',
    blockCount = 0,
    scheduledStartTime = '4:00 PM',
    scheduledEndTime = '9:30 PM',
    hardEndTime = '9:30 PM',
    energy = 'normal',
    startedCount = 0,
    finishedCount = 0,
    perGoalStats = [],
    dayState = 'planned',
    activeIndex = 0
  } = planState;

  const isDayActive = dayState === 'active';

  return (
    <div className="overview-view animate-fade-in" style={{ padding: '24px 28px 48px', maxWidth: '960px', margin: '0 auto' }}>
      
      {/* Header & Live Clock */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', marginBottom: '20px' }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--accent-primary-faint)',
              color: 'var(--accent-primary)',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '6px',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <Sparkles size={11} />
            <span>ORBIT DAILY PLAN</span>
          </div>

          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Today's Schedule
          </h1>

          <p style={{ fontSize: '0.88rem', color: 'var(--accent-primary)', marginTop: '2px', fontStyle: 'italic' }}>
            "Your life doesn't need a blueprint. You just need to decide what's next."
          </p>
        </div>

        {/* Live Real-Time Clock */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600
          }}
        >
          <Clock size={14} style={{ color: 'var(--accent-primary)' }} />
          <span>Real Time: <strong style={{ color: 'var(--text-primary)' }}>{currentTimeStr}</strong></span>
        </div>
      </div>

      {/* Metrics Bar: Focused Time, Started vs Finished, Total Blocks, End Time */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}
      >
        {/* Metric 1: Focused Time */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 16px'
          }}
        >
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            Planned Focus
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            {totalFocusedFormatted}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
            Goal & study work
          </div>
        </div>

        {/* Metric 2: Started vs Finished */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 16px'
          }}
        >
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            Started vs Finished
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            {finishedCount} <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {blocks.length}</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
            Started: {startedCount} · Done: {finishedCount}
          </div>
        </div>

        {/* Metric 3: Total Blocks */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 16px'
          }}
        >
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            Schedule Blocks
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            {blocks.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
            {totalFreeFormatted !== '0m' ? `${totalFreeFormatted} free time` : 'Custom blocks'}
          </div>
        </div>

        {/* Metric 4: Scheduled End Time */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 16px'
          }}
        >
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            Planned End Time
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            {scheduledEndTime}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
            Bedtime: {planState.bedtime || '10:30 PM'}
          </div>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '28px' }}>
        {isDayActive ? (
          <button
            onClick={onResumeDay}
            style={{
              padding: '12px 26px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--accent-primary)',
              color: '#06070a',
              fontSize: '0.94rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 18px rgba(56, 189, 248, 0.25)'
            }}
          >
            <Play size={16} fill="#06070a" />
            <span>Resume Focus Session →</span>
          </button>
        ) : (
          <button
            onClick={onStartDay}
            style={{
              padding: '12px 26px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--accent-primary)',
              color: '#06070a',
              fontSize: '0.94rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 18px rgba(56, 189, 248, 0.25)'
            }}
          >
            <Play size={16} fill="#06070a" />
            <span>START MY DAY →</span>
          </button>
        )}

        <button
          onClick={onEditCheckIn}
          style={{
            padding: '12px 20px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.88rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Edit3 size={15} />
          <span>Edit Block by Block</span>
        </button>
      </div>

      {/* GOALS AND TIME TRACKING: Planned vs Completed Today */}
      {Array.isArray(perGoalStats) && perGoalStats.some((g) => g.plannedMinutes > 0) && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Target size={16} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Goals & Time Tracking
            </h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '10px'
            }}
          >
            {perGoalStats
              .filter((g) => g.plannedMinutes > 0)
              .map((g) => (
                <div
                  key={g.goalId}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '12px 14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.15rem' }}>{g.icon}</span>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {g.name}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Planned:</span>
                    <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{g.plannedFormatted}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Actual Worked:</span>
                    <strong style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>{g.completedFormatted}</strong>
                  </div>

                  {g.remainingPlannedMinutes > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Remaining:</span>
                      <span style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{g.remainingPlannedFormatted}</span>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Timeline Section with Inline Cascading Edits */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Timeline
            </h3>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Adjusting any block duration automatically recalculates all following blocks.
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            {scheduledStartTime} — {scheduledEndTime}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {blocks.map((block, idx) => {
            const isBreak = block.type === 'break';
            const isFreeTime = block.type === 'freetime';
            const isGym = block.type === 'gym';
            const isBusyBlock = block.type === 'busy' || block.isBusy;
            const isCurrentActive = isDayActive && idx === activeIndex;

            let tagColor = 'var(--accent-primary)';
            let tagBg = 'var(--accent-primary-faint)';
            if (isBreak) {
              tagColor = 'var(--accent-emerald)';
              tagBg = 'var(--accent-emerald-faint)';
            } else if (isFreeTime) {
              tagColor = 'var(--accent-sapphire)';
              tagBg = 'rgba(2, 132, 199, 0.15)';
            } else if (isGym) {
              tagColor = 'var(--accent-coral)';
              tagBg = 'var(--accent-coral-faint)';
            } else if (isBusyBlock) {
              tagColor = 'var(--text-muted)';
              tagBg = 'rgba(126, 139, 160, 0.14)';
            }

            return (
              <div
                key={block.id || idx}
                className="timeline-block"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: isBusyBlock
                    ? 'rgba(16, 19, 29, 0.6)'
                    : isCurrentActive
                    ? 'rgba(56, 189, 248, 0.08)'
                    : isBreak
                    ? 'var(--bg-primary)'
                    : 'var(--bg-surface)',
                  border: isCurrentActive
                    ? '1.5px solid var(--accent-primary)'
                    : isBusyBlock
                    ? '1.5px dashed rgba(126, 139, 160, 0.3)'
                    : isBreak
                    ? '1px dashed var(--border-subtle)'
                    : '1px solid var(--border-hairline)',
                  position: 'relative',
                  transition: 'all 0.16s ease'
                }}
              >
                {/* Time Range */}
                <div
                  style={{
                    width: '120px',
                    fontFamily: 'var(--font-mono)',
                    flexShrink: 0
                  }}
                >
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: isBusyBlock ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    {block.startTime}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    to {block.endTime}
                  </div>
                </div>

                {/* Icon */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.15rem',
                    flexShrink: 0,
                    border: '1px solid var(--border-hairline)'
                  }}
                >
                  {block.icon || '📌'}
                </div>

                {/* Title & Context */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: isBusyBlock ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                      {block.title}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        color: tagColor,
                        backgroundColor: tagBg,
                        padding: '1px 7px',
                        borderRadius: 'var(--radius-pill)',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {formatDuration(block.durationMinutes)}
                    </span>
                    {isCurrentActive && (
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          color: '#06070a',
                          backgroundColor: 'var(--accent-primary)',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-pill)',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        ACTIVE NOW
                      </span>
                    )}
                    {block.status === 'ended_early' && (
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 600,
                          color: 'var(--accent-emerald)',
                          backgroundColor: 'var(--accent-emerald-faint)',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-pill)'
                        }}
                      >
                        Ended Early ({block.actualWorkedMinutes || block.durationMinutes}m)
                      </span>
                    )}
                  </div>

                  {block.note && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {block.note}
                    </div>
                  )}
                </div>

                {/* Inline Duration Edit (+/- 15m) & Delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                  {onUpdateBlockDuration && !isBusyBlock && !block.completed && (
                    <>
                      <button
                        type="button"
                        onClick={() => onUpdateBlockDuration(idx, Math.max(10, (block.durationMinutes || 30) - 15))}
                        disabled={block.durationMinutes <= 15}
                        style={{
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-hairline)',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          opacity: block.durationMinutes <= 15 ? 0.4 : 1
                        }}
                      >
                        -15m
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateBlockDuration(idx, (block.durationMinutes || 30) + 15)}
                        style={{
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-hairline)',
                          fontSize: '0.68rem',
                          fontWeight: 700
                        }}
                      >
                        +15m
                      </button>
                    </>
                  )}

                  {onDeleteBlock && !block.completed && (
                    <button
                      type="button"
                      onClick={() => onDeleteBlock(idx)}
                      style={{
                        padding: '5px',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-muted)',
                        marginLeft: '2px'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-coral)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  {/* Completion Status */}
                  {block.completed && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'var(--accent-emerald)',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        marginLeft: '6px'
                      }}
                    >
                      <CheckCircle2 size={15} />
                      <span>Done</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
