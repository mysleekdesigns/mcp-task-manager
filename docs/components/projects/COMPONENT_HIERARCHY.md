# Project Components - Hierarchy & Flow

## Component Tree

```
App Layout
│
├── Header (layout/Header.tsx)
│   └── ProjectSelector ✨ UPDATED
│       ├── Fetches from: GET /api/projects
│       ├── State: localStorage.currentProjectId
│       └── Opens: CreateProjectModal ⭐ NEW
│
└── Dashboard Routes
    └── Settings
        └── Project Settings Page ⭐ NEW
            │
            ├── Section 1: General Information
            │   └── Form (react-hook-form + zod)
            │       ├── Updates: PATCH /api/projects/:id
            │       └── Fields: name, description, targetPath, githubRepo
            │
            ├── Section 2: Team Management
            │   └── TeamMembers Component ⭐ NEW
            │       ├── Lists members with avatars & roles
            │       ├── Invite form (email + role)
            │       │   └── Creates: POST /api/projects/:id/members
            │       └── Remove button (with confirmation)
            │           └── Deletes: DELETE /api/projects/:id/members/:id
            │
            └── Section 3: Danger Zone
                └── Delete Project (OWNER only)
                    ├── AlertDialog with name confirmation
                    └── Deletes: DELETE /api/projects/:id
```

---

## Data Flow

### 1. Project Creation Flow
```
User clicks "Create Project"
    ↓
ProjectSelector opens CreateProjectModal
    ↓
User fills form (name, description, paths)
    ↓
Form validation (Zod schema)
    ↓
POST /api/projects
    ↓
Success: Toast notification
    ↓
ProjectSelector.fetchProjects() refreshes list
    ↓
New project appears in dropdown
```

### 2. Project Selection Flow
```
User opens ProjectSelector dropdown
    ↓
Displays all projects from GET /api/projects
    ↓
User clicks a project
    ↓
localStorage.setItem("currentProjectId", projectId)
    ↓
router.refresh()
    ↓
Toast: "Switched to [ProjectName]"
    ↓
All dashboard views now use new project context
```

### 3. Team Member Invite Flow
```
User enters email + selects role
    ↓
Form validation (email format, role enum)
    ↓
POST /api/projects/:id/members
    ↓
API validates user exists & checks permissions
    ↓
Success: Toast notification
    ↓
onUpdate() callback triggers
    ↓
Parent refetches members list
    ↓
New member appears in list
```

### 4. Project Update Flow
```
User edits project fields
    ↓
Form tracks changes (react-hook-form)
    ↓
User clicks "Save Changes"
    ↓
Form validation (Zod schema)
    ↓
PATCH /api/projects/:id
    ↓
API validates permissions (OWNER/ADMIN)
    ↓
Success: Toast notification
    ↓
router.refresh()
    ↓
Updated data displayed
```

### 5. Project Deletion Flow
```
User clicks "Delete Project" (OWNER only)
    ↓
AlertDialog opens
    ↓
Shows list of what will be deleted
    ↓
User types project name to confirm
    ↓
Confirmation matches project.name
    ↓
DELETE /api/projects/:id
    ↓
API cascade deletes:
  - ProjectMembers
  - Tasks (with subtasks, phases)
  - Terminals
  - Worktrees
  - Memories
  - McpConfigs
    ↓
localStorage.removeItem("currentProjectId")
    ↓
router.push("/dashboard")
    ↓
User redirected to dashboard
```

---

## State Management

### ProjectSelector State
```typescript
{
  projects: Project[]           // From API
  selectedProject: Project | null
  isLoading: boolean
  isOpen: boolean              // Dropdown state
  showCreateModal: boolean     // Modal state
}
```

### CreateProjectModal State
```typescript
{
  form: UseFormReturn<CreateProjectFormData>
  isLoading: boolean           // During API call
}
```

### TeamMembers State
```typescript
{
  form: UseFormReturn<InviteMemberFormData>
  isInviting: boolean
  removingMemberId: string | null
  memberToRemove: TeamMember | null
}
```

### ProjectSettingsPage State
```typescript
{
  project: Project | null
  members: TeamMember[]
  currentUserId: string
  isLoading: boolean
  isSaving: boolean
  isDeleting: boolean
  deleteConfirmation: string
  form: UseFormReturn<UpdateProjectFormData>
}
```

---

## Permission Matrix

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|--------|-------|-------|--------|--------|
| **View Projects** | ✅ | ✅ | ✅ | ✅ |
| **Create Project** | ✅ | ✅ | ✅ | ✅ |
| **Switch Project** | ✅ | ✅ | ✅ | ✅ |
| **View Settings** | ✅ | ✅ | ✅ | ✅ |
| **Edit Project** | ✅ | ✅ | ❌ | ❌ |
| **Invite Members** | ✅ | ✅ | ❌ | ❌ |
| **Remove VIEWER** | ✅ | ✅ | ❌ | ❌ |
| **Remove MEMBER** | ✅ | ✅ | ❌ | ❌ |
| **Remove ADMIN** | ✅ | ❌ | ❌ | ❌ |
| **Remove OWNER** | ❌ | ❌ | ❌ | ❌ |
| **Delete Project** | ✅ | ❌ | ❌ | ❌ |

---

## Component Dependencies

### CreateProjectModal
```
Dependencies:
├── react-hook-form
├── @hookform/resolvers/zod
├── zod
├── sonner (toast)
└── shadcn/ui:
    ├── dialog
    ├── form
    ├── input
    ├── textarea
    └── button

Uses:
- useRouter (next/navigation)
- useForm (react-hook-form)
- zodResolver
```

### TeamMembers
```
Dependencies:
├── react-hook-form
├── @hookform/resolvers/zod
├── zod
├── sonner (toast)
└── shadcn/ui:
    ├── card
    ├── form
    ├── select
    ├── alert-dialog
    ├── input
    ├── button
    ├── badge
    └── avatar

Uses:
- useForm (react-hook-form)
- zodResolver
```

### ProjectSettingsPage
```
Dependencies:
├── react-hook-form
├── @hookform/resolvers/zod
├── zod
├── sonner (toast)
├── TeamMembers component
└── shadcn/ui:
    ├── card
    ├── form
    ├── alert-dialog
    ├── input
    ├── textarea
    ├── button
    └── separator

Uses:
- useRouter (next/navigation)
- useForm (react-hook-form)
- zodResolver
- React.useEffect (data fetching)
- React.useCallback (memoization)
```

### ProjectSelector
```
Dependencies:
├── sonner (toast)
├── CreateProjectModal component
└── shadcn/ui:
    ├── dropdown-menu
    └── button

Uses:
- useRouter (next/navigation)
- React.useState
- React.useEffect
- localStorage API
```

---

## API Endpoints Reference

### Projects
```typescript
GET    /api/projects                     // List user's projects
POST   /api/projects                     // Create project
GET    /api/projects/:id                 // Get project details
PATCH  /api/projects/:id                 // Update project
DELETE /api/projects/:id                 // Delete project

// Request/Response types align with Prisma schema
```

### Team Members
```typescript
GET    /api/projects/:id/members         // List members
POST   /api/projects/:id/members         // Invite member
DELETE /api/projects/:id/members/:memberId  // Remove member

// Includes user relation (name, email, image)
```

---

## LocalStorage Keys

```typescript
"currentProjectId": string  // Selected project ID
```

**Usage:**
- Set: When user selects a project
- Read: On app load, settings page
- Clear: On project deletion

---

## Error Scenarios

### Handled Errors

1. **API Failures**
   - Network errors
   - 401 Unauthorized
   - 403 Forbidden
   - 404 Not Found
   - 500 Server Error
   - **Action:** Toast error message

2. **Validation Errors**
   - Invalid email format
   - Required fields missing
   - String length exceeded
   - Invalid URL format
   - **Action:** Inline form error message

3. **Permission Errors**
   - User lacks required role
   - **Action:** UI element hidden/disabled + API returns 403

4. **Not Found Errors**
   - Project deleted while viewing
   - User removed from project
   - **Action:** Redirect to dashboard + toast

5. **Deletion Confirmation Mismatch**
   - Project name doesn't match
   - **Action:** Delete button stays disabled

---

## Styling Patterns

### Color Coding
```css
Role Badges:
- OWNER:  default (gray)
- ADMIN:  destructive (red)
- MEMBER: secondary (blue)
- VIEWER: outline (border only)

States:
- Primary action:   bg-primary
- Destructive:      bg-destructive (red)
- Success:          via toast (green)
- Loading:          text-muted-foreground + spinner
```

### Spacing
```css
Container padding:   p-4, p-6, p-8
Card spacing:        space-y-4, space-y-6
Form fields:         space-y-4
Button gap:          gap-2
Icon size:           h-4 w-4, h-5 w-5
```

### Responsive
```css
Modal width:         sm:max-w-[600px]
Container:           max-w-4xl
Truncate long text:  truncate class
Flex wrapping:       flex-wrap where needed
```

---

## Integration Points

### Current Phase (2.3)
- ✅ Uses Phase 2.2 API routes
- ✅ Integrates with existing layout components
- ✅ Uses established UI component library

### Future Phases
- **Phase 2.4 (Tasks UI)**: Will read currentProjectId for task filtering
- **Phase 3.1 (Terminals)**: Will use project.targetPath for terminal CWD
- **Phase 4.1 (Worktrees)**: Will use project.githubRepo and targetPath
- **Phase 5.1 (Memory)**: Will scope memories to currentProjectId
- **Phase 6.1 (MCP)**: Will link MCP configs to projects

---

## Testing Considerations

### Unit Tests (Recommended)
- Form validation schemas
- Permission check functions
- Role badge color mapping
- Initial calculation function

### Integration Tests (Recommended)
- Create project flow
- Project selection persistence
- Team member invite/remove
- Project deletion with cascade

### E2E Tests (Recommended)
- Full project lifecycle
- Multi-user collaboration scenarios
- Permission boundary testing
- Error recovery flows
