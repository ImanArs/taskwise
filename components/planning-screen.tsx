"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TaskForm } from "@/components/task-form"
import { useTaskStore } from "@/lib/task-store"
import { useSettingsStore } from "@/lib/settings-store"
import { usePlanningStore } from "@/lib/planning-store"
import { aiScheduler, createUserPreferences } from "@/lib/ai-scheduler"
import { Calendar, Clock, Plus, Zap, Target, Brain, RotateCcw, CheckCircle2, Sparkles } from "lucide-react"

export function PlanningScreen() {
  const { tasks, getUnscheduledTasks, updateTask } = useTaskStore()
  const { workSchedule, aiPreferences } = useSettingsStore()
  const { 
    weeklySchedule, 
    viewMode, 
    isOptimizing, 
    lastOptimization,
    suggestions,
    updateSchedule,
    setViewMode,
    startOptimization,
    finishOptimization
  } = usePlanningStore()
  const [showTaskForm, setShowTaskForm] = useState(false)

  const unscheduledTasks = getUnscheduledTasks()

  // Update schedule when tasks or settings change
  useEffect(() => {
    updateSchedule(tasks, workSchedule)
  }, [tasks, workSchedule, updateSchedule])

  // Create user preferences from settings
  const userPreferences = createUserPreferences(workSchedule, aiPreferences)

  const handleAIOptimization = async (type: "productivity" | "balance" | "frontload") => {
    startOptimization(type)

    try {
      // Simulate AI processing time
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const result = aiScheduler.optimizeSchedule(unscheduledTasks, userPreferences, type)

      // Update tasks with AI scheduling
      result.scheduledTasks.forEach((scheduledTask) => {
        updateTask(scheduledTask.id, {
          scheduled: true,
          scheduledTime: scheduledTask.scheduledTime,
          scheduledDate: scheduledTask.scheduledDate,
        })
      })

      // Record optimization completion
      finishOptimization(result.scheduledTasks.length, 
        result.scheduledTasks.length > 0 ? 
          Math.round(result.scheduledTasks.reduce((sum, task) => sum + task.confidence, 0) / result.scheduledTasks.length) : 0
      )

      console.log("AI Optimization Result:", result)
      console.log("Suggestions:", result.suggestions)
    } catch (error) {
      console.error("AI optimization failed:", error)
      finishOptimization(0, 0)
    }
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

  const getEnergyColor = (energy: string) => {
    switch (energy) {
      case "High":
        return "text-red-500"
      case "Medium":
        return "text-yellow-500"
      case "Low":
        return "text-green-500"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <div className="p-2 sm:p-4 space-y-4 sm:space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-foreground">Planning</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Organize your week with AI assistance</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant={viewMode === "week" ? "default" : "outline"} size="sm" onClick={() => setViewMode("week")} className="flex-1 sm:flex-none">
            Week
          </Button>
          <Button variant={viewMode === "day" ? "default" : "outline"} size="sm" onClick={() => setViewMode("day")} className="flex-1 sm:flex-none">
            Day
          </Button>
        </div>
      </div>

      {/* AI Auto-organize section */}
      <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            AI Auto-Organize Week
            {isOptimizing && <Sparkles className="w-4 h-4 text-primary animate-pulse" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Let AI optimize your schedule based on your preferences and energy patterns.
            {lastOptimization && <span className="text-primary ml-2">Last optimized: {lastOptimization.type} mode</span>}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-primary/30 hover:bg-primary/10 bg-transparent text-xs sm:text-sm"
              onClick={() => handleAIOptimization("productivity")}
              disabled={isOptimizing || unscheduledTasks.length === 0}
            >
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              {isOptimizing ? "Optimizing..." : "Optimize Productivity"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-secondary/30 hover:bg-secondary/10 bg-transparent text-xs sm:text-sm"
              onClick={() => handleAIOptimization("balance")}
              disabled={isOptimizing || unscheduledTasks.length === 0}
            >
              <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              {isOptimizing ? "Balancing..." : "Balance Work/Breaks"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-accent/30 hover:bg-accent/10 bg-transparent text-xs sm:text-sm"
              onClick={() => handleAIOptimization("frontload")}
              disabled={isOptimizing || unscheduledTasks.length === 0}
            >
              <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              {isOptimizing ? "Front-loading..." : "Front-load Important"}
            </Button>
          </div>
          {unscheduledTasks.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              All tasks are scheduled! Add new tasks to use AI optimization.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Task Input Form */}
        <div className="lg:col-span-1 space-y-4">
          {!showTaskForm ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Add New Task</span>
                  <Button onClick={() => setShowTaskForm(true)} variant="outline" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
            </Card>
          ) : (
            <TaskForm onClose={() => setShowTaskForm(false)} />
          )}

          {/* Unscheduled Tasks Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Unscheduled Tasks
                <Badge variant="secondary">{unscheduledTasks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {unscheduledTasks.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">All tasks are scheduled!</p>
                  <p className="text-xs mt-1">AI has optimized your week</p>
                </div>
              ) : (
                unscheduledTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-move"
                    draggable
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <Badge className={getPriorityColor(task.priority)} variant="secondary">
                        {task.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className={getCategoryColor(task.category)}>
                        {task.category}
                      </Badge>
                      <span className="text-muted-foreground">{task.duration}min</span>
                      <span className={getEnergyColor(task.energyLevel)}>{task.energyLevel} energy</span>
                    </div>
                    {task.deadline && <div className="text-xs text-accent mt-1">Due: {task.deadline}</div>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Calendar/Schedule View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {viewMode === "week" ? "Weekly Schedule" : "Daily Schedule"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {viewMode === "week" ? (
                <div className="space-y-4">
                  {/* Week overview */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {weeklySchedule.map((day) => (
                      <div
                        key={day.day}
                        className="p-1.5 sm:p-3 border rounded-lg text-center hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div className="font-medium text-xs sm:text-sm">{day.day}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2">{day.date}</div>
                        <div className="space-y-0.5 sm:space-y-1">
                          <div className="text-[10px] sm:text-xs">
                            <span className="font-medium">{day.tasks}</span> tasks
                          </div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground">{day.hours}h</div>
                        </div>
                        {day.tasks > 0 && (
                          <div className="mt-1 sm:mt-2 h-1 sm:h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${Math.min((day.hours / 8) * 100, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* AI Scheduling Status */}
                  <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center">
                    {isOptimizing ? (
                      <div className="space-y-4">
                        <Sparkles className="w-12 h-12 text-primary mx-auto animate-pulse" />
                        <p className="text-primary font-medium">AI is optimizing your schedule...</p>
                        <p className="text-sm text-muted-foreground">Analyzing energy patterns and task priorities</p>
                      </div>
                    ) : unscheduledTasks.length > 0 ? (
                      <div className="space-y-4">
                        <Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto" />
                        <p className="text-muted-foreground">Drag tasks from the queue to schedule them manually</p>
                        <p className="text-sm text-muted-foreground/60">
                          Or use AI optimization buttons above for automatic scheduling
                        </p>
                        {suggestions.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-muted-foreground mb-2">AI Suggestions:</p>
                            {suggestions.slice(0, 2).map((suggestion, index) => (
                              <p key={index} className="text-xs text-muted-foreground/80">
                                • {suggestion.description}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                        <p className="text-green-600 font-medium">Week fully optimized!</p>
                        <p className="text-sm text-muted-foreground">
                          All tasks have been intelligently scheduled based on your energy patterns
                        </p>
                        {lastOptimization && (
                          <p className="text-xs text-muted-foreground">
                            Efficiency: {lastOptimization.efficiency}% • Tasks: {lastOptimization.tasksOptimized}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Daily view placeholder */}
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                    <p className="text-muted-foreground">Daily view coming soon</p>
                    <p className="text-sm text-muted-foreground/60">
                      Detailed hourly scheduling with conflict detection
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-2 sm:p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-primary">{unscheduledTasks.length}</div>
                <p className="text-xs sm:text-sm text-muted-foreground">Unscheduled</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
              <CardContent className="p-2 sm:p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-secondary">
                  {weeklySchedule.reduce((acc, day) => acc + day.tasks, 0)}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">This Week</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
              <CardContent className="p-2 sm:p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-accent">
                  {weeklySchedule.reduce((acc, day) => acc + day.hours, 0).toFixed(1)}h
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Hours</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
