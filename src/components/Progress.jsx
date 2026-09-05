import React, { useState } from 'react';
import {
  TrendingUp,
  RotateCcw,
  Undo2,
  Clock,
  CheckCircle2,
  Target,
  Sparkles,
  Calendar
} from 'lucide-react';
import { formatHistoryDate, formatDuration } from '../utils/timeHelpers';
import { ResetWeeklyModal } from './GoalModals';

export default function Progress({
  goals,
  activity,
  totalTrackedMinutes,
  startedCount = 0,
  finishedCount = 0,
  onUndoActivity,
  onResetWeeklyProgress
}) {
  const [isResetOpen, setIsResetOpen] = useState(false);

  const totalHours = (totalTrackedMinutes / 60).toFixed(1);
  const totalSessions = activity.length;

  return (
    <div className="progress-view animate-fade-in" style={{ padding: '32px 40px 60px', maxWidth: '1080px', margin: '0 auto' }}>
      
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '36px',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--border-hairline)'
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              fontFamily: 'var(--font-mono)',
              marginBottom: '4px'
            }}
          >
            LONG-TERM RECORD
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Junior Year Progress
          </h1>
          <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Tracking where your time actually goes across school, research, tests, and business.
          </p>
        </div>

        <button
          onClick={() => setIsResetOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            fontWeight: 600,
            fontSize: '0.88rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--accent-primary)';
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          <RotateCcw size={15} />
          <span>Reset Weekly Progress</span>
        </button>
      </div>

      {/* High Level Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
          marginBottom: '36px'
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            Total Year Time
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {totalHours}h
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Compounded focused work
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            Completed Sessions
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {totalSessions}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Focus blocks finished
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            Started vs Finished
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {finishedCount} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {startedCount || totalSessions}</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Follow-through rate
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            Active Goals
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-sapphire)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {goals.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Tracked life priorities
          </div>
        </div>
      </div>

      {/* TWO SECTIONS: Weekly Targets & Activity History Stream */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(320px, 1.4fr)',
          gap: '28px',
          alignItems: 'start'
        }}
      >
        {/* Weekly Goals Status */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px'
          }}
        >
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '18px' }}>
            Current Week Targets
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {goals.map((g) => {
              const target = g.weeklyTarget || 1;
              const completed = g.completed || 0;
              const pct = Math.min(100, Math.round((completed / target) * 100));
              const isComplete = completed >= target;

              return (
                <div
                  key={g.id}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    border: '1px solid var(--border-hairline)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>{g.icon}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{g.name}</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isComplete ? 'var(--accent-emerald)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {completed} / {target} {g.unit}
                    </span>
                  </div>

                  <div style={{ height: '5px', backgroundColor: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: isComplete ? 'var(--accent-emerald)' : 'var(--accent-primary)',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chronological Activity Feed with Undo */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Activity History
            </h3>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              {activity.length} logged
            </span>
          </div>

          {activity.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              No completed sessions yet. Start your day and finish a block to log activity!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
              {activity.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-hairline)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <span style={{ fontSize: '1.2rem' }}>{item.icon || '🎯'}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {formatDuration(item.minutes)} · {formatHistoryDate(item.date)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onUndoActivity(item)}
                    title="Undo this completed activity"
                    style={{
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-hairline)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--accent-coral)';
                      e.currentTarget.style.borderColor = 'var(--accent-coral)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.borderColor = 'var(--border-hairline)';
                    }}
                  >
                    <Undo2 size={13} />
                    <span>Undo</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <ResetWeeklyModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onConfirmReset={onResetWeeklyProgress}
      />
    </div>
  );
}
