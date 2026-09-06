import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  Zap,
  TrendingUp,
  Target,
  Play,
  RotateCcw
} from 'lucide-react';
import OrbitPlanet from './OrbitPlanet';
import { getGreeting, getFormattedCurrentDate, formatDuration, getCurrentTimeString } from '../utils/timeHelpers';

export default function Today({
  planState,
  goals,
  rankedGoals,
  onOpenCheckIn,
  onHomeCheckIn,
  onStartDay,
  onResumeDay,
  onReviewPlan,
  onNavigate,
  onResetDay
}) {
  const [currentTimeStr, setCurrentTimeStr] = useState(() => getCurrentTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeStr(getCurrentTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const greeting = getGreeting('Emmanuel');
  const currentDate = getFormattedCurrentDate();
  const dayState = planState?.dayState || 'idle';

  return (
    <div className="today-view animate-fade-in" style={{ padding: '24px 32px 48px', maxWidth: '1120px', margin: '0 auto' }}>
      
      {/* Top Header: Greeting, Date & Live Clock */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          marginBottom: '24px',
          paddingBottom: '18px',
          borderBottom: '1px solid var(--border-hairline)'
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              fontFamily: 'var(--font-mono)',
              marginBottom: '2px'
            }}
          >
            {currentDate}
          </div>
          <h1
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em'
            }}
          >
            {greeting}
          </h1>
        </div>

        {/* Live Real-Time Clock & Home Check-in */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-hairline)',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600
            }}
          >
            <Clock size={14} style={{ color: 'var(--accent-primary)' }} />
            <span>Real Time: <strong style={{ color: 'var(--text-primary)' }}>{currentTimeStr}</strong></span>
          </div>

          <button
            onClick={onHomeCheckIn}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              fontWeight: 600,
              fontSize: '0.86rem',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <span style={{ fontSize: '1rem' }}>🏠</span>
            <span>I'm home</span>
            <ArrowRight size={14} style={{ color: 'var(--accent-primary)' }} />
          </button>
        </div>
      </div>

      {/* COMPLETED DAY STATE */}
      {dayState === 'completed' ? (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '36px 28px',
            textAlign: 'center',
            marginBottom: '32px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--accent-emerald-faint)',
              color: 'var(--accent-emerald)',
              fontSize: '0.74rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '12px',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <CheckCircle2 size={14} />
            <span>TODAY COMPLETE</span>
          </div>

          <h2
            style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              marginBottom: '8px'
            }}
          >
            That's enough for today.
          </h2>

          <p
            style={{
              fontSize: '0.96rem',
              color: 'var(--text-secondary)',
              maxWidth: '520px',
              margin: '0 auto 24px',
              lineHeight: 1.45
            }}
          >
            You showed up, made progress on your junior year goals, and protected your time and recovery.
          </p>

          <button
            onClick={onResetDay}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.9rem',
              fontWeight: 600
            }}
          >
            <RotateCcw size={15} />
            <span>Plan Another Session</span>
          </button>
        </div>
      ) : (
        /* HERO PLANNING CARD */
        <div
          className="hero-card"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px 32px',
            marginBottom: '28px',
            display: 'grid',
            gridTemplateColumns: 'minmax(300px, 1.4fr) minmax(180px, 1fr)',
            alignItems: 'center',
            gap: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Left Hero Content */}
          <div style={{ zIndex: 2 }}>
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
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '12px',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <Sparkles size={12} />
              <span>ORBIT</span>
            </div>

            <h2
              style={{
                fontSize: '1.9rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                letterSpacing: '-0.03em',
                marginBottom: '10px'
              }}
            >
              "Your life doesn't need a blueprint. You just need to decide what's next."
            </h2>

            <p
              style={{
                fontSize: '0.92rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                marginBottom: '22px',
                maxWidth: '480px'
              }}
            >
              Build your schedule one block at a time. Pick what matters, set the duration, and take control of your day.
            </p>

            {/* Dynamic CTA depending on Day State */}
            {dayState === 'idle' && (
              <button
                onClick={onOpenCheckIn}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 26px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#06070a',
                  fontSize: '0.96rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 18px rgba(56, 189, 248, 0.25)',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-primary-hover)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <Sparkles size={16} />
                <span>Build My Day (Block by Block) →</span>
              </button>
            )}

            {dayState === 'planned' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <button
                  onClick={onStartDay}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 24px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--accent-primary)',
                    color: '#06070a',
                    fontSize: '0.96rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 18px rgba(56, 189, 248, 0.25)'
                  }}
                >
                  <Play size={16} fill="#06070a" />
                  <span>START MY DAY →</span>
                </button>
                <button
                  onClick={onReviewPlan}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.88rem',
                    fontWeight: 600
                  }}
                >
                  <span>Review Plan ({planState.blocks?.length || 0} blocks)</span>
                </button>
              </div>
            )}

            {dayState === 'active' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <button
                  onClick={onResumeDay}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 24px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--accent-primary)',
                    color: '#06070a',
                    fontSize: '0.96rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 18px rgba(56, 189, 248, 0.25)'
                  }}
                >
                  <Play size={16} fill="#06070a" />
                  <span>Resume my day →</span>
                </button>
                <button
                  onClick={onReviewPlan}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.88rem',
                    fontWeight: 600
                  }}
                >
                  <span>Overview Timeline</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Orbit Visual */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              width: '100%',
              minHeight: '190px'
            }}
          >
            <OrbitPlanet size="hero" />
          </div>
        </div>
      )}

      {/* PLAN READY BANNER (If planned & not completed) */}
      {dayState === 'planned' && (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 22px',
            marginBottom: '28px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-primary-faint)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)'
              }}
            >
              <Clock size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                PLAN READY
              </div>
              <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Orbit has your afternoon mapped out.
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {planState.blocks?.length || 0} blocks · {planState.totalFocusedFormatted || '0m'} focus · Done around {planState.scheduledEndTime}
              </div>
            </div>
          </div>

          <button
            onClick={onStartDay}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-primary)',
              color: '#06070a',
              fontWeight: 700,
              fontSize: '0.88rem'
            }}
          >
            Start Now →
          </button>
        </div>
      )}

      {/* LOWER GRID: Ranked Priorities & Philosophy */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(280px, 1fr)',
          gap: '20px',
          alignItems: 'stretch'
        }}
      >
        {/* Ranked Priorities Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-xl)',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                marginBottom: '2px'
              }}
            >
              TODAY
            </div>
            <h3
              style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: '14px'
              }}
            >
              Your priorities
            </h3>

            {/* Priorities List with Recommendation Highlighting */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(rankedGoals || []).slice(0, 5).map((goal) => {
                const target = goal.weeklyTarget || 1;
                const completed = goal.completed || 0;
                const pct = Math.min(100, Math.round((completed / target) * 100));
                const isRec = goal.isRecommended;

                return (
                  <div
                    key={goal.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isRec ? 'rgba(56, 189, 248, 0.05)' : 'var(--bg-card)',
                      border: isRec ? '1px solid var(--accent-primary-faint)' : '1px solid var(--border-hairline)',
                      transition: 'transform 0.18s ease'
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: 'var(--accent-primary)',
                        width: '20px'
                      }}
                    >
                      {goal.rank || '01'}
                    </span>

                    <span style={{ fontSize: '1.15rem' }}>{goal.icon}</span>

                    <div style={{ flex: 1, minWidth: 0 }}>
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
                        {goal.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          marginTop: '1px'
                        }}
                      >
                        {completed} / {target} {goal.unit} this week ({pct}%)
                      </div>
                    </div>

                    {isRec && (
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          color: 'var(--accent-primary)',
                          backgroundColor: 'var(--accent-primary-faint)',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-pill)',
                          textTransform: 'uppercase',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        Recommended
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-hairline)' }}>
            <button
              onClick={() => onNavigate('goals')}
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>Manage life priorities</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Philosophy Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-xl)',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                marginBottom: '2px'
              }}
            >
              PHILOSOPHY
            </div>
            <h3
              style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: '10px'
              }}
            >
              "Your life isn't a checklist."
            </h3>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
              Traditional productivity says: write everything down and feel guilty when you don't finish.
            </p>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Orbit says: look at your energy, your available afternoon window, and your weekly goals — then decide what actually deserves your time today.
            </p>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-hairline)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
              Protected bedtime: {planState?.bedtime || '10:30 PM'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
