"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Loader2Icon, TrashIcon, MailIcon, UserPlusIcon } from "lucide-react"

const inviteMemberSchema = z.object({
  email: z.string().email("Must be a valid email address"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"], {
    message: "Please select a role",
  }),
})

type InviteMemberFormData = z.infer<typeof inviteMemberSchema>

interface TeamMember {
  id: string
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
  createdAt: string
}

interface TeamMembersProps {
  projectId: string
  members: TeamMember[]
  currentUserId: string
  onUpdate?: () => void
}

const roleColors = {
  OWNER: "default",
  ADMIN: "destructive",
  MEMBER: "secondary",
  VIEWER: "outline",
} as const

const roleLabels = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
}

export function TeamMembers({
  projectId,
  members,
  currentUserId,
  onUpdate,
}: TeamMembersProps) {
  const [isInviting, setIsInviting] = React.useState(false)
  const [removingMemberId, setRemovingMemberId] = React.useState<string | null>(
    null
  )
  const [memberToRemove, setMemberToRemove] = React.useState<TeamMember | null>(
    null
  )

  const form = useForm<InviteMemberFormData>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      role: "MEMBER",
    },
  })

  const currentMember = members.find((m) => m.user.id === currentUserId)
  const canInvite = currentMember?.role === "OWNER" || currentMember?.role === "ADMIN"
  const canRemove = (targetMember: TeamMember) => {
    if (targetMember.role === "OWNER") return false
    if (targetMember.user.id === currentUserId) return false
    if (currentMember?.role === "OWNER") return true
    if (currentMember?.role === "ADMIN" && (targetMember.role === "MEMBER" || targetMember.role === "VIEWER")) return true
    return false
  }

  const onInvite = async (data: InviteMemberFormData) => {
    try {
      setIsInviting(true)

      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          role: data.role,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to invite member")
      }

      toast.success("Member invited successfully")
      form.reset()
      onUpdate?.()
    } catch (error) {
      console.error("Error inviting member:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to invite member"
      )
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove) return

    try {
      setRemovingMemberId(memberToRemove.id)

      const response = await fetch(
        `/api/projects/${projectId}/members/${memberToRemove.id}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to remove member")
      }

      toast.success("Member removed successfully")
      setMemberToRemove(null)
      onUpdate?.()
    } catch (error) {
      console.error("Error removing member:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to remove member"
      )
    } finally {
      setRemovingMemberId(null)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage who has access to this project and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {canInvite && (
            <div className="rounded-lg border border-border/50 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <UserPlusIcon className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Invite New Member</h3>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onInvite)}
                  className="flex gap-3"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <div className="relative">
                            <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="email@example.com"
                              className="pl-9"
                              {...field}
                              disabled={isInviting}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isInviting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="MEMBER">Member</SelectItem>
                              <SelectItem value="VIEWER">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isInviting}>
                    {isInviting && (
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Invite
                  </Button>
                </form>
              </Form>
            </div>
          )}

          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 rounded-lg border border-border/50 p-4"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.user.image || undefined} />
                  <AvatarFallback>
                    {getInitials(member.user.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {member.user.name || "Unknown User"}
                    {member.user.id === currentUserId && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (You)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {member.user.email || "No email"}
                  </p>
                </div>

                <Badge variant={roleColors[member.role]}>
                  {roleLabels[member.role]}
                </Badge>

                {canRemove(member) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMemberToRemove(member)}
                    disabled={removingMemberId === member.id}
                    className="text-muted-foreground hover:text-cyan-400 active:text-cyan-400"
                  >
                    {removingMemberId === member.id ? (
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                      <TrashIcon className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            ))}

            {members.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No team members yet. Invite someone to get started!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToRemove?.user.name} from
              this project? They will lose access to all project resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
