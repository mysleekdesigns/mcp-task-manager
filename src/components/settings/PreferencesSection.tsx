'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface UserSettings {
  defaultTerminalCount: number
  theme: 'LIGHT' | 'DARK' | 'SYSTEM'
  keyboardShortcuts?: Record<string, string>
}

export function PreferencesSection() {
  const [settings, setSettings] = useState<UserSettings>({
    defaultTerminalCount: 2,
    theme: 'SYSTEM',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (!response.ok) throw new Error('Failed to fetch settings')

      const data = await response.json()
      setSettings({
        defaultTerminalCount: data.defaultTerminalCount || 2,
        theme: data.theme || 'SYSTEM',
        keyboardShortcuts: data.keyboardShortcuts,
      })
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultTerminalCount: settings.defaultTerminalCount,
          theme: settings.theme,
          keyboardShortcuts: settings.keyboardShortcuts,
        }),
      })

      if (!response.ok) throw new Error('Failed to update settings')

      toast.success('Preferences updated successfully')
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('Failed to update preferences')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>
          Customize your application preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="terminal-count">Default Terminal Count</Label>
            <Select
              value={settings.defaultTerminalCount.toString()}
              onValueChange={(value) =>
                setSettings({ ...settings, defaultTerminalCount: parseInt(value) })
              }
            >
              <SelectTrigger id="terminal-count">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 8, 10].map((count) => (
                  <SelectItem key={count} value={count.toString()}>
                    {count} {count === 1 ? 'Terminal' : 'Terminals'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Number of terminals to create for new projects
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={settings.theme}
              onValueChange={(value) =>
                setSettings({ ...settings, theme: value as 'LIGHT' | 'DARK' | 'SYSTEM' })
              }
            >
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LIGHT">Light</SelectItem>
                <SelectItem value="DARK">Dark</SelectItem>
                <SelectItem value="SYSTEM">System</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose your preferred color theme
            </p>
          </div>

          <div className="space-y-2">
            <Label>Keyboard Shortcuts</Label>
            <div className="rounded-md border p-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Toggle Sidebar</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Cmd/Ctrl + B</kbd>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">New Task</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Cmd/Ctrl + N</kbd>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Search</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Cmd/Ctrl + K</kbd>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Terminal Focus</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Cmd/Ctrl + `</kbd>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Keyboard shortcut customization coming soon
            </p>
          </div>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
