/**
 * Orbit Deterministic Scheduling Engine
 * Generates human-paced, cleanly rounded schedules that seamlessly continue
 * across busy blocks, respect gym time/duration/shower preferences, and protect end times.
 */

import {
  parseTimeToMinutes,
  minutesToTimeString,
  formatDuration,
  roundToCleanIncrement,
  snapDurationToClean
} from './timeHelpers.js';

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
 * Generates an Orbit schedule with clean increments, seamless busy handling,
 * customized gym timing, post-gym buffers, and natural breathing room.
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
  gymStartTime = 'flexible', // 'flexible' | '5:00 PM' | '6:00 PM' | '7:00 PM' | custom string
  gymDuration = 60,          // 45, 60, 75, 90, or custom
  gymBufferMinutes = 15,     // shower / cooldown buffer after gym
  freeTimeMinutes = 60,
  goals = []
}) {
  const startMin = roundToCleanIncrement(parseTimeToMinutes(startTime), 5);
  let endMin = roundToCleanIncrement(parseTimeToMinutes(endTime), 5);
  const bedtimeMin = roundToCleanIncrement(parseTimeToMinutes(bedtime), 5);

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
    energyMultiplier = 0.8;
    defaultBreakDuration = 15;
    maxGoalsToFit = 2;
  } else if (energy === 'high') {
    energyMultiplier = 1.15;
    defaultBreakDuration = 10;
    maxGoalsToFit = 4;
  }

  // --- 1. PROCESS BUSY TIME RANGES ---
  const validBusyBlocks = [];
  if (isBusy && Array.isArray(busyRanges)) {
    busyRanges.forEach((range, idx) => {
      if (!range.startTime || !range.endTime) return;
      let bStart = roundToCleanIncrement(parseTimeToMinutes(range.startTime), 5);
      let bEnd = roundToCleanIncrement(parseTimeToMinutes(range.endTime), 5);

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

  // --- 2. CALCULATE WORKABLE FREE SEGMENTS (Windows before, between, and after busy blocks) ---
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

  // --- 3. PREPARE WORK TASKS POOL ---
  const workTasks = [];

  // A. Schoolwork
  const cleanSchoolwork = snapDurationToClean(Math.round(schoolworkMinutes * energyMultiplier));
  if (cleanSchoolwork > 0) {
    if (cleanSchoolwork >= 75) {
      const part1 = snapDurationToClean(Math.round(cleanSchoolwork * 0.55));
      const part2 = snapDurationToClean(cleanSchoolwork - part1);
      workTasks.push({
        type: 'schoolwork',
        goalId: null,
        title: 'AP Classwork & Study (Part 1)',
        icon: '📚',
        durationMinutes: part1,
        tracked: true,
        note: 'Focused academic study block'
      });
      workTasks.push({
        type: 'schoolwork',
        goalId: null,
        title: 'AP Classwork & Study (Part 2)',
        icon: '📚',
        durationMinutes: part2,
        tracked: true,
        note: 'Wrap up homework and deliverables'
      });
    } else {
      workTasks.push({
        type: 'schoolwork',
        goalId: null,
        title: 'AP Classwork & Study',
        icon: '📚',
        durationMinutes: cleanSchoolwork,
        tracked: true,
        note: 'Protected academic study block'
      });
    }
  }

  // B. Selected Specific Goal
  if (selectedGoalId && selectedGoalId !== 'none') {
    const specificGoal = rankedGoals.find((g) => g.id === selectedGoalId);
    if (specificGoal && specificGoal.id !== 'gym') {
      const gDur = snapDurationToClean(Math.round((specificGoal.sessionMinutes || 45) * energyMultiplier));
      workTasks.push({
        type: 'goal',
        goalId: specificGoal.id,
        title: specificGoal.name,
        icon: specificGoal.icon || '🎯',
        durationMinutes: gDur,
        tracked: true,
        note: 'Selected daily priority focus'
      });
    }
  }

  // C. Ranked Secondary Goals
  const availableGoals = rankedGoals.filter((g) => g.id !== 'gym' && g.id !== selectedGoalId);
  const secondaryGoals = availableGoals.slice(0, maxGoalsToFit);

  for (let goal of secondaryGoals) {
    const gDur = snapDurationToClean(Math.round((goal.sessionMinutes || 45) * energyMultiplier));
    workTasks.push({
      type: 'goal',
      goalId: goal.id,
      title: goal.name,
      icon: goal.icon || '🎯',
      durationMinutes: gDur,
      tracked: true,
      note: goal.deficit > 0
        ? `Weekly progress (${goal.completed}/${goal.weeklyTarget} ${goal.unit})`
        : 'Consistent junior year progress'
    });
  }

  // --- 4. PREPARE GYM & SHOWER SPECIFICATION ---
  let gymSpec = null;
  if (gymToday) {
    const cleanGymDur = snapDurationToClean(gymDuration || 60);
    const cleanShowerDur = snapDurationToClean(gymBufferMinutes || 15);
    
    let preferredStartMin = null;
    if (gymStartTime && gymStartTime !== 'flexible') {
      preferredStartMin = roundToCleanIncrement(parseTimeToMinutes(gymStartTime), 5);
      if (preferredStartMin < startMin || preferredStartMin >= hardCeiling) {
        preferredStartMin = null; // fallback to flexible if out of bounds
      }
    }

    gymSpec = {
      durationMinutes: cleanGymDur,
      showerMinutes: cleanShowerDur,
      preferredStartMin,
      placed: false
    };
  }

  // --- 5. FILL SEGMENTS CHRONOLOGICALLY ---
  const allFinalBlocks = [];
  let workTaskIndex = 0;

  freeSegments.forEach((segment, segIdx) => {
    const isLastSegment = segIdx === freeSegments.length - 1;
    let segClock = segment.start;
    const segEnd = segment.end;

    // Check if Gym is requested in this segment
    let placeGymHere = false;
    let gymScheduledStart = null;

    if (gymSpec && !gymSpec.placed) {
      if (gymSpec.preferredStartMin !== null) {
        if (gymSpec.preferredStartMin >= segClock && gymSpec.preferredStartMin + gymSpec.durationMinutes <= segEnd) {
          placeGymHere = true;
          gymScheduledStart = gymSpec.preferredStartMin;
        }
      } else {
        const totalNeeded = gymSpec.durationMinutes + gymSpec.showerMinutes;
        const isEveningSeg = segEnd >= 1020; // 5:00 PM or later
        if ((isEveningSeg || isLastSegment) && segment.duration >= totalNeeded) {
          placeGymHere = true;
          const idealStart = Math.max(segClock, Math.min(1080, segEnd - totalNeeded)); // 6:00 PM = 1080
          gymScheduledStart = roundToCleanIncrement(idealStart, 5);
        }
      }
    }

    // A. Fill tasks BEFORE Gym
    if (placeGymHere && gymScheduledStart && gymScheduledStart > segClock) {
      while (workTaskIndex < workTasks.length && segClock + 25 <= gymScheduledStart) {
        const task = workTasks[workTaskIndex];
        const space = gymScheduledStart - segClock;
        const dur = Math.min(task.durationMinutes, space >= 40 ? snapDurationToClean(space - 10) : space);

        allFinalBlocks.push({
          id: `block-${Date.now()}-${allFinalBlocks.length}`,
          ...task,
          durationMinutes: dur,
          startMinutes: segClock,
          endMinutes: segClock + dur,
          startTime: minutesToTimeString(segClock),
          endTime: minutesToTimeString(segClock + dur),
          completed: false,
          remainingMinutes: dur
        });

        segClock += dur;
        workTaskIndex++;

        // Add short buffer if room before gym
        if (segClock + defaultBreakDuration <= gymScheduledStart) {
          allFinalBlocks.push({
            id: `block-${Date.now()}-${allFinalBlocks.length}`,
            type: 'break',
            goalId: null,
            title: 'Transition & Gear Up',
            icon: '☕',
            durationMinutes: defaultBreakDuration,
            startMinutes: segClock,
            endMinutes: segClock + defaultBreakDuration,
            startTime: minutesToTimeString(segClock),
            endTime: minutesToTimeString(segClock + defaultBreakDuration),
            completed: false,
            remainingMinutes: defaultBreakDuration,
            tracked: false,
            note: 'Get ready for gym'
          });
          segClock += defaultBreakDuration;
        }
      }
      segClock = gymScheduledStart;
    }

    // B. Place Gym and Post-Gym Shower / Buffer
    if (placeGymHere && !gymSpec.placed && segClock + gymSpec.durationMinutes <= segEnd) {
      const gStart = segClock;
      const gEnd = gStart + gymSpec.durationMinutes;

      allFinalBlocks.push({
        id: `block-${Date.now()}-${allFinalBlocks.length}`,
        type: 'gym',
        goalId: 'gym',
        title: 'Gym & Strength Session',
        icon: '🏋️',
        durationMinutes: gymSpec.durationMinutes,
        startMinutes: gStart,
        endMinutes: gEnd,
        startTime: minutesToTimeString(gStart),
        endTime: minutesToTimeString(gEnd),
        completed: false,
        remainingMinutes: gymSpec.durationMinutes,
        tracked: true,
        note: 'Protected workout session'
      });

      segClock = gEnd;
      gymSpec.placed = true;

      // Post-Gym Shower & Cooldown buffer
      if (gymSpec.showerMinutes > 0 && segClock + gymSpec.showerMinutes <= segEnd) {
        const sStart = segClock;
        const sEnd = sStart + gymSpec.showerMinutes;

        allFinalBlocks.push({
          id: `block-${Date.now()}-${allFinalBlocks.length}`,
          type: 'break',
          goalId: null,
          title: 'Shower & Cooldown',
          icon: '🚿',
          durationMinutes: gymSpec.showerMinutes,
          startMinutes: sStart,
          endMinutes: sEnd,
          startTime: minutesToTimeString(sStart),
          endTime: minutesToTimeString(sEnd),
          completed: false,
          remainingMinutes: gymSpec.showerMinutes,
          tracked: false,
          note: 'Post-workout recovery and reset'
        });

        segClock = sEnd;
      }
    }

    // C. Fill remaining tasks in this segment
    const reservedFreeTime = isLastSegment ? snapDurationToClean(freeTimeMinutes || 60) : 0;
    const taskCeiling = Math.max(segClock, segEnd - reservedFreeTime);

    while (workTaskIndex < workTasks.length && segClock + 25 <= taskCeiling) {
      const task = workTasks[workTaskIndex];
      const space = taskCeiling - segClock;
      const dur = Math.min(task.durationMinutes, space >= 40 ? snapDurationToClean(space - 10) : space);

      allFinalBlocks.push({
        id: `block-${Date.now()}-${allFinalBlocks.length}`,
        ...task,
        durationMinutes: dur,
        startMinutes: segClock,
        endMinutes: segClock + dur,
        startTime: minutesToTimeString(segClock),
        endTime: minutesToTimeString(segClock + dur),
        completed: false,
        remainingMinutes: dur
      });

      segClock += dur;
      workTaskIndex++;

      // Insert clean 10-minute transition buffer between distinct work blocks
      if (segClock + defaultBreakDuration <= taskCeiling && workTaskIndex < workTasks.length) {
        allFinalBlocks.push({
          id: `block-${Date.now()}-${allFinalBlocks.length}`,
          type: 'break',
          goalId: null,
          title: 'Reset & Transition',
          icon: '✨',
          durationMinutes: defaultBreakDuration,
          startMinutes: segClock,
          endMinutes: segClock + defaultBreakDuration,
          startTime: minutesToTimeString(segClock),
          endTime: minutesToTimeString(segClock + defaultBreakDuration),
          completed: false,
          remainingMinutes: defaultBreakDuration,
          tracked: false,
          note: 'Short mental decompression'
        });
        segClock += defaultBreakDuration;
      }
    }

    // D. In the last segment: Place Protected Free Time & Wind-Down
    if (isLastSegment) {
      const remainingFree = Math.max(20, segEnd - segClock);
      const cleanFree = snapDurationToClean(remainingFree);

      allFinalBlocks.push({
        id: `block-${Date.now()}-${allFinalBlocks.length}`,
        type: 'freetime',
        goalId: null,
        title: 'Free Time & Unwind',
        icon: '🎮',
        durationMinutes: cleanFree,
        startMinutes: segClock,
        endMinutes: segClock + cleanFree,
        startTime: minutesToTimeString(segClock),
        endTime: minutesToTimeString(segClock + cleanFree),
        completed: false,
        remainingMinutes: cleanFree,
        tracked: false,
        note: 'Guaranteed evening downtime before sleep'
      });
      segClock += cleanFree;
    } else if (segClock < segEnd) {
      const gap = segEnd - segClock;
      if (gap >= 10) {
        const cleanGap = roundToCleanIncrement(gap, 5);
        allFinalBlocks.push({
          id: `block-${Date.now()}-${allFinalBlocks.length}`,
          type: 'break',
          goalId: null,
          title: 'Breathing Room & Reset',
          icon: '☕',
          durationMinutes: cleanGap,
          startMinutes: segClock,
          endMinutes: segClock + cleanGap,
          startTime: minutesToTimeString(segClock),
          endTime: minutesToTimeString(segClock + cleanGap),
          completed: false,
          remainingMinutes: cleanGap,
          tracked: false,
          note: 'Buffer before upcoming plans'
        });
      }
    }

    // E. Insert any busy block that occurs right after this segment
    validBusyBlocks.forEach((busy) => {
      if (busy.startMinutes === segEnd) {
        allFinalBlocks.push({
          ...busy,
          completed: false,
          remainingMinutes: busy.durationMinutes
        });
      }
    });
  });

  // Ensure all busy blocks are present in the final list
  validBusyBlocks.forEach((busy) => {
    if (!allFinalBlocks.some((b) => b.id === busy.id)) {
      allFinalBlocks.push({
        ...busy,
        completed: false,
        remainingMinutes: busy.durationMinutes
      });
    }
  });

  // Sort finalized blocks strictly chronologically
  allFinalBlocks.sort((a, b) => a.startMinutes - b.startMinutes);

  // Metrics
  const totalFocusedMinutes = allFinalBlocks
    .filter((b) => b.tracked)
    .reduce((acc, b) => acc + b.durationMinutes, 0);

  const finalEndTime = allFinalBlocks.length > 0
    ? allFinalBlocks[allFinalBlocks.length - 1].endTime
    : endTime;

  // Context Summary
  let summaryText = 'Human-paced afternoon schedule with built-in recovery.';
  if (selectedGoalId && selectedGoalId !== 'none') {
    const chosen = rankedGoals.find((g) => g.id === selectedGoalId);
    if (chosen) {
      summaryText = `Prioritized "${chosen.name}" with dedicated focus time.`;
    }
  }
  if (gymToday && gymSpec?.placed) {
    summaryText += ` Gym scheduled with a post-workout shower reset.`;
  }
  if (validBusyBlocks.length > 0) {
    summaryText += ` Seamlessly scheduled around your ${validBusyBlocks[0].startTime}–${validBusyBlocks[0].endTime} busy window.`;
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

/**
 * Robustly recalculates timestamps for all blocks starting from a clean start time.
 * Handles busy blocks (which act as fixed immovable anchors) and pushes flexible
 * blocks smoothly without ever outputting NaN or N/A.
 */
export function recalculateScheduleTimes(blocks = [], startMinutes = 780) {
  if (!Array.isArray(blocks) || blocks.length === 0) return [];

  let clock = roundToCleanIncrement(typeof startMinutes === 'number' && !isNaN(startMinutes) ? startMinutes : 780, 5);

  return blocks.map((block) => {
    const dur = typeof block.durationMinutes === 'number' && !isNaN(block.durationMinutes) && block.durationMinutes > 0
      ? block.durationMinutes
      : 15;

    // Busy blocks are fixed anchors at their predetermined clock time
    if (block.isBusy || block.type === 'busy') {
      const bStart = typeof block.startMinutes === 'number' && !isNaN(block.startMinutes)
        ? block.startMinutes
        : clock;
      const bEnd = typeof block.endMinutes === 'number' && !isNaN(block.endMinutes)
        ? block.endMinutes
        : bStart + dur;

      clock = Math.max(clock, bEnd);

      return {
        ...block,
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

  const updatedBlocks = blocks.map((b, idx) => ({ ...b }));
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

  // If final end time exceeds max allowable ceiling
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
