"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TaskForm } from "@/components/task-form"
import { useTaskStore, type Task } from "@/lib/task-store"
import { useAnalyticsStore } from "@/lib/analytics-store"
import { usePlanningStore } from "@/lib/planning-store"
import { useSettingsStore } from "@/lib/settings-store"
import { ScheduleBuilder } from "@/lib/schedule-builder"
import { Play, Pause, CheckCircle2, Plus, Clock, Zap, Target, Lightbulb } from "lucide-react"

export function TodayScreen() {
  const { tasks, completeTask, uncompleteTask, getTodayTasks } = useTaskStore()
  const { performanceMetrics, updateAnalytics } = useAnalyticsStore()
  const { suggestions, updateSchedule } = usePlanningStore()
  const { workSchedule } = useSettingsStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [showTaskForm, setShowTaskForm] = useState(false)

  const todayTasks = getTodayTasks()
  const completedTasks = todayTasks.filter((task) => task.completed).length
  const totalTasks = todayTasks.length
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Calculate actual time spent today
  const totalTimeSpent = todayTasks.reduce((sum, task) => {
    return task.completed ? sum + task.duration : sum
  }, 0)
  const totalTimeSpentHours = Math.round(totalTimeSpent / 60 * 10) / 10

  // Update analytics and planning data when tasks change
  useEffect(() => {
    updateAnalytics(tasks)
    updateSchedule(tasks, workSchedule)
  }, [tasks, updateAnalytics, updateSchedule, workSchedule])

  // Get today's suggestions
  const todaySuggestions = suggestions.filter(s => 
    !s.dismissed && new Date(s.date).toDateString() === new Date().toDateString()
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      if (isTimerRunning) {
        setTimerSeconds((prev) => prev + 1)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [isTimerRunning])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-accent text-accent-foreground"
      case "Medium":
        return "bg-secondary text-secondary-foreground"
      case "Low":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Work":
        return "text-primary"
      case "Personal":
        return "text-accent"
      case "Health":
        return "text-green-500"
      case "Learning":
        return "text-secondary"
      default:
        return "text-muted-foreground"
    }
  }

  const handleTaskComplete = (task: Task) => {
    if (task.completed) {
      uncompleteTask(task.id)
    } else {
      completeTask(task.id)
      if (activeTask?.id === task.id) {
        setActiveTask(null)
        setIsTimerRunning(false)
        setTimerSeconds(0)
      }
    }
  }

  const handleStartTask = (task: Task) => {
    if (!task.completed && !activeTask) {
      setActiveTask(task)
      setTimerSeconds(0)
      setIsTimerRunning(true)
    }
  }

  return (
    <div className="p-2 sm:p-4 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Header with greeting and progress */}
      <div className="text-center space-y-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-foreground">
            Good {currentTime.getHours() < 12 ? "Morning" : currentTime.getHours() < 18 ? "Afternoon" : "Evening"}!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Progress ring */}
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto">
          <svg className="w-24 h-24 sm:w-32 sm:h-32 transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted/20"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${completionPercentage * 3.14} 314`}
              className="text-primary transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-primary">{completionPercentage}%</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">Complete</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-2 sm:p-4 text-center">
            <div className="flex items-center justify-center mb-1 sm:mb-2">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-1 sm:mr-2" />
              <span className="text-lg sm:text-2xl font-bold text-primary">{completedTasks}</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Tasks Done</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardContent className="p-2 sm:p-4 text-center">
            <div className="flex items-center justify-center mb-1 sm:mb-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-secondary mr-1 sm:mr-2" />
              <span className="text-lg sm:text-2xl font-bold text-secondary">{totalTimeSpentHours}h</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Time Spent</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-2 sm:p-4 text-center">
            <div className="flex items-center justify-center mb-1 sm:mb-2">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-accent mr-1 sm:mr-2" />
              <span className="text-lg sm:text-2xl font-bold text-accent">{performanceMetrics.completionRate}</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Completion Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Current task card */}
      {activeTask && (
        <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Current Task
              </span>
              <Badge className={getPriorityColor(activeTask.priority)}>{activeTask.priority}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div>
              <h3 className="font-semibold text-base sm:text-lg">{activeTask.title}</h3>
              <p className={`text-sm ${getCategoryColor(activeTask.category)}`}>{activeTask.category}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-primary">{formatTime(timerSeconds)}</div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  variant={isTimerRunning ? "secondary" : "default"}
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span className="ml-1 sm:ml-2">{isTimerRunning ? "Pause" : "Start"}</span>
                </Button>
                <Button onClick={() => handleTaskComplete(activeTask)} variant="outline" size="sm" className="flex-1 sm:flex-none">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="ml-1 sm:ml-2">Complete</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add task form */}
      {showTaskForm && <TaskForm onClose={() => setShowTaskForm(false)} />}

      {/* Today's timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Today's Schedule</span>
            <Button size="sm" variant="outline" onClick={() => setShowTaskForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3">
          {todayTasks.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <Target className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base">No tasks scheduled for today</p>
              <Button onClick={() => setShowTaskForm(true)} variant="outline" size="sm" className="mt-2">
                <Plus className="w-4 h-4 mr-2" />
                Add your first task
              </Button>
            </div>
          ) : (
            todayTasks.map((task) => (
              <div
                key={task.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  task.completed
                    ? "bg-muted/50 border-muted opacity-75"
                    : "bg-card border-border hover:border-primary/30"
                }`}
              >
                <div className="text-xs sm:text-sm text-muted-foreground sm:min-w-[80px] order-3 sm:order-1">
                  {task.scheduledTime ? `${task.scheduledTime} - ${task.scheduledTime}` : "Unscheduled"}
                </div>

                <div className="flex-1 order-1 sm:order-2">
                  <div className={`font-medium text-sm sm:text-base ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className={`${getCategoryColor(task.category)} text-xs`}>
                      {task.category}
                    </Badge>
                    <Badge className={`${getPriorityColor(task.priority)} text-xs`} variant="secondary">
                      {task.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{task.duration}min</span>
                  </div>
                </div>

                <div className="flex gap-1 sm:gap-2 order-2 sm:order-3">
                  <Button
                    onClick={() => handleStartTask(task)}
                    variant={task.completed ? "outline" : "default"}
                    size="sm"
                    disabled={task.completed || (activeTask && activeTask.id !== task.id)}
                    className="flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                    ) : activeTask?.id === task.id ? (
                      "Active"
                    ) : (
                      "Start"
                    )}
                  </Button>

                  <Button onClick={() => handleTaskComplete(task)} variant="ghost" size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm">
                    {task.completed ? "Undo" : "Done"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Quick actions and free slots */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {/* Dynamic suggestions and insights */}
        {todaySuggestions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {todaySuggestions.slice(0, 2).map((suggestion, index) => (
              <Card key={suggestion.id} className={`bg-gradient-to-br ${
                suggestion.type === 'workload_warning' ? 'from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800' :
                suggestion.type === 'time_slot' ? 'from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800' :
                'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800'
              }`}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-semibold text-sm sm:text-base mb-2 ${
                      suggestion.type === 'workload_warning' ? 'text-red-800 dark:text-red-200' :
                      suggestion.type === 'time_slot' ? 'text-green-800 dark:text-green-200' :
                      'text-blue-800 dark:text-blue-200'
                    }`}>
                      <Lightbulb className="w-4 h-4 inline mr-1" />
                      {suggestion.title}
                    </h3>
                  </div>
                  <p className={`text-xs sm:text-sm mb-3 ${
                    suggestion.type === 'workload_warning' ? 'text-red-600 dark:text-red-300' :
                    suggestion.type === 'time_slot' ? 'text-green-600 dark:text-green-300' :
                    'text-blue-600 dark:text-blue-300'
                  }`}>
                    {suggestion.description}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`bg-transparent text-xs sm:text-sm w-full sm:w-auto ${
                      suggestion.type === 'workload_warning' ? 'border-red-300 text-red-700 hover:bg-red-100' :
                      suggestion.type === 'time_slot' ? 'border-green-300 text-green-700 hover:bg-green-100' :
                      'border-blue-300 text-blue-700 hover:bg-blue-100'
                    }`}
                    onClick={() => setShowTaskForm(true)}
                  >
                    {suggestion.type === 'time_slot' ? 'Schedule Task' : 'Optimize Schedule'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Fallback when no suggestions */}
        {todaySuggestions.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
              <CardContent className="p-3 sm:p-4">
                <h3 className="font-semibold text-sm sm:text-base text-green-800 dark:text-green-200 mb-2">
                  <Lightbulb className="w-4 h-4 inline mr-1" />
                  Schedule Optimized
                </h3>
                <p className="text-xs sm:text-sm text-green-600 dark:text-green-300 mb-3">
                  Your schedule is well-balanced for today
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-300 text-green-700 hover:bg-green-100 bg-transparent text-xs sm:text-sm w-full sm:w-auto"
                  onClick={() => setShowTaskForm(true)}
                >
                  Add New Task
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <CardContent className="p-3 sm:p-4">
                <h3 className="font-semibold text-sm sm:text-base text-blue-800 dark:text-blue-200 mb-2">
                  <Target className="w-4 h-4 inline mr-1" />
                  Productivity Score
                </h3>
                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-300 mb-3">
                  Current streak: {performanceMetrics.currentStreak} days
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100 bg-transparent text-xs sm:text-sm w-full sm:w-auto"
                  disabled
                >
                  Keep it up!
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
