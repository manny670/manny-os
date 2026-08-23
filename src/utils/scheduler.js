/**
 * Orbit Deterministic Scheduling Engine
 * Balances priorities, schoolwork, specific goal selections, busy timeframes, gym, breaks, and protected end times.
 */

import { parseTimeToMinutes, minutesToTimeString, formatDuration } from './timeHelpers';

/**
 * Evaluates goals and produces ranked priorities based on user priority,
 * deficit towards weekly target, and specific daily selection.
 */
export function scoreAndRankGoals(goals = [], selectedGoalId = 'none') {
  const scored = goals.map((goal) => {
    // 1. Base user priority (1 - 5) -> 10 to 50 points
    const baseScore = (goal.priority || 3) * 10;

    // 2. Weekly progress deficit bonus -> up to 25 points
    const target = goal.weeklyTarget || 1;
    const completed = goal.completed || 0;
    const progressRatio = Math.min(completed / target, 1.5);
    const deficitScore = Math.max(0, (1 - progressRatio) * 25);

    // 3. User Daily Specific Selection Boost
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

  // Sort descending by internalScore
  scored.sort((a, b) => b.internalScore - a.internalScore);

  return scored.map((item, index) => ({
    ...item,
    rank: String(index + 1).padStart(2, '0')
  }));
}

/**
 * Generates an Orbit schedule respecting hard constraints and busy periods.
 */
export function generateOrbitSchedule({
  startTime = '1:00 PM',
  endTime = '9:30 PM',
  bedtime = '10:30 PM',
  energy = 'normal',
  schoolworkMinutes = 60,
  selectedGoalId = 'none',
  isBusy = false,
  busyRanges = [],
  gymToday = false,
  freeTimeMinutes = 60,
  goals = []
}) {
  const startMin = parseTimeToMinutes(startTime);
  let endMin = parseTimeToMinutes(endTime);
  const bedtimeMin = parseTimeToMinutes(bedtime);

  if (endMin <= startMin) endMin += 1440;
  let effectiveBedtime = bedtimeMin;
  if (effectiveBedtime <= startMin) effectiveBedtime += 1440;

  // Hard ceiling constraint
  const hardCeiling = Math.min(endMin, effectiveBedtime);
  const totalAvailableMinutes = Math.max(0, hardCeiling - startMin);

  // Ranked goals with daily focus applied
  const rankedGoals = scoreAndRankGoals(goals, selectedGoalId);

  // Energy scaling
  let energyMultiplier = 1.0;
  let defaultBreakDuration = 10;
  let maxGoalsToFit = 3;

  if (energy === 'low') {
    energyMultiplier = 0.75;
    defaultBreakDuration = 12;
    maxGoalsToFit = 2;
  } else if (energy === 'high') {
    energyMultiplier = 1.2;
    defaultBreakDuration = 8;
    maxGoalsToFit = 4;
  }

  // --- 1. PROCESS BUSY TIME RANGES ---
  const validBusyBlocks = [];
  if (isBusy && Array.isArray(busyRanges)) {
    busyRanges.forEach((range, idx) => {
      if (!range.startTime || !range.endTime) return;
      let bStart = parseTimeToMinutes(range.startTime);
      let bEnd = parseTimeToMinutes(range.endTime);

      if (bEnd <= bStart) bEnd += 1440;

      // Clamp within schedule window
      const clampedStart = Math.max(startMin, Math.min(bStart, hardCeiling));
      const clampedEnd = Math.max(clampedStart, Math.min(bEnd, hardCeiling));
      const duration = clampedEnd - clampedStart;

      if (duration > 0) {
        validBusyBlocks.push({
          id: `busy-${Date.now()}-${idx}`,
          type: 'busy',
          goalId: null,
          title: range.label?.trim() || 'Busy',
          icon: '🔒',
          durationMinutes: duration,
          startMinutes: clampedStart,
          endMinutes: clampedEnd,
          startTime: minutesToTimeString(clampedStart),
          endTime: minutesToTimeString(clampedEnd),
          tracked: false,
          isBusy: true,
          note: 'Unavailable · External plans'
        });
      }
    });
  }

  // Sort busy blocks chronologically
  validBusyBlocks.sort((a, b) => a.startMinutes - b.startMinutes);

  // --- 2. CALCULATE FREE TIME SEGMENTS (Windows between busy periods) ---
  const freeSegments = [];
  let currentPointer = startMin;

  validBusyBlocks.forEach((busy) => {
    if (busy.startMinutes > currentPointer) {
      freeSegments.push({
        start: currentPointer,
        end: busy.startMinutes,
        duration: busy.startMinutes - currentPointer
      });
    }
    currentPointer = Math.max(currentPointer, busy.endMinutes);
  });

  if (currentPointer < hardCeiling) {
    freeSegments.push({
      start: currentPointer,
      end: hardCeiling,
      duration: hardCeiling - currentPointer
    });
  }

  // Total free workable minutes across all segments
  const totalFreeWorkableMinutes = freeSegments.reduce((sum, seg) => sum + seg.duration, 0);

  // --- 3. PREPARE DRAFT TASK QUEUE ---
  const taskQueue = [];

  // A. Schoolwork
  if (schoolworkMinutes > 0) {
    if (schoolworkMinutes > 75) {
      const p1 = Math.round(schoolworkMinutes * 0.55);
      const p2 = schoolworkMinutes - p1;
      taskQueue.push({
        type: 'schoolwork',
        title: 'AP Classwork & Study (Part 1)',
        icon: '📚',
        durationMinutes: p1,
        tracked: true,
        note: 'Focused academic study session'
      });
      taskQueue.push({
        type: 'break',
        title: 'Quick Reset',
        icon: '☕',
        durationMinutes: defaultBreakDuration,
        tracked: false,
        note: 'Mental recovery between study blocks'
      });
      taskQueue.push({
        type: 'schoolwork',
        title: 'AP Classwork & Study (Part 2)',
        icon: '📚',
        durationMinutes: p2,
        tracked: true,
        note: 'Wrap up homework and deliverables'
      });
    } else {
      taskQueue.push({
        type: 'schoolwork',
        title: 'AP Classwork & Study',
        icon: '📚',
        durationMinutes: schoolworkMinutes,
        tracked: true,
        note: 'Protected academic block'
      });
    }
  }

  // B. Selected Specific Goal (if any)
  if (selectedGoalId && selectedGoalId !== 'none') {
    const specificGoal = rankedGoals.find((g) => g.id === selectedGoalId);
    if (specificGoal && specificGoal.id !== 'gym') {
      let dur = Math.round((specificGoal.sessionMinutes || 45) * energyMultiplier);
      dur = Math.max(30, Math.min(dur, 90));

      if (taskQueue.length > 0 && taskQueue[taskQueue.length - 1].type !== 'break') {
        taskQueue.push({
          type: 'break',
          title: 'Reset & Transition',
          icon: '✨',
          durationMinutes: defaultBreakDuration,
          tracked: false,
          note: 'Hydrate and transition to goal'
        });
      }

      taskQueue.push({
        type: 'goal',
        goalId: specificGoal.id,
        title: specificGoal.name,
        icon: specificGoal.icon || '🎯',
        durationMinutes: dur,
        tracked: true,
        note: 'Selected daily priority focus'
      });
    }
  }

  // C. Other Top Goals
  const availableGoals = rankedGoals.filter((g) => g.id !== 'gym' && g.id !== selectedGoalId);
  const remainingSlots = Math.max(1, maxGoalsToFit - (selectedGoalId !== 'none' ? 1 : 0));
  const secondaryGoals = availableGoals.slice(0, remainingSlots);

  for (let goal of secondaryGoals) {
    let dur = Math.round((goal.sessionMinutes || 45) * energyMultiplier);
    dur = Math.max(25, Math.min(dur, 60));

    if (taskQueue.length > 0 && taskQueue[taskQueue.length - 1].type !== 'break') {
      taskQueue.push({
        type: 'break',
        title: 'Reset & Transition',
        icon: '✨',
        durationMinutes: defaultBreakDuration,
        tracked: false,
        note: 'Short decompression break'
      });
    }

    taskQueue.push({
      type: 'goal',
      goalId: goal.id,
      title: goal.name,
      icon: goal.icon || '🎯',
      durationMinutes: dur,
      tracked: true,
      note: goal.deficit > 0
        ? `Weekly target progress (${goal.completed}/${goal.weeklyTarget} ${goal.unit})`
        : 'Consistent junior year progress'
    });
  }

  // D. Gym Placement
  if (gymToday) {
    const gymGoal = rankedGoals.find((g) => g.id === 'gym') || {
      id: 'gym',
      name: 'Gym',
      icon: '🏋️',
      sessionMinutes: 60
    };

    const gymBlock = {
      type: 'gym',
      goalId: 'gym',
      title: 'Gym & Strength Session',
      icon: '🏋️',
      durationMinutes: 60,
      tracked: true,
      note: 'Protected physical training session'
    };

    // Insert gym into task queue
    if (taskQueue.length <= 2) {
      taskQueue.push(gymBlock);
    } else {
      const insertPos = Math.min(2, taskQueue.length);
      taskQueue.splice(insertPos, 0, gymBlock);
    }
  }

  // E. Free Time (Protected at the end)
  if (freeTimeMinutes > 0) {
    taskQueue.push({
      type: 'freetime',
      title: 'Free Time & Unwind',
      icon: '🎮',
      durationMinutes: freeTimeMinutes,
      tracked: false,
      note: 'Guaranteed evening downtime before sleep'
    });
  }

  // --- 4. FIT TASKS INTO FREE SEGMENTS & MERGE WITH BUSY BLOCKS ---
  const allFinalBlocks = [];
  let taskIndex = 0;

  // Scale task durations if total queue exceeds free workable time
  const rawQueueMinutes = taskQueue.reduce((acc, t) => acc + t.durationMinutes, 0);
  if (rawQueueMinutes > totalFreeWorkableMinutes && totalFreeWorkableMinutes > 40) {
    const scale = totalFreeWorkableMinutes / rawQueueMinutes;
    taskQueue.forEach((t) => {
      if (t.type === 'freetime') {
        t.durationMinutes = Math.max(15, Math.round(t.durationMinutes * scale * 0.85));
      } else if (t.type === 'break') {
        t.durationMinutes = Math.max(5, Math.round(t.durationMinutes * scale));
      } else {
        t.durationMinutes = Math.max(20, Math.round(t.durationMinutes * scale));
      }
    });
  }

  // Sequentially fill free segments and insert busy blocks
  let busyBlockIndex = 0;

  freeSegments.forEach((segment) => {
    let segClock = segment.start;

    while (taskIndex < taskQueue.length && segClock < segment.end) {
      const task = taskQueue[taskIndex];
      const timeRemainingInSeg = segment.end - segClock;

      if (timeRemainingInSeg < 15) {
        // Not enough space for another task in this segment, leave small buffer
        break;
      }

      const taskDuration = Math.min(task.durationMinutes, timeRemainingInSeg);

      allFinalBlocks.push({
        id: `block-${Date.now()}-${allFinalBlocks.length}`,
        ...task,
        durationMinutes: taskDuration,
        startMinutes: segClock,
        endMinutes: segClock + taskDuration,
        startTime: minutesToTimeString(segClock),
        endTime: minutesToTimeString(segClock + taskDuration),
        completed: false,
        remainingMinutes: taskDuration
      });

      segClock += taskDuration;
      taskIndex++;
    }

    // Insert any busy block that starts at or after this segment
    while (
      busyBlockIndex < validBusyBlocks.length &&
      validBusyBlocks[busyBlockIndex].startMinutes <= segment.end
    ) {
      const busy = validBusyBlocks[busyBlockIndex];
      allFinalBlocks.push({
        ...busy,
        completed: false,
        remainingMinutes: busy.durationMinutes
      });
      busyBlockIndex++;
    }
  });

  // Append any remaining busy blocks
  while (busyBlockIndex < validBusyBlocks.length) {
    allFinalBlocks.push({
      ...validBusyBlocks[busyBlockIndex],
      completed: false,
      remainingMinutes: validBusyBlocks[busyBlockIndex].durationMinutes
    });
    busyBlockIndex++;
  }

  // Sort finalized blocks chronologically
  allFinalBlocks.sort((a, b) => a.startMinutes - b.startMinutes);

  // Metrics
  const totalFocusedMinutes = allFinalBlocks
    .filter((b) => b.tracked)
    .reduce((acc, b) => acc + b.durationMinutes, 0);

  const finalEndTime = allFinalBlocks.length > 0
    ? allFinalBlocks[allFinalBlocks.length - 1].endTime
    : endTime;

  // Selected goal summary text
  let summaryText = 'Balanced afternoon schedule created by Orbit.';
  if (selectedGoalId && selectedGoalId !== 'none') {
    const chosen = rankedGoals.find((g) => g.id === selectedGoalId);
    if (chosen) {
      summaryText = `Orbit prioritized dedicated focus time for "${chosen.name}".`;
    }
  }
  if (validBusyBlocks.length > 0) {
    summaryText += ` Orbit protected your ${validBusyBlocks[0].startTime}–${validBusyBlocks[0].endTime} busy window.`;
  }

  return {
    blocks: allFinalBlocks,
    totalFocusedMinutes,
    totalFocusedFormatted: formatDuration(totalFocusedMinutes),
    blockCount: allFinalBlocks.length,
    scheduledStartTime: startTime,
    scheduledEndTime: finalEndTime,
    hardEndTime: endTime,
    bedtime: bedtime,
    energy,
    contextSummary: summaryText,
    hasBusy: validBusyBlocks.length > 0,
    rankedGoals
  };
}

export function recalculateScheduleTimes(blocks, startMinutes) {
  let clock = startMinutes;
  return blocks.map((b) => {
    if (b.isBusy) {
      clock = b.endMinutes;
      return b;
    }
    const bStart = clock;
    const bEnd = clock + b.durationMinutes;
    clock = bEnd;

    return {
      ...b,
      startMinutes: bStart,
      endMinutes: bEnd,
      startTime: minutesToTimeString(bStart),
      endTime: minutesToTimeString(bEnd)
    };
  });
}
