"use client"

import { Task } from "./task-store"

export interface WeeklyProgressData {
  day: string
  completed: number
  planned: number
  productivity: number
  date: string
}

export interface CategoryDistribution {
  name: string
  value: number
  color: string
  count: number
}

export interface EnergyPerformanceData {
  time: string
  energy: number
  performance: number
  taskCount: number
}

export interface PerformanceMetrics {
  completionRate: number
  timeAccuracy: number
  productivityTrend: number
  weeklyGoal: number
  currentStreak: number
  totalTasksCompleted: number
  averageTaskDuration: number
}

export interface AIInsight {
  type: "peak" | "pattern" | "suggestion" | "warning"
  title: string
  description: string
  color: string
  priority: number
  date: string
}

export interface Goal {
  id: string
  name: string
  progress: number
  target: number
  current: number
  type: "tasks" | "hours" | "rate" | "streak"
  deadline?: string
}

export class AnalyticsCalculator {
  private tasks: Task[]
  
  constructor(tasks: Task[]) {
    this.tasks = tasks
  }

  // Get date range for analysis
  private getDateRange(days: number = 7): Date[] {
    const dates: Date[] = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(date)
    }
    return dates
  }

  // Calculate weekly progress
  calculateWeeklyProgress(): WeeklyProgressData[] {
    const weekDates = this.getDateRange(7)
    
    return weekDates.map(date => {
      const dateStr = date.toISOString().split('T')[0]
      const dayTasks = this.tasks.filter(task => {
        if (task.scheduledDate) {
          return task.scheduledDate === dateStr
        }
        if (task.completedAt) {
          return task.completedAt.split('T')[0] === dateStr
        }
        return false
      })

      const completed = dayTasks.filter(task => task.completed).length
      const planned = dayTasks.length
      const productivity = planned > 0 ? Math.round((completed / planned) * 100) : 0

      return {
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        date: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        completed,
        planned,
        productivity
      }
    })
  }

  // Calculate category distribution
  calculateCategoryDistribution(): CategoryDistribution[] {
    const completedTasks = this.tasks.filter(task => task.completed)
    const totalCompleted = completedTasks.length

    if (totalCompleted === 0) {
      return [
        { name: "Work", value: 0, color: "#6366f1", count: 0 },
        { name: "Personal", value: 0, color: "#ec4899", count: 0 },
        { name: "Health", value: 0, color: "#10b981", count: 0 },
        { name: "Learning", value: 0, color: "#8b5cf6", count: 0 },
      ]
    }

    const categoryColors: { [key: string]: string } = {
      "Work": "#6366f1",
      "Personal": "#ec4899", 
      "Health": "#10b981",
      "Learning": "#8b5cf6"
    }

    const categoryCounts = completedTasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1
      return acc
    }, {} as { [key: string]: number })

    return Object.entries(categoryCounts).map(([category, count]) => ({
      name: category,
      value: Math.round((count / totalCompleted) * 100),
      color: categoryColors[category] || "#94a3b8",
      count
    }))
  }

  // Calculate energy vs performance patterns
  calculateEnergyPerformance(): EnergyPerformanceData[] {
    const hours = Array.from({ length: 9 }, (_, i) => i + 6) // 6 AM to 2 PM (8 hour range)
    
    return hours.map(hour => {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`
      const displayTime = hour <= 12 ? `${hour} AM` : `${hour - 12} PM`
      
      // Find tasks scheduled or completed at this hour
      const hourTasks = this.tasks.filter(task => {
        if (task.scheduledTime) {
          const scheduledHour = parseInt(task.scheduledTime.split(':')[0])
          return scheduledHour === hour
        }
        if (task.completedAt) {
          const completedHour = new Date(task.completedAt).getHours()
          return completedHour === hour
        }
        return false
      })

      const completedCount = hourTasks.filter(task => task.completed).length
      const totalCount = hourTasks.length
      
      // Energy level based on common patterns
      let energy = 50 // baseline
      if (hour >= 8 && hour <= 11) energy = 85 // morning peak
      else if (hour >= 14 && hour <= 16) energy = 75 // afternoon peak  
      else if (hour <= 7 || hour >= 20) energy = 30 // early/late
      else if (hour >= 12 && hour <= 13) energy = 60 // lunch time

      // Performance based on completion rate or show energy baseline when no tasks
      const performance = totalCount > 0 ? (completedCount / totalCount) * 100 : energy * 0.8

      return {
        time: displayTime,
        energy,
        performance: Math.round(performance),
        taskCount: totalCount
      }
    })
  }

  // Calculate performance metrics
  calculatePerformanceMetrics(): PerformanceMetrics {
    const completedTasks = this.tasks.filter(task => task.completed)
    const totalTasks = this.tasks.length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0

    // Time accuracy (comparing estimated vs actual duration)
    const tasksWithTiming = completedTasks.filter(task => task.completedAt && task.scheduledTime)
    const timeAccuracy = tasksWithTiming.length > 0 ? 
      Math.round(Math.random() * 20 + 70) : 80 // Mock calculation for now

    // Calculate streak
    const currentStreak = this.calculateCurrentStreak()

    // Productivity trend (last 7 days vs previous 7 days)
    const recentCompletion = this.getCompletionRateForPeriod(7)
    const previousCompletion = this.getCompletionRateForPeriod(14, 7)
    const productivityTrend = recentCompletion - previousCompletion

    // Average task duration
    const totalDuration = completedTasks.reduce((sum, task) => sum + task.duration, 0)
    const averageTaskDuration = completedTasks.length > 0 ? 
      Math.round(totalDuration / completedTasks.length) : 0

    return {
      completionRate,
      timeAccuracy,
      productivityTrend: Math.round(productivityTrend * 10) / 10,
      weeklyGoal: 85, // This could be user-configurable
      currentStreak,
      totalTasksCompleted: completedTasks.length,
      averageTaskDuration
    }
  }

  // Calculate current completion streak
  private calculateCurrentStreak(): number {
    const today = new Date()
    let streak = 0
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]
      
      const dayTasks = this.tasks.filter(task => {
        if (task.scheduledDate === dateStr) return true
        if (task.completedAt && task.completedAt.split('T')[0] === dateStr) return true
        return false
      })

      if (dayTasks.length === 0) continue // Skip days with no tasks
      
      const completed = dayTasks.filter(task => task.completed).length
      const completionRate = completed / dayTasks.length
      
      if (completionRate >= 0.7) { // 70% completion rate threshold
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  // Get completion rate for a specific period
  private getCompletionRateForPeriod(days: number, offset: number = 0): number {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - offset)
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - days)

    const periodTasks = this.tasks.filter(task => {
      const taskDate = new Date(task.createdAt)
      return taskDate >= startDate && taskDate <= endDate
    })

    if (periodTasks.length === 0) return 0
    
    const completed = periodTasks.filter(task => task.completed).length
    return (completed / periodTasks.length) * 100
  }

  // Generate AI insights based on task patterns
  generateAIInsights(): AIInsight[] {
    const insights: AIInsight[] = []
    const metrics = this.calculatePerformanceMetrics()
    const weeklyProgress = this.calculateWeeklyProgress()

    // If no tasks, show welcome insights
    if (this.tasks.length === 0) {
      insights.push({
        type: "suggestion",
        title: "Welcome to TaskWise!",
        description: "Start by adding your first task to begin tracking your productivity",
        color: "text-blue-500",
        priority: 1,
        date: new Date().toISOString()
      })
      
      insights.push({
        type: "pattern",
        title: "Optimize Your Day",
        description: "Use AI planning to automatically schedule tasks based on your energy levels",
        color: "text-green-500",
        priority: 2,
        date: new Date().toISOString()
      })
      
      return insights
    }

    // Peak performance insight
    const bestDay = weeklyProgress.reduce((best, day) => 
      day.productivity > best.productivity ? day : best
    )
    
    if (bestDay.productivity > 80) {
      insights.push({
        type: "peak",
        title: "Peak Performance",
        description: `Most productive on ${bestDay.day}s with ${bestDay.productivity}% completion`,
        color: "text-green-500",
        priority: 1,
        date: new Date().toISOString()
      })
    }

    // Completion rate insights
    if (metrics.completionRate < 60) {
      insights.push({
        type: "warning",
        title: "Low Completion Rate",
        description: `Only ${metrics.completionRate}% of tasks completed this week`,
        color: "text-red-500",
        priority: 3,
        date: new Date().toISOString()
      })
    }

    // Streak insights
    if (metrics.currentStreak >= 7) {
      insights.push({
        type: "pattern",
        title: "Strong Momentum",
        description: `${metrics.currentStreak} day completion streak!`,
        color: "text-blue-500",
        priority: 1,
        date: new Date().toISOString()
      })
    }

    // Productivity trend
    if (metrics.productivityTrend > 5) {
      insights.push({
        type: "suggestion",
        title: "Improving Trend",
        description: `Productivity up ${metrics.productivityTrend}% this week`,
        color: "text-green-500",
        priority: 2,
        date: new Date().toISOString()
      })
    }

    return insights.sort((a, b) => a.priority - b.priority).slice(0, 4)
  }

  // Generate default goals based on current performance
  generateDefaultGoals(): Goal[] {
    const metrics = this.calculatePerformanceMetrics()
    const weeklyProgress = this.calculateWeeklyProgress()
    const totalWeeklyTasks = weeklyProgress.reduce((sum, day) => sum + day.planned, 0)
    const completedWeeklyTasks = weeklyProgress.reduce((sum, day) => sum + day.completed, 0)

    // If no tasks, show starter goals
    if (this.tasks.length === 0) {
      return [
        {
          id: "weekly-tasks",
          name: "Add your first tasks",
          progress: 0,
          target: 5,
          current: 0,
          type: "tasks"
        },
        {
          id: "completion-rate",
          name: "Achieve 80% completion rate",
          progress: 0,
          target: 80,
          current: 0,
          type: "rate"
        },
        {
          id: "daily-streak", 
          name: "Start a completion streak",
          progress: 0,
          target: 3,
          current: 0,
          type: "streak"
        },
        {
          id: "weekly-hours",
          name: "Plan 10 hours of focused work", 
          progress: 0,
          target: 10,
          current: 0,
          type: "hours"
        }
      ]
    }

    return [
      {
        id: "weekly-tasks",
        name: "Complete tasks this week",
        progress: Math.round((completedWeeklyTasks / Math.max(totalWeeklyTasks, 1)) * 100),
        target: Math.max(totalWeeklyTasks, 10),
        current: completedWeeklyTasks,
        type: "tasks"
      },
      {
        id: "completion-rate",
        name: "Maintain completion rate",
        progress: metrics.completionRate,
        target: 85,
        current: metrics.completionRate,
        type: "rate"
      },
      {
        id: "daily-streak", 
        name: "Daily completion streak",
        progress: Math.min((metrics.currentStreak / 7) * 100, 100),
        target: 7,
        current: metrics.currentStreak,
        type: "streak"
      },
      {
        id: "weekly-hours",
        name: "Focus hours this week", 
        progress: Math.round((completedWeeklyTasks * (metrics.averageTaskDuration / 60)) / 25 * 100),
        target: 25,
        current: Math.round(completedWeeklyTasks * (metrics.averageTaskDuration / 60)),
        type: "hours"
      }
    ]
  }
}