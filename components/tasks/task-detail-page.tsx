"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, formatRelative } from "@/lib/utils/date";
import { ArrowLeft, Send } from "lucide-react";

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-red-50 text-red-700 border-red-200",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  MEDIUM: "bg-blue-50 text-blue-700 border-blue-200",
  LOW: "bg-zinc-50 text-zinc-600 border-zinc-200",
};

const STATUS_COLORS: Record<string, string> = {
  TODO: "bg-zinc-50 text-zinc-600 border-zinc-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  IN_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
};

interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

interface TaskDetailPageProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: string | null;
    createdAt: string;
    createdBy: { id: string; name: string };
    assignedTo: { id: string; name: string } | null;
    comments: Comment[];
  };
  canManage: boolean;
  assignableUsers: { id: string; name: string }[];
  currentUserId: string;
  employeeId?: string;
}

export function TaskDetailPage({
  task,
  canManage,
  assignableUsers,
  currentUserId,
  employeeId,
}: TaskDetailPageProps) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [commentPending, setCommentPending] = useState(false);

  async function handleStatusChange(status: string) {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        toast.error("Failed to update status");
        return;
      }
      toast.success("Status updated");
      router.refresh();
    } catch {
      toast.error("Network error");
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || !employeeId) return;
    setCommentPending(true);

    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to post comment");
        return;
      }
      setComment("");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setCommentPending(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-base font-semibold flex-1">{task.title}</h2>
      </div>

      {/* Metadata */}
      <div className="rounded-lg border bg-card divide-y">
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-sm text-muted-foreground w-28 shrink-0">Status</span>
          <Select defaultValue={task.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-7 w-auto border-0 shadow-none px-0 text-right">
              <Badge variant="outline" className={`text-xs ${STATUS_COLORS[task.status] || ""}`}>
                {task.status.replace("_", " ")}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="IN_REVIEW">In Review</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-sm text-muted-foreground w-28 shrink-0">Priority</span>
          <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[task.priority] || ""}`}>
            {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
          </Badge>
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-sm text-muted-foreground w-28 shrink-0">Assignee</span>
          <span className="text-sm">{task.assignedTo?.name || "Unassigned"}</span>
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-sm text-muted-foreground w-28 shrink-0">Created by</span>
          <span className="text-sm">{task.createdBy.name}</span>
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-sm text-muted-foreground w-28 shrink-0">Due date</span>
          <span className="text-sm">{task.dueDate ? formatDate(task.dueDate) : "—"}</span>
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-sm text-muted-foreground w-28 shrink-0">Created</span>
          <span className="text-sm text-muted-foreground">{formatRelative(task.createdAt)}</span>
        </div>
      </div>

      {task.description && (
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm font-medium mb-2">Description</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
        </div>
      )}

      {/* Comments */}
      <div>
        <h3 className="text-sm font-medium mb-3">Comments ({task.comments.length})</h3>
        <div className="space-y-3 mb-4">
          {task.comments.length === 0 && (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          )}
          {task.comments.map((c) => (
            <div key={c.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">{c.author}</span>
                <span className="text-xs text-muted-foreground">{formatRelative(c.createdAt)}</span>
              </div>
              <p className="text-sm">{c.content}</p>
            </div>
          ))}
        </div>

        {employeeId && (
          <form onSubmit={handleComment} className="flex gap-2">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment…"
              rows={2}
              className="resize-none text-sm"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!comment.trim() || commentPending}
              className="shrink-0 self-end"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
