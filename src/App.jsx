import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Menu, Sparkles } from 'lucide-react';
import './App.css';

// Utilities
import {
  getStoredGoals,
  saveStoredGoals,
  getStoredActivity,
  saveStoredActivity,
  getStoredPlan,
  saveStoredPlan
} from './utils/storage';
import {
  scoreAndRankGoals,
  generateOrbitSchedule,
  recalculateScheduleTimes,
  adjustScheduleForExtendedBlock
} from './utils/scheduler';
import {
  parseTimeToMinutes,
  minutesToTimeString,
  getCurrentTimeString,
  getCurrentTimeMinutes,
  roundToCleanIncrement
} from './utils/timeHelpers';

// Components
import BackgroundParticles from './components/BackgroundParticles';
import Sidebar from './components/Sidebar';
import Today from './components/Today';
import Overview from './components/Overview';
import Focus from './components/Focus';
import Goals from './components/Goals';
import Progress from './components/Progress';
import CheckInModal from './components/CheckInModal';
import BreakModal from './components/BreakModal';
import PushLaterModal from './components/PushLaterModal';
import Toast from './components/Toast';

export default function App() {
  // Navigation & View State
  const [currentPage, setCurrentPage] = useState('today'); // 'today' | 'overview' | 'focus' | 'goals' | 'progress'
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Persistence States
  const [goals, setGoals] = useState(() => getStoredGoals());
  const [activity, setActivity] = useState(() => getStoredActivity());
  const [planState, setPlanState] = useState(() => getStoredPlan());

  // Modals & UI States
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isHomeTrigger, setIsHomeTrigger] = useState(false);
  const [breakTargetBlock, setBreakTargetBlock] = useState(null);
  const [pushLaterBlock, setPushLaterBlock] = useState(null);
  const [toast, setToast] = useState(null);

  // Save to localStorage on changes
  useEffect(() => {
    saveStoredGoals(goals);
  }, [goals]);

  useEffect(() => {
    saveStoredActivity(activity);
  }, [activity]);

  useEffect(() => {
    saveStoredPlan(planState);
  }, [planState]);

  // Compute total tracked minutes across all completed activities
  const totalTrackedMinutes = activity.reduce((acc, act) => acc + (act.minutes || 0), 0);

  // Compute live ranked goals
  const rankedGoals = scoreAndRankGoals(goals, planState?.checkInPreferences?.selectedGoalId || 'none');

  // Helper to trigger toasts
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  // --- CHECK-IN & SCHEDULE GENERATION ---
  const handleOpenCheckIn = () => {
    setIsHomeTrigger(false);
    setIsCheckInOpen(true);
  };

  const handleHomeCheckIn = () => {
    setIsHomeTrigger(true);
    setIsCheckInOpen(true);
  };

  const handleCheckInSubmit = (preferences) => {
    const generated = generateOrbitSchedule({
      ...preferences,
      goals
    });

    const newPlanState = {
      ...generated,
      activeIndex: 0,
      dayState: 'planned',
      checkInPreferences: preferences
    };

    setPlanState(newPlanState);
    saveStoredPlan(newPlanState);
    setIsCheckInOpen(false);
    setCurrentPage('overview');
    showToast('Orbit built your day successfully.', 'success');
  };

  // Re-generate schedule with current preferences
  const handleRebuildSchedule = () => {
    if (!planState?.checkInPreferences) {
      handleOpenCheckIn();
      return;
    }
    const generated = generateOrbitSchedule({
      ...planState.checkInPreferences,
      goals
    });
    const updated = {
      ...planState,
      ...generated,
      activeIndex: 0,
      dayState: 'planned'
    };
    setPlanState(updated);
    saveStoredPlan(updated);
    showToast('Orbit plan regenerated.', 'info');
  };

  // --- DAY CONTROLS ---
  const handleStartDay = () => {
    if (!planState?.blocks || planState.blocks.length === 0) return;
    setPlanState((prev) => {
      const next = {
        ...prev,
        dayState: 'active',
        activeIndex: 0
      };
      saveStoredPlan(next);
      return next;
    });
    setCurrentPage('focus');
    showToast('Day started. First focus block active.', 'success');
  };

  const handleResumeDay = () => {
    setCurrentPage('focus');
  };

  const handleResetDay = () => {
    setPlanState((prev) => {
      const next = {
        ...prev,
        dayState: 'idle',
        activeIndex: 0
      };
      saveStoredPlan(next);
      return next;
    });
    setCurrentPage('today');
  };

  // --- FOCUS ACTIONS ---

  // 1. Complete Active Block
  const handleCompleteBlock = (completedBlock) => {
    if (!planState || !planState.blocks) return;

    const currentIdx = planState.activeIndex || 0;
    const isTracked = completedBlock.tracked;
    const duration = completedBlock.durationMinutes || 30;

    // If tracked, log to activity & update goal progress immediately with persistent save
    if (isTracked) {
      const newActivityItem = {
        id: `act-${Date.now()}`,
        goalId: completedBlock.goalId,
        title: completedBlock.title,
        icon: completedBlock.icon || '🎯',
        minutes: duration,
        date: new Date().toISOString(),
        timestamp: Date.now(),
        note: completedBlock.note || 'Focused junior year session'
      };

      setActivity((prev) => {
        const nextActivity = [newActivityItem, ...prev];
        saveStoredActivity(nextActivity);
        return nextActivity;
      });

      // Update goal completed amount
      if (completedBlock.goalId) {
        setGoals((prevGoals) => {
          const nextGoals = prevGoals.map((g) => {
            if (g.id === completedBlock.goalId) {
              const increment = g.unit === 'sessions' ? 1 : duration / 60;
              return {
                ...g,
                completed: parseFloat(((g.completed || 0) + increment).toFixed(2))
              };
            }
            return g;
          });
          saveStoredGoals(nextGoals);
          return nextGoals;
        });
      }
    }

    // Mark current block complete
    const updatedBlocks = [...planState.blocks];
    updatedBlocks[currentIdx] = {
      ...updatedBlocks[currentIdx],
      completed: true,
      remainingMinutes: 0
    };

    const nextIndex = currentIdx + 1;

    // Check if entire day is complete
    if (nextIndex >= updatedBlocks.length) {
      const finishedPlan = {
        ...planState,
        blocks: updatedBlocks,
        activeIndex: nextIndex,
        dayState: 'completed'
      };
      setPlanState(finishedPlan);
      saveStoredPlan(finishedPlan);
      setCurrentPage('today');

      // Trigger confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }
      showToast('All blocks complete! That’s enough for today.', 'success');
    } else {
      const advancedPlan = {
        ...planState,
        blocks: updatedBlocks,
        activeIndex: nextIndex
      };
      setPlanState(advancedPlan);
      saveStoredPlan(advancedPlan);
      showToast(`"${completedBlock.title}" completed. Next block starting.`, 'success');
    }
  };

  // 2. Cancel Active Block
  const handleCancelBlock = (canceledBlock) => {
    if (!planState || !planState.blocks) return;

    const currentIdx = planState.activeIndex || 0;
    const remainingBlocks = [...planState.blocks];
    
    // Remove the current block
    remainingBlocks.splice(currentIdx, 1);

    if (remainingBlocks.length === 0 || currentIdx >= remainingBlocks.length) {
      const comp = {
        ...planState,
        blocks: remainingBlocks,
        dayState: 'completed'
      };
      setPlanState(comp);
      saveStoredPlan(comp);
      setCurrentPage('today');
      showToast('Block removed. Schedule finished.', 'info');
    } else {
      // Recalculate remaining timestamps starting from current time
      const currentMin = getCurrentTimeMinutes();
      const recalculated = recalculateScheduleTimes(remainingBlocks, currentMin);
      const updated = {
        ...planState,
        blocks: recalculated,
        scheduledEndTime: recalculated[recalculated.length - 1]?.endTime || planState.scheduledEndTime
      };
      setPlanState(updated);
      saveStoredPlan(updated);
      showToast(`Canceled "${canceledBlock.title}".`, 'info');
    }
  };

  // 3. Add Time (+15 / +30 mins) with intelligent free-time borrowing & ceiling protection
  const handleAddTime = (addedMinutes) => {
    if (!planState || !planState.blocks) return;

    const currentIdx = planState.activeIndex || 0;
    const currentBlock = planState.blocks[currentIdx];
    if (!currentBlock) return;

    const result = adjustScheduleForExtendedBlock(
      planState.blocks,
      currentIdx,
      addedMinutes,
      planState.hardEndTime || '9:30 PM',
      planState.bedtime || '10:30 PM'
    );

    if (!result.success) {
      showToast(result.message, 'warning');
      return;
    }

    const updated = {
      ...planState,
      blocks: result.blocks,
      scheduledEndTime: result.blocks[result.blocks.length - 1]?.endTime || planState.scheduledEndTime
    };

    setPlanState(updated);
    saveStoredPlan(updated);
    showToast(result.message, 'success');
  };

  // 4. Need a Break Flow (Creates separate Break block; preserves unfinished task & schedule)
  const handleOpenBreakModal = (block) => {
    setBreakTargetBlock(block);
  };

  const handleConfirmBreak = (breakDuration, breakReason) => {
    if (!planState || !planState.blocks || !breakTargetBlock) return;

    const currentIdx = planState.activeIndex || 0;
    const currentTask = planState.blocks[currentIdx];
    if (!currentTask) return;

    const nowMin = getCurrentTimeMinutes();
    const cleanBreakDuration = roundToCleanIncrement(breakDuration || 15, 5);

    // Create separate clean break block
    const breakBlock = {
      id: `break-${Date.now()}`,
      type: 'break',
      goalId: null,
      title: `${cleanBreakDuration}m Rest & Recharge`,
      icon: '☕',
      durationMinutes: cleanBreakDuration,
      tracked: false,
      note: breakReason || 'Mental reset & hydration',
      completed: false,
      remainingMinutes: cleanBreakDuration
    };

    // Calculate remaining unfinished work on current task
    const remMinutes = currentTask.remainingMinutes || currentTask.durationMinutes || 30;
    const cleanRemMinutes = Math.max(10, roundToCleanIncrement(remMinutes, 5));

    const unfinishedTaskRemainder = {
      ...currentTask,
      id: `${currentTask.id}-resumed`,
      durationMinutes: cleanRemMinutes,
      remainingMinutes: cleanRemMinutes,
      completed: false,
      note: currentTask.note ? `${currentTask.note} (Resumed)` : 'Resumed focus session'
    };

    // Replace current task with [Break Block, Unfinished Task Remainder]
    const newBlocks = [...planState.blocks];
    newBlocks.splice(currentIdx, 1, breakBlock, unfinishedTaskRemainder);

    // Recalculate schedule starting from now
    const recalculated = recalculateScheduleTimes(newBlocks, nowMin);

    const updated = {
      ...planState,
      blocks: recalculated,
      activeIndex: currentIdx, // Focuses on the break block immediately
      scheduledEndTime: recalculated[recalculated.length - 1]?.endTime || planState.scheduledEndTime
    };

    setPlanState(updated);
    saveStoredPlan(updated);

    setBreakTargetBlock(null);
    showToast(`Break started (${cleanBreakDuration}m). Your task will resume right after.`, 'info');
  };

  // End Break Early: Return immediately to unfinished task without completing it
  const handleEndBreakEarly = () => {
    if (!planState || !planState.blocks) return;
    const currentIdx = planState.activeIndex || 0;
    const currentBlock = planState.blocks[currentIdx];

    if (!currentBlock || currentBlock.type !== 'break') return;

    const nowMin = getCurrentTimeMinutes();
    const updatedBlocks = [...planState.blocks];

    // Mark break block finished
    updatedBlocks[currentIdx] = {
      ...updatedBlocks[currentIdx],
      completed: true,
      remainingMinutes: 0
    };

    // Advance to the unfinished task
    const nextIdx = currentIdx + 1;
    if (nextIdx < updatedBlocks.length) {
      // Recalculate downstream schedule starting from now
      const recalculated = recalculateScheduleTimes(updatedBlocks, nowMin);

      const updated = {
        ...planState,
        blocks: recalculated,
        activeIndex: nextIdx,
        scheduledEndTime: recalculated[recalculated.length - 1]?.endTime || planState.scheduledEndTime
      };

      setPlanState(updated);
      saveStoredPlan(updated);
      showToast('Break ended early. Resuming your task now.', 'success');
    } else {
      handleCompleteBlock(currentBlock);
    }
  };

  // 5. Push Later Flow (User selects destination, excludes Free Time, recalculates)
  const handleOpenPushLaterModal = (block) => {
    setPushLaterBlock(block);
  };

  const handleConfirmPushLater = (chosenIndexOffset) => {
    if (!planState || !planState.blocks || !pushLaterBlock) return;

    const currentIdx = planState.activeIndex || 0;
    const blocksList = [...planState.blocks];

    // Remove the pushed block from its current index
    const [pushedBlock] = blocksList.splice(currentIdx, 1);

    // Target position after chosen remaining task
    const targetIndex = currentIdx + 1 + chosenIndexOffset;
    blocksList.splice(Math.min(targetIndex, blocksList.length), 0, pushedBlock);

    // Recalculate timestamps
    const recalculated = recalculateScheduleTimes(blocksList, blocksList[0]?.startMinutes || getCurrentTimeMinutes());

    const updated = {
      ...planState,
      blocks: recalculated,
      activeIndex: currentIdx,
      scheduledEndTime: recalculated[recalculated.length - 1]?.endTime || planState.scheduledEndTime
    };
    setPlanState(updated);
    saveStoredPlan(updated);

    setPushLaterBlock(null);
    showToast(`Pushed "${pushedBlock.title}" later in your afternoon.`, 'info');
  };

  // --- GOAL MANAGEMENT ---
  const handleAddGoal = (newGoal) => {
    const nextGoals = [...goals, newGoal];
    setGoals(nextGoals);
    saveStoredGoals(nextGoals);
    showToast(`Added goal "${newGoal.name}".`, 'success');
  };

  const handleUpdateGoal = (updatedGoal) => {
    const nextGoals = goals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g));
    setGoals(nextGoals);
    saveStoredGoals(nextGoals);
    showToast(`Updated "${updatedGoal.name}".`, 'success');
  };

  const handleDeleteGoal = (goalId) => {
    const nextGoals = goals.filter((g) => g.id !== goalId);
    setGoals(nextGoals);
    saveStoredGoals(nextGoals);
    showToast('Goal removed from scheduler.', 'info');
  };

  // --- PROGRESS ACTIONS ---
  const handleUndoActivity = (activityItem) => {
    setActivity((prev) => {
      const nextActivity = prev.filter((a) => a.id !== activityItem.id);
      saveStoredActivity(nextActivity);
      return nextActivity;
    });

    // Rollback goal completed amount
    if (activityItem.goalId) {
      setGoals((prevGoals) => {
        const nextGoals = prevGoals.map((g) => {
          if (g.id === activityItem.goalId) {
            const decrement = g.unit === 'sessions' ? 1 : (activityItem.minutes || 0) / 60;
            return {
              ...g,
              completed: Math.max(0, parseFloat(((g.completed || 0) - decrement).toFixed(2)))
            };
          }
          return g;
        });
        saveStoredGoals(nextGoals);
        return nextGoals;
      });
    }

    showToast(`Undid "${activityItem.title}" (${activityItem.minutes}m).`, 'warning');
  };

  const handleResetWeeklyProgress = () => {
    setGoals((prev) => {
      const next = prev.map((g) => ({
        ...g,
        completed: 0
      }));
      saveStoredGoals(next);
      return next;
    });
    showToast('Weekly progress reset to 0. Yearly records preserved.', 'success');
  };

  return (
    <div className="app-container">
      {/* Background Starfield & Orbit Particles */}
      <BackgroundParticles />

      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        totalTrackedMinutes={totalTrackedMinutes}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Mobile Backdrop overlay */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 140,
            backdropFilter: 'blur(4px)'
          }}
        />
      )}

      {/* Main Content Area */}
      <main className="main-content">
        {/* Mobile Header Bar */}
        <div className="mobile-top-bar">
          <button
            onClick={() => setMobileNavOpen(true)}
            style={{
              padding: '8px',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface)'
            }}
            aria-label="Open Navigation"
          >
            <Menu size={20} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Emmanuel Lopez
            </span>
            <span style={{ color: 'var(--accent-primary)', fontSize: '0.8rem' }}>•</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
              Orbit
            </span>
          </div>

          <div style={{ width: '36px' }} />
        </div>

        {/* Dynamic Views */}
        {currentPage === 'today' && (
          <Today
            planState={planState}
            goals={goals}
            rankedGoals={rankedGoals}
            onOpenCheckIn={handleOpenCheckIn}
            onHomeCheckIn={handleHomeCheckIn}
            onStartDay={handleStartDay}
            onResumeDay={handleResumeDay}
            onReviewPlan={() => setCurrentPage('overview')}
            onNavigate={(page) => setCurrentPage(page)}
            onResetDay={handleResetDay}
          />
        )}

        {currentPage === 'overview' && (
          <Overview
            planState={planState}
            onStartDay={handleStartDay}
            onResumeDay={handleResumeDay}
            onRebuildDay={handleRebuildSchedule}
            onEditCheckIn={handleOpenCheckIn}
          />
        )}

        {currentPage === 'focus' && (
          <Focus
            planState={planState}
            onCompleteBlock={handleCompleteBlock}
            onCancelBlock={handleCancelBlock}
            onAddTime={handleAddTime}
            onOpenBreakModal={handleOpenBreakModal}
            onOpenPushLaterModal={handleOpenPushLaterModal}
            onNavigateToOverview={() => setCurrentPage('overview')}
            onEndBreakEarly={handleEndBreakEarly}
          />
        )}

        {currentPage === 'goals' && (
          <Goals
            goals={goals}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        )}

        {currentPage === 'progress' && (
          <Progress
            goals={goals}
            activity={activity}
            totalTrackedMinutes={totalTrackedMinutes}
            onUndoActivity={handleUndoActivity}
            onResetWeeklyProgress={handleResetWeeklyProgress}
          />
        )}
      </main>

      {/* Global Modals */}
      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onSubmit={handleCheckInSubmit}
        goals={goals}
        initialValues={planState?.checkInPreferences}
        isHomeTrigger={isHomeTrigger}
      />

      <BreakModal
        isOpen={!!breakTargetBlock}
        onClose={() => setBreakTargetBlock(null)}
        onConfirmBreak={handleConfirmBreak}
        currentTaskTitle={breakTargetBlock?.title || 'Current Task'}
      />

      <PushLaterModal
        isOpen={!!pushLaterBlock}
        onClose={() => setPushLaterBlock(null)}
        onConfirmPushLater={handleConfirmPushLater}
        activeBlock={pushLaterBlock}
        remainingBlocks={planState?.blocks ? planState.blocks.slice(planState.activeIndex || 0) : []}
      />

      {/* Global Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
