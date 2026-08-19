import React from 'react';
import { Calendar, Target, TrendingUp, X, Sparkles, Clock, Compass } from 'lucide-react';
import { formatDuration } from '../utils/timeHelpers';

export default function Sidebar({
  currentPage,
  onNavigate,
  totalTrackedMinutes = 0,
  mobileOpen = false,
  onCloseMobile
}) {
  const navItems = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'progress', label: 'Progress', icon: TrendingUp }
  ];

  const totalHoursFormatted = (totalTrackedMinutes / 60).toFixed(1) + 'h';

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(8, 9, 12, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 90,
            transition: 'opacity 0.2s ease'
          }}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`sidebar-container ${mobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: 'var(--bg-primary)',
          borderRight: '1px solid var(--border-hairline)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '28px 20px',
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Top Header & Identity */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '32px',
              paddingBottom: '20px',
              borderBottom: '1px solid var(--border-hairline)'
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  fontFamily: 'var(--font-sans)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>Emmanuel Lopez</span>
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--accent-primary)',
                  fontWeight: 500,
                  marginTop: '2px',
                  letterSpacing: '0.02em',
                  opacity: 0.95
                }}
              >
                Your year, your system.
              </div>
            </div>

            {/* Mobile Close Button */}
            {mobileOpen && (
              <button
                onClick={onCloseMobile}
                aria-label="Close navigation"
                style={{
                  padding: '6px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--bg-surface)'
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isActive ? 'var(--bg-card)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.92rem',
                    textAlign: 'left',
                    border: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
                    boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                    transition: 'all 0.18s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <Icon
                    size={18}
                    style={{
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                      transition: 'color 0.18s ease'
                    }}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <div
                      style={{
                        marginLeft: 'auto',
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-primary)'
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: YOUR YEAR */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 16px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '6px',
              fontFamily: 'var(--font-mono)'
            }}
          >
            YOUR YEAR
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '6px',
              marginBottom: '2px'
            }}
          >
            <span
              style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                color: 'var(--accent-primary)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '-0.03em'
              }}
            >
              {totalHoursFormatted}
            </span>
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                fontWeight: 500
              }}
            >
              tracked so far
            </span>
          </div>

          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginTop: '6px',
              lineHeight: 1.3
            }}
          >
            Every block compounds toward your junior year milestones.
          </div>
        </div>
      </aside>
    </>
  );
}
