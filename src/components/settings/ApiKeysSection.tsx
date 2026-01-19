'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Eye, EyeOff, Check, X } from 'lucide-react'

interface ApiKeysData {
  claudeApiKey: string | null
  githubToken: string | null
  hasClaudeApiKey: boolean
  hasGithubToken: boolean
}

export function ApiKeysSection() {
  const [apiKeys, setApiKeys] = useState<ApiKeysData>({
    claudeApiKey: null,
    githubToken: null,
    hasClaudeApiKey: false,
    hasGithubToken: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [claudeApiKey, setClaudeApiKey] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [showClaudeKey, setShowClaudeKey] = useState(false)
  const [showGithubToken, setShowGithubToken] = useState(false)

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/settings/api-keys')
      if (!response.ok) throw new Error('Failed to fetch API keys')

      const data = await response.json()
      setApiKeys(data)
    } catch (error) {
      console.error('Error fetching API keys:', error)
      toast.error('Failed to load API keys')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateClaudeKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!claudeApiKey.trim()) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/api-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claudeApiKey }),
      })

      if (!response.ok) throw new Error('Failed to update Claude API key')

      const data = await response.json()
      setApiKeys(prev => ({
        ...prev,
        claudeApiKey: data.claudeApiKey,
        hasClaudeApiKey: data.hasClaudeApiKey,
      }))

      setClaudeApiKey('')
      setShowClaudeKey(false)
      toast.success('Claude API key updated successfully')
    } catch (error) {
      console.error('Error updating Claude API key:', error)
      toast.error('Failed to update Claude API key')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateGithubToken = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!githubToken.trim()) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/api-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubToken }),
      })

      if (!response.ok) throw new Error('Failed to update GitHub token')

      const data = await response.json()
      setApiKeys(prev => ({
        ...prev,
        githubToken: data.githubToken,
        hasGithubToken: data.hasGithubToken,
      }))

      setGithubToken('')
      setShowGithubToken(false)
      toast.success('GitHub token updated successfully')
    } catch (error) {
      console.error('Error updating GitHub token:', error)
      toast.error('Failed to update GitHub token')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveKey = async (keyType: 'claude' | 'github') => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/api-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [keyType === 'claude' ? 'claudeApiKey' : 'githubToken']: null,
        }),
      })

      if (!response.ok) throw new Error('Failed to remove key')

      const data = await response.json()
      setApiKeys(prev => ({
        ...prev,
        ...(keyType === 'claude'
          ? { claudeApiKey: null, hasClaudeApiKey: false }
          : { githubToken: null, hasGithubToken: false }),
      }))

      toast.success(`${keyType === 'claude' ? 'Claude API key' : 'GitHub token'} removed`)
    } catch (error) {
      console.error('Error removing key:', error)
      toast.error('Failed to remove key')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Claude API Key</CardTitle>
              <CardDescription>
                Your Anthropic API key for Claude integration
              </CardDescription>
            </div>
            {apiKeys.hasClaudeApiKey && (
              <Badge variant="outline" className="gap-1">
                <Check className="h-3 w-3" />
                Configured
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {apiKeys.hasClaudeApiKey && (
            <div className="mb-4 p-3 bg-muted rounded-md flex items-center justify-between">
              <code className="text-sm">{apiKeys.claudeApiKey}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveKey('claude')}
                disabled={isSaving}
                className="text-muted-foreground hover:text-cyan-400 active:text-cyan-400"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <form onSubmit={handleUpdateClaudeKey} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="claude-key">
                {apiKeys.hasClaudeApiKey ? 'Update API Key' : 'Add API Key'}
              </Label>
              <div className="relative">
                <Input
                  id="claude-key"
                  type={showClaudeKey ? 'text' : 'password'}
                  placeholder="sk-ant-..."
                  value={claudeApiKey}
                  onChange={(e) => setClaudeApiKey(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-cyan-400 active:text-cyan-400"
                  onClick={() => setShowClaudeKey(!showClaudeKey)}
                >
                  {showClaudeKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" disabled={!claudeApiKey.trim() || isSaving}>
              {isSaving ? 'Saving...' : apiKeys.hasClaudeApiKey ? 'Update Key' : 'Save Key'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>GitHub Token</CardTitle>
              <CardDescription>
                Personal access token for GitHub integration
              </CardDescription>
            </div>
            {apiKeys.hasGithubToken && (
              <Badge variant="outline" className="gap-1">
                <Check className="h-3 w-3" />
                Configured
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {apiKeys.hasGithubToken && (
            <div className="mb-4 p-3 bg-muted rounded-md flex items-center justify-between">
              <code className="text-sm">{apiKeys.githubToken}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveKey('github')}
                disabled={isSaving}
                className="text-muted-foreground hover:text-cyan-400 active:text-cyan-400"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <form onSubmit={handleUpdateGithubToken} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="github-token">
                {apiKeys.hasGithubToken ? 'Update Token' : 'Add Token'}
              </Label>
              <div className="relative">
                <Input
                  id="github-token"
                  type={showGithubToken ? 'text' : 'password'}
                  placeholder="ghp_..."
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-cyan-400 active:text-cyan-400"
                  onClick={() => setShowGithubToken(!showGithubToken)}
                >
                  {showGithubToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" disabled={!githubToken.trim() || isSaving}>
              {isSaving ? 'Saving...' : apiKeys.hasGithubToken ? 'Update Token' : 'Save Token'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
