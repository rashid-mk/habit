export const HABIT_SUGGESTIONS = [
  // Health & Fitness
  'Exercise for 30 minutes',
  'Morning workout',
  'Evening walk',
  'Yoga practice',
  'Stretching routine',
  'Run 5km',
  'Gym session',
  'Drink 8 glasses of water',
  'Take vitamins',
  'Track calories',
  
  // Productivity
  'Read for 30 minutes',
  'Write in journal',
  'Meditate for 10 minutes',
  'Plan tomorrow',
  'Review daily goals',
  'Learn something new',
  'Practice coding',
  'Study for 1 hour',
  'Work on side project',
  'Organize workspace',
  
  // Self-care
  'Get 8 hours of sleep',
  'Skincare routine',
  'Take a break',
  'Practice gratitude',
  'Call a friend',
  'Spend time outdoors',
  'Listen to music',
  'Take a cold shower',
  'Practice deep breathing',
  'Digital detox hour',
  
  // Nutrition
  'Eat healthy breakfast',
  'Prepare meals',
  'Eat vegetables',
  'Avoid sugar',
  'No caffeine after 2pm',
  'Intermittent fasting',
  'Cook at home',
  'Eat fruits',
  
  // Learning
  'Practice language',
  'Watch educational video',
  'Listen to podcast',
  'Read news',
  'Take online course',
  'Practice instrument',
  'Draw or sketch',
  'Write blog post',
  
  // Habits
  'Make bed',
  'Clean room',
  'Do laundry',
  'Wash dishes',
  'Water plants',
  'Review finances',
  'Save money',
  'Track expenses',
  'No social media',
  'Limit screen time',
  
  // Bad Habits to Break
  'Stop smoking',
  'Quit vaping',
  'Stop nail biting',
  'Quit procrastinating',
  'Stop snacking late',
  'Quit drinking soda',
  'Stop checking phone',
  'Quit oversleeping',
  'Stop negative self-talk',
  'Quit impulse buying',
  'Stop skipping meals',
  'Quit energy drinks',
  'Stop staying up late',
  'Quit fast food',
  'Stop interrupting others',
  'Quit complaining',
  'Stop comparing myself',
  'Quit multitasking',
  'Stop eating junk food',
  'Quit binge watching',
  'Stop drinking alcohol',
  'Quit caffeine',
  'Stop gossiping',
  'Quit making excuses',
  'Stop being late',
]

// Bad habit keywords to detect habit type
const BAD_HABIT_KEYWORDS = ['stop', 'quit', 'avoid', 'no ', 'limit']

export function getHabitSuggestions(input: string): string[] {
  if (!input || input.length < 2) return []
  
  const searchTerm = input.toLowerCase().trim()
  
  return HABIT_SUGGESTIONS
    .filter(habit => habit.toLowerCase().includes(searchTerm))
    .slice(0, 5) // Limit to 5 suggestions
}

export function isBreakHabit(habitName: string): boolean {
  const lowerName = habitName.toLowerCase()
  return BAD_HABIT_KEYWORDS.some(keyword => lowerName.startsWith(keyword))
}
