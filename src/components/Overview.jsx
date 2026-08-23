import React from 'react';
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
  Lock
} from 'lucide-react';
import { formatDuration } from '../utils/timeHelpers';

export default function Overview({
  planState,
  onStartDay,
  onResumeDay,
  onRebuildDay,
  onEditCheckIn
}) {
  if (!planState || !planState.blocks || planState.blocks.length === 0) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🪐</div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }}>No active schedule yet.</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Tell Orbit about your afternoon and let the scheduling engine map out your day.
        </p>
        <button
          onClick={onEditCheckIn}
          style={{
            padding: '14px 28px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--accent-primary)',
            color: '#06070a',
            fontWeight: 700
          }}
        >
          Build My Day →
        </button>
      </div>
    );
  }

  const {
    blocks = [],
    totalFocusedFormatted = '0m',
    blockCount = 0,
    scheduledStartTime = '1:00 PM',
    scheduledEndTime = '9:30 PM',
    hardEndTime = '9:30 PM',
    energy = 'normal',
    contextSummary,
    dayState = 'planned'
  } = planState;

  const isDayActive = dayState === 'active';

  return (
    <div className="overview-view animate-fade-in" style={{ padding: '32px 40px 60px', maxWidth: '960px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--accent-primary-faint)',
            color: 'var(--accent-primary)',
            fontSize: '0.74rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '10px',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <Sparkles size={12} />
          <span>ORBIT PLAN</span>
        </div>

        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          Here's your day.
        </h1>

        <p style={{ fontSize: '0.96rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '600px' }}>
          Orbit built this around your time, energy ({energy}), priorities, and need for recovery.
        </p>

        {contextSummary && (
          <div
            style={{
              marginTop: '12px',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--accent-primary-faint)',
              fontSize: '0.84rem',
              color: 'var(--accent-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Sparkles size={15} />
            <span>{contextSummary}</span>
          </div>
        )}
      </div>

      {/* Metrics Bar: Focused Time, Blocks, End Time */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '36px'
        }}
      >
        {/* Metric 1: Focused Time */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            Focused Time
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {totalFocusedFormatted}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Productive goal & study blocks
          </div>
        </div>

        {/* Metric 2: Total Blocks */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            Schedule Blocks
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {blocks.length}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Work, breaks, gym & free time
          </div>
        </div>

        {/* Metric 3: Scheduled End Time */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            Protected End Time
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {scheduledEndTime}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Guaranteed cutoff before bedtime
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '40px' }}>
        {isDayActive ? (
          <button
            onClick={onResumeDay}
            style={{
              padding: '16px 32px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--accent-primary)',
              color: '#06070a',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 20px rgba(56, 189, 248, 0.25)'
            }}
          >
            <Play size={18} fill="#06070a" />
            <span>Resume Focus Session →</span>
          </button>
        ) : (
          <button
            onClick={onStartDay}
            style={{
              padding: '16px 32px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--accent-primary)',
              color: '#06070a',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 20px rgba(56, 189, 248, 0.25)'
            }}
          >
            <Play size={18} fill="#06070a" />
            <span>START MY DAY →</span>
          </button>
        )}

        <button
          onClick={onEditCheckIn}
          style={{
            padding: '16px 24px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.92rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Edit3 size={16} />
          <span>Adjust Check-In</span>
        </button>

        <button
          onClick={onRebuildDay}
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'transparent',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <RotateCcw size={15} />
          <span>Regenerate Orbit Plan</span>
        </button>
      </div>

      {/* Timeline Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Afternoon Timeline
          </h3>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {scheduledStartTime} — {scheduledEndTime}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {blocks.map((block, idx) => {
            const isBreak = block.type === 'break';
            const isFreeTime = block.type === 'freetime';
            const isGym = block.type === 'gym';
            const isBusyBlock = block.type === 'busy' || block.isBusy;

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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '18px',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: isBusyBlock
                    ? 'rgba(16, 19, 29, 0.6)'
                    : isBreak
                    ? 'var(--bg-primary)'
                    : 'var(--bg-surface)',
                  border: isBusyBlock
                    ? '1.5px dashed rgba(126, 139, 160, 0.3)'
                    : isBreak
                    ? '1px dashed var(--border-subtle)'
                    : '1px solid var(--border-hairline)',
                  position: 'relative',
                  transition: 'transform 0.18s ease'
                }}
              >
                {/* Time Range */}
                <div
                  style={{
                    width: '130px',
                    fontFamily: 'var(--font-mono)',
                    flexShrink: 0
                  }}
                >
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isBusyBlock ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    {block.startTime}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    to {block.endTime}
                  </div>
                </div>

                {/* Icon */}
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0,
                    border: '1px solid var(--border-hairline)'
                  }}
                >
                  {block.icon || '📌'}
                </div>

                {/* Title & Context */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: isBusyBlock ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                      {block.title}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: tagColor,
                        backgroundColor: tagBg,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {formatDuration(block.durationMinutes)}
                    </span>
                    {isBusyBlock && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          backgroundColor: 'var(--bg-card)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-pill)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Lock size={10} />
                        <span>UNAVAILABLE</span>
                      </span>
                    )}
                    {block.tracked && !isBusyBlock && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          color: 'var(--text-muted)',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-card)'
                        }}
                      >
                        Tracked
                      </span>
                    )}
                  </div>

                  {block.note && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                      {block.note}
                    </div>
                  )}
                </div>

                {/* Completion Status */}
                {block.completed && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--accent-emerald)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Done</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
