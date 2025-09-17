"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Clock, Brain, Palette, Calendar, Bell, Shield, Download, Upload, Trash2, Plus, Edit, Save, ChevronRight } from "lucide-react"
import { useSettingsStore } from "@/lib/settings-store"
import { toast } from "@/hooks/use-toast"

export function SettingsScreen() {
  const {
    workSchedule,
    aiPreferences,
    categories,
    notifications,
    updateWorkSchedule,
    updateAIPreferences,
    updateNotifications,
    addCategory,
    deleteCategory,
    exportData,
    importData,
    clearAllData
  } = useSettingsStore()


  const [newCategory, setNewCategory] = useState({ name: "", color: "#6366f1", icon: "📝" })
  const [showAddCategory, setShowAddCategory] = useState(false)

  const handleSaveSchedule = () => {
    toast({
      title: "Schedule Saved",
      description: "Your work schedule has been updated.",
    })
  }

  const handleAddCategory = () => {
    if (newCategory.name.trim()) {
      addCategory(newCategory)
      setNewCategory({ name: "", color: "#6366f1", icon: "📝" })
      setShowAddCategory(false)
      toast({
        title: "Category Added",
        description: `${newCategory.name} category has been created.`,
      })
    }
  }

  const handleDeleteCategory = (id: string) => {
    const category = categories.find(cat => cat.id === id)
    deleteCategory(id)
    toast({
      title: "Category Deleted",
      description: `${category?.name || 'Category'} has been removed.`,
    })
  }

  const handleExportData = () => {
    try {
      const dataStr = exportData()
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `taskwise-settings-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Data Exported",
        description: "Your settings have been downloaded.",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export settings data.",
        variant: "destructive"
      })
    }
  }

  const handleImportData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const data = event.target?.result as string
            const success = importData(data)
            
            if (success) {
              toast({
                title: "Data Imported",
                description: "Your settings have been restored.",
              })
            } else {
              toast({
                title: "Import Failed",
                description: "Invalid file format or corrupted data.",
                variant: "destructive"
              })
            }
          } catch (error) {
            toast({
              title: "Import Failed",
              description: "Failed to read the file.",
              variant: "destructive"
            })
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  return (
    <div className="p-2 sm:p-4 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Customize your TaskWise experience</p>
      </div>

      {/* Work Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            TaskWise App
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <Card className="py-3 px-5 flex items-center flex-row justify-between">
            <p>Privacy policy</p>
            <ChevronRight />
          </Card>
          <Card className="py-3 px-5 flex items-center flex-row justify-between">
            Terms of use
            <ChevronRight />
          </Card>
          <Card className="py-3 px-5 flex items-center flex-row justify-between">
            Support
            <ChevronRight />
          </Card>
          <Card className="py-3 px-5 flex items-center flex-row justify-between">
            Share
            <ChevronRight />
          </Card>
        </CardContent>
      </Card>

      {/* AI Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-secondary" />
            AI Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Energy Pattern</Label>
            <Select value={aiPreferences?.energyPattern} onValueChange={(value) => updateAIPreferences({ energyPattern: value as any })}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning Person (Peak: 8-11 AM)</SelectItem>
                <SelectItem value="afternoon">Afternoon Person (Peak: 1-4 PM)</SelectItem>
                <SelectItem value="evening">Evening Person (Peak: 6-9 PM)</SelectItem>
                <SelectItem value="flexible">Flexible Schedule</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Scheduling Style</Label>
            <Select value={aiPreferences.schedulingStyle} onValueChange={(value) => updateAIPreferences({ schedulingStyle: value as any })}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aggressive">Aggressive (Pack schedule tight)</SelectItem>
                <SelectItem value="balanced">Balanced (Moderate spacing)</SelectItem>
                <SelectItem value="relaxed">Relaxed (Plenty of buffer time)</SelectItem>
                <SelectItem value="custom">Custom Settings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Break Frequency (minutes)</Label>
            <div className="flex items-center gap-4 mt-2">
              <Slider
                value={[aiPreferences.breakFrequency]}
                onValueChange={(value) => updateAIPreferences({ breakFrequency: value[0] })}
                max={180}
                min={30}
                step={15}
                className="flex-1"
              />
              <Badge variant="outline">Every {aiPreferences.breakFrequency} min</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">AI will suggest breaks based on this frequency</p>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-accent" />
              Task Categories
            </div>
            <Button onClick={() => setShowAddCategory(!showAddCategory)} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddCategory && (
            <Card className="bg-muted/30">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category-name">Name</Label>
                    <Input
                      id="category-name"
                      placeholder="Category name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category-color">Color</Label>
                    <Input
                      id="category-color"
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category-icon">Icon</Label>
                    <Input
                      id="category-icon"
                      placeholder="📝"
                      value={newCategory.icon}
                      onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddCategory} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                  <Button onClick={() => setShowAddCategory(false)} variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteCategory(category.id)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integrations & Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-green-500" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => {
                if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                  clearAllData()
                  toast({
                    title: "Data Cleared",
                    description: "All settings have been reset to defaults.",
                  })
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
