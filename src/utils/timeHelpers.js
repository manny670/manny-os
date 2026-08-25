/**
 * Time and Date helper utilities for Junior OS / Orbit
 */

export function roundToCleanIncrement(minutes, increment = 5) {
  if (typeof minutes !== 'number' || isNaN(minutes)) return 0;
  return Math.round(minutes / increment) * increment;
}

export function snapDurationToClean(minutes) {
  if (typeof minutes !== 'number' || isNaN(minutes) || minutes <= 0) return 15;
  if (minutes <= 12) return 10;
  if (minutes <= 17) return 15;
  if (minutes <= 22) return 20;
  if (minutes <= 27) return 25;
  if (minutes <= 35) return 30;
  if (minutes <= 42) return 40;
  if (minutes <= 50) return 45;
  if (minutes <= 55) return 50;
  if (minutes <= 67) return 60;
  if (minutes <= 82) return 75;
  if (minutes <= 97) return 90;
  return roundToCleanIncrement(minutes, 5);
}

export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 780; // default 1:00 PM
  if (typeof timeStr === 'number') return isNaN(timeStr) ? 780 : roundToCleanIncrement(timeStr, 5);
  
  const clean = String(timeStr).trim().toUpperCase();
  if (!clean) return 780;

  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');
  
  const numbersOnly = clean.replace(/[APM\s]/g, '');
  const parts = numbersOnly.split(':');
  if (parts.length === 0 || !parts[0] || isNaN(parseInt(parts[0], 10))) return 780;
  
  let hours = parseInt(parts[0], 10) || 0;
  const minutes = parts.length > 1 ? parseInt(parts[1], 10) || 0 : 0;
  
  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  } else if (!isPM && !isAM) {
    // Default afternoon school heuristics: if 1-11, assume PM
    if (hours >= 1 && hours <= 11) {
      hours += 12;
    }
  }
  
  const total = hours * 60 + minutes;
  return roundToCleanIncrement(total, 5);
}

export function minutesToTimeString(totalMinutes) {
  if (typeof totalMinutes !== 'number' || isNaN(totalMinutes)) {
    return '1:00 PM';
  }
  
  // Normalize to 24h cycle and round to nearest 5 minutes for clean display
  let rounded = roundToCleanIncrement(totalMinutes, 5);
  let normalized = rounded % 1440;
  if (normalized < 0) normalized += 1440;
  
  let hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  
  let displayHours = hours % 12;
  if (displayHours === 0) displayHours = 12;
  
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${period}`;
}

export function formatDuration(minutes) {
  if (typeof minutes !== 'number' || isNaN(minutes) || minutes <= 0) return '0m';
  const rounded = roundToCleanIncrement(minutes, 5);
  const hrs = Math.floor(rounded / 60);
  const mins = rounded % 60;
  
  if (hrs > 0 && mins > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (hrs > 0) {
    return `${hrs}h`;
  }
  return `${mins}m`;
}

export function getCurrentTimeMinutes() {
  const now = new Date();
  const raw = now.getHours() * 60 + now.getMinutes();
  return roundToCleanIncrement(raw, 5);
}

export function getCurrentTimeString() {
  return minutesToTimeString(getCurrentTimeMinutes());
}

export function getGreeting(userName = 'Emmanuel') {
  const hour = new Date().getHours();
  if (hour < 12) {
    return `Good morning, ${userName}`;
  } else if (hour < 17) {
    return `Good afternoon, ${userName}`;
  } else {
    return `Good evening, ${userName}`;
  }
}

export function getFormattedCurrentDate() {
  const now = new Date();
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const months = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];
  
  const dayName = days[now.getDay()];
  const monthName = months[now.getMonth()];
  const dateNum = now.getDate();
  const year = now.getFullYear();
  
  return `${dayName} · ${monthName} ${dateNum}, ${year}`;
}

export function formatHistoryDate(dateInput) {
  if (!dateInput) return 'Today';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Recently';
  
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return `Today at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' + date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
