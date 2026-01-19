'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileSection } from '@/components/settings/ProfileSection'
import { ApiKeysSection } from '@/components/settings/ApiKeysSection'
import { PreferencesSection } from '@/components/settings/PreferencesSection'
import { ProjectsSection } from '@/components/settings/ProjectsSection'
import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session) {
      setIsLoading(false)
    }
  }, [session])

  const handleProfileUpdate = async () => {
    // Trigger session update to reflect changes
    await update()
  }

  if (isLoading || !session?.user) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ProfileSection
            user={{
              name: session.user.name,
              email: session.user.email,
              image: session.user.image,
            }}
            onUpdate={handleProfileUpdate}
          />
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4">
          <ApiKeysSection />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <PreferencesSection />
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <ProjectsSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}
