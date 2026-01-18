# Projects API Documentation

## Overview
RESTful API routes for managing projects and project members.

## Authentication
All endpoints require authentication via Auth.js session. Unauthorized requests return `401`.

## Endpoints

### List Projects
**GET** `/api/projects`

Returns all projects where the current user is a member.

**Response:** `200 OK`
```json
[
  {
    "id": "cuid",
    "name": "Project Name",
    "description": "Optional description",
    "targetPath": "/path/to/project",
    "githubRepo": "org/repo",
    "members": [
      {
        "id": "cuid",
        "role": "OWNER",
        "userId": "cuid",
        "projectId": "cuid",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "user": {
          "id": "cuid",
          "name": "User Name",
          "email": "user@example.com",
          "image": "https://..."
        }
      }
    ],
    "_count": {
      "tasks": 0,
      "terminals": 0,
      "worktrees": 0
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Create Project
**POST** `/api/projects`

Create a new project. The creator automatically becomes the OWNER.

**Request Body:**
```json
{
  "name": "Project Name",
  "description": "Optional description",
  "targetPath": "/path/to/project",
  "githubRepo": "org/repo"
}
```

**Validation:**
- `name`: Required, 1-255 characters
- `description`: Optional string
- `targetPath`: Optional string
- `githubRepo`: Optional string

**Response:** `201 Created`
```json
{
  "id": "cuid",
  "name": "Project Name",
  "description": "Optional description",
  "targetPath": "/path/to/project",
  "githubRepo": "org/repo",
  "members": [
    {
      "id": "cuid",
      "role": "OWNER",
      "userId": "cuid",
      "projectId": "cuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "user": {
        "id": "cuid",
        "name": "Creator Name",
        "email": "creator@example.com",
        "image": "https://..."
      }
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error:** `400 Bad Request` - Validation errors

---

### Get Project
**GET** `/api/projects/[id]`

Get a single project with all members and counts.

**Authorization:** User must be a member of the project.

**Response:** `200 OK`
```json
{
  "id": "cuid",
  "name": "Project Name",
  "description": "Optional description",
  "targetPath": "/path/to/project",
  "githubRepo": "org/repo",
  "members": [...],
  "_count": {
    "tasks": 0,
    "features": 0,
    "phases": 0,
    "terminals": 0,
    "memories": 0,
    "mcpConfigs": 0,
    "worktrees": 0
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Errors:**
- `403 Forbidden` - User is not a member
- `404 Not Found` - Project does not exist

---

### Update Project
**PUT** `/api/projects/[id]`

Update project details.

**Authorization:** User must be OWNER or ADMIN.

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "targetPath": "/new/path",
  "githubRepo": "org/new-repo"
}
```

**Validation:**
- All fields are optional
- `name`: 1-255 characters if provided

**Response:** `200 OK` (same structure as Create Project)

**Errors:**
- `400 Bad Request` - Validation errors
- `403 Forbidden` - User is not OWNER/ADMIN

---

### Delete Project
**DELETE** `/api/projects/[id]`

Permanently delete a project.

**Authorization:** Only the project OWNER can delete.

**Response:** `200 OK`
```json
{
  "success": true
}
```

**Error:** `403 Forbidden` - User is not the OWNER

---

## Members Endpoints

### List Members
**GET** `/api/projects/[id]/members`

Get all members of a project.

**Authorization:** User must be a member of the project.

**Response:** `200 OK`
```json
[
  {
    "id": "cuid",
    "role": "OWNER",
    "userId": "cuid",
    "projectId": "cuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "user": {
      "id": "cuid",
      "name": "User Name",
      "email": "user@example.com",
      "image": "https://..."
    }
  }
]
```

**Error:** `403 Forbidden` - User is not a member

---

### Add Member
**POST** `/api/projects/[id]/members`

Add a new member to the project by email.

**Authorization:** User must be OWNER or ADMIN.

**Request Body:**
```json
{
  "email": "newmember@example.com",
  "role": "MEMBER"
}
```

**Validation:**
- `email`: Required, valid email format
- `role`: Optional, one of `OWNER`, `ADMIN`, `MEMBER`, `VIEWER` (defaults to `MEMBER`)

**Business Rules:**
- User with the email must already exist in the system
- User cannot already be a member of the project
- Only OWNER can add other OWNERs
- ADMIN cannot add OWNERs

**Response:** `201 Created`
```json
{
  "id": "cuid",
  "role": "MEMBER",
  "userId": "cuid",
  "projectId": "cuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "user": {
    "id": "cuid",
    "name": "New Member",
    "email": "newmember@example.com",
    "image": "https://..."
  }
}
```

**Errors:**
- `400 Bad Request` - Validation errors or user already member
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - User with email not found

---

### Remove Member
**DELETE** `/api/projects/[id]/members`

Remove a member from the project.

**Authorization:** User must be OWNER or ADMIN.

**Request Body:**
```json
{
  "userId": "cuid"
}
```

**Validation:**
- `userId`: Required, valid CUID

**Business Rules:**
- Cannot remove the last OWNER
- Only OWNER can remove another OWNER
- ADMIN cannot remove OWNER

**Response:** `200 OK`
```json
{
  "success": true
}
```

**Errors:**
- `400 Bad Request` - Cannot remove last owner
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Member not found in project

---

## Role Hierarchy

| Role | Create | Read | Update | Delete | Add Members | Remove Members |
|------|--------|------|--------|--------|-------------|----------------|
| OWNER | ✓ | ✓ | ✓ | ✓ | ✓ (any role) | ✓ (any role) |
| ADMIN | - | ✓ | ✓ | - | ✓ (except OWNER) | ✓ (except OWNER) |
| MEMBER | - | ✓ | - | - | - | - |
| VIEWER | - | ✓ | - | - | - | - |

---

## Error Response Format

All errors follow this structure:

```json
{
  "error": "Error message" | [ZodValidationError]
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error
