/**
 * Gemini AI Contextual Reasoning Engine for Orbit
 * Handles BOTH time-specific commitments (e.g. "meeting with YAC at 4pm")
 * AND time-free natural language requests (e.g. "AP Physics test tomorrow", "Need to write my ISEF proposal", "YAC secretary speech")
 */

import { parseTimeToMinutes, minutesToTimeString, formatDuration } from './timeHelpers';
import { getGeminiApiKey } from './storage';

/**
 * Deep semantic understanding for any natural language input (with or without a time)
 */
export async function parseContextWithAI(promptText, startTimeStr = '1:00 PM', endTimeStr = '9:30 PM', energy = 'normal') {
  if (!promptText || !promptText.trim()) {
    return {
      hasAiAnalysis: false,
      anchoredEvents: [],
      customAiBlocks: [],
      detectedSubjects: [],
      summary: 'Balanced afternoon workflow',
      aiNotes: ''
    };
  }

  const raw = promptText.trim();

  // 1. Try Gemini API if key is available
  const apiKey = getGeminiApiKey();
  if (apiKey) {
    try {
      const geminiResult = await callGeminiAPI(raw, apiKey, startTimeStr, endTimeStr, energy);
      if (geminiResult && (geminiResult.customAiBlocks?.length > 0 || geminiResult.anchoredEvents?.length > 0)) {
        return geminiResult;
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to built-in semantic AI:', err);
    }
  }

  // 2. High-precision Built-in Semantic AI Engine
  return analyzeContextSemanticAI(raw, startTimeStr, endTimeStr, energy);
}

/**
 * Built-in Deep Semantic AI Engine (processes any prompt with or without a time)
 */
export function analyzeContextSemanticAI(text, startTimeStr = '1:00 PM', endTimeStr = '9:30 PM', energy = 'normal') {
  const lower = text.toLowerCase();
  const anchoredEvents = [];
  const customAiBlocks = [];
  const detectedSubjects = [];

  // --- 1. Check for Explicit Time Anchors (e.g. "at 4pm", "@ 5:30", "at 4") ---
  const timeRegex = /(?:at|@|around|for)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/gi;
  let match;

  while ((match = timeRegex.exec(lower)) !== null) {
    let hours = parseInt(match[1], 10);
    const mins = match[2] ? parseInt(match[2], 10) : 0;
    const meridian = match[3] ? match[3].toLowerCase() : null;

    if (meridian === 'pm' && hours < 12) {
      hours += 12;
    } else if (meridian === 'am' && hours === 12) {
      hours = 0;
    } else if (!meridian) {
      if (hours >= 1 && hours <= 11) hours += 12;
    }

    const startMinutes = hours * 60 + mins;
    const timeDisplay = minutesToTimeString(startMinutes);

    let eventTitle = 'Scheduled Event';
    let icon = '📌';
    let duration = 45;
    let goalId = null;

    if (lower.includes('yac') || lower.includes('youth advisory') || lower.includes('council')) {
      eventTitle = 'Youth Advisory Council (YAC) Meeting';
      icon = '🌌';
      goalId = 'scioly_yac';
      duration = 45;
    } else if (lower.includes('science olympiad') || lower.includes('scioly') || lower.includes('astronomy')) {
      eventTitle = 'Science Olympiad Meeting';
      icon = '🌌';
      goalId = 'scioly_yac';
      duration = 45;
    } else if (lower.includes('physics')) {
      eventTitle = 'AP Physics Review';
      icon = '⚡';
      duration = 60;
    } else if (lower.includes('calc')) {
      eventTitle = 'AP Calculus Study';
      icon = '📐';
      duration = 60;
    } else if (lower.includes('isef') || lower.includes('research')) {
      eventTitle = 'ISEF Research Session';
      icon = '🔬';
      goalId = 'isef';
      duration = 60;
    } else if (lower.includes('act')) {
      eventTitle = 'ACT Prep Practice';
      icon = '📝';
      goalId = 'act';
      duration = 45;
    } else {
      eventTitle = 'Scheduled Commitment';
      icon = '📅';
      duration = 45;
    }

    anchoredEvents.push({
      id: `anchor-${Date.now()}-${anchoredEvents.length}`,
      title: eventTitle,
      icon,
      goalId,
      startMinutes,
      startTime: timeDisplay,
      durationMinutes: duration,
      endMinutes: startMinutes + duration,
      endTime: minutesToTimeString(startMinutes + duration),
      isFixedTime: true,
      tracked: true,
      note: `AI Time-Anchor: Specifically placed at ${timeDisplay} as requested.`
    });
  }

  // --- 2. TIME-FREE Semantic Intent Parsing (When NO specific time was typed) ---
  // Detect what the user wants to accomplish:
  const isTestTomorrow = lower.includes('test') || lower.includes('exam') || lower.includes('quiz') || lower.includes('tomorrow');
  const isDueTomorrow = lower.includes('due') || lower.includes('deadline') || lower.includes('submit');
  const isSpeechOrPrep = lower.includes('speech') || lower.includes('presentation') || lower.includes('election') || lower.includes('interview');
  const isDraftOrWriting = lower.includes('draft') || lower.includes('proposal') || lower.includes('essay') || lower.includes('report') || lower.includes('abstract') || lower.includes('paper');

  // Academic subjects:
  if (lower.includes('physics') || lower.includes('ap physics')) {
    detectedSubjects.push('AP Physics');
    customAiBlocks.push({
      title: isTestTomorrow ? 'AP Physics Test Preparation & Practice' : 'AP Physics Problem Sets & Review',
      icon: '⚡',
      durationMinutes: isTestTomorrow ? 70 : 55,
      goalId: null,
      tracked: true,
      isAiPriority: true,
      note: isTestTomorrow 
        ? 'Orbit AI: High-stakes test prep placed in prime focus slot' 
        : 'Orbit AI: Academic priority extracted from your notes'
    });
  }

  if (lower.includes('calc') || lower.includes('calculus') || lower.includes('math')) {
    detectedSubjects.push('AP Calculus');
    customAiBlocks.push({
      title: isTestTomorrow ? 'AP Calculus Exam Review & Practice' : 'Calculus Homework & Problem Sets',
      icon: '📐',
      durationMinutes: 60,
      goalId: null,
      tracked: true,
      isAiPriority: true,
      note: 'Orbit AI: Math focus block scheduled'
    });
  }

  if (lower.includes('cs') || lower.includes('computer science') || lower.includes('csa') || lower.includes('coding') || lower.includes('java')) {
    detectedSubjects.push('AP Computer Science A');
    customAiBlocks.push({
      title: 'AP Computer Science A Coding & Labs',
      icon: '💻',
      durationMinutes: 55,
      goalId: null,
      tracked: true,
      isAiPriority: true,
      note: 'Orbit AI: Programming and algorithm focus'
    });
  }

  if (lower.includes('stat') || lower.includes('statistics')) {
    detectedSubjects.push('AP Statistics');
    customAiBlocks.push({
      title: 'AP Statistics Review & Practice',
      icon: '📊',
      durationMinutes: 50,
      goalId: null,
      tracked: true,
      isAiPriority: true,
      note: 'Orbit AI: Statistics data analysis session'
    });
  }

  if (lower.includes('chem') || lower.includes('chemistry') || lower.includes('lab')) {
    detectedSubjects.push('Chemistry');
    customAiBlocks.push({
      title: isDraftOrWriting ? 'Chemistry Lab Report & Analysis' : 'AP Chemistry Study Session',
      icon: '🧪',
      durationMinutes: 55,
      goalId: null,
      tracked: true,
      isAiPriority: true,
      note: 'Orbit AI: Lab report & chemical concepts'
    });
  }

  // Research / ISEF:
  if (lower.includes('isef') || lower.includes('research') || lower.includes('abstract') || lower.includes('proposal') || lower.includes('advisor') || lower.includes('experiment')) {
    detectedSubjects.push('ISEF Research');
    let title = 'ISEF / Research Project Work';
    if (isDraftOrWriting) title = 'ISEF Proposal Draft & Research Writing';
    else if (lower.includes('experiment')) title = 'ISEF Experimental Data & Analysis';
    else if (lower.includes('literature') || lower.includes('paper')) title = 'ISEF Literature Review & Methodology';

    customAiBlocks.push({
      title,
      icon: '🔬',
      durationMinutes: 60,
      goalId: 'isef',
      tracked: true,
      isAiPriority: true,
      note: 'Orbit AI: Protected deep research block'
    });
  }

  // Extracurriculars / YAC / SciOly / Leadership:
  if (lower.includes('yac') || lower.includes('youth advisory') || lower.includes('council')) {
    let title = 'Youth Advisory Council (YAC) Work';
    if (isSpeechOrPrep) title = 'YAC Secretary Campaign Speech Prep';
    else if (lower.includes('email') || lower.includes('agenda')) title = 'YAC Correspondence & Council Planning';

    customAiBlocks.push({
      title,
      icon: '🌌',
      durationMinutes: 45,
      goalId: 'scioly_yac',
      tracked: true,
      isAiPriority: true,
      note: 'Orbit AI: Extracurricular leadership commitment'
    });
  }

  if (lower.includes('science olympiad') || lower.includes('scioly') || lower.includes('astronomy')) {
    let title = 'Science Olympiad Event Preparation';
    if (lower.includes('astronomy') || lower.includes('binder')) title = 'Science Olympiad Astronomy Binder Review';

    customAiBlocks.push({
      title,
      icon: '🌌',
      durationMinutes: 45,
      goalId: 'scioly_yac',
      tracked: true,
      isAiPriority: true,
      note: 'Orbit AI: Competition preparation block'
    });
  }

  // Standardized Tests (ACT):
  if (lower.includes('act') || lower.includes('sat') || lower.includes('test prep')) {
    let title = 'ACT Timed Practice & Problem Review';
    if (lower.includes('math')) title = 'ACT Math Section Practice & Formulas';
    else if (lower.includes('science')) title = 'ACT Science Section Timed Drills';
    else if (lower.includes('english') || lower.includes('reading')) title = 'ACT Reading & English Drills';

    customAiBlocks.push({
      title,
      icon: '📝',
      durationMinutes: 45,
      goalId: 'act',
      tracked: true,
      isAiPriority: true,
      note: 'Orbit AI: Standardized test accuracy training'
    });
  }

  // Business / Dropshipping / Shopify:
  if (lower.includes('drop') || lower.includes('shop') || lower.includes('product') || lower.includes('business') || lower.includes('store')) {
    let title = 'Dropshipping Business & Product Research';
    if (lower.includes('product') || lower.includes('find')) title = 'Winning Product Research & Validation';
    else if (lower.includes('website') || lower.includes('store') || lower.includes('shopify')) title = 'Shopify Store Design & Brand Setup';

    customAiBlocks.push({
      title,
      icon: '📦',
      durationMinutes: 60,
      goalId: 'dropshipping',
      tracked: true,
      isAiPriority: true,
      note: 'Orbit AI: E-commerce venture building block'
    });
  }

  // General / Other Custom Requests (e.g. "clean room", "MIT application essay", "apply for summer program")
  if (customAiBlocks.length === 0 && text.trim().length > 3) {
    let customTitle = text.trim();
    // Capitalize first letter
    customTitle = customTitle.charAt(0).toUpperCase() + customTitle.slice(1);
    // Truncate if very long
    if (customTitle.length > 38) customTitle = customTitle.substring(0, 35) + '...';

    customAiBlocks.push({
      title: customTitle,
      icon: '✨',
      durationMinutes: 45,
      goalId: null,
      tracked: true,
      isAiPriority: true,
      note: `Orbit AI: Dedicated custom block generated from "${text.trim()}"`
    });
  }

  // Construct intelligent 1-2 sentence AI summary explanation
  let summary = '';
  if (anchoredEvents.length > 0) {
    const ev = anchoredEvents[0];
    summary = `Orbit AI placed "${ev.title}" strictly at ${ev.startTime} and organized your afternoon around it.`;
  } else if (customAiBlocks.length > 0) {
    const primary = customAiBlocks[0].title;
    if (isTestTomorrow) {
      summary = `Orbit AI detected an upcoming exam: allocated prime cognitive focus to "${primary}" with structured recovery.`;
    } else if (isDueTomorrow || isDraftOrWriting) {
      summary = `Orbit AI prioritized deliverable "${primary}" and balanced your remaining goals around it.`;
    } else {
      summary = `Orbit AI understood your note: scheduled "${primary}" with tailored focus duration.`;
    }
  } else {
    summary = `Orbit AI analyzed: "${text}"`;
  }

  return {
    hasAiAnalysis: true,
    anchoredEvents,
    customAiBlocks,
    detectedSubjects,
    summary,
    aiNotes: `AI intent extracted from "${text}".`
  };
}

/**
 * Direct Gemini 1.5/2.0 API caller
 */
async function callGeminiAPI(userPrompt, apiKey, startTimeStr, endTimeStr, energy) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const systemInstruction = `You are Orbit, an intelligent personal OS assistant for Emmanuel Lopez (a high school junior).
Analyze what the user wrote in their notes: "${userPrompt}".
Afternoon span: ${startTimeStr} to ${endTimeStr}. Energy: ${energy}.

The user might NOT provide a time (e.g. "I have an AP Physics test tomorrow", "Need to finish ISEF proposal", "YAC secretary speech").
Or they might provide a time (e.g. "YAC meeting at 4pm").

Extract or generate:
1. "summary": A crisp 1-sentence decision rationale explaining how Orbit built today's schedule for them.
2. "anchoredEvents": Array of events with exact clock times (if a time was given like 'at 4pm').
3. "customAiBlocks": Array of tailored tasks extracted from their text (even if NO time was given). Each task should have:
   - "title": e.g. "AP Physics Test Preparation & Practice Problems"
   - "icon": single emoji (⚡, 🔬, 📝, 🌌, 💻, 📦, etc.)
   - "durationMinutes": realistic duration (30 to 75)
   - "note": why Orbit prioritized this
4. "detectedSubjects": array of string subject names.

Return ONLY raw valid JSON:
{
  "summary": "...",
  "anchoredEvents": [],
  "customAiBlocks": [
    {
      "title": "...",
      "icon": "...",
      "durationMinutes": 60,
      "note": "..."
    }
  ],
  "detectedSubjects": ["AP Physics"]
}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: systemInstruction }] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API returned ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return null;

  const parsed = JSON.parse(rawText);

  let formattedAnchors = [];
  if (parsed.anchoredEvents && Array.isArray(parsed.anchoredEvents)) {
    formattedAnchors = parsed.anchoredEvents.map((ev, idx) => {
      const startMin = parseTimeToMinutes(ev.startTime);
      const dur = ev.durationMinutes || 45;
      return {
        id: `gemini-anchor-${Date.now()}-${idx}`,
        title: ev.title,
        icon: ev.icon || '📌',
        goalId: ev.title.toLowerCase().includes('yac') ? 'scioly_yac' : null,
        startMinutes: startMin,
        startTime: ev.startTime,
        durationMinutes: dur,
        endMinutes: startMin + dur,
        endTime: minutesToTimeString(startMin + dur),
        isFixedTime: true,
        tracked: true,
        note: ev.note || `AI Time-Anchor placed at ${ev.startTime}`
      };
    });
  }

  let formattedCustomBlocks = [];
  if (parsed.customAiBlocks && Array.isArray(parsed.customAiBlocks)) {
    formattedCustomBlocks = parsed.customAiBlocks.map((b) => ({
      title: b.title,
      icon: b.icon || '🎯',
      durationMinutes: b.durationMinutes || 50,
      goalId: null,
      tracked: true,
      isAiPriority: true,
      note: b.note || 'Orbit Gemini AI custom priority'
    }));
  }

  return {
    hasAiAnalysis: true,
    anchoredEvents: formattedAnchors,
    customAiBlocks: formattedCustomBlocks,
    detectedSubjects: parsed.detectedSubjects || [],
    summary: parsed.summary || 'Orbit Gemini AI planned your schedule.',
    aiNotes: 'Powered by Gemini AI'
  };
}
