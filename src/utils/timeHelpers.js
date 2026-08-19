/**
 * Time and Date helper utilities for Junior OS / Orbit
 */

export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  // Handle formats like "4:30 PM", "16:30", "4:30pm"
  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');
  
  const numbersOnly = clean.replace(/[APM\s]/g, '');
  const parts = numbersOnly.split(':');
  if (parts.length === 0) return 0;
  
  let hours = parseInt(parts[0], 10) || 0;
  const minutes = parts.length > 1 ? parseInt(parts[1], 10) || 0 : 0;
  
  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }
  
  return hours * 60 + minutes;
}

export function minutesToTimeString(totalMinutes) {
  // Normalize to 24h cycle
  let normalized = Math.round(totalMinutes) % 1440;
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
  if (!minutes || minutes <= 0) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
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
  return now.getHours() * 60 + now.getMinutes();
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
