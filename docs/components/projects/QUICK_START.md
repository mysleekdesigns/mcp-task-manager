# Quick Start Guide - Project Components

Get started using the project management components in under 5 minutes.

---

## Installation (Already Done)

Phase 2.3 components are already installed. If you need to set up a new environment:

```bash
# Install dependencies
npm install react-hook-form @hookform/resolvers

# Add shadcn/ui components
npx shadcn@latest add textarea alert-dialog form
```

---

## Basic Usage

### 1. Show Project Selector (Header)

The project selector is already integrated in the header. Just import and use:

```tsx
import { ProjectSelector } from "@/components/layout"

export default function Header() {
  return (
    <header>
      <ProjectSelector />
    </header>
  )
}
```

**What it does:**
- Shows current project name
- Allows switching between projects
- Has "Create New Project" option
- Persists selection to localStorage

---

### 2. Create Project Modal

Use when you need a standalone "Create Project" button:

```tsx
"use client"

import { useState } from "react"
import { CreateProjectModal } from "@/components/projects"
import { Button } from "@/components/ui/button"

export default function MyPage() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        New Project
      </Button>

      <CreateProjectModal
        open={isOpen}
        onOpenChange={setIsOpen}
        onSuccess={(projectId) => {
          console.log("Created project:", projectId)
          // Do something with the new project
        }}
      />
    </>
  )
}
```

**What it does:**
- Opens a modal dialog
- Form with name, description, paths
- Validates input
- Creates project via API
- Calls onSuccess callback
- Closes automatically

---

### 3. Team Members Component

Use in settings pages or team management views:

```tsx
"use client"

import { useEffect, useState } from "react"
import { TeamMembers } from "@/components/projects"

export default function TeamPage() {
  const [members, setMembers] = useState([])
  const [currentUserId, setCurrentUserId] = useState("")
  const projectId = "your-project-id"

  const fetchMembers = async () => {
    const res = await fetch(`/api/projects/${projectId}/members`)
    const data = await res.json()
    setMembers(data)
  }

  useEffect(() => {
    fetchMembers()
    // Fetch current user ID from session
  }, [])

  return (
    <TeamMembers
      projectId={projectId}
      members={members}
      currentUserId={currentUserId}
      onUpdate={fetchMembers}
    />
  )
}
```

**What it does:**
- Shows team member list
- Allows inviting new members
- Allows removing members (with permissions)
- Role-based UI
- Handles API calls internally

---

### 4. Project Settings Page

Navigate user to `/dashboard/settings/project`:

```tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SomeComponent() {
  return (
    <Link href="/dashboard/settings/project">
      <Button>Project Settings</Button>
    </Link>
  )
}
```

**What it shows:**
- Edit project form
- Team members management
- Delete project option (OWNER only)
- All features in one page

---

## Get Current Project ID

Most components need to know which project is active:

```tsx
"use client"

import { useEffect, useState } from "react"

export default function MyComponent() {
  const [projectId, setProjectId] = useState<string | null>(null)

  useEffect(() => {
    // Get from localStorage
    const id = localStorage.getItem("currentProjectId")
    setProjectId(id)
  }, [])

  if (!projectId) {
    return <div>Please select a project</div>
  }

  return <div>Current project: {projectId}</div>
}
```

**Or create a custom hook:**

```tsx
// hooks/useCurrentProject.ts
import { useEffect, useState } from "react"

export function useCurrentProject() {
  const [projectId, setProjectId] = useState<string | null>(null)

  useEffect(() => {
    const id = localStorage.getItem("currentProjectId")
    setProjectId(id)

    // Optional: Listen for storage changes
    const handleStorageChange = () => {
      const newId = localStorage.getItem("currentProjectId")
      setProjectId(newId)
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  return projectId
}
```

Then use it:

```tsx
import { useCurrentProject } from "@/hooks/useCurrentProject"

export default function MyComponent() {
  const projectId = useCurrentProject()

  // Use projectId in your component
}
```

---

## Fetch Project Data

Get full project details:

```tsx
const projectId = localStorage.getItem("currentProjectId")

const response = await fetch(`/api/projects/${projectId}`)
const project = await response.json()

console.log(project)
// {
//   id: "...",
//   name: "Claude Tasks",
//   description: "...",
//   targetPath: "/path/to/project",
//   githubRepo: "https://github.com/...",
//   createdAt: "...",
//   updatedAt: "..."
// }
```

---

## Check User Permissions

Get user's role in current project:

```tsx
const projectId = localStorage.getItem("currentProjectId")

const response = await fetch(`/api/projects/${projectId}/members`)
const members = await response.json()

// Get current user from session
const sessionRes = await fetch("/api/auth/session")
const session = await sessionRes.json()
const currentUserId = session.user.id

// Find current user's role
const currentMember = members.find(m => m.user.id === currentUserId)
const role = currentMember?.role // "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"

// Check permissions
const canEdit = role === "OWNER" || role === "ADMIN"
const canDelete = role === "OWNER"
const canInvite = role === "OWNER" || role === "ADMIN"
```

---

## Common Patterns

### 1. Create Project Button in Empty State

```tsx
"use client"

import { useState } from "react"
import { CreateProjectModal } from "@/components/projects"

export default function EmptyProjectsState() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="text-center py-12">
      <h2>No Projects Yet</h2>
      <p>Get started by creating your first project</p>
      <button onClick={() => setShowModal(true)}>
        Create Project
      </button>

      <CreateProjectModal
        open={showModal}
        onOpenChange={setShowModal}
      />
    </div>
  )
}
```

### 2. Project Context Provider (Recommended)

```tsx
// contexts/ProjectContext.tsx
"use client"

import { createContext, useContext, useEffect, useState } from "react"

interface Project {
  id: string
  name: string
  // ... other fields
}

interface ProjectContextType {
  project: Project | null
  setProject: (project: Project) => void
  isLoading: boolean
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProject = async () => {
      const projectId = localStorage.getItem("currentProjectId")
      if (!projectId) {
        setIsLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/projects/${projectId}`)
        const data = await res.json()
        setProject(data)
      } catch (error) {
        console.error("Failed to load project:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProject()
  }, [])

  return (
    <ProjectContext.Provider value={{ project, setProject, isLoading }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error("useProject must be used within ProjectProvider")
  }
  return context
}
```

Then wrap your app:

```tsx
// app/layout.tsx
import { ProjectProvider } from "@/contexts/ProjectContext"

export default function Layout({ children }) {
  return (
    <ProjectProvider>
      {children}
    </ProjectProvider>
  )
}
```

Use it anywhere:

```tsx
import { useProject } from "@/contexts/ProjectContext"

export default function MyComponent() {
  const { project, isLoading } = useProject()

  if (isLoading) return <div>Loading...</div>
  if (!project) return <div>No project selected</div>

  return <div>{project.name}</div>
}
```

### 3. Protect Routes by Project Role

```tsx
// components/ProjectGuard.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function ProjectGuard({
  children,
  requiredRole = "MEMBER"
}: {
  children: React.ReactNode
  requiredRole?: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
}) {
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      const projectId = localStorage.getItem("currentProjectId")
      if (!projectId) {
        router.push("/dashboard")
        return
      }

      try {
        const res = await fetch(`/api/projects/${projectId}/members`)
        const members = await res.json()

        const sessionRes = await fetch("/api/auth/session")
        const session = await sessionRes.json()

        const currentMember = members.find(
          m => m.user.id === session.user.id
        )

        const roleHierarchy = {
          OWNER: 4,
          ADMIN: 3,
          MEMBER: 2,
          VIEWER: 1
        }

        const hasRequiredRole =
          roleHierarchy[currentMember?.role] >=
          roleHierarchy[requiredRole]

        if (!hasRequiredRole) {
          router.push("/dashboard")
        } else {
          setHasAccess(true)
        }
      } catch (error) {
        console.error("Access check failed:", error)
        router.push("/dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [router, requiredRole])

  if (isLoading) return <div>Checking permissions...</div>
  if (!hasAccess) return null

  return <>{children}</>
}
```

Use it:

```tsx
export default function AdminOnlyPage() {
  return (
    <ProjectGuard requiredRole="ADMIN">
      <div>Admin-only content</div>
    </ProjectGuard>
  )
}
```

---

## API Usage Examples

### Create Project

```tsx
const createProject = async (data: {
  name: string
  description?: string
  targetPath?: string
  githubRepo?: string
}) => {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    throw new Error("Failed to create project")
  }

  return response.json()
}
```

### Update Project

```tsx
const updateProject = async (
  projectId: string,
  data: Partial<{
    name: string
    description: string
    targetPath: string
    githubRepo: string
  }>
) => {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    throw new Error("Failed to update project")
  }

  return response.json()
}
```

### Invite Team Member

```tsx
const inviteMember = async (
  projectId: string,
  email: string,
  role: "ADMIN" | "MEMBER" | "VIEWER"
) => {
  const response = await fetch(`/api/projects/${projectId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, role })
  })

  if (!response.ok) {
    throw new Error("Failed to invite member")
  }

  return response.json()
}
```

### Remove Team Member

```tsx
const removeMember = async (projectId: string, memberId: string) => {
  const response = await fetch(
    `/api/projects/${projectId}/members/${memberId}`,
    { method: "DELETE" }
  )

  if (!response.ok) {
    throw new Error("Failed to remove member")
  }
}
```

---

## Styling Examples

### Custom Modal Trigger

```tsx
import { CreateProjectModal } from "@/components/projects"

<CreateProjectModal
  open={isOpen}
  onOpenChange={setIsOpen}
/>

// Trigger with custom button
<button
  onClick={() => setIsOpen(true)}
  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
>
  New Project
</button>
```

### Custom Toast Messages

```tsx
import { toast } from "sonner"

// Success
toast.success("Project created!")

// Error
toast.error("Failed to create project")

// Custom
toast("Project saved", {
  description: "Your changes have been saved successfully",
  action: {
    label: "View",
    onClick: () => router.push("/dashboard/settings/project")
  }
})
```

---

## Troubleshooting

### Modal doesn't open
```tsx
// Make sure you're using "use client" directive
"use client"

// And state is managed correctly
const [isOpen, setIsOpen] = useState(false)
```

### Can't fetch projects
```tsx
// Check authentication
const response = await fetch("/api/projects")
if (response.status === 401) {
  // User not authenticated
  router.push("/login")
}
```

### localStorage not working
```tsx
// Only use localStorage in client components
"use client"

// And in useEffect
useEffect(() => {
  const projectId = localStorage.getItem("currentProjectId")
}, [])
```

### TypeScript errors
```tsx
// Import types from Prisma
import type { Project, ProjectMember } from "@prisma/client"

// Or define inline
interface Project {
  id: string
  name: string
  description: string | null
  // ...
}
```

---

## Next Steps

1. **Integrate with Task Components** (Phase 2.4)
   - Filter tasks by current project
   - Create tasks in current project

2. **Add to Terminal UI** (Phase 3.1)
   - Use project.targetPath as CWD
   - Show project name in terminal header

3. **Connect Git Worktrees** (Phase 4.1)
   - Use project.githubRepo for cloning
   - Scope worktrees to project

4. **Scope Memory** (Phase 5.1)
   - Filter memories by projectId
   - Show project context in memory UI

---

## Resources

- **Component Documentation**: `./README.md`
- **Visual Guide**: `./VISUAL_GUIDE.md`
- **Component Hierarchy**: `./COMPONENT_HIERARCHY.md`
- **Implementation Details**: `/PHASE_2.3_IMPLEMENTATION.md`
- **shadcn/ui Docs**: https://ui.shadcn.com
- **React Hook Form Docs**: https://react-hook-form.com
- **Zod Docs**: https://zod.dev

---

**You're ready to use project components!** 🚀

For any issues or questions, refer to the documentation or check the component source code.
