/**
 * Orbit Block-by-Block Scheduling & Rescheduling Engine
 * Calculates clean timestamps, cascades downstream schedule changes,
 * computes Planned vs Completed goal time tracking, and tracks Started vs Finished stats.
 */

import {
  parseTimeToMinutes,
  minutesToTimeString,
  formatDuration,
  roundToCleanIncrement,
  snapDurationToClean
} from './timeHelpers.js';

/**
 * Evaluates goals and produces ranked priorities
 */
export function scoreAndRankGoals(goals = [], selectedGoalId = 'none') {
  const scored = goals.map((goal) => {
    const baseScore = (goal.priority || 3) * 10;
    const target = goal.weeklyTarget || 1;
    const completed = goal.completed || 0;
    const progressRatio = Math.min(completed / target, 1.5);
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

    return {
      ...goal,
      internalScore: totalScore,
      selectionReason,
      isDailyFocus: selectionBoost > 0,
      deficit: target - completed
    };
  });

  scored.sort((a, b) => b.internalScore - a.internalScore);

  return scored.map((item, index) => ({
    ...item,
    rank: String(index + 1).padStart(2, '0')
  }));
}

/**
 * Builds a complete Orbit schedule from the user's customized block-by-block inputs.
 * Chains all blocks chronologically, computes clean 5-minute increments,
 * per-goal planned vs completed time, and started vs finished metrics.
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

  const hardCeiling = Math.min(endMin, effectiveBedtime);

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
      .reduce((acc, b) => acc + (b.durationMinutes || 0), 0);

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

  // Calculate Started vs Finished counts
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
    contextSummary: `Custom block-by-block schedule · ${calculatedBlocks.length} blocks planned.`
  };
}

/**
 * Robustly recalculates timestamps for all blocks starting from a clean start time.
 * If any block duration changes, this cascades and updates all subsequent block start/end times automatically.
 * Ensures clean 5-minute multiples with ZERO NaN or N/A values.
 */
export function recalculateScheduleTimes(blocks = [], startMinutes = 780) {
  if (!Array.isArray(blocks) || blocks.length === 0) return [];

  let clock = roundToCleanIncrement(typeof startMinutes === 'number' && !isNaN(startMinutes) ? startMinutes : 780, 5);

  return blocks.map((block, idx) => {
    const dur = typeof block.durationMinutes === 'number' && !isNaN(block.durationMinutes) && block.durationMinutes > 0
      ? roundToCleanIncrement(block.durationMinutes, 5)
      : 30;

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
 * Intelligent schedule adjustment engine for extending tasks (+15m / +30m)
 * Absorbs extra time from downstream Free Time or buffers when possible,
 * or extends day end time without breaking busy blocks or creating invalid times.
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

  // Check if we can borrow from downstream Free Time (to preserve user's end time)
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

  // Recalculate timestamps starting from the first block's start time
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

/**
 * Preserved fallback generator for quick full day creation if needed
 */
export function generateOrbitSchedule({
  startTime = '4:00 PM',
  endTime = '9:30 PM',
  bedtime = '10:30 PM',
  energy = 'normal',
  schoolworkMinutes = 60,
  selectedGoalId = 'none',
  isBusy = false,
  busyRanges = [],
  gymToday = false,
  gymStartTime = 'flexible',
  gymDuration = 60,
  gymBufferMinutes = 15,
  freeTimeMinutes = 60,
  goals = []
}) {
  const startMin = roundToCleanIncrement(parseTimeToMinutes(startTime), 5);
  let endMin = roundToCleanIncrement(parseTimeToMinutes(endTime), 5);
  const bedtimeMin = roundToCleanIncrement(parseTimeToMinutes(bedtime), 5);

  if (endMin <= startMin) endMin += 1440;
  let effectiveBedtime = bedtimeMin;
  if (effectiveBedtime <= startMin) effectiveBedtime += 1440;

  const hardCeiling = Math.min(endMin, effectiveBedtime);
  const rankedGoals = scoreAndRankGoals(goals, selectedGoalId);

  const sampleBlocks = [];

  if (schoolworkMinutes > 0) {
    sampleBlocks.push({
      id: `block-${Date.now()}-1`,
      type: 'schoolwork',
      goalId: null,
      title: 'AP Schoolwork',
      icon: '📚',
      durationMinutes: schoolworkMinutes,
      tracked: true,
      note: 'Academic assignments and study'
    });
  }

  if (selectedGoalId && selectedGoalId !== 'none') {
    const g = goals.find((item) => item.id === selectedGoalId);
    if (g) {
      sampleBlocks.push({
        id: `block-${Date.now()}-2`,
        type: 'goal',
        goalId: g.id,
        title: g.name,
        icon: g.icon || '🎯',
        durationMinutes: g.sessionMinutes || 45,
        tracked: true,
        note: 'Selected priority goal'
      });
    }
  }

  if (gymToday) {
    sampleBlocks.push({
      id: `block-${Date.now()}-3`,
      type: 'gym',
      goalId: 'gym',
      title: 'Gym',
      icon: '🏋️',
      durationMinutes: gymDuration || 60,
      tracked: true,
      note: 'Workout session'
    });
    if (gymBufferMinutes > 0) {
      sampleBlocks.push({
        id: `block-${Date.now()}-4`,
        type: 'break',
        goalId: null,
        title: 'Shower & Cooldown',
        icon: '🚿',
        durationMinutes: gymBufferMinutes,
        tracked: false,
        note: 'Post-workout cooldown'
      });
    }
  }

  sampleBlocks.push({
    id: `block-${Date.now()}-5`,
    type: 'freetime',
    goalId: null,
    title: 'Free Time',
    icon: '🎮',
    durationMinutes: freeTimeMinutes || 60,
    tracked: false,
    note: 'Protected evening downtime'
  });

  return buildScheduleFromUserBlocks({
    blocks: sampleBlocks,
    startTime,
    endTime,
    bedtime,
    energy,
    goals
  });
}
