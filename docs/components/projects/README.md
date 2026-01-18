# Project Components

This directory contains UI components for project management functionality in Phase 2.3.

## Components

### CreateProjectModal

A modal dialog for creating new projects with form validation.

**Location:** `/Users/simonlacey/Documents/GitHub/mcp/mcp-task-manager/src/components/projects/create-project-modal.tsx`

**Features:**
- Project name input (required)
- Description textarea (optional)
- Local directory path input (targetPath)
- GitHub repository URL input (githubRepo)
- Form validation with Zod
- Loading states
- Toast notifications
- API integration with `/api/projects`

**Usage:**
```tsx
import { CreateProjectModal } from "@/components/projects"

<CreateProjectModal
  open={isOpen}
  onOpenChange={setIsOpen}
  onSuccess={(projectId) => {
    console.log("Project created:", projectId)
  }}
/>
```

**Props:**
- `open: boolean` - Controls modal visibility
- `onOpenChange: (open: boolean) => void` - Callback when modal state changes
- `onSuccess?: (projectId: string) => void` - Optional callback on successful creation

---

### TeamMembers

Team member management component with invite and remove functionality.

**Location:** `/Users/simonlacey/Documents/GitHub/mcp/mcp-task-manager/src/components/projects/team-members.tsx`

**Features:**
- Display list of current team members with roles
- Role-based permissions (OWNER, ADMIN, MEMBER, VIEWER)
- Invite new members by email
- Remove members (with confirmation dialog)
- Avatar display with fallback to initials
- Permission checks for invite/remove actions

**Usage:**
```tsx
import { TeamMembers } from "@/components/projects"

<TeamMembers
  projectId={projectId}
  members={members}
  currentUserId={currentUserId}
  onUpdate={() => fetchMembers()}
/>
```

**Props:**
- `projectId: string` - The project ID
- `members: TeamMember[]` - Array of team members
- `currentUserId: string` - Current user's ID for permission checks
- `onUpdate?: () => void` - Optional callback after member changes

**Permissions:**
- OWNER: Can invite/remove all members except themselves
- ADMIN: Can invite members and remove MEMBER/VIEWER roles
- MEMBER/VIEWER: Read-only access

---

### Updated ProjectSelector

Enhanced project selector with API integration and create modal.

**Location:** `/Users/simonlacey/Documents/GitHub/mcp/mcp-task-manager/src/components/layout/ProjectSelector.tsx`

**Features:**
- Fetches projects from `/api/projects`
- Persists selected project to localStorage
- Dropdown menu for project switching
- "Create New Project" option
- Loading and error states
- Empty state with create button

**Usage:**
```tsx
import { ProjectSelector } from "@/components/layout"

<ProjectSelector className="w-64" />
```

**State Management:**
- Uses localStorage key `currentProjectId` for persistence
- Automatically selects first project if none selected
- Refreshes router on project switch

---

## Project Settings Page

Full settings page for project configuration and management.

**Location:** `/Users/simonlacey/Documents/GitHub/mcp/mcp-task-manager/src/app/(dashboard)/dashboard/settings/project/page.tsx`

**Features:**
- Edit project name, description, paths
- Integrated TeamMembers component
- Danger zone with delete project functionality
- Delete confirmation with project name verification
- Role-based edit/delete permissions
- Loading states for all actions

**Sections:**
1. **General Information** - Edit basic project details
2. **Team Members** - Manage project team (TeamMembers component)
3. **Danger Zone** - Delete project with confirmation (OWNER only)

**Permissions:**
- OWNER: Full access including delete
- ADMIN: Can edit project details and manage team
- MEMBER/VIEWER: Read-only access

---

## API Endpoints Used

The components integrate with the following API routes:

### Projects
- `GET /api/projects` - List all projects for current user
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Team Members
- `GET /api/projects/:id/members` - List project members
- `POST /api/projects/:id/members` - Invite member
- `DELETE /api/projects/:id/members/:memberId` - Remove member

---

## Dependencies

### Required packages:
- `react-hook-form` - Form state management
- `@hookform/resolvers` - Form validation resolvers
- `zod` - Schema validation
- `sonner` - Toast notifications

### shadcn/ui components:
- `dialog` - Modal dialogs
- `form` - Form components with validation
- `input` - Text inputs
- `textarea` - Multi-line text input
- `select` - Dropdown select
- `button` - Buttons
- `card` - Card containers
- `alert-dialog` - Confirmation dialogs
- `badge` - Status badges
- `avatar` - User avatars

---

## Form Validation Schemas

### CreateProject Schema
```typescript
{
  name: string (1-100 chars, required)
  description?: string (max 500 chars)
  targetPath?: string
  githubRepo?: string (valid URL or empty)
}
```

### InviteMember Schema
```typescript
{
  email: string (valid email, required)
  role: "ADMIN" | "MEMBER" | "VIEWER" (required)
}
```

---

## Styling

All components use:
- Tailwind CSS for styling
- shadcn/ui design system
- Consistent spacing and colors
- Responsive layouts
- Dark mode support (via next-themes)

---

## Error Handling

All components implement:
- Try-catch blocks for API calls
- User-friendly error messages via toast
- Loading states during async operations
- Form validation with inline error messages
- Graceful fallbacks for missing data
