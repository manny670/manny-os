import React from 'react';
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
import { getGreeting, getFormattedCurrentDate, formatDuration } from '../utils/timeHelpers';

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
  const greeting = getGreeting('Emmanuel');
  const currentDate = getFormattedCurrentDate();
  const dayState = planState?.dayState || 'idle';

  return (
    <div className="today-view animate-fade-in" style={{ padding: '32px 40px 60px', maxWidth: '1180px', margin: '0 auto' }}>
      
      {/* Top Header: Greeting, Date & Quick Home Check-in */}
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
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              fontFamily: 'var(--font-mono)',
              marginBottom: '4px'
            }}
          >
            {currentDate}
          </div>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em'
            }}
          >
            {greeting}
          </h1>
        </div>

        {/* "I'm home" Action */}
        <button
          onClick={onHomeCheckIn}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 22px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            fontWeight: 600,
            fontSize: '0.9rem',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease'
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
          <span style={{ fontSize: '1.1rem' }}>🏠</span>
          <span>I'm home</span>
          <ArrowRight size={16} style={{ color: 'var(--accent-primary)' }} />
        </button>
      </div>

      {/* COMPLETED DAY STATE */}
      {dayState === 'completed' ? (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '48px 36px',
            textAlign: 'center',
            marginBottom: '40px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--accent-emerald-faint)',
              color: 'var(--accent-emerald)',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '16px',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <CheckCircle2 size={15} />
            <span>TODAY COMPLETE</span>
          </div>

          <h2
            style={{
              fontSize: '2.4rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              marginBottom: '12px'
            }}
          >
            That's enough for today.
          </h2>

          <p
            style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              maxWidth: '560px',
              margin: '0 auto 28px',
              lineHeight: 1.5
            }}
          >
            You showed up, made progress on your junior year goals, and protected your time and recovery.
          </p>

          {/* Quick Summary Metrics */}
          {planState?.schedule && (
            <div
              style={{
                display: 'inline-flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '24px',
                padding: '16px 28px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-hairline)',
                marginBottom: '32px'
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Total Focus Time
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                  {planState.totalFocusedFormatted || '0m'}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-hairline)', paddingLeft: '24px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Completed Blocks
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {planState.blocks?.length || 0} blocks
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              onClick={onOpenCheckIn}
              style={{
                padding: '14px 28px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--accent-primary)',
                color: '#08090C',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginRight: '12px',
                boxShadow: '0 4px 18px rgba(56, 189, 248, 0.25)'
              }}
            >
              <Sparkles size={16} />
              <span>Plan Another Session →</span>
            </button>
            <button
              onClick={() => onNavigate('progress')}
              style={{
                padding: '14px 24px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.95rem',
                border: '1px solid var(--border-subtle)'
              }}
            >
              See Progress & Year Record →
            </button>
          </div>
        </div>
      ) : (
        /* ORBIT HERO SECTION */
        <div
          className="orbit-hero-card"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '36px 40px',
            marginBottom: '40px',
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 1.4fr) minmax(200px, 1fr)',
            alignItems: 'center',
            gap: '32px',
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
                padding: '5px 12px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--accent-primary-faint)',
                color: 'var(--accent-primary)',
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '18px',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <Sparkles size={13} />
              <span>ORBIT</span>
            </div>

            <h2
              style={{
                fontSize: '2.1rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                lineHeight: 1.18,
                letterSpacing: '-0.03em',
                marginBottom: '14px'
              }}
            >
              Let Orbit decide what deserves your time today.
            </h2>

            <p
              style={{
                fontSize: '0.98rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
                marginBottom: '28px',
                maxWidth: '520px'
              }}
            >
              Time, energy, priorities, school, and your real life — all considered together.
            </p>

            {/* Dynamic CTA depending on Day State */}
            {dayState === 'idle' && (
              <button
                onClick={onOpenCheckIn}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '16px 28px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#08090C',
                  fontSize: '1rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 20px rgba(56, 189, 248, 0.25)',
                  transition: 'all 0.2s ease'
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
                <Sparkles size={18} />
                <span>Build my day →</span>
              </button>
            )}

            {dayState === 'planned' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <button
                  onClick={onStartDay}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '16px 28px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--accent-primary)',
                    color: '#08090C',
                    fontSize: '1rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 20px rgba(56, 189, 248, 0.25)'
                  }}
                >
                  <Play size={18} fill="#08090C" />
                  <span>START MY DAY →</span>
                </button>
                <button
                  onClick={onReviewPlan}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '16px 22px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.92rem',
                    fontWeight: 600
                  }}
                >
                  <span>Review Plan ({planState.blocks?.length || 0} blocks)</span>
                </button>
              </div>
            )}

            {dayState === 'active' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <button
                  onClick={onResumeDay}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '16px 28px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--accent-primary)',
                    color: '#08090C',
                    fontSize: '1rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 20px rgba(56, 189, 248, 0.25)'
                  }}
                >
                  <Play size={18} fill="#08090C" />
                  <span>Resume my day →</span>
                </button>
                <button
                  onClick={onReviewPlan}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.92rem',
                    fontWeight: 600
                  }}
                >
                  <span>Overview Timeline</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Orbit Visual: Responsive, Contained & Scalable */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              width: '100%',
              minHeight: '220px'
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
            padding: '20px 28px',
            marginBottom: '36px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-primary-faint)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)'
              }}
            >
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                PLAN READY
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Orbit has your afternoon mapped out.
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {planState.blocks?.length || 0} blocks · {planState.totalFocusedFormatted || '0m'} focus · Done around {planState.scheduledEndTime}
              </div>
            </div>
          </div>

          <button
            onClick={onStartDay}
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-primary)',
              color: '#08090C',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>START MY DAY →</span>
          </button>
        </div>
      )}

      {/* TWO COLUMN SECTION: Priorities & Philosophy */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '28px'
        }}
      >
        {/* Ranked Priorities Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                marginBottom: '4px'
              }}
            >
              TODAY
            </div>
            <h3
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: '20px'
              }}
            >
              Your priorities
            </h3>

            {/* Priorities List with Ranking Numbers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(rankedGoals || []).slice(0, 5).map((goal) => {
                const target = goal.weeklyTarget || 1;
                const completed = goal.completed || 0;
                const pct = Math.min(100, Math.round((completed / target) * 100));

                return (
                  <div
                    key={goal.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-hairline)',
                      transition: 'transform 0.18s ease'
                    }}
                  >
                    {/* Ranking Number */}
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        color: 'var(--accent-primary)',
                        width: '24px'
                      }}
                    >
                      {goal.rank || '01'}
                    </span>

                    {/* Icon */}
                    <span style={{ fontSize: '1.25rem' }}>{goal.icon}</span>

                    {/* Title & Weekly Status */}
                    <div style={{ flex: 1, minWidth: 0 }}>
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
                        {goal.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.74rem',
                          color: 'var(--text-muted)',
                          marginTop: '2px'
                        }}
                      >
                        {completed} / {target} {goal.unit} this week ({pct}%)
                      </div>
                    </div>

                    {/* Urgency or Status Tag */}
                    {goal.isUrgent && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: 'var(--accent-coral)',
                          backgroundColor: 'var(--accent-coral-faint)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-pill)',
                          textTransform: 'uppercase',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        Urgent
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-hairline)' }}>
            <button
              onClick={() => onNavigate('goals')}
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Manage life priorities</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Philosophy Card: "Your life isn't a checklist." */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                marginBottom: '4px'
              }}
            >
              THE IDEA
            </div>
            <h3
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: '16px'
              }}
            >
              Your life isn't a checklist.
            </h3>

            <p
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: '16px'
              }}
            >
              Traditional productivity tools assume unlimited energy and rigid hours. Junior OS is built around what actually happens when you get home from school:
            </p>

            <ul
              style={{
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                fontSize: '0.84rem',
                color: 'var(--text-secondary)'
              }}
            >
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--accent-primary)' }}>•</span>
                <span>Works around your busy hours and prioritizes your daily goals</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--accent-sapphire)' }}>•</span>
                <span>Adapts task depths to current physical & mental energy</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--accent-emerald)' }}>•</span>
                <span>Protects gym, breaks, and guaranteed free time before sleep</span>
              </li>
            </ul>
          </div>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-hairline)' }}>
            <button
              onClick={() => onNavigate('progress')}
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>See where your time goes →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
