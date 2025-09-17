"use client"

import type { Task } from "./task-store"
import { WorkSchedule, AIPreferences } from "./settings-store"

export interface UserPreferences {
  energyType: "morning" | "afternoon" | "evening" | "flexible"
  workStartTime: string
  workEndTime: string
  breakDuration: number
  lunchBreak: boolean
  lunchStart: string
  lunchDuration: number
  schedulingStyle: "aggressive" | "balanced" | "relaxed" | "custom"
  breakFrequency: number
}

// Helper function to convert settings store data to UserPreferences
export function createUserPreferences(workSchedule: WorkSchedule, aiPreferences: AIPreferences): UserPreferences {
  return {
    energyType: aiPreferences.energyPattern,
    workStartTime: workSchedule.startTime,
    workEndTime: workSchedule.endTime,
    breakDuration: workSchedule.breakDuration,
    lunchBreak: workSchedule.lunchBreak,
    lunchStart: workSchedule.lunchStart,
    lunchDuration: workSchedule.lunchDuration,
    schedulingStyle: aiPreferences.schedulingStyle,
    breakFrequency: aiPreferences.breakFrequency,
  }
}

export interface TimeSlot {
  start: string
  end: string
  available: boolean
  energyLevel: "High" | "Medium" | "Low"
  type: "work" | "break" | "lunch"
}

export interface ScheduledTask extends Task {
  scheduledTime: string
  scheduledDate: string
  confidence: number
  conflicts: string[]
}

export interface SchedulingResult {
  scheduledTasks: ScheduledTask[]
  unscheduledTasks: Task[]
  suggestions: string[]
  conflicts: string[]
}

export class AIScheduler {
  private energyPatterns = {
    morning: {
      peak: 9,
      good: [8, 10, 11],
      medium: [7, 12, 13],
      low: [14, 15, 16, 17, 18],
    },
    afternoon: {
      peak: 14,
      good: [13, 15, 16],
      medium: [11, 12, 17],
      low: [8, 9, 10, 18, 19],
    },
    evening: {
      peak: 19,
      good: [18, 20],
      medium: [17, 21],
      low: [8, 9, 10, 11, 12, 13, 14, 15, 16],
    },
    flexible: {
      peak: 10,
      good: [9, 11, 14, 15],
      medium: [8, 12, 13, 16, 17],
      low: [7, 18, 19, 20],
    },
  }

  calculateUrgency(task: Task): number {
    const priorityWeight = {
      High: 10,
      Medium: 5,
      Low: 1,
    }

    let urgency = priorityWeight[task.priority]

    // Add deadline urgency
    if (task.deadline) {
      const daysToDeadline = Math.max(
        1,
        Math.ceil((new Date(task.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      )
      urgency += 10 / daysToDeadline
    }

    return urgency
  }

  generateTimeSlots(date: string, preferences: UserPreferences): TimeSlot[] {
    const slots: TimeSlot[] = []
    const startHour = Number.parseInt(preferences.workStartTime.split(":")[0])
    const endHour = Number.parseInt(preferences.workEndTime.split(":")[0])
    const energyPattern = this.energyPatterns[preferences.energyType]

    // Generate hourly slots
    for (let hour = startHour; hour < endHour; hour++) {
      const timeString = `${hour.toString().padStart(2, "0")}:00`

      // Skip lunch break if enabled
      if (
        preferences.lunchBreak &&
        hour >= Number.parseInt(preferences.lunchStart.split(":")[0]) &&
        hour < Number.parseInt(preferences.lunchStart.split(":")[0]) + Math.ceil(preferences.lunchDuration / 60)
      ) {
        slots.push({
          start: timeString,
          end: `${(hour + 1).toString().padStart(2, "0")}:00`,
          available: false,
          energyLevel: "Low",
          type: "lunch",
        })
        continue
      }

      // Determine energy level for this hour
      let energyLevel: "High" | "Medium" | "Low" = "Low"
      if (hour === energyPattern.peak) {
        energyLevel = "High"
      } else if (energyPattern.good.includes(hour)) {
        energyLevel = "High"
      } else if (energyPattern.medium.includes(hour)) {
        energyLevel = "Medium"
      }

      slots.push({
        start: timeString,
        end: `${(hour + 1).toString().padStart(2, "0")}:00`,
        available: true,
        energyLevel,
        type: "work",
      })
    }

    return slots
  }

  findBestSlot(
    task: Task,
    availableSlots: TimeSlot[],
    preferences: UserPreferences,
  ): { slot: TimeSlot; confidence: number } | null {
    const suitableSlots = availableSlots.filter((slot) => {
      // Must be available and work time
      if (!slot.available || slot.type !== "work") return false

      // Check if slot duration can accommodate task
      const slotDuration = 60 // Assuming 1-hour slots
      if (task.duration > slotDuration) return false

      return true
    })

    if (suitableSlots.length === 0) return null

    // Score each slot based on energy match and preferences
    const scoredSlots = suitableSlots.map((slot) => {
      let score = 0

      // Energy level matching
      if (task.energyLevel === slot.energyLevel) {
        score += 10
      } else if (
        (task.energyLevel === "High" && slot.energyLevel === "Medium") ||
        (task.energyLevel === "Medium" && slot.energyLevel === "High")
      ) {
        score += 7
      } else if (task.energyLevel === "Low") {
        score += 5 // Low energy tasks can be done anytime
      }

      // Priority bonus for better slots
      if (task.priority === "High" && slot.energyLevel === "High") {
        score += 5
      }

      // Deadline urgency
      if (task.deadline) {
        const daysToDeadline = Math.ceil(
          (new Date(task.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
        )
        if (daysToDeadline <= 1) score += 8
        else if (daysToDeadline <= 3) score += 5
        else if (daysToDeadline <= 7) score += 2
      }

      return { slot, score }
    })

    // Sort by score and return the best match
    scoredSlots.sort((a, b) => b.score - a.score)
    const bestMatch = scoredSlots[0]

    return {
      slot: bestMatch.slot,
      confidence: Math.min(100, (bestMatch.score / 20) * 100),
    }
  }

  scheduleWeek(
    tasks: Task[],
    preferences: UserPreferences,
    startDate: string = new Date().toISOString().split("T")[0],
  ): SchedulingResult {
    const result: SchedulingResult = {
      scheduledTasks: [],
      unscheduledTasks: [],
      suggestions: [],
      conflicts: [],
    }

    // Sort tasks by urgency
    const sortedTasks = [...tasks].sort((a, b) => this.calculateUrgency(b) - this.calculateUrgency(a))

    // Generate time slots for the week
    const weekSlots: { [date: string]: TimeSlot[] } = {}
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateString = date.toISOString().split("T")[0]
      weekSlots[dateString] = this.generateTimeSlots(dateString, preferences)
    }

    // Schedule each task
    for (const task of sortedTasks) {
      let scheduled = false

      // Try to schedule in the next 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        const dateString = date.toISOString().split("T")[0]

        const bestSlot = this.findBestSlot(task, weekSlots[dateString], preferences)

        if (bestSlot && bestSlot.confidence > 50) {
          // Schedule the task
          const scheduledTask: ScheduledTask = {
            ...task,
            scheduledTime: bestSlot.slot.start,
            scheduledDate: dateString,
            confidence: bestSlot.confidence,
            conflicts: [],
          }

          result.scheduledTasks.push(scheduledTask)

          // Mark the slot as unavailable
          const slotIndex = weekSlots[dateString].findIndex((s) => s.start === bestSlot.slot.start)
          if (slotIndex !== -1) {
            weekSlots[dateString][slotIndex].available = false
          }

          scheduled = true
          break
        }
      }

      if (!scheduled) {
        result.unscheduledTasks.push(task)
      }
    }

    // Generate suggestions
    result.suggestions = this.generateSuggestions(result, preferences)

    return result
  }

  generateSuggestions(result: SchedulingResult, preferences: UserPreferences): string[] {
    const suggestions: string[] = []

    // Check for overloaded days
    const tasksByDay: { [date: string]: number } = {}
    result.scheduledTasks.forEach((task) => {
      tasksByDay[task.scheduledDate] = (tasksByDay[task.scheduledDate] || 0) + 1
    })

    Object.entries(tasksByDay).forEach(([date, count]) => {
      if (count > 6) {
        const dayName = new Date(date).toLocaleDateString("en-US", {
          weekday: "long",
        })
        suggestions.push(`${dayName} is overloaded with ${count} tasks. Consider redistributing some tasks.`)
      }
    })

    // Check for unscheduled high-priority tasks
    const unscheduledHighPriority = result.unscheduledTasks.filter((task) => task.priority === "High")
    if (unscheduledHighPriority.length > 0) {
      suggestions.push(
        `${unscheduledHighPriority.length} high-priority tasks couldn't be scheduled. Consider extending work hours or reducing task load.`,
      )
    }

    // Energy pattern suggestions
    const highEnergyTasks = result.scheduledTasks.filter((task) => task.energyLevel === "High")
    const morningScheduled = highEnergyTasks.filter((task) => {
      const hour = Number.parseInt(task.scheduledTime.split(":")[0])
      return hour >= 8 && hour <= 11
    })

    if (preferences.energyType === "morning" && morningScheduled.length < highEnergyTasks.length * 0.7) {
      suggestions.push("Consider scheduling more high-energy tasks in the morning when you're most productive.")
    }

    // Break frequency suggestions
    if (preferences.breakFrequency > 120) {
      suggestions.push("Your break frequency is quite long. Consider shorter, more frequent breaks for better focus.")
    }

    return suggestions
  }

  optimizeSchedule(
    tasks: Task[],
    preferences: UserPreferences,
    optimizationType: "productivity" | "balance" | "frontload",
  ): SchedulingResult {
    // Modify preferences based on optimization type
    const modifiedPreferences = { ...preferences }

    switch (optimizationType) {
      case "productivity":
        // Prioritize high-energy slots for important tasks
        modifiedPreferences.schedulingStyle = "aggressive"
        break
      case "balance":
        // Ensure even distribution of work and breaks
        modifiedPreferences.schedulingStyle = "balanced"
        modifiedPreferences.breakFrequency = Math.min(preferences.breakFrequency, 90)
        break
      case "frontload":
        // Schedule important tasks earlier in the week
        const sortedTasks = [...tasks].sort((a, b) => {
          const urgencyA = this.calculateUrgency(a)
          const urgencyB = this.calculateUrgency(b)
          return urgencyB - urgencyA
        })
        return this.scheduleWeek(sortedTasks, modifiedPreferences)
    }

    return this.scheduleWeek(tasks, modifiedPreferences)
  }

  insertBreaks(scheduledTasks: ScheduledTask[], preferences: UserPreferences): ScheduledTask[] {
    const tasksWithBreaks: ScheduledTask[] = []
    const breakDuration = preferences.breakDuration

    scheduledTasks.forEach((task, index) => {
      tasksWithBreaks.push(task)

      // Add break after task if it's been more than breakFrequency minutes
      if (index < scheduledTasks.length - 1) {
        const currentTaskEnd = new Date(`${task.scheduledDate}T${task.scheduledTime}`)
        currentTaskEnd.setMinutes(currentTaskEnd.getMinutes() + task.duration)

        const nextTask = scheduledTasks[index + 1]
        const nextTaskStart = new Date(`${nextTask.scheduledDate}T${nextTask.scheduledTime}`)

        const timeBetween = (nextTaskStart.getTime() - currentTaskEnd.getTime()) / (1000 * 60)

        if (timeBetween >= breakDuration && task.duration >= preferences.breakFrequency) {
          const breakTask: ScheduledTask = {
            id: `break-${task.id}`,
            title: "Break",
            category: "Personal",
            priority: "Low",
            duration: breakDuration,
            energyLevel: "Low",
            scheduled: true,
            scheduledTime: currentTaskEnd.toTimeString().slice(0, 5),
            scheduledDate: task.scheduledDate,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            confidence: 100,
            conflicts: [],
          }
          tasksWithBreaks.push(breakTask)
        }
      }
    })

    return tasksWithBreaks
  }
}

export const aiScheduler = new AIScheduler()
