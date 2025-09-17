"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useTaskStore, type Task } from "@/lib/task-store"
import { Plus, X } from "lucide-react"

interface TaskFormProps {
  onClose?: () => void
  editTask?: Task
}

export function TaskForm({ onClose, editTask }: TaskFormProps) {
  const { addTask, updateTask } = useTaskStore()

  const [formData, setFormData] = useState({
    title: editTask?.title || "",
    description: editTask?.description || "",
    category: editTask?.category || ("Work" as Task["category"]),
    priority: editTask?.priority || ("Medium" as Task["priority"]),
    duration: editTask?.duration || 60,
    deadline: editTask?.deadline || "",
    energyLevel: editTask?.energyLevel || ("Medium" as Task["energyLevel"]),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) return

    if (editTask) {
      updateTask(editTask.id, formData)
    } else {
      addTask(formData)
    }

    // Reset form
    setFormData({
      title: "",
      description: "",
      category: "Work",
      priority: "Medium",
      duration: 60,
      deadline: "",
      energyLevel: "Medium",
    })

    onClose?.()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{editTask ? "Edit Task" : "Add New Task"}</span>
          {onClose && (
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="w-4 h-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <Label htmlFor="task-title">Task Title *</Label>
            <Input
              id="task-title"
              placeholder="Enter task title..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="task-description">Description (Optional)</Label>
            <Textarea
              id="task-description"
              placeholder="Add details about this task..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as Task["category"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Work">💼 Work</SelectItem>
                  <SelectItem value="Personal">🏠 Personal</SelectItem>
                  <SelectItem value="Health">💪 Health</SelectItem>
                  <SelectItem value="Learning">📚 Learning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as Task["priority"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">🔴 High</SelectItem>
                  <SelectItem value="Medium">🟡 Medium</SelectItem>
                  <SelectItem value="Low">🟢 Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="5"
                max="480"
                step="5"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number.parseInt(e.target.value) || 60 })}
              />
            </div>

            <div>
              <Label>Energy Level</Label>
              <Select
                value={formData.energyLevel}
                onValueChange={(value) => setFormData({ ...formData, energyLevel: value as Task["energyLevel"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">⚡ High Energy</SelectItem>
                  <SelectItem value="Medium">🔋 Medium Energy</SelectItem>
                  <SelectItem value="Low">🪫 Low Energy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="deadline">Deadline (Optional)</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button type="submit" className="flex-1 order-2 sm:order-1">
              <Plus className="w-4 h-4 mr-2" />
              {editTask ? "Update Task" : "Add Task"}
            </Button>
            {onClose && (
              <Button type="button" onClick={onClose} variant="outline" className="order-1 sm:order-2">
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
