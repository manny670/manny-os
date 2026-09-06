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
} from './utils/storage.js';
import {
  scoreAndRankGoals,
  buildScheduleFromUserBlocks,
  recalculateScheduleTimes,
  adjustScheduleForExtendedBlock,
  shiftScheduleOnResume,
  finishBlockEarly
} from './utils/scheduler.js';
import {
  parseTimeToMinutes,
  minutesToTimeString,
  getCurrentTimeString,
  getCurrentTimeMinutes,
  roundToCleanIncrement
} from './utils/timeHelpers.js';

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
  const rankedGoals = scoreAndRankGoals(goals, 'none');

  // Helper to trigger toasts
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  // --- CHECK-IN & BLOCK-BY-BLOCK SCHEDULE SUBMISSION ---
  const handleOpenCheckIn = () => {
    setIsHomeTrigger(false);
    setIsCheckInOpen(true);
  };

  const handleHomeCheckIn = () => {
    setIsHomeTrigger(true);
    setIsCheckInOpen(true);
  };

  const handleCheckInSubmit = (preferences) => {
    const built = buildScheduleFromUserBlocks({
      blocks: preferences.blocks || [],
      startTime: preferences.startTime || getCurrentTimeString(),
      endTime: preferences.endTime || '9:30 PM',
      bedtime: preferences.bedtime || '10:30 PM',
      energy: preferences.energy || 'normal',
      goals,
      activity
    });

    const newPlanState = {
      ...built,
      activeIndex: 0,
      dayState: 'planned',
      checkInPreferences: preferences
    };

    setPlanState(newPlanState);
    saveStoredPlan(newPlanState);
    setIsCheckInOpen(false);
    setCurrentPage('overview');
    showToast(`Schedule built with ${built.blockCount} blocks.`, 'success');
  };

  // Re-generate schedule with current preferences
  const handleRebuildSchedule = () => {
    if (!planState?.checkInPreferences) {
      handleOpenCheckIn();
      return;
    }
    const built = buildScheduleFromUserBlocks({
      ...planState.checkInPreferences,
      goals,
      activity
    });
    const updated = {
      ...planState,
      ...built,
      activeIndex: 0,
      dayState: 'planned'
    };
    setPlanState(updated);
    saveStoredPlan(updated);
    showToast('Orbit plan refreshed.', 'info');
  };

  // --- INLINE BLOCK DURATION EDIT & DOWNSTREAM CASCADE ---
  const handleUpdateBlockDuration = (blockIndex, newDuration) => {
    if (!planState || !planState.blocks) return;

    const updatedBlocks = planState.blocks.map((b, idx) => {
      if (idx === blockIndex) {
        return {
          ...b,
          durationMinutes: newDuration,
          remainingMinutes: newDuration
        };
      }
      return b;
    });

    const built = buildScheduleFromUserBlocks({
      blocks: updatedBlocks,
      startTime: planState.scheduledStartTime || '4:00 PM',
      endTime: planState.hardEndTime || '9:30 PM',
      bedtime: planState.bedtime || '10:30 PM',
      energy: planState.energy || 'normal',
      goals,
      activity
    });

    const updatedPlan = {
      ...planState,
      ...built,
      checkInPreferences: {
        ...(planState.checkInPreferences || {}),
        blocks: built.blocks
      }
    };

    setPlanState(updatedPlan);
    saveStoredPlan(updatedPlan);
    showToast(`Updated duration to ${newDuration}m. Timeline adjusted.`, 'info');
  };

  // --- DELETE BLOCK FROM OVERVIEW ---
  const handleDeleteBlock = (blockIndex) => {
    if (!planState || !planState.blocks) return;

    const updatedBlocks = planState.blocks.filter((_, idx) => idx !== blockIndex);

    const built = buildScheduleFromUserBlocks({
      blocks: updatedBlocks,
      startTime: planState.scheduledStartTime || '4:00 PM',
      endTime: planState.hardEndTime || '9:30 PM',
      bedtime: planState.bedtime || '10:30 PM',
      energy: planState.energy || 'normal',
      goals,
      activity
    });

    const updatedPlan = {
      ...planState,
      ...built,
      activeIndex: Math.min(planState.activeIndex || 0, Math.max(0, updatedBlocks.length - 1)),
      checkInPreferences: {
        ...(planState.checkInPreferences || {}),
        blocks: built.blocks
      }
    };

    setPlanState(updatedPlan);
    saveStoredPlan(updatedPlan);
    showToast('Block removed. Timeline updated.', 'info');
  };

  // --- LIVE PAUSE / RESUME SCHEDULE SHIFTING ---
  const handleShiftScheduleOnResume = (fromIndex, remainingMinutes) => {
    if (!planState || !planState.blocks) return;

    const shiftedBlocks = shiftScheduleOnResume({
      blocks: planState.blocks,
      activeIndex: fromIndex,
      currentClockMinutes: getCurrentTimeMinutes(),
      remainingMinutes
    });

    const built = buildScheduleFromUserBlocks({
      blocks: shiftedBlocks,
      startTime: planState.scheduledStartTime || '4:00 PM',
      endTime: planState.hardEndTime || '9:30 PM',
      bedtime: planState.bedtime || '10:30 PM',
      energy: planState.energy || 'normal',
      goals,
      activity
    });

    const updatedPlan = {
      ...planState,
      ...built,
      blocks: shiftedBlocks
    };

    setPlanState(updatedPlan);
    saveStoredPlan(updatedPlan);
  };

  // --- END BLOCK EARLY (Logs actual worked time & shifts following blocks to start now) ---
  const handleEndBlockEarly = (currentBlock, actualWorkedMinutes) => {
    if (!planState || !planState.blocks) return;

    const currentIdx = planState.activeIndex || 0;
    const isTracked = currentBlock.tracked;
    const loggedMinutes = Math.max(1, actualWorkedMinutes || 1);

    // 1. Log actual worked time to activity
    if (isTracked) {
      const newActivityItem = {
        id: `act-${Date.now()}`,
        goalId: currentBlock.goalId,
        title: currentBlock.title,
        icon: currentBlock.icon || '🎯',
        minutes: loggedMinutes,
        date: new Date().toISOString(),
        timestamp: Date.now(),
        note: currentBlock.note || 'Focused session (Ended early)'
      };

      setActivity((prev) => {
        const nextActivity = [newActivityItem, ...prev];
        saveStoredActivity(nextActivity);
        return nextActivity;
      });

      // Update goal completed amount based on ACTUAL worked hours
      if (currentBlock.goalId) {
        setGoals((prevGoals) => {
          const nextGoals = prevGoals.map((g) => {
            if (g.id === currentBlock.goalId) {
              const increment = g.unit === 'sessions' ? 1 : loggedMinutes / 60;
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

    // 2. Shift subsequent blocks to start NOW
    const earlyFinishedBlocks = finishBlockEarly({
      blocks: planState.blocks,
      activeIndex: currentIdx,
      actualWorkedMinutes: loggedMinutes,
      currentClockMinutes: getCurrentTimeMinutes()
    });

    const nextIndex = currentIdx + 1;

    const built = buildScheduleFromUserBlocks({
      blocks: earlyFinishedBlocks,
      startTime: planState.scheduledStartTime || '4:00 PM',
      endTime: planState.hardEndTime || '9:30 PM',
      bedtime: planState.bedtime || '10:30 PM',
      energy: planState.energy || 'normal',
      goals,
      activity
    });

    if (nextIndex >= earlyFinishedBlocks.length) {
      const finishedPlan = {
        ...planState,
        ...built,
        blocks: earlyFinishedBlocks,
        activeIndex: nextIndex,
        dayState: 'completed'
      };
      setPlanState(finishedPlan);
      saveStoredPlan(finishedPlan);
      setCurrentPage('today');

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
      showToast(`Logged ${loggedMinutes}m. That’s enough for today!`, 'success');
    } else {
      const advancedPlan = {
        ...planState,
        ...built,
        blocks: earlyFinishedBlocks,
        activeIndex: nextIndex
      };
      setPlanState(advancedPlan);
      saveStoredPlan(advancedPlan);
      showToast(`Logged ${loggedMinutes}m. Next block starting now.`, 'success');
    }
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

  // Complete Active Block with ACTUAL elapsed worked minutes
  const handleCompleteBlock = (completedBlock, actualWorkedMinutes) => {
    if (!planState || !planState.blocks) return;

    const currentIdx = planState.activeIndex || 0;
    const isTracked = completedBlock.tracked;
    const loggedMinutes = actualWorkedMinutes !== undefined
      ? Math.max(1, actualWorkedMinutes)
      : (completedBlock.durationMinutes || 30);

    // If tracked, log ACTUAL worked minutes to activity & update goal progress
    if (isTracked) {
      const newActivityItem = {
        id: `act-${Date.now()}`,
        goalId: completedBlock.goalId,
        title: completedBlock.title,
        icon: completedBlock.icon || '🎯',
        minutes: loggedMinutes,
        date: new Date().toISOString(),
        timestamp: Date.now(),
        note: completedBlock.note || 'Focused session'
      };

      setActivity((prev) => {
        const nextActivity = [newActivityItem, ...prev];
        saveStoredActivity(nextActivity);
        return nextActivity;
      });

      // Update goal completed amount with actual tracked hours
      if (completedBlock.goalId) {
        setGoals((prevGoals) => {
          const nextGoals = prevGoals.map((g) => {
            if (g.id === completedBlock.goalId) {
              const increment = g.unit === 'sessions' ? 1 : loggedMinutes / 60;
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
      actualWorkedMinutes: loggedMinutes,
      remainingMinutes: 0
    };

    const nextIndex = currentIdx + 1;

    // Recompute perGoalStats and counts
    const built = buildScheduleFromUserBlocks({
      blocks: updatedBlocks,
      startTime: planState.scheduledStartTime || '4:00 PM',
      endTime: planState.hardEndTime || '9:30 PM',
      bedtime: planState.bedtime || '10:30 PM',
      energy: planState.energy || 'normal',
      goals,
      activity
    });

    if (nextIndex >= updatedBlocks.length) {
      const finishedPlan = {
        ...planState,
        ...built,
        blocks: updatedBlocks,
        activeIndex: nextIndex,
        dayState: 'completed'
      };
      setPlanState(finishedPlan);
      saveStoredPlan(finishedPlan);
      setCurrentPage('today');

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
      showToast('All blocks complete! That’s enough for today.', 'success');
    } else {
      const advancedPlan = {
        ...planState,
        ...built,
        blocks: updatedBlocks,
        activeIndex: nextIndex
      };
      setPlanState(advancedPlan);
      saveStoredPlan(advancedPlan);
      showToast(`"${completedBlock.title}" completed (${loggedMinutes}m). Next block starting.`, 'success');
    }
  };

  // Cancel Active Block
  const handleCancelBlock = (canceledBlock) => {
    if (!planState || !planState.blocks) return;

    const currentIdx = planState.activeIndex || 0;
    const remainingBlocks = [...planState.blocks];
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

  // Add Time (+15 / +30 mins)
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

  // Need a Break Flow
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

    const newBlocks = [...planState.blocks];
    newBlocks.splice(currentIdx, 1, breakBlock, unfinishedTaskRemainder);

    const recalculated = recalculateScheduleTimes(newBlocks, nowMin);

    const updated = {
      ...planState,
      blocks: recalculated,
      activeIndex: currentIdx,
      scheduledEndTime: recalculated[recalculated.length - 1]?.endTime || planState.scheduledEndTime
    };

    setPlanState(updated);
    saveStoredPlan(updated);

    setBreakTargetBlock(null);
    showToast(`Break started (${cleanBreakDuration}m). Task will resume after.`, 'info');
  };

  const handleEndBreakEarly = () => {
    if (!planState || !planState.blocks) return;
    const currentIdx = planState.activeIndex || 0;
    const currentBlock = planState.blocks[currentIdx];

    if (!currentBlock || currentBlock.type !== 'break') return;

    const nowMin = getCurrentTimeMinutes();
    const updatedBlocks = [...planState.blocks];

    updatedBlocks[currentIdx] = {
      ...updatedBlocks[currentIdx],
      completed: true,
      remainingMinutes: 0
    };

    const nextIdx = currentIdx + 1;
    if (nextIdx < updatedBlocks.length) {
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
      handleCompleteBlock(currentBlock, currentBlock.durationMinutes);
    }
  };

  // Push Later Flow
  const handleOpenPushLaterModal = (block) => {
    setPushLaterBlock(block);
  };

  const handleConfirmPushLater = (chosenIndexOffset) => {
    if (!planState || !planState.blocks || !pushLaterBlock) return;

    const currentIdx = planState.activeIndex || 0;
    const blocksList = [...planState.blocks];
    const [pushedBlock] = blocksList.splice(currentIdx, 1);

    const targetIndex = currentIdx + 1 + chosenIndexOffset;
    blocksList.splice(Math.min(targetIndex, blocksList.length), 0, pushedBlock);

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
    showToast(`Pushed "${pushedBlock.title}" later in your schedule.`, 'info');
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
    showToast('Goal removed from list.', 'info');
  };

  // --- PROGRESS ACTIONS ---
  const handleUndoActivity = (activityItem) => {
    setActivity((prev) => {
      const nextActivity = prev.filter((a) => a.id !== activityItem.id);
      saveStoredActivity(nextActivity);
      return nextActivity;
    });

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
    showToast('Weekly progress reset to 0. Records preserved.', 'success');
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
              Junior OS
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
            onUpdateBlockDuration={handleUpdateBlockDuration}
            onDeleteBlock={handleDeleteBlock}
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
            onShiftScheduleOnResume={handleShiftScheduleOnResume}
            onEndBlockEarly={handleEndBlockEarly}
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
            startedCount={planState?.startedCount || 0}
            finishedCount={planState?.finishedCount || 0}
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
