import React, { useState, useEffect } from 'react';
import { X, Sparkles, Clock, Zap, BookOpen, Dumbbell, Coffee, AlertCircle, Check, Key, Bot } from 'lucide-react';
import { getCurrentTimeString } from '../utils/timeHelpers';
import { getGeminiApiKey, saveGeminiApiKey } from '../utils/storage';
import { parseContextWithAI } from '../utils/aiScheduler';

export default function CheckInModal({
  isOpen,
  onClose,
  onSubmit,
  initialValues = null,
  isHomeTrigger = false
}) {
  const [startTime, setStartTime] = useState('1:00 PM');
  const [endTime, setEndTime] = useState('9:30 PM');
  const [bedtime, setBedtime] = useState('10:30 PM');
  const [energy, setEnergy] = useState('normal'); // 'low' | 'normal' | 'high'
  const [schoolworkMinutes, setSchoolworkMinutes] = useState(60);
  const [urgentText, setUrgentText] = useState('');
  const [gymToday, setGymToday] = useState(true);
  const [freeTimeMinutes, setFreeTimeMinutes] = useState(60);
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  // Gemini API key settings drawer
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState(() => getGeminiApiKey());

  useEffect(() => {
    if (isOpen) {
      if (initialValues) {
        setStartTime(initialValues.startTime || (isHomeTrigger ? getCurrentTimeString() : '1:00 PM'));
        setEndTime(initialValues.endTime || '9:30 PM');
        setBedtime(initialValues.bedtime || '10:30 PM');
        setEnergy(initialValues.energy || 'normal');
        setSchoolworkMinutes(initialValues.schoolworkMinutes ?? 60);
        setUrgentText(initialValues.urgentText || '');
        setGymToday(initialValues.gymToday ?? true);
        setFreeTimeMinutes(initialValues.freeTimeMinutes ?? 60);
      } else if (isHomeTrigger) {
        setStartTime(getCurrentTimeString());
      }
    }
  }, [isOpen, initialValues, isHomeTrigger]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    saveGeminiApiKey(apiKey);
    setIsAiThinking(true);

    try {
      // Run AI semantic analysis on user's natural language input
      const aiParsed = await parseContextWithAI(urgentText, startTime, endTime, energy);
      
      onSubmit({
        startTime,
        endTime,
        bedtime,
        energy,
        schoolworkMinutes,
        urgentText,
        gymToday,
        freeTimeMinutes,
        aiParsedData: aiParsed
      });
    } catch (err) {
      console.error('AI submission error:', err);
      onSubmit({
        startTime,
        endTime,
        bedtime,
        energy,
        schoolworkMinutes,
        urgentText,
        gymToday,
        freeTimeMinutes
      });
    } finally {
      setIsAiThinking(false);
    }
  };

  const samplePrompts = [
    'AP Physics test tomorrow',
    'Finish my ISEF proposal draft',
    'meeting with yac at 4pm',
    'YAC secretary campaign speech prep',
    'ACT math timed practice drills',
    'Shopify product research and store design'
  ];

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
        backgroundColor: 'rgba(8, 9, 12, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto'
      }}
    >
      <div
        className="checkin-dialog"
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '28px 32px 20px',
            borderBottom: '1px solid var(--border-hairline)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between'
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
                marginBottom: '10px',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <Sparkles size={12} />
              <span>ORBIT GEMINI AI CHECK-IN</span>
            </div>
            <h2
              style={{
                fontSize: '1.45rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em'
              }}
            >
              Tell Orbit about your afternoon.
            </h2>
            <p
              style={{
                fontSize: '0.86rem',
                color: 'var(--text-secondary)',
                marginTop: '4px'
              }}
            >
              Type anything naturally. Orbit's AI reads your goals, exams, or meetings (with or without a time).
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
              border: '1px solid var(--border-hairline)'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px 32px 32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* 1. Urgent Information & AI Context Field (Prominently at Top) */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1.5px solid var(--accent-primary-faint)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 18px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    color: 'var(--accent-primary)'
                  }}
                >
                  <Bot size={16} />
                  <span>Anything urgent, coming up, or on your mind? (No time needed!)</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Key size={11} />
                  <span>{apiKey ? 'Gemini Key ✓' : 'Gemini Key'}</span>
                </button>
              </div>

              <textarea
                rows={2}
                value={urgentText}
                onChange={(e) => setUrgentText(e.target.value)}
                placeholder="Example: I have an AP Physics test tomorrow and need to write my ISEF abstract... (Orbit figures out the rest!)"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  lineHeight: 1.4,
                  resize: 'none'
                }}
              />

              {/* Quick Prompt Ideas */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '2px' }}>
                  Quick ideas:
                </span>
                {samplePrompts.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setUrgentText(sample)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.72rem',
                      border: '1px solid var(--border-hairline)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--accent-primary)';
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.borderColor = 'var(--border-hairline)';
                    }}
                  >
                    + {sample}
                  </button>
                ))}
              </div>

              {/* Optional Gemini API Key Drawer */}
              {showApiKeyInput && (
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-hairline)' }}>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Google Gemini API Key (Optional — built-in semantic AI runs automatically):
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>
              )}
            </div>

            {/* 2. Time Constraints: Start & End Time */}
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

            {/* 3. Energy Level */}
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
                        padding: '14px 12px',
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

            {/* 4. School Workload */}
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
                  <span>How much general schoolwork do you have today?</span>
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

            {/* 5. Gym Today? */}
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
                        color: isSelected ? '#08090C' : 'var(--text-secondary)',
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

            {/* 6. Desired Free Time */}
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
              disabled={isAiThinking}
              style={{
                width: '100%',
                padding: '16px 24px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--accent-primary)',
                color: '#08090C',
                fontSize: '1rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 20px rgba(56, 189, 248, 0.25)',
                transition: 'all 0.2s ease',
                opacity: isAiThinking ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!isAiThinking) {
                  e.currentTarget.style.backgroundColor = 'var(--accent-primary-hover)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isAiThinking) {
                  e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                  e.currentTarget.style.transform = 'none';
                }
              }}
            >
              <Sparkles size={18} />
              <span>{isAiThinking ? 'Orbit Gemini AI Analyzing Afternoon...' : 'Let Orbit Gemini AI Build My Day →'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
