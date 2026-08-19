/**
 * Local Storage persistence manager for Junior OS / Orbit
 */

export const DEFAULT_GOALS = [
  {
    id: 'isef',
    name: 'ISEF / Research',
    icon: '🔬',
    priority: 5,
    weeklyTarget: 4,
    unit: 'hours',
    sessionMinutes: 60,
    completed: 0,
    description: 'Long-term research project & ISEF preparation',
    color: '#38bdf8'
  },
  {
    id: 'act',
    name: 'ACT',
    icon: '📝',
    priority: 5,
    weeklyTarget: 2,
    unit: 'hours',
    sessionMinutes: 30,
    completed: 0,
    description: 'Standardized test prep & practice problems',
    color: '#60a5fa'
  },
  {
    id: 'dropshipping',
    name: 'Dropshipping',
    icon: '📦',
    priority: 3,
    weeklyTarget: 3,
    unit: 'hours',
    sessionMinutes: 60,
    completed: 0,
    description: 'E-commerce business building & product research',
    color: '#818cf8'
  },
  {
    id: 'gym',
    name: 'Gym',
    icon: '🏋️',
    priority: 3,
    weeklyTarget: 4,
    unit: 'sessions',
    sessionMinutes: 60,
    completed: 0,
    description: 'Strength training & fitness (5–9 PM window)',
    color: '#38bdf8'
  },
  {
    id: 'scioly_yac',
    name: 'Science Olympiad / YAC',
    icon: '🌌',
    priority: 2,
    weeklyTarget: 2,
    unit: 'hours',
    sessionMinutes: 45,
    completed: 0,
    description: 'Astronomy events & Youth Advisory Council work',
    color: '#34d399'
  }
];

export const DEFAULT_ACTIVITY = [];

export function getStoredGoals() {
  try {
    const raw = localStorage.getItem('orbitGoals');
    if (!raw) {
      localStorage.setItem('orbitGoals', JSON.stringify(DEFAULT_GOALS));
      return DEFAULT_GOALS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure all goals exist with clean numeric progress
      return parsed.map(g => ({
        ...g,
        completed: typeof g.completed === 'number' ? g.completed : 0
      }));
    }
    return DEFAULT_GOALS;
  } catch (err) {
    console.error('Error loading stored goals:', err);
    return DEFAULT_GOALS;
  }
}

export function saveStoredGoals(goals) {
  try {
    localStorage.setItem('orbitGoals', JSON.stringify(goals));
  } catch (err) {
    console.error('Error saving goals:', err);
  }
}

export function getStoredActivity() {
  try {
    const raw = localStorage.getItem('orbitActivity');
    if (!raw) {
      localStorage.setItem('orbitActivity', JSON.stringify(DEFAULT_ACTIVITY));
      return DEFAULT_ACTIVITY;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_ACTIVITY;
  } catch (err) {
    console.error('Error loading stored activity:', err);
    return DEFAULT_ACTIVITY;
  }
}

export function saveStoredActivity(activity) {
  try {
    localStorage.setItem('orbitActivity', JSON.stringify(activity));
  } catch (err) {
    console.error('Error saving activity:', err);
  }
}

export function getStoredPlan() {
  try {
    const raw = localStorage.getItem('orbitPlanState');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading plan state:', err);
    return null;
  }
}

export function saveStoredPlan(planState) {
  try {
    if (planState) {
      localStorage.setItem('orbitPlanState', JSON.stringify(planState));
    } else {
      localStorage.removeItem('orbitPlanState');
    }
  } catch (err) {
    console.error('Error saving plan state:', err);
  }
}

export function getGeminiApiKey() {
  return localStorage.getItem('orbitGeminiApiKey') || '';
}

export function saveGeminiApiKey(key) {
  if (key) {
    localStorage.setItem('orbitGeminiApiKey', key.trim());
  } else {
    localStorage.removeItem('orbitGeminiApiKey');
  }
}
