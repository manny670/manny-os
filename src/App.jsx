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
  recalculateScheduleTimes
} from './utils/scheduler';
import {
  parseTimeToMinutes,
  minutesToTimeString,
  getCurrentTimeString
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
    setIsCheckInOpen(false);
    setCurrentPage('overview');
    showToast('Orbit mapped your day successfully.', 'success');
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
    setPlanState((prev) => ({
      ...prev,
      ...generated,
      activeIndex: 0,
      dayState: 'planned'
    }));
    showToast('Orbit plan regenerated.', 'info');
  };

  // --- DAY CONTROLS ---
  const handleStartDay = () => {
    if (!planState?.blocks || planState.blocks.length === 0) return;
    setPlanState((prev) => ({
      ...prev,
      dayState: 'active',
      activeIndex: 0
    }));
    setCurrentPage('focus');
    showToast('Day started. First focus block active.', 'success');
  };

  const handleResumeDay = () => {
    setCurrentPage('focus');
  };

  const handleResetDay = () => {
    setPlanState((prev) => ({
      ...prev,
      dayState: 'idle',
      activeIndex: 0
    }));
    setCurrentPage('today');
  };

  // --- FOCUS ACTIONS ---

  // 1. Complete Active Block
  const handleCompleteBlock = (completedBlock) => {
    if (!planState || !planState.blocks) return;

    const currentIdx = planState.activeIndex || 0;
    const isTracked = completedBlock.tracked;
    const duration = completedBlock.durationMinutes || 30;

    // If tracked, log to activity & update goal progress
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

      setActivity((prev) => [newActivityItem, ...prev]);

      // Update goal completed amount
      if (completedBlock.goalId) {
        setGoals((prevGoals) =>
          prevGoals.map((g) => {
            if (g.id === completedBlock.goalId) {
              const increment = g.unit === 'sessions' ? 1 : duration / 60;
              return {
                ...g,
                completed: parseFloat((g.completed + increment).toFixed(2))
              };
            }
            return g;
          })
        );
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
      setPlanState((prev) => ({
        ...prev,
        blocks: updatedBlocks,
        activeIndex: nextIndex,
        dayState: 'completed'
      }));
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
      setPlanState((prev) => ({
        ...prev,
        blocks: updatedBlocks,
        activeIndex: nextIndex
      }));
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
      setPlanState((prev) => ({
        ...prev,
        blocks: remainingBlocks,
        dayState: 'completed'
      }));
      setCurrentPage('today');
      showToast('Block canceled. Day complete.', 'info');
      return;
    }

    // Recalculate timestamps for remaining blocks starting from current time
    const startMin = parseTimeToMinutes(getCurrentTimeString());
    const recalculated = recalculateScheduleTimes(remainingBlocks, startMin);

    setPlanState((prev) => ({
      ...prev,
      blocks: recalculated,
      activeIndex: currentIdx
    }));

    showToast(`"${canceledBlock.title}" canceled. Schedule adjusted.`, 'warning');
  };

  // 3. Add Time (+15 / +30 min) with Hard End-Time Guard
  const handleAddTime = (minutesToAdd) => {
    if (!planState || !planState.blocks) return;

    const currentIdx = planState.activeIndex || 0;
    const currentBlock = planState.blocks[currentIdx];
    if (!currentBlock) return;

    // Check if new end time would exceed hard end time
    const hardEndMin = parseTimeToMinutes(planState.hardEndTime || '10:00 PM');
    const lastBlock = planState.blocks[planState.blocks.length - 1];
    const projectedEndMin = lastBlock.endMinutes + minutesToAdd;

    if (projectedEndMin > hardEndMin) {
      showToast(`Cannot add ${minutesToAdd}m: Protected end time (${planState.hardEndTime}) reached.`, 'warning');
      return;
    }

    const updatedBlocks = [...planState.blocks];
    updatedBlocks[currentIdx] = {
      ...updatedBlocks[currentIdx],
      durationMinutes: updatedBlocks[currentIdx].durationMinutes + minutesToAdd,
      remainingMinutes: (updatedBlocks[currentIdx].remainingMinutes || updatedBlocks[currentIdx].durationMinutes) + minutesToAdd
    };

    // Recalculate times starting from current block start
    const reindexed = recalculateScheduleTimes(updatedBlocks, updatedBlocks[0].startMinutes);

    setPlanState((prev) => ({
      ...prev,
      blocks: reindexed,
      scheduledEndTime: reindexed[reindexed.length - 1].endTime
    }));

    showToast(`Added +${minutesToAdd}m to "${currentBlock.title}".`, 'success');
  };

  // 4. Need a Break Flow (Pauses task, inserts break block, resumes exact remaining time)
  const handleOpenBreakModal = (block) => {
    setBreakTargetBlock(block);
  };

  const handleConfirmBreak = (breakDuration, breakReason) => {
    if (!planState || !planState.blocks || !breakTargetBlock) return;

    const currentIdx = planState.activeIndex || 0;
    const currentBlock = planState.blocks[currentIdx];

    // Create break block
    const breakBlock = {
      id: `break-${Date.now()}`,
      type: 'break',
      goalId: null,
      title: `${breakDuration}m Rest & Recharge`,
      icon: '☕',
      durationMinutes: breakDuration,
      tracked: false,
      note: breakReason || 'Mental reset & hydration',
      completed: false,
      remainingMinutes: breakDuration
    };

    const newBlocks = [...planState.blocks];
    // Insert break block right before the unfinished task
    newBlocks.splice(currentIdx, 0, breakBlock);

    // Recalculate schedule timestamps
    const recalculated = recalculateScheduleTimes(newBlocks, newBlocks[0].startMinutes);

    setPlanState((prev) => ({
      ...prev,
      blocks: recalculated,
      activeIndex: currentIdx, // Focuses on the break block immediately
      scheduledEndTime: recalculated[recalculated.length - 1].endTime
    }));

    setBreakTargetBlock(null);
    showToast(`Break started (${breakDuration}m). Task progress preserved.`, 'info');
  };

  const handleEndBreakEarly = () => {
    if (!planState || !planState.blocks) return;
    const currentIdx = planState.activeIndex || 0;
    const currentBlock = planState.blocks[currentIdx];

    // Mark break complete & advance immediately to the unfinished task
    handleCompleteBlock(currentBlock);
    showToast('Break ended early. Resuming your focus task.', 'success');
  };

  // 5. Push Later Flow (User selects destination, excludes Free Time, recalculates)
  const handleOpenPushLaterModal = (block) => {
    setPushLaterBlock(block);
  };

  const handleConfirmPushLater = (chosenIndexOffset) => {
    if (!planState || !planState.blocks || !pushLaterBlock) return;

    const currentIdx = planState.activeIndex || 0;
    const blocksList = [...planState.blocks];

    // Remove active block
    const [taskToMove] = blocksList.splice(currentIdx, 1);

    // Calculate new position: offset among remaining non-free-time blocks
    const destinationIdx = Math.min(blocksList.length - 1, currentIdx + chosenIndexOffset + 1);
    blocksList.splice(destinationIdx, 0, taskToMove);

    // Recalculate schedule timestamps
    const recalculated = recalculateScheduleTimes(blocksList, blocksList[0].startMinutes);

    setPlanState((prev) => ({
      ...prev,
      blocks: recalculated,
      activeIndex: currentIdx
    }));

    setPushLaterBlock(null);
    showToast(`"${taskToMove.title}" pushed later. Free Time preserved at end.`, 'info');
  };

  // --- GOALS CRUD ---
  const handleAddGoal = (newGoal) => {
    setGoals((prev) => [...prev, newGoal]);
    showToast(`Goal "${newGoal.name}" added.`, 'success');
  };

  const handleUpdateGoal = (updatedGoal) => {
    setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
    showToast(`Goal "${updatedGoal.name}" updated.`, 'success');
  };

  const handleDeleteGoal = (goalId) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    showToast('Goal removed from scheduler.', 'info');
  };

  // --- PROGRESS ACTIONS ---
  const handleUndoActivity = (activityItem) => {
    setActivity((prev) => prev.filter((a) => a.id !== activityItem.id));

    // Rollback goal completed amount
    if (activityItem.goalId) {
      setGoals((prevGoals) =>
        prevGoals.map((g) => {
          if (g.id === activityItem.goalId) {
            const decrement = g.unit === 'sessions' ? 1 : (activityItem.minutes || 0) / 60;
            return {
              ...g,
              completed: Math.max(0, parseFloat((g.completed - decrement).toFixed(2)))
            };
          }
          return g;
        })
      );
    }

    showToast(`Undid "${activityItem.title}" (${activityItem.minutes}m).`, 'warning');
  };

  const handleResetWeeklyProgress = () => {
    setGoals((prev) =>
      prev.map((g) => ({
        ...g,
        completed: 0
      }))
    );
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

      {/* Main Content Area */}
      <main className="main-content">
        {/* Mobile Top Header */}
        <div className="mobile-top-bar">
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open Navigation"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-surface)'
            }}
          >
            <Menu size={20} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
