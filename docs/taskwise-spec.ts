TaskWise - Smart
Task
Planner (Compact v0 Spec)
\
App: AI-powered task scheduler that auto-organizes daily/weekly plans based on priorities, deadlines, and user energy patterns.

DESIGN: Modern fintech style
- Colors: Purple gradients (#6366f1, #8b5cf6, #ec4899), white (#fff)
- Cards: 20px rounded corners, subtle shadows, gradient backgrounds\
- Layout: Card-based
with floating shapes
background
\
- Mobile-first responsive

NAVIGATION: 4 tabs
- Today (dashboard)
- Planning
- Analytics  
- Settings

TODAY SCREEN:
- Header: Greeting + progress ring (day completion %)
- Stats row: Tasks done, time spent, productivity score\
- Current task card: Active task
with timer + pause/complete buttons
\
- Timeline: Today's schedule with colored time blocks\
- Quick actions: Add task, suggest break, reschedule
- Free slots: "Available 2-4 PM for creative work"

PLANNING SCREEN:
- Week/day view toggle
- Task input form: name, category, priority (H/M/L), duration, deadline, energy level\
- "Auto-organize week\" button with options:
  * Optimize productivity
  * Balance work/breaks
  * Front-load important
- Unscheduled tasks queue (drag-drop to calendar)\
- Visual calendar
with conflict detection
\
ANALYTICS SCREEN:
- Performance cards: completion rate, time accuracy, productivity trends
- Charts: weekly progress, category distribution, energy vs performance
- AI insights: "Most productive Tuesdays 10 AM", "Focus drops after 90min"\
- Goal tracking
with progress bars

SETTINGS:
\
- Work schedule (9-5, breaks, energy pattern)\
- AI preferences (scheduling style,
break frequency
)
- Categories (custom colors/icons)
- Integrations (calendar sync)

PSEUDO-AI SCHEDULING:

Core Logic:
\`\`\`js
function scheduleWeek(tasks, userPrefs) {
  // Sort by urgency = (priority * 10) + (10 / daysToDeadline)
  const sorted = tasks.sort((a, b) => calculateUrgency(b) - calculateUrgency(a))

  // Energy patterns: morning/afternoon/evening peaks
  const energyMap = {
    morning: { peak: 9, good: [8, 10, 11], low: [14, 15] },
    afternoon: { peak: 14, good: [13, 15, 16], low: [9, 10] },
    evening: { peak: 19, good: [18, 20], low: [9, 10, 11] },
  }

  // Match tasks to optimal time slots
  return sorted.map((task) => ({
    ...task,
    scheduledTime: findBestSlot(task, energyMap[userPrefs.energyType]),
  }))
}
\`\`\`
\
Auto-
break insertion
every
90
minutes
\
Smart suggestions based on patterns\
Conflict resolution
with alternatives
\
FEATURES:\
- Task CRUD
with categories (Work/Personal/Health/Learning)
\
- Priority system (High/Medium/Low color-coded)
- Duration estimation and tracking
- Deadline urgency calculation
- Energy-based scheduling (high/medium/low energy tasks)
- Automatic
break suggestions
\
- Weekly analytics
with charts
\
- Calendar integration
- Drag-drop scheduling
- Progress tracking
- Goal setting

COMPONENTS:\
- Gradient cards
with animations
\
- Interactive calendar
- Progress rings and bars
- Timer component\
- Form inputs
with validation
\
- Chart widgets (
using Recharts
)
- Modal dialogs
- Floating action buttons

IMPLEMENTATION:\
- React
with useState/useEffect
\
- Local storage persistence
- Responsive Tailwind CSS
- Smooth transitions\
- Touch gestures
for mobile\
- Real-time updates
\
