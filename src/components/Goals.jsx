import React, { useState } from 'react';
import { Target, Plus, Edit3, Trash2, Clock, Sparkles, Award } from 'lucide-react';
import { AddGoalModal, EditGoalModal, DeleteGoalModal } from './GoalModals';

export default function Goals({
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [deletingGoal, setDeletingGoal] = useState(null);

  return (
    <div className="goals-view animate-fade-in" style={{ padding: '32px 40px 60px', maxWidth: '1080px', margin: '0 auto' }}>
      
      {/* Top Header */}
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
            LIFE PRIORITIES
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Junior Year Commitments
          </h1>
          <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Orbit balances these goals automatically each day based on weekly deficits and energy.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 22px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--accent-primary)',
            color: '#08090C',
            fontWeight: 700,
            fontSize: '0.9rem',
            boxShadow: '0 4px 16px rgba(56, 189, 248, 0.25)',
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
          <Plus size={18} />
          <span>Add New Goal →</span>
        </button>
      </div>

      {/* Goals Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px'
        }}
      >
        {goals.map((goal) => {
          const target = goal.weeklyTarget || 1;
          const completed = goal.completed || 0;
          const pct = Math.min(100, Math.round((completed / target) * 100));
          const isComplete = completed >= target;

          return (
            <div
              key={goal.id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-xl)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-hairline)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div>
                {/* Header: Icon, Name, Priority Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-card)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.4rem',
                        border: '1px solid var(--border-hairline)'
                      }}
                    >
                      {goal.icon}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {goal.name}
                      </h3>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: 'var(--accent-primary)',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        Priority {goal.priority} / 5
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => setEditingGoal(goal)}
                      title="Edit Goal"
                      style={{
                        padding: '6px',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-muted)',
                        backgroundColor: 'var(--bg-card)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => setDeletingGoal(goal)}
                      title="Remove Goal"
                      style={{
                        padding: '6px',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-muted)',
                        backgroundColor: 'var(--bg-card)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-coral)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {goal.description && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.4 }}>
                    {goal.description}
                  </p>
                )}

                {/* Target & Progress Stats */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    marginBottom: '14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>This Week</span>
                    <span style={{ fontWeight: 700, color: isComplete ? 'var(--accent-emerald)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {completed} / {target} {goal.unit} ({pct}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div
                    style={{
                      height: '6px',
                      borderRadius: '3px',
                      backgroundColor: 'var(--bg-primary)',
                      overflow: 'hidden'
                    }}
                  >
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
              </div>

              {/* Bottom Meta */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-hairline)',
                  fontSize: '0.76rem',
                  color: 'var(--text-muted)'
                }}
              >
                <span>Default session: {goal.sessionMinutes || 45}m</span>
                {isComplete ? (
                  <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>Target reached!</span>
                ) : (
                  <span>{target - completed} {goal.unit} left</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Orbit Modals */}
      <AddGoalModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAddGoal={onAddGoal}
      />

      <EditGoalModal
        isOpen={!!editingGoal}
        goal={editingGoal}
        onClose={() => setEditingGoal(null)}
        onSaveGoal={onUpdateGoal}
      />

      <DeleteGoalModal
        isOpen={!!deletingGoal}
        goal={deletingGoal}
        onClose={() => setDeletingGoal(null)}
        onConfirmDelete={onDeleteGoal}
      />
    </div>
  );
}
