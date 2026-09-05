import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Clock,
  Zap,
  Plus,
  Trash2,
  Check,
  Target,
  ArrowRight,
  BookOpen,
  Dumbbell,
  Coffee,
  Heart,
  User,
  Gamepad2,
  Edit2
} from 'lucide-react';
import {
  getCurrentTimeString,
  getCurrentTimeMinutes,
  minutesToTimeString,
  parseTimeToMinutes,
  formatDuration,
  roundToCleanIncrement
} from '../utils/timeHelpers.js';
import { recalculateScheduleTimes } from '../utils/scheduler.js';

export const BUILT_IN_ACTIVITIES = [
  { id: 'ap_schoolwork', name: 'AP Schoolwork', icon: '📚', type: 'schoolwork', defaultDuration: 60, color: '#38bdf8' },
  { id: 'mental_health', name: 'Mental Health Club', icon: '🧠', type: 'club', defaultDuration: 45, color: '#a78bfa' },
  { id: 'personal', name: 'Personal', icon: '🌟', type: 'personal', defaultDuration: 30, color: '#f472b6' },
  { id: 'freetime', name: 'Free Time', icon: '🎮', type: 'freetime', defaultDuration: 60, color: '#60a5fa' },
  { id: 'break', name: 'Break / Recharge', icon: '☕', type: 'break', defaultDuration: 15, color: '#34d399' }
];

export default function CheckInModal({
  isOpen,
  onClose,
  onSubmit,
  goals = [],
  initialValues = null,
  isHomeTrigger = false
}) {
  const [startTime, setStartTime] = useState('4:00 PM');
  const [endTime, setEndTime] = useState('9:30 PM');
  const [bedtime, setBedtime] = useState('10:30 PM');
  const [energy, setEnergy] = useState('normal'); // 'low' | 'normal' | 'high'

  // User's customized list of blocks built block-by-block
  const [blocks, setBlocks] = useState([]);

  // Active step selection state
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(45);
  const [customDurationInput, setCustomDurationInput] = useState('');
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [customNoteInput, setCustomNoteInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialValues) {
        setStartTime(initialValues.startTime || (isHomeTrigger ? getCurrentTimeString() : '4:00 PM'));
        setEndTime(initialValues.endTime || '9:30 PM');
        setBedtime(initialValues.bedtime || '10:30 PM');
        setEnergy(initialValues.energy || 'normal');
        if (Array.isArray(initialValues.blocks) && initialValues.blocks.length > 0) {
          setBlocks(initialValues.blocks);
        } else {
          setBlocks([]);
        }
      } else if (isHomeTrigger) {
        setStartTime(getCurrentTimeString());
        setBlocks([]);
      } else {
        setBlocks([]);
      }
      setSelectedActivity(null);
      setSelectedDuration(45);
      setCustomDurationInput('');
      setCustomTitleInput('');
      setCustomNoteInput('');
    }
  }, [isOpen, initialValues, isHomeTrigger]);

  if (!isOpen) return null;

  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);
  const availableTotalMinutes = Math.max(0, (endMin >= startMin ? endMin - startMin : endMin + 1440 - startMin));

  // Current calculated blocks with clean cascading timestamps
  const calculatedBlocks = recalculateScheduleTimes(blocks, startMin);

  // Determine next block start time
  const nextStartMin = calculatedBlocks.length > 0
    ? calculatedBlocks[calculatedBlocks.length - 1].endMinutes
    : startMin;
  const nextStartTimeStr = minutesToTimeString(nextStartMin);

  // Total minutes scheduled so far
  const totalScheduledMinutes = calculatedBlocks.reduce((acc, b) => acc + (b.durationMinutes || 0), 0);
  const remainingAvailableMinutes = Math.max(0, availableTotalMinutes - totalScheduledMinutes);

  // Handle selecting an activity
  const handleSelectActivity = (activity) => {
    setSelectedActivity(activity);
    if (activity.defaultDuration) {
      setSelectedDuration(activity.defaultDuration);
    } else if (activity.sessionMinutes) {
      setSelectedDuration(activity.sessionMinutes);
    } else {
      setSelectedDuration(45);
    }
    setCustomTitleInput(activity.id === 'custom' ? '' : activity.name);
    setCustomNoteInput('');
  };

  // Handle confirming and adding the block
  const handleAddCurrentBlock = (e) => {
    if (e) e.preventDefault();
    if (!selectedActivity) return;

    const finalDuration = customDurationInput && !isNaN(parseInt(customDurationInput, 10))
      ? roundToCleanIncrement(parseInt(customDurationInput, 10), 5)
      : selectedDuration;

    const title = selectedActivity.id === 'custom'
      ? (customTitleInput.trim() || 'Custom Task')
      : selectedActivity.name;

    const isGoal = goals.some((g) => g.id === selectedActivity.id);
    const goalId = isGoal ? selectedActivity.id : null;

    const newBlock = {
      id: `block-${Date.now()}-${blocks.length}`,
      type: selectedActivity.type || (isGoal ? 'goal' : 'custom'),
      goalId: goalId,
      title: title,
      icon: selectedActivity.icon || '🎯',
      durationMinutes: Math.max(5, finalDuration),
      tracked: selectedActivity.type !== 'freetime' && selectedActivity.type !== 'break',
      note: customNoteInput.trim() || (isGoal ? 'Focused goal session' : selectedActivity.name),
      completed: false
    };

    const updated = [...blocks, newBlock];
    setBlocks(updated);

    // Reset selection to prompt for next block
    setSelectedActivity(null);
    setCustomDurationInput('');
    setCustomTitleInput('');
    setCustomNoteInput('');
  };

  // Handle adjusting a block's duration inline (cascades immediately)
  const handleAdjustDuration = (index, deltaMinutes) => {
    const updated = blocks.map((b, idx) => {
      if (idx === index) {
        const newDur = Math.max(10, (b.durationMinutes || 30) + deltaMinutes);
        return { ...b, durationMinutes: newDur, remainingMinutes: newDur };
      }
      return b;
    });
    setBlocks(updated);
  };

  // Handle removing a block
  const handleRemoveBlock = (index) => {
    setBlocks(blocks.filter((_, idx) => idx !== index));
  };

  // Handle finishing planning
  const handleFinishPlanning = () => {
    onSubmit({
      startTime,
      endTime,
      bedtime,
      energy,
      blocks: calculatedBlocks
    });
  };

  const startTimePresets = ['Now', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'];
  const endTimePresets = ['8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM'];
  const durationPresets = [
    { label: '15m', value: 15 },
    { label: '30m', value: 30 },
    { label: '45m', value: 45 },
    { label: '1 hour', value: 60 },
    { label: '1.5 hours', value: 90 }
  ];

  return (
    <div
      className="modal-backdrop animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(6, 7, 10, 0.88)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
    >
      <div
        className="checkin-dialog glass-panel"
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg), 0 0 40px rgba(56, 189, 248, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px 18px',
            borderBottom: '1px solid var(--border-hairline)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
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
              <Sparkles size={12} />
              <span>BUILD MY DAY · BLOCK BY BLOCK</span>
            </div>
            <h2
              style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.025em'
              }}
            >
              Build your day, one decision at a time.
            </h2>
            <p
              style={{
                fontSize: '0.86rem',
                color: 'var(--text-secondary)',
                marginTop: '3px'
              }}
            >
              "Your life doesn't need a blueprint. You just need to decide what's next."
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
              flexShrink: 0
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ overflowY: 'auto', padding: '24px 28px 32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* 1. SETUP BAR: Start, End, Bedtime & Energy */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '16px',
                alignItems: 'center'
              }}
            >
              {/* Start Time */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                  Start Time
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} style={{ color: 'var(--accent-primary)' }} />
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="4:00 PM"
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-hairline)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.88rem',
                      fontWeight: 700
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {startTimePresets.slice(0, 3).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setStartTime(p === 'Now' ? getCurrentTimeString() : p)}
                      style={{
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.68rem',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-hairline)'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* End Time */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                  End Time
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} style={{ color: 'var(--accent-emerald)' }} />
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="9:30 PM"
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-hairline)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.88rem',
                      fontWeight: 700
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {endTimePresets.slice(1, 4).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEndTime(p)}
                      style={{
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.68rem',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-hairline)'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                  Energy Level
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[
                    { id: 'low', label: 'Low' },
                    { id: 'normal', label: 'Normal' },
                    { id: 'high', label: 'High' }
                  ].map((e) => {
                    const isSel = energy === e.id;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setEnergy(e.id)}
                        style={{
                          flex: 1,
                          padding: '6px 4px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          backgroundColor: isSel ? 'var(--accent-primary)' : 'var(--bg-card)',
                          color: isSel ? '#06070a' : 'var(--text-secondary)',
                          border: isSel ? 'none' : '1px solid var(--border-hairline)',
                          transition: 'all 0.16s ease'
                        }}
                      >
                        {e.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Available Window Stat */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Available Window
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                  {formatDuration(availableTotalMinutes)}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  {formatDuration(remainingAvailableMinutes)} unassigned
                </div>
              </div>
            </div>

            {/* 2. TIMELINE BUILT SO FAR */}
            {calculatedBlocks.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Your Planned Schedule ({calculatedBlocks.length} blocks)</span>
                  </label>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Total: {formatDuration(totalScheduledMinutes)}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {calculatedBlocks.map((b, idx) => (
                    <div
                      key={b.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-hairline)',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: '18px' }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: '1.1rem' }}>{b.icon || '📌'}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {b.title}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {b.startTime} — {b.endTime}
                          </div>
                        </div>
                      </div>

                      {/* Inline Duration Adjuster (+/- 15m) & Delete */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleAdjustDuration(idx, -15)}
                          disabled={b.durationMinutes <= 15}
                          style={{
                            padding: '3px 7px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-hairline)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            opacity: b.durationMinutes <= 15 ? 0.4 : 1
                          }}
                        >
                          -15m
                        </button>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', minWidth: '42px', textAlign: 'center' }}>
                          {formatDuration(b.durationMinutes)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAdjustDuration(idx, 15)}
                          style={{
                            padding: '3px 7px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-hairline)',
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}
                        >
                          +15m
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveBlock(idx)}
                          style={{
                            padding: '5px',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-muted)',
                            marginLeft: '4px'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-coral)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. INTERACTIVE "WHAT DO YOU WANT TO DO FIRST?" / "WHAT'S NEXT?" SECTION */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1.5px solid var(--accent-primary-faint)',
                borderRadius: 'var(--radius-lg)',
                padding: '22px',
                position: 'relative'
              }}
            >
              {/* Question Header */}
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
                  <span>
                    {calculatedBlocks.length === 0
                      ? 'What do you want to do first?'
                      : "What's next?"}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Starting at <strong style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{nextStartTimeStr}</strong>
                  {remainingAvailableMinutes > 0 && ` · ${formatDuration(remainingAvailableMinutes)} unassigned`}
                </div>
              </div>

              {/* Activity Selector (if no active selection) */}
              {!selectedActivity ? (
                <div>
                  {/* Goals Section */}
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    My Goals
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                      gap: '8px',
                      marginBottom: '16px'
                    }}
                  >
                    {goals.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => handleSelectActivity(g)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-hairline)',
                          color: 'var(--text-primary)',
                          textAlign: 'left',
                          transition: 'all 0.16s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--accent-primary)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-hairline)';
                          e.currentTarget.style.transform = 'none';
                        }}
                      >
                        <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{g.icon || '🎯'}</span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '0.84rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {g.name}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {g.weeklyTarget} {g.unit}/wk
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Built-in Activities / Categories */}
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Activities & Downtime
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                      gap: '8px',
                      marginBottom: '16px'
                    }}
                  >
                    {BUILT_IN_ACTIVITIES.map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => handleSelectActivity(act)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-hairline)',
                          color: 'var(--text-primary)',
                          textAlign: 'left',
                          transition: 'all 0.16s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--accent-emerald)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-hairline)';
                          e.currentTarget.style.transform = 'none';
                        }}
                      >
                        <span style={{ fontSize: '1.15rem', flexShrink: 0 }}>{act.icon}</span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {act.name}
                          </div>
                        </div>
                      </button>
                    ))}

                    {/* Custom Activity */}
                    <button
                      type="button"
                      onClick={() => handleSelectActivity({ id: 'custom', name: '', icon: '✨', defaultDuration: 30 })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px dashed var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        textAlign: 'left',
                        transition: 'all 0.16s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      <Plus size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Custom Activity</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* DURATION & DETAILS CONFIGURATION FOR CHOSEN ACTIVITY */
                <div
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.3rem' }}>{selectedActivity.icon}</span>
                      <div>
                        {selectedActivity.id === 'custom' ? (
                          <input
                            type="text"
                            value={customTitleInput}
                            onChange={(e) => setCustomTitleInput(e.target.value)}
                            placeholder="e.g. Piano Practice, Coding, Reading"
                            autoFocus
                            style={{
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'var(--bg-primary)',
                              border: '1px solid var(--accent-primary)',
                              color: 'var(--text-primary)',
                              fontSize: '0.92rem',
                              fontWeight: 700
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {selectedActivity.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedActivity(null)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      Change Activity
                    </button>
                  </div>

                  {/* Duration Prompt & Presets */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                      How long do you want to spend on this?
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '6px', marginBottom: '8px' }}>
                      {durationPresets.map((dp) => {
                        const isSel = selectedDuration === dp.value && !customDurationInput;
                        return (
                          <button
                            key={dp.value}
                            type="button"
                            onClick={() => {
                              setSelectedDuration(dp.value);
                              setCustomDurationInput('');
                            }}
                            style={{
                              padding: '10px 4px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: isSel ? 'var(--accent-primary)' : 'var(--bg-primary)',
                              color: isSel ? '#06070a' : 'var(--text-secondary)',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              border: isSel ? 'none' : '1px solid var(--border-hairline)',
                              transition: 'all 0.16s ease'
                            }}
                          >
                            {dp.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom minutes input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Or custom minutes:</span>
                      <input
                        type="number"
                        min="5"
                        max="240"
                        step="5"
                        value={customDurationInput}
                        onChange={(e) => {
                          setCustomDurationInput(e.target.value);
                          if (e.target.value) {
                            setSelectedDuration(parseInt(e.target.value, 10) || 30);
                          }
                        }}
                        placeholder="e.g. 75"
                        style={{
                          width: '90px',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-hairline)',
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.84rem'
                        }}
                      />
                    </div>
                  </div>

                  {/* Optional Note / Topic */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Optional Note / Focus Area:
                    </label>
                    <input
                      type="text"
                      value={customNoteInput}
                      onChange={(e) => setCustomNoteInput(e.target.value)}
                      placeholder="e.g. Chapter 4 review, Section 2 problems, Chest & arms"
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-hairline)',
                        color: 'var(--text-primary)',
                        fontSize: '0.84rem'
                      }}
                    />
                  </div>

                  {/* Add Block Button */}
                  <button
                    type="button"
                    onClick={handleAddCurrentBlock}
                    style={{
                      width: '100%',
                      padding: '12px 18px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--accent-primary)',
                      color: '#06070a',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 16px rgba(56, 189, 248, 0.25)'
                    }}
                  >
                    <span>+ Add Block ({nextStartTimeStr} — {minutesToTimeString(nextStartMin + (parseInt(customDurationInput, 10) || selectedDuration))})</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Bottom Action: Done Planning / Finish */}
          <div
            style={{
              marginTop: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'center'
            }}
          >
            <button
              type="button"
              onClick={handleFinishPlanning}
              style={{
                width: '100%',
                padding: '16px 24px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--accent-primary)',
                color: '#06070a',
                fontSize: '1.05rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 24px rgba(56, 189, 248, 0.3)',
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
              <Check size={20} />
              <span>
                {calculatedBlocks.length === 0
                  ? 'I’m Done Planning → View Overview'
                  : `Done Planning (${calculatedBlocks.length} blocks) → View My Day`}
              </span>
            </button>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Free time and gaps are completely supported · You can adjust durations anytime.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
