/**
 * Orbit Scheduling & Contextual Intelligence Engine
 * Layer A: Deterministic Constraint Engine
 * Layer B: Gemini AI Semantic Reasoning & Clock-Time Anchoring
 */

import { parseTimeToMinutes, minutesToTimeString, formatDuration } from './timeHelpers';
import { analyzeContextSemanticAI } from './aiScheduler';

/**
 * Evaluates goals and produces ranked priorities based on user priority,
 * deficit towards weekly target, and natural language urgency matches.
 */
export function scoreAndRankGoals(goals, urgentText = '') {
  const normalizedUrgent = (urgentText || '').toLowerCase();

  const scored = goals.map(goal => {
    // 1. Base user priority (1 - 5) -> 10 to 50 points
    const baseScore = (goal.priority || 3) * 10;

    // 2. Weekly progress deficit bonus -> up to 25 points
    const target = goal.weeklyTarget || 1;
    const completed = goal.completed || 0;
    const progressRatio = Math.min(completed / target, 1.5);
    const deficitScore = Math.max(0, (1 - progressRatio) * 25);

    // 3. Contextual urgency match
    let urgencyScore = 0;
    let urgencyReason = '';

    const name = goal.name.toLowerCase();
    const id = goal.id.toLowerCase();

    if (normalizedUrgent) {
      if (
        (id === 'scioly_yac' || name.includes('yac') || name.includes('science')) &&
        (normalizedUrgent.includes('yac') || normalizedUrgent.includes('olympiad') || normalizedUrgent.includes('council') || normalizedUrgent.includes('scioly') || normalizedUrgent.includes('speech'))
      ) {
        urgencyScore += 50;
        urgencyReason = 'Extracurricular / council priority recognized';
      } else if (
        (id === 'act' || name.includes('act')) &&
        (normalizedUrgent.includes('act') || normalizedUrgent.includes('test') || normalizedUrgent.includes('exam'))
      ) {
        urgencyScore += 45;
        urgencyReason = 'Standardized test prep priority';
      } else if (
        (id === 'isef' || name.includes('research') || name.includes('isef')) &&
        (normalizedUrgent.includes('isef') || normalizedUrgent.includes('research') || normalizedUrgent.includes('proposal') || normalizedUrgent.includes('draft') || normalizedUrgent.includes('abstract'))
      ) {
        urgencyScore += 45;
        urgencyReason = 'Research milestone recognized';
      } else if (
        (id === 'dropshipping' || name.includes('business')) &&
        (normalizedUrgent.includes('drop') || normalizedUrgent.includes('shop') || normalizedUrgent.includes('business') || normalizedUrgent.includes('product'))
      ) {
        urgencyScore += 35;
        urgencyReason = 'Business project milestone';
      } else if (normalizedUrgent.includes(name)) {
        urgencyScore += 35;
        urgencyReason = 'Specifically mentioned in your notes';
      }
    }

    const totalScore = baseScore + deficitScore + urgencyScore;

    return {
      ...goal,
      internalScore: totalScore,
      urgencyReason,
      isUrgent: urgencyScore > 0,
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
 * Primary Orbit Scheduling Engine (Layer A + Layer B Gemini AI Reasoning)
 */
export function generateOrbitSchedule({
  startTime = '1:00 PM',
  endTime = '9:30 PM',
  bedtime = '10:30 PM',
  energy = 'normal',
  schoolworkMinutes = 60,
  urgentText = '',
  gymToday = false,
  freeTimeMinutes = 60,
  goals = [],
  aiParsedData = null
}) {
  const startMin = parseTimeToMinutes(startTime);
  let endMin = parseTimeToMinutes(endTime);
  const bedtimeMin = parseTimeToMinutes(bedtime);

  if (endMin <= startMin) endMin += 1440;
  let effectiveBedtime = bedtimeMin;
  if (effectiveBedtime <= startMin) effectiveBedtime += 1440;

  const hardCeiling = Math.min(endMin, effectiveBedtime);
  const totalAvailableMinutes = Math.max(0, hardCeiling - startMin);

  // Use pre-parsed AI data if passed, otherwise run semantic AI analyzer
  const aiAnalysis = aiParsedData || analyzeContextSemanticAI(urgentText, startTime, endTime, energy);
  const rankedGoals = scoreAndRankGoals(goals, urgentText);

  let energyMultiplier = 1.0;
  let defaultBreakDuration = 10;
  if (energy === 'low') {
    energyMultiplier = 0.75;
    defaultBreakDuration = 12;
  } else if (energy === 'high') {
    energyMultiplier = 1.2;
    defaultBreakDuration = 8;
  }

  // --- CASE 1: FIXED TIME-ANCHORED COMMITMENTS (e.g. "meeting with YAC at 4pm") ---
  const validAnchors = (aiAnalysis.anchoredEvents || []).filter(
    (ev) => ev.startMinutes >= startMin && ev.startMinutes < hardCeiling
  );

  let finalizedBlocks = [];

  if (validAnchors.length > 0) {
    const anchor = validAnchors[0];
    const preAnchorSpan = Math.max(0, anchor.startMinutes - startMin);
    const postAnchorSpan = Math.max(0, hardCeiling - anchor.endMinutes);

    // 1. Pre-Anchor Segment
    let preBlocks = [];
    let currentClock = startMin;

    // AI Custom Tasks or Schoolwork before meeting
    if (aiAnalysis.customAiBlocks?.length > 0) {
      for (let aiBlock of aiAnalysis.customAiBlocks) {
        if (aiBlock.goalId !== anchor.goalId && anchor.startMinutes - currentClock >= 35) {
          const dur = Math.min(aiBlock.durationMinutes, anchor.startMinutes - currentClock - 10);
          preBlocks.push({
            type: 'goal',
            goalId: aiBlock.goalId,
            title: aiBlock.title,
            icon: aiBlock.icon,
            durationMinutes: dur,
            tracked: true,
            note: aiBlock.note
          });
          currentClock += dur;

          if (currentClock + defaultBreakDuration < anchor.startMinutes) {
            preBlocks.push({
              type: 'break',
              goalId: null,
              title: 'Quick Reset',
              icon: '☕',
              durationMinutes: defaultBreakDuration,
              tracked: false,
              note: 'Mental recovery before meeting'
            });
            currentClock += defaultBreakDuration;
          }
          break;
        }
      }
    }

    if (schoolworkMinutes > 0 && anchor.startMinutes - currentClock >= 30) {
      const swMinutes = Math.min(schoolworkMinutes, anchor.startMinutes - currentClock - 5);
      preBlocks.push({
        type: 'schoolwork',
        goalId: null,
        title: 'AP Classwork & Study',
        icon: '📚',
        durationMinutes: swMinutes,
        tracked: true,
        note: 'Focused academic homework session'
      });
      currentClock += swMinutes;
    }

    // 2. Fixed Anchor Block (at exact clock time)
    const anchorBlock = {
      ...anchor,
      startMinutes: anchor.startMinutes,
      endMinutes: anchor.endMinutes,
      startTime: minutesToTimeString(anchor.startMinutes),
      endTime: minutesToTimeString(anchor.endMinutes),
      durationMinutes: anchor.durationMinutes
    };

    // 3. Post-Anchor Segment
    let postBlocks = [];
    let postClock = anchor.endMinutes;

    if (postClock + defaultBreakDuration <= hardCeiling) {
      postBlocks.push({
        type: 'break',
        goalId: null,
        title: 'Post-Meeting Reset',
        icon: '☕',
        durationMinutes: defaultBreakDuration,
        tracked: false,
        note: 'Short decompression after meeting'
      });
      postClock += defaultBreakDuration;
    }

    if (gymToday && postClock + 60 <= hardCeiling) {
      postBlocks.push({
        type: 'gym',
        goalId: 'gym',
        title: 'Gym & Strength Session',
        icon: '🏋️',
        durationMinutes: 60,
        tracked: true,
        note: 'Protected evening training in 5–9 PM window'
      });
      postClock += 60;

      if (postClock + 35 <= hardCeiling) {
        postBlocks.push({
          type: 'dinner',
          goalId: null,
          title: 'Dinner & Food Recharge',
          icon: '🍲',
          durationMinutes: 35,
          tracked: false,
          note: 'Post-workout meal and personal recovery'
        });
        postClock += 35;
      }
    }

    // Additional goals
    const topGoals = rankedGoals.filter((g) => g.id !== anchor.goalId && g.id !== 'gym');
    for (let g of topGoals) {
      if (!preBlocks.some((pb) => pb.goalId === g.id) && postClock + 40 <= hardCeiling - freeTimeMinutes) {
        postBlocks.push({
          type: 'goal',
          goalId: g.id,
          title: g.name,
          icon: g.icon,
          durationMinutes: 45,
          tracked: true,
          note: `Evening focus block on ${g.name}`
        });
        postClock += 45;
        break;
      }
    }

    const remainingForFree = Math.max(30, hardCeiling - postClock);
    postBlocks.push({
      type: 'freetime',
      goalId: null,
      title: 'Free Time & Unwind',
      icon: '🎮',
      durationMinutes: Math.min(freeTimeMinutes || 60, remainingForFree),
      tracked: false,
      note: 'Guaranteed evening downtime before sleep'
    });

    finalizedBlocks = [...preBlocks, anchorBlock, ...postBlocks];

    let timeIndex = startMin;
    finalizedBlocks = finalizedBlocks.map((b, idx) => {
      if (b.isFixedTime) {
        timeIndex = b.endMinutes;
        return {
          id: `block-${Date.now()}-${idx}`,
          ...b,
          completed: false,
          remainingMinutes: b.durationMinutes
        };
      }
      const bStart = timeIndex;
      const bEnd = bStart + b.durationMinutes;
      timeIndex = bEnd;
      return {
        id: `block-${Date.now()}-${idx}`,
        ...b,
        startMinutes: bStart,
        endMinutes: bEnd,
        startTime: minutesToTimeString(bStart),
        endTime: minutesToTimeString(bEnd),
        completed: false,
        remainingMinutes: b.durationMinutes
      };
    });

  } else {
    // --- CASE 2: TIME-FREE SEMANTIC AI SCHEDULING ---
    // (e.g. "I have an AP Physics test tomorrow and need to write my ISEF proposal")
    const blocksToSchedule = [];

    // 1. Place AI Tailored Priority Tasks at the front when mental energy is highest
    if (aiAnalysis.customAiBlocks && aiAnalysis.customAiBlocks.length > 0) {
      for (let aiBlock of aiAnalysis.customAiBlocks) {
        let dur = Math.round(aiBlock.durationMinutes * energyMultiplier);
        dur = Math.max(30, Math.min(dur, 80));

        blocksToSchedule.push({
          type: 'goal',
          goalId: aiBlock.goalId,
          title: aiBlock.title,
          icon: aiBlock.icon,
          durationMinutes: dur,
          tracked: true,
          isAiPriority: true,
          note: aiBlock.note
        });

        // Insert break after high intensity AI tasks
        blocksToSchedule.push({
          type: 'break',
          goalId: null,
          title: 'Mental Recovery Break',
          icon: '☕',
          durationMinutes: defaultBreakDuration,
          tracked: false,
          note: 'Transition and mental recharge'
        });
      }
    }

    // 2. Schoolwork (if not already fully covered by AI custom tasks)
    const hasPhysicsOrCalcCustom = aiAnalysis.customAiBlocks?.some(b => 
      b.title.includes('Physics') || b.title.includes('Calculus') || b.title.includes('Classwork')
    );

    if (schoolworkMinutes > 0 && !hasPhysicsOrCalcCustom) {
      blocksToSchedule.push({
        type: 'schoolwork',
        title: 'AP Classwork & Study',
        icon: '📚',
        durationMinutes: Math.round(schoolworkMinutes * energyMultiplier),
        tracked: true,
        note: 'Protected academic study block'
      });

      blocksToSchedule.push({
        type: 'break',
        title: 'Reset & Transition',
        icon: '✨',
        durationMinutes: defaultBreakDuration,
        tracked: false,
        note: 'Decompress and prepare for next project'
      });
    }

    // 3. Life Goals (ISEF, ACT, Business, etc.)
    const usedGoalIds = blocksToSchedule.map(b => b.goalId).filter(Boolean);
    const availableGoals = rankedGoals.filter(g => g.id !== 'gym' && !usedGoalIds.includes(g.id));
    const selectedGoals = availableGoals.slice(0, 2);

    for (let goal of selectedGoals) {
      let duration = Math.round((goal.sessionMinutes || 45) * energyMultiplier);
      duration = Math.max(25, Math.min(duration, 60));

      blocksToSchedule.push({
        type: 'goal',
        goalId: goal.id,
        title: goal.name,
        icon: goal.icon || '🎯',
        durationMinutes: duration,
        tracked: true,
        note: goal.urgencyReason || (goal.deficit > 0 ? `Weekly target priority (${goal.completed}/${goal.weeklyTarget} ${goal.unit})` : 'Consistent progress')
      });
    }

    // 4. Gym in 5-9pm window
    if (gymToday) {
      const gymBlock = {
        type: 'gym',
        goalId: 'gym',
        title: 'Gym & Strength Session',
        icon: '🏋️',
        durationMinutes: 60,
        tracked: true,
        note: 'Protected physical training in preferred 5–9 PM window'
      };
      // Place near the middle of afternoon
      const insertIdx = Math.min(2, blocksToSchedule.length);
      blocksToSchedule.splice(insertIdx, 0, gymBlock);
    }

    // 5. Dinner (if afternoon spans >= 3.5h)
    if (totalAvailableMinutes >= 210) {
      const dinnerBlock = {
        type: 'dinner',
        title: 'Dinner & Food Recharge',
        icon: '🍲',
        durationMinutes: 35,
        tracked: false,
        note: 'Protected mealtime and personal recharge'
      };
      const dinnerInsertIdx = Math.floor(blocksToSchedule.length * 0.65);
      blocksToSchedule.splice(Math.max(1, dinnerInsertIdx), 0, dinnerBlock);
    }

    // 6. Free Time (Protected at the end)
    if (freeTimeMinutes > 0) {
      blocksToSchedule.push({
        type: 'freetime',
        title: 'Free Time & Unwind',
        icon: '🎮',
        durationMinutes: freeTimeMinutes,
        tracked: false,
        note: 'Guaranteed evening downtime before sleep'
      });
    }

    // Scale to fit available time window
    let rawTotal = blocksToSchedule.reduce((acc, b) => acc + b.durationMinutes, 0);
    if (rawTotal > totalAvailableMinutes && totalAvailableMinutes > 60) {
      const factor = totalAvailableMinutes / rawTotal;
      blocksToSchedule.forEach((b) => {
        if (b.type === 'freetime') {
          b.durationMinutes = Math.max(20, Math.round(b.durationMinutes * factor * 0.85));
        } else if (b.type === 'break') {
          b.durationMinutes = Math.max(5, Math.round(b.durationMinutes * factor));
        } else {
          b.durationMinutes = Math.max(20, Math.round(b.durationMinutes * factor));
        }
      });
    }

    // Assign sequential clock times
    let clock = startMin;
    finalizedBlocks = blocksToSchedule.map((b, index) => {
      const bStart = clock;
      const bEnd = clock + b.durationMinutes;
      clock = bEnd;

      return {
        id: `block-${Date.now()}-${index}`,
        ...b,
        startMinutes: bStart,
        endMinutes: bEnd,
        startTime: minutesToTimeString(bStart),
        endTime: minutesToTimeString(bEnd),
        completed: false,
        remainingMinutes: b.durationMinutes
      };
    });
  }

  const totalFocusedMinutes = finalizedBlocks
    .filter((b) => b.tracked)
    .reduce((acc, b) => acc + b.durationMinutes, 0);

  const finalEndTime = finalizedBlocks.length > 0
    ? finalizedBlocks[finalizedBlocks.length - 1].endTime
    : endTime;

  return {
    blocks: finalizedBlocks,
    totalFocusedMinutes,
    totalFocusedFormatted: formatDuration(totalFocusedMinutes),
    blockCount: finalizedBlocks.length,
    scheduledStartTime: startTime,
    scheduledEndTime: finalEndTime,
    hardEndTime: endTime,
    bedtime: bedtime,
    energy,
    contextSummary: aiAnalysis.summary,
    hasUrgent: aiAnalysis.hasAiAnalysis,
    aiNotes: aiAnalysis.aiNotes,
    rankedGoals
  };
}

export function recalculateScheduleTimes(blocks, startMinutes) {
  let clock = startMinutes;
  return blocks.map((b) => {
    if (b.isFixedTime) {
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
