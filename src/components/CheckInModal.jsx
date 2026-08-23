import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Clock,
  Zap,
  BookOpen,
  Dumbbell,
  Coffee,
  Calendar,
  Lock,
  Plus,
  Trash2,
  Check,
  Target
} from 'lucide-react';
import { getCurrentTimeString } from '../utils/timeHelpers';

export default function CheckInModal({
  isOpen,
  onClose,
  onSubmit,
  goals = [],
  initialValues = null,
  isHomeTrigger = false
}) {
  const [startTime, setStartTime] = useState('1:00 PM');
  const [endTime, setEndTime] = useState('9:30 PM');
  const [bedtime, setBedtime] = useState('10:30 PM');
  const [energy, setEnergy] = useState('normal'); // 'low' | 'normal' | 'high'
  const [schoolworkMinutes, setSchoolworkMinutes] = useState(60);
  
  // Specific Goal Selection (Replaces AI input)
  const [selectedGoalId, setSelectedGoalId] = useState('none'); // 'none' or goal id

  // "Are you busy today?" Time Range Feature
  const [isBusy, setIsBusy] = useState(false);
  const [busyRanges, setBusyRanges] = useState([
    { id: 'busy-1', startTime: '5:00 PM', endTime: '8:00 PM', label: 'Busy' }
  ]);

  const [gymToday, setGymToday] = useState(true);
  const [freeTimeMinutes, setFreeTimeMinutes] = useState(60);

  useEffect(() => {
    if (isOpen) {
      if (initialValues) {
        setStartTime(initialValues.startTime || (isHomeTrigger ? getCurrentTimeString() : '1:00 PM'));
        setEndTime(initialValues.endTime || '9:30 PM');
        setBedtime(initialValues.bedtime || '10:30 PM');
        setEnergy(initialValues.energy || 'normal');
        setSchoolworkMinutes(initialValues.schoolworkMinutes ?? 60);
        setSelectedGoalId(initialValues.selectedGoalId || 'none');
        setIsBusy(initialValues.isBusy ?? false);
        setBusyRanges(
          Array.isArray(initialValues.busyRanges) && initialValues.busyRanges.length > 0
            ? initialValues.busyRanges
            : [{ id: 'busy-1', startTime: '5:00 PM', endTime: '8:00 PM', label: 'Busy' }]
        );
        setGymToday(initialValues.gymToday ?? true);
        setFreeTimeMinutes(initialValues.freeTimeMinutes ?? 60);
      } else if (isHomeTrigger) {
        setStartTime(getCurrentTimeString());
      }
    }
  }, [isOpen, initialValues, isHomeTrigger]);

  if (!isOpen) return null;

  const handleAddBusyRange = () => {
    const nextId = `busy-${Date.now()}`;
    setBusyRanges((prev) => [
      ...prev,
      { id: nextId, startTime: '5:00 PM', endTime: '7:00 PM', label: 'Busy' }
    ]);
  };

  const handleRemoveBusyRange = (id) => {
    setBusyRanges((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateBusyRange = (id, field, value) => {
    setBusyRanges((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      startTime,
      endTime,
      bedtime,
      energy,
      schoolworkMinutes,
      selectedGoalId,
      isBusy,
      busyRanges: isBusy ? busyRanges : [],
      gymToday,
      freeTimeMinutes
    });
  };

  const schoolworkOptions = [
    { label: 'None (0m)', value: 0 },
    { label: '30m', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 },
    { label: '3h+', value: 180 }
  ];

  const freeTimeOptions = [
    { label: '30 min', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '1.5 hours', value: 90 },
    { label: '2 hours', value: 120 }
  ];

  const startTimePresets = ['Now', '1:00 PM', '3:00 PM', '4:00 PM', '4:30 PM'];
  const endTimePresets = ['8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM'];

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
          maxWidth: '680px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg), 0 0 35px rgba(56, 189, 248, 0.15)',
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
              <span>ORBIT CHECK-IN</span>
            </div>
            <h2
              style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.025em'
              }}
            >
              Tell Orbit about your afternoon.
            </h2>
            <p
              style={{
                fontSize: '0.86rem',
                color: 'var(--text-secondary)',
                marginTop: '3px'
              }}
            >
              Orbit will build your schedule around your priorities and busy hours.
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px 28px 32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
            
            {/* 1. DAILY GOAL PREFERENCE QUESTION */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px'
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '6px'
                }}
              >
                <Target size={17} style={{ color: 'var(--accent-primary)' }} />
                <span>Do you want to work on anything specific today?</span>
              </label>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  marginBottom: '14px'
                }}
              >
                Pick a goal to prioritize today, or let Orbit’s algorithm balance your weekly commitments.
              </p>

              {/* Selectable Goal Cards / Pills Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '10px'
                }}
              >
                {/* Option: No specification — let Orbit decide */}
                <button
                  type="button"
                  onClick={() => setSelectedGoalId('none')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: selectedGoalId === 'none' ? 'var(--bg-card)' : 'var(--bg-primary)',
                    border: selectedGoalId === 'none'
                      ? '1.5px solid var(--accent-primary)'
                      : '1px solid var(--border-hairline)',
                    color: selectedGoalId === 'none' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    textAlign: 'left',
                    boxShadow: selectedGoalId === 'none' ? '0 0 20px rgba(56, 189, 248, 0.18)' : 'none',
                    transition: 'all 0.2s ease',
                    gridColumn: '1 / -1'
                  }}
                >
                  <Sparkles size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                      No specification — let Orbit decide
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Automatically balances weekly progress & energy
                    </div>
                  </div>
                  {selectedGoalId === 'none' && <Check size={16} />}
                </button>

                {/* Options for each user goal */}
                {goals.map((g) => {
                  const isSelected = selectedGoalId === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGoalId(g.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isSelected ? 'var(--bg-card)' : 'var(--bg-primary)',
                        border: isSelected
                          ? '1.5px solid var(--accent-primary)'
                          : '1px solid var(--border-hairline)',
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                        textAlign: 'left',
                        boxShadow: isSelected ? '0 0 20px rgba(56, 189, 248, 0.18)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{g.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.86rem',
                            fontWeight: 600,
                            color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {g.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {g.weeklyTarget} {g.unit}/wk
                        </div>
                      </div>
                      {isSelected && <Check size={15} style={{ color: 'var(--accent-primary)' }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. "ARE YOU BUSY TODAY?" TIME RANGE QUESTION */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  marginBottom: '6px'
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)'
                  }}
                >
                  <Lock size={17} style={{ color: 'var(--accent-sapphire)' }} />
                  <span>Are you busy today?</span>
                </label>

                {/* Yes / No Toggle */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { label: 'No, free afternoon', val: false },
                    { label: 'Yes, I have plans', val: true }
                  ].map((btn) => {
                    const active = isBusy === btn.val;
                    return (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => setIsBusy(btn.val)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-card)',
                          color: active ? '#06070a' : 'var(--text-secondary)',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          border: active ? 'none' : '1px solid var(--border-hairline)',
                          transition: 'all 0.18s ease'
                        }}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  marginBottom: isBusy ? '16px' : '0'
                }}
              >
                Block out unavailable time (e.g. 5:00 PM–8:00 PM for sports, appointments, or events). Orbit will work around them.
              </p>

              {/* Busy Time Range Inputs */}
              {isBusy && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                  {busyRanges.map((range, idx) => (
                    <div
                      key={range.id || idx}
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px 16px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr)) auto',
                        gap: '12px',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          Start Time
                        </label>
                        <input
                          type="text"
                          value={range.startTime}
                          onChange={(e) => handleUpdateBusyRange(range.id, 'startTime', e.target.value)}
                          placeholder="5:00 PM"
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-hairline)',
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.88rem',
                            fontWeight: 600
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          End Time
                        </label>
                        <input
                          type="text"
                          value={range.endTime}
                          onChange={(e) => handleUpdateBusyRange(range.id, 'endTime', e.target.value)}
                          placeholder="8:00 PM"
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-hairline)',
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.88rem',
                            fontWeight: 600
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          Label
                        </label>
                        <input
                          type="text"
                          value={range.label}
                          onChange={(e) => handleUpdateBusyRange(range.id, 'label', e.target.value)}
                          placeholder="Busy"
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-hairline)',
                            color: 'var(--text-primary)',
                            fontSize: '0.88rem'
                          }}
                        />
                      </div>

                      {busyRanges.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBusyRange(range.id)}
                          style={{
                            padding: '8px',
                            color: 'var(--text-muted)',
                            borderRadius: 'var(--radius-sm)',
                            alignSelf: 'flex-end',
                            marginBottom: '2px'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-coral)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddBusyRange}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--accent-primary)',
                      padding: '6px 0',
                      alignSelf: 'flex-start'
                    }}
                  >
                    <Plus size={14} />
                    <span>+ Add another busy time range</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. TIME CONSTRAINTS: START & END TIME */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px'
              }}
            >
              {/* Start Time */}
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-hairline)'
                }}
              >
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '8px'
                  }}
                >
                  When do you want to start?
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Clock size={16} style={{ color: 'var(--accent-primary)' }} />
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="e.g. 1:00 PM"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.95rem',
                      fontWeight: 600
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {startTimePresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setStartTime(preset === 'Now' ? getCurrentTimeString() : preset)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.72rem',
                        fontWeight: 500,
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-hairline)'
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* End Time */}
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-hairline)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)'
                    }}
                  >
                    When do you want to be done?
                  </label>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      color: 'var(--accent-primary)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    Protected
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Clock size={16} style={{ color: 'var(--accent-primary)' }} />
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="e.g. 9:30 PM"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.95rem',
                      fontWeight: 600
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {endTimePresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEndTime(preset)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.72rem',
                        fontWeight: 500,
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-hairline)'
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. ENERGY LEVEL */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '10px'
                }}
              >
                <Zap size={15} style={{ color: 'var(--accent-primary)' }} />
                <span>How's your energy?</span>
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px'
                }}
              >
                {[
                  { id: 'low', label: 'Low', desc: 'Take it easy' },
                  { id: 'normal', label: 'Normal', desc: 'Balanced' },
                  { id: 'high', label: 'High', desc: 'Push a little more' }
                ].map((item) => {
                  const isSelected = energy === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setEnergy(item.id)}
                      style={{
                        padding: '14px 10px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isSelected ? 'var(--bg-card)' : 'var(--bg-surface)',
                        border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-hairline)',
                        textAlign: 'center',
                        boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                          marginBottom: '2px'
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: isSelected ? 'var(--text-secondary)' : 'var(--text-muted)'
                        }}
                      >
                        {item.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. SCHOOL WORKLOAD */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                  }}
                >
                  <BookOpen size={15} style={{ color: 'var(--accent-sapphire)' }} />
                  <span>How much schoolwork do you have today?</span>
                </label>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  {schoolworkMinutes === 0 ? 'None' : `${schoolworkMinutes} min`}
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '8px'
                }}
              >
                {schoolworkOptions.map((opt) => {
                  const isSelected = schoolworkMinutes === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSchoolworkMinutes(opt.value)}
                      style={{
                        padding: '10px 4px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isSelected ? 'var(--bg-card)' : 'var(--bg-surface)',
                        border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-hairline)',
                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        fontSize: '0.82rem',
                        fontWeight: isSelected ? 700 : 500,
                        transition: 'all 0.18s ease'
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. GYM TODAY? */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-surface)',
                padding: '16px 20px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-hairline)'
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                  }}
                >
                  <Dumbbell size={16} style={{ color: 'var(--accent-coral)' }} />
                  <span>Gym today?</span>
                </div>
                <div
                  style={{
                    fontSize: '0.76rem',
                    color: 'var(--text-muted)',
                    marginTop: '2px'
                  }}
                >
                  Orbit protects a 60m workout in your preferred 5–9 PM evening window.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {['Yes', 'No'].map((choice) => {
                  const val = choice === 'Yes';
                  const isSelected = gymToday === val;
                  return (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => setGymToday(val)}
                      style={{
                        padding: '8px 18px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-card)',
                        color: isSelected ? '#06070a' : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        border: isSelected ? 'none' : '1px solid var(--border-hairline)',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 7. DESIRED FREE TIME */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                  }}
                >
                  <Coffee size={15} style={{ color: 'var(--accent-emerald)' }} />
                  <span>How much free time do you want?</span>
                </label>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--accent-emerald)',
                    fontWeight: 600
                  }}
                >
                  Protected at end of day
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px'
                }}
              >
                {freeTimeOptions.map((opt) => {
                  const isSelected = freeTimeMinutes === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFreeTimeMinutes(opt.value)}
                      style={{
                        padding: '10px 6px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isSelected ? 'var(--bg-card)' : 'var(--bg-surface)',
                        border: isSelected ? '1.5px solid var(--accent-emerald)' : '1px solid var(--border-hairline)',
                        color: isSelected ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                        fontSize: '0.82rem',
                        fontWeight: isSelected ? 700 : 500,
                        transition: 'all 0.18s ease'
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Submit Button */}
          <div style={{ marginTop: '32px' }}>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '16px 24px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--accent-primary)',
                color: '#06070a',
                fontSize: '1rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
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
              <span>Let Orbit Build My Day →</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
