/**
 * Orbit Real-Time Scheduling, Dynamic Rescheduling & Goal Tracking Engine
 * Supports live pause schedule shifting, actual worked time tracking, early endings,
 * cascading downstream recalculations, and goal recommendation scoring.
 */

import {
  parseTimeToMinutes,
  minutesToTimeString,
  formatDuration,
  roundToCleanIncrement,
  getCurrentTimeMinutes
} from './timeHelpers.js';

/**
 * Evaluates goals and produces ranked priorities with recommendation flags
 */
export function scoreAndRankGoals(goals = [], selectedGoalId = 'none') {
  const scored = goals.map((goal) => {
    const baseScore = (goal.priority || 3) * 10;
    const target = goal.weeklyTarget || 1;
    const completed = goal.completed || 0;
    const progressRatio = Math.min(completed / target, 1.5);
    const deficit = Math.max(0, target - completed);
    const deficitScore = Math.max(0, (1 - progressRatio) * 25);

    let selectionBoost = 0;
    let selectionReason = '';

    if (selectedGoalId && selectedGoalId !== 'none') {
      if (goal.id === selectedGoalId) {
        selectionBoost = 100;
        selectionReason = 'Selected as today’s primary focus';
      }
    }

    const totalScore = baseScore + deficitScore + selectionBoost;

    // A goal is recommended if it has a weekly deficit or is high priority (priority >= 4)
    const isRecommended = (goal.priority >= 4 && deficit > 0) || deficit >= 1 || (goal.priority === 5);

    return {
      ...goal,
      internalScore: totalScore,
      selectionReason,
      isDailyFocus: selectionBoost > 0,
      isRecommended,
      deficit
    };
  });

  scored.sort((a, b) => b.internalScore - a.internalScore);

  return scored.map((item, index) => ({
    ...item,
    rank: String(index + 1).padStart(2, '0'),
    // Ensure at least the top 2 ranked items are marked as recommended
    isRecommended: item.isRecommended || index < 2
  }));
}

/**
 * Builds a complete Orbit schedule from the user's customized block-by-block inputs.
 */
export function buildScheduleFromUserBlocks({
  blocks = [],
  startTime = '4:00 PM',
  endTime = '9:30 PM',
  bedtime = '10:30 PM',
  energy = 'normal',
  goals = [],
  activity = []
}) {
  const startMin = roundToCleanIncrement(parseTimeToMinutes(startTime), 5);
  let endMin = roundToCleanIncrement(parseTimeToMinutes(endTime), 5);
  const bedtimeMin = roundToCleanIncrement(parseTimeToMinutes(bedtime), 5);

  if (endMin <= startMin) endMin += 1440;
  let effectiveBedtime = bedtimeMin;
  if (effectiveBedtime <= startMin) effectiveBedtime += 1440;

  // Recalculate timestamps for the user blocks starting from startMin
  const calculatedBlocks = recalculateScheduleTimes(blocks, startMin);

  // Calculate metrics
  const totalPlannedFocusMinutes = calculatedBlocks
    .filter((b) => b.tracked !== false && b.type !== 'freetime' && b.type !== 'break' && !b.isBusy)
    .reduce((acc, b) => acc + (b.durationMinutes || 0), 0);

  const totalPlannedFreeMinutes = calculatedBlocks
    .filter((b) => b.type === 'freetime')
    .reduce((acc, b) => acc + (b.durationMinutes || 0), 0);

  const finalEndTime = calculatedBlocks.length > 0
    ? calculatedBlocks[calculatedBlocks.length - 1].endTime
    : endTime;

  // Calculate per-goal planned vs completed minutes for today
  const perGoalStats = goals.map((goal) => {
    const plannedForGoal = calculatedBlocks
      .filter((b) => b.goalId === goal.id)
      .reduce((acc, b) => acc + (b.durationMinutes || 0), 0);

    const completedForGoal = calculatedBlocks
      .filter((b) => b.goalId === goal.id && b.completed)
      .reduce((acc, b) => acc + (b.actualWorkedMinutes || b.durationMinutes || 0), 0);

    const remainingPlanned = Math.max(0, plannedForGoal - completedForGoal);

    return {
      goalId: goal.id,
      name: goal.name,
      icon: goal.icon || '🎯',
      color: goal.color || 'var(--accent-primary)',
      unit: goal.unit || 'hours',
      weeklyTarget: goal.weeklyTarget || 0,
      totalWeeklyCompleted: goal.completed || 0,
      plannedMinutes: plannedForGoal,
      plannedFormatted: formatDuration(plannedForGoal),
      completedMinutes: completedForGoal,
      completedFormatted: formatDuration(completedForGoal),
      remainingPlannedMinutes: remainingPlanned,
      remainingPlannedFormatted: formatDuration(remainingPlanned)
    };
  });

  const startedCount = calculatedBlocks.filter((b) => b.started || b.completed).length;
  const finishedCount = calculatedBlocks.filter((b) => b.completed).length;

  return {
    blocks: calculatedBlocks,
    totalFocusedMinutes: totalPlannedFocusMinutes,
    totalFocusedFormatted: formatDuration(totalPlannedFocusMinutes),
    totalFreeMinutes: totalPlannedFreeMinutes,
    totalFreeFormatted: formatDuration(totalPlannedFreeMinutes),
    blockCount: calculatedBlocks.length,
    scheduledStartTime: startTime,
    scheduledEndTime: finalEndTime,
    hardEndTime: endTime,
    bedtime: bedtime,
    energy,
    startedCount,
    finishedCount,
    perGoalStats,
    contextSummary: `Schedule with ${calculatedBlocks.length} blocks.`
  };
}

/**
 * Robustly recalculates timestamps for all blocks starting from a clean start time.
 */
export function recalculateScheduleTimes(blocks = [], startMinutes = 780) {
  if (!Array.isArray(blocks) || blocks.length === 0) return [];

  let clock = roundToCleanIncrement(typeof startMinutes === 'number' && !isNaN(startMinutes) ? startMinutes : 780, 5);

  return blocks.map((block, idx) => {
    const dur = typeof block.durationMinutes === 'number' && !isNaN(block.durationMinutes) && block.durationMinutes > 0
      ? roundToCleanIncrement(block.durationMinutes, 5)
      : 30;

    // If block is already completed and has fixed timestamps, preserve them
    if (block.completed && block.startMinutes != null && block.endMinutes != null) {
      clock = Math.max(clock, block.endMinutes);
      return {
        ...block,
        durationMinutes: block.actualWorkedMinutes || block.durationMinutes || dur,
        startTime: minutesToTimeString(block.startMinutes),
        endTime: minutesToTimeString(block.endMinutes)
      };
    }

    // Busy blocks are fixed anchors at their predetermined clock time
    if (block.isBusy || block.type === 'busy') {
      const bStart = typeof block.startMinutes === 'number' && !isNaN(block.startMinutes)
        ? roundToCleanIncrement(block.startMinutes, 5)
        : clock;
      const bEnd = typeof block.endMinutes === 'number' && !isNaN(block.endMinutes)
        ? roundToCleanIncrement(block.endMinutes, 5)
        : bStart + dur;

      clock = Math.max(clock, bEnd);

      return {
        ...block,
        id: block.id || `block-${Date.now()}-${idx}`,
        durationMinutes: bEnd - bStart,
        startMinutes: bStart,
        endMinutes: bEnd,
        startTime: minutesToTimeString(bStart),
        endTime: minutesToTimeString(bEnd)
      };
    }

    const bStart = clock;
    const bEnd = bStart + dur;
    clock = bEnd;

    return {
      ...block,
      id: block.id || `block-${Date.now()}-${idx}`,
      durationMinutes: dur,
      startMinutes: bStart,
      endMinutes: bEnd,
      startTime: minutesToTimeString(bStart),
      endTime: minutesToTimeString(bEnd)
    };
  });
}

/**
 * Dynamically shifts schedule when a paused block resumes at currentClockMinutes.
 * The active block finishes at (currentClockMinutes + remainingMinutes).
 * All following blocks shift accordingly!
 */
export function shiftScheduleOnResume({
  blocks = [],
  activeIndex = 0,
  currentClockMinutes = null,
  remainingMinutes = 30
}) {
  if (!blocks || blocks.length === 0 || activeIndex >= blocks.length) return blocks;

  const nowMin = currentClockMinutes !== null
    ? roundToCleanIncrement(currentClockMinutes, 5)
    : getCurrentTimeMinutes();

  const cleanRemaining = roundToCleanIncrement(Math.max(5, remainingMinutes), 5);

  const updated = blocks.map((b, idx) => ({ ...b }));
  const activeBlock = updated[activeIndex];

  // Active block's new end time is nowMin + cleanRemaining
  const newActiveEnd = nowMin + cleanRemaining;
  activeBlock.endMinutes = newActiveEnd;
  activeBlock.endTime = minutesToTimeString(newActiveEnd);
  activeBlock.remainingMinutes = cleanRemaining;
  activeBlock.status = 'active';

  // Cascade shift to all subsequent blocks starting from newActiveEnd
  let runningClock = newActiveEnd;
  for (let i = activeIndex + 1; i < updated.length; i++) {
    const block = updated[i];
    if (block.isBusy || block.type === 'busy') {
      runningClock = Math.max(runningClock, block.endMinutes || runningClock);
      continue;
    }
    const dur = block.durationMinutes || 30;
    const bStart = runningClock;
    const bEnd = bStart + dur;
    runningClock = bEnd;

    updated[i] = {
      ...block,
      startMinutes: bStart,
      endMinutes: bEnd,
      startTime: minutesToTimeString(bStart),
      endTime: minutesToTimeString(bEnd)
    };
  }

  return updated;
}

/**
 * Ends a block early with actualWorkedMinutes and shifts all following blocks to start NOW.
 */
export function finishBlockEarly({
  blocks = [],
  activeIndex = 0,
  actualWorkedMinutes = 30,
  currentClockMinutes = null
}) {
  if (!blocks || blocks.length === 0 || activeIndex >= blocks.length) return blocks;

  const nowMin = currentClockMinutes !== null
    ? roundToCleanIncrement(currentClockMinutes, 5)
    : getCurrentTimeMinutes();

  const cleanActual = Math.max(1, Math.round(actualWorkedMinutes));

  const updated = blocks.map((b, idx) => ({ ...b }));
  const activeBlock = updated[activeIndex];

  // Record actual finished state
  activeBlock.completed = true;
  activeBlock.status = 'ended_early';
  activeBlock.actualWorkedMinutes = cleanActual;
  activeBlock.durationMinutes = cleanActual;
  activeBlock.remainingMinutes = 0;
  activeBlock.endMinutes = nowMin;
  activeBlock.endTime = minutesToTimeString(nowMin);

  // Subsequent blocks start immediately at nowMin
  let runningClock = nowMin;
  for (let i = activeIndex + 1; i < updated.length; i++) {
    const block = updated[i];
    if (block.isBusy || block.type === 'busy') {
      runningClock = Math.max(runningClock, block.endMinutes || runningClock);
      continue;
    }
    const dur = block.durationMinutes || 30;
    const bStart = runningClock;
    const bEnd = bStart + dur;
    runningClock = bEnd;

    updated[i] = {
      ...block,
      startMinutes: bStart,
      endMinutes: bEnd,
      startTime: minutesToTimeString(bStart),
      endTime: minutesToTimeString(bEnd)
    };
  }

  return updated;
}

/**
 * Intelligent schedule adjustment engine for extending tasks (+15m / +30m)
 */
export function adjustScheduleForExtendedBlock(blocks = [], activeIndex = 0, addedMinutes = 15, hardEndTimeStr = '9:30 PM', bedtimeStr = '10:30 PM') {
  if (!blocks || blocks.length === 0 || activeIndex >= blocks.length) {
    return { success: false, blocks, message: 'Invalid schedule blocks' };
  }

  const hardCeilingMin = parseTimeToMinutes(hardEndTimeStr);
  const bedtimeMin = parseTimeToMinutes(bedtimeStr);
  const maxAllowableCeiling = Math.max(hardCeilingMin, bedtimeMin);

  const updatedBlocks = blocks.map((b) => ({ ...b }));
  const targetBlock = updatedBlocks[activeIndex];

  targetBlock.durationMinutes = (targetBlock.durationMinutes || 30) + addedMinutes;
  targetBlock.remainingMinutes = (targetBlock.remainingMinutes || targetBlock.durationMinutes) + addedMinutes;

  // Check if we can borrow from downstream Free Time
  let timeToAbsorb = addedMinutes;
  for (let i = updatedBlocks.length - 1; i > activeIndex; i--) {
    if (timeToAbsorb <= 0) break;
    const b = updatedBlocks[i];
    if (b.type === 'freetime' && b.durationMinutes > 20) {
      const reduction = Math.min(timeToAbsorb, b.durationMinutes - 15);
      b.durationMinutes -= reduction;
      timeToAbsorb -= reduction;
    }
  }

  const recalculated = recalculateScheduleTimes(updatedBlocks, updatedBlocks[0]?.startMinutes || 780);
  const finalEndMin = recalculated[recalculated.length - 1]?.endMinutes || 0;

  if (finalEndMin > maxAllowableCeiling + 15) {
    return {
      success: false,
      blocks,
      message: `Cannot extend further without passing your bedtime (${bedtimeStr}).`
    };
  }

  return {
    success: true,
    blocks: recalculated,
    message: `Added +${addedMinutes}m to "${targetBlock.title}".`
  };
}
