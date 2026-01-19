# Phase 10.2 - Ideation Board Implementation

## Overview
Complete implementation of the Ideation Board feature for capturing, voting on, and converting ideas to features in the MCP Task Manager.

## Implementation Date
2026-01-18

## Components Implemented

### 1. Database Schema

#### Idea Model
Added to `/prisma/schema.prisma`:

```prisma
enum IdeaStatus {
  PENDING
  UNDER_REVIEW
  APPROVED
  REJECTED
  CONVERTED
}

model Idea {
  id          String     @id @default(cuid())
  title       String
  description String?    @db.Text
  votes       Int        @default(0)
  status      IdeaStatus @default(PENDING)
  projectId   String
  project     Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdById String
  createdBy   User       @relation("CreatedIdeas", fields: [createdById], references: [id], onDelete: Cascade)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([projectId])
  @@index([createdById])
  @@index([status])
  @@index([votes(sort: Desc)])
}
```

**Relations:**
- Project has many Ideas
- User has many Ideas (as creator)

**Migration:** `20260118234659_add_idea_model`

### 2. TypeScript Types

File: `/src/types/idea.ts`

- `Idea` - Base idea interface
- `CreateIdeaInput` - Input for creating ideas
- `UpdateIdeaInput` - Input for updating ideas
- `IdeaWithCreator` - Idea with populated creator info
- `IdeaSortOption` - Sorting options (votes, date, title)
- `IdeaSortDirection` - Sort direction (asc, desc)

### 3. API Routes

#### `/api/ideas` - List and Create Ideas

**GET**
- Query params: `projectId`, `sortBy`, `sortDirection`, `status`
- Returns: Array of ideas with creator info
- Auth: Required (project member)
- Features:
  - Sorting by votes, date, or title
  - Filtering by status
  - Auto-includes creator details

**POST**
- Body: `{ title, description?, projectId }`
- Returns: Created idea with creator
- Auth: Required (project member)
- Validation: Title required (1-200 chars)

#### `/api/ideas/[id]` - Individual Idea Operations

**GET**
- Returns: Idea with creator info
- Auth: Required (project member)

**PUT**
- Body: `{ title?, description?, status? }`
- Returns: Updated idea
- Auth: Required (creator or project admin/owner)
- Permissions: Only creator or admin can update

**DELETE**
- Returns: `{ success: true }`
- Auth: Required (creator or project admin/owner)
- Permissions: Only creator or admin can delete

#### `/api/ideas/[id]/vote` - Vote on Ideas

**POST**
- Body: `{ action: 'upvote' | 'downvote' }`
- Returns: Updated idea with new vote count
- Auth: Required (project member)
- Logic: Increments/decrements votes by 1

#### `/api/ideas/[id]/convert` - Convert to Feature

**POST**
- Body: `{ priority?: MoscowPriority, phaseId?: string }`
- Returns: `{ idea, feature }`
- Auth: Required (project admin/owner only)
- Logic:
  - Auto-assigns priority based on votes if not provided:
    - 10+ votes → MUST
    - 5-9 votes → SHOULD
    - 2-4 votes → COULD
    - 0-1 votes → SHOULD
  - Creates Feature with same title/description
  - Updates Idea status to CONVERTED
  - Uses transaction for atomicity
  - Prevents re-conversion

### 4. UI Components

#### IdeaCard (`/src/components/ideation/idea-card.tsx`)

Features:
- Displays idea title, description, creator, and timestamp
- Vote buttons (up/down) with current vote count
- Status badge with color coding
- Convert to Feature button (admin/owner only)
- Delete button (creator or admin/owner)
- Confirmation dialog for deletion
- Disabled voting after conversion
- Uses shadcn/ui components: Card, Button, Badge, Avatar, AlertDialog

#### NewIdeaForm (`/src/components/ideation/new-idea-form.tsx`)

Features:
- Modal dialog form
- Title input (required, 200 char max with counter)
- Description textarea (optional)
- Form validation
- Toast notifications
- Triggers refresh on successful creation
- Uses shadcn/ui components: Dialog, Input, Textarea, Button, Label

#### IdeationBoard (`/src/components/ideation/ideation-board.tsx`)

Features:
- Tabbed interface for filtering by status:
  - All Ideas
  - Pending
  - Under Review
  - Approved
  - Converted
- Sort controls:
  - Sort by: Votes, Date, Title
  - Sort direction toggle
- Grid layout (responsive: 1/2/3 columns)
- Empty state with call-to-action
- Real-time updates after voting/converting
- Convert dialog with auto-priority explanation
- Role-based permissions
- Uses shadcn/ui components: Tabs, Select, Dialog

### 5. Dashboard Page

File: `/src/app/dashboard/ideation/page.tsx`

Features:
- Server component with auth check
- Fetches user's project and role
- Passes context to IdeationBoard
- Displays empty state if no projects
- Follows same pattern as other dashboard pages

## User Flow

### Creating an Idea
1. User clicks "New Idea" button
2. Modal opens with form
3. User enters title (required) and description (optional)
4. Submits form
5. Idea appears in board with PENDING status
6. Vote count starts at 0

### Voting on Ideas
1. User views idea card
2. Clicks up arrow to upvote (increases by 1)
3. Clicks down arrow to downvote (decreases by 1)
4. Vote count updates immediately
5. Voting disabled after conversion

### Converting to Feature
1. Admin/Owner views high-voted ideas
2. Clicks "Convert to Feature" button
3. Confirmation dialog explains auto-priority
4. Upon confirmation:
   - Feature created in roadmap
   - Idea marked as CONVERTED
   - Vote count preserved for reference
5. Converted ideas remain visible but voting disabled

### Managing Ideas
1. Creator or admin can edit idea details
2. Creator or admin can delete ideas
3. Deletion requires confirmation
4. Ideas can be filtered by status
5. Ideas can be sorted by votes, date, or title

## Security & Permissions

### Project Access
- All operations require project membership
- Verified via `ProjectMember` lookup

### Role-Based Access
- **Viewer/Member**: Can create, vote, view
- **Creator**: Can edit/delete own ideas
- **Admin/Owner**: Can edit/delete any idea, convert to features

### Data Validation
- Zod schemas for all inputs
- Title: 1-200 characters
- Status: Enum validation
- IDs: CUID validation

## Testing

Test file: `/src/__tests__/api/ideas.test.ts`

Coverage:
- ✅ GET /api/ideas (list with filters and sorting)
- ✅ POST /api/ideas (create with validation)
- ✅ GET /api/ideas/[id] (individual fetch)
- ✅ PUT /api/ideas/[id] (update with permissions)
- ✅ DELETE /api/ideas/[id] (delete with permissions)
- ✅ POST /api/ideas/[id]/vote (upvote/downvote)
- ✅ POST /api/ideas/[id]/convert (convert to feature)
- ✅ Auth checks (401 unauthorized)
- ✅ Permission checks (403 forbidden)
- ✅ Validation errors (400 bad request)
- ✅ Not found errors (404)

## Future Enhancements

1. **Idea Comments**: Allow discussion on ideas
2. **Vote History**: Track who voted on what
3. **Idea Categories/Tags**: Organize ideas by type
4. **Batch Operations**: Convert multiple ideas at once
5. **Idea Merging**: Combine similar ideas
6. **Email Notifications**: Notify on status changes
7. **Rich Text Editor**: Better description formatting
8. **Attachments**: Add images/files to ideas
9. **Vote Limits**: Prevent vote manipulation
10. **Analytics**: Most voted ideas, conversion rates

## Files Created

### Database
- `prisma/migrations/20260118234659_add_idea_model/migration.sql`
- Updated `prisma/schema.prisma`

### Types
- `src/types/idea.ts`

### API Routes
- `src/app/api/ideas/route.ts`
- `src/app/api/ideas/[id]/route.ts`
- `src/app/api/ideas/[id]/vote/route.ts`
- `src/app/api/ideas/[id]/convert/route.ts`

### Components
- `src/components/ideation/idea-card.tsx`
- `src/components/ideation/new-idea-form.tsx`
- `src/components/ideation/ideation-board.tsx`

### Pages
- `src/app/dashboard/ideation/page.tsx` (updated)

### Tests
- `src/__tests__/api/ideas.test.ts`

### Documentation
- `docs/phase-10.2-ideation-board-implementation.md`

## Technical Decisions

1. **Vote System**: Simple integer counter (no vote tracking per user yet)
2. **Auto-Priority**: Based on vote count for seamless conversion
3. **Status Workflow**: Manual status changes (no automatic workflow)
4. **Permissions**: Leverages existing ProjectMember roles
5. **Real-time**: Client-side refresh (no WebSocket for now)
6. **Sorting**: Server-side for consistency
7. **Filtering**: Combined client/server for performance

## Known Limitations

1. Users can vote multiple times (no vote tracking)
2. No vote change history
3. No undo for conversions
4. Manual status updates only
5. Single project context (no cross-project ideas)

## Success Metrics

- ✅ All CRUD operations functional
- ✅ Voting system working
- ✅ Conversion to features successful
- ✅ Role-based permissions enforced
- ✅ Comprehensive test coverage
- ✅ Responsive UI
- ✅ Error handling and validation

## Phase Status: ✅ COMPLETED

All requirements from PRD.md Phase 10.2 have been successfully implemented.
