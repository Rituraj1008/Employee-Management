"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatDate } from "@/lib/utils/date";
import { Plus, Check, X } from "lucide-react";

interface LeaveRequest {
  id: string;
  employee: { firstName: string; lastName: string };
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  createdAt: string;
}

interface LeaveBalance {
  leaveTypeName: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

interface LeavesPageProps {
  requests: LeaveRequest[];
  total: number;
  page: number;
  totalPages: number;
  leaveTypes: { id: string; name: string }[];
  balances: LeaveBalance[];
  isManagerOrAbove: boolean;
  employeeId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-amber-600 border-amber-200 bg-amber-50",
  APPROVED: "text-green-700 border-green-200 bg-green-50",
  REJECTED: "text-red-600 border-red-200 bg-red-50",
  CANCELLED: "text-zinc-500 border-zinc-200 bg-zinc-50",
};

export function LeavesPage({
  requests,
  total,
  page,
  totalPages,
  leaveTypes,
  balances,
  isManagerOrAbove,
  employeeId,
}: LeavesPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applyOpen, setApplyOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ id: string; action: "APPROVED" | "REJECTED" } | null>(null);
  const [pending, setPending] = useState(false);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/leaves?${params.toString()}`);
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/leaves?${params.toString()}`);
  }

  async function handleApply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());

    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to apply");
        return;
      }
      toast.success("Leave request submitted");
      setApplyOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setPending(false);
    }
  }

  async function handleReview(status: "APPROVED" | "REJECTED") {
    if (!reviewTarget) return;
    setPending(true);
    try {
      const res = await fetch(`/api/leaves/${reviewTarget.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      toast.success(status === "APPROVED" ? "Request approved" : "Request rejected");
      setReviewTarget(null);
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Leaves</h2>
          <p className="text-sm text-muted-foreground">{total} requests</p>
        </div>
        {employeeId && (
          <Button size="sm" onClick={() => setApplyOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Apply Leave
          </Button>
        )}
      </div>

      {/* Leave balances */}
      {balances.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {balances.map((b) => (
            <div key={b.leaveTypeName} className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">{b.leaveTypeName}</p>
              <p className="text-xl font-semibold tabular-nums">{b.remainingDays}</p>
              <p className="text-xs text-muted-foreground">{b.usedDays} used of {b.totalDays}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div>
        <Select
          defaultValue={searchParams.get("status") || "all"}
          onValueChange={(v) => updateFilter("status", v)}
        >
          <SelectTrigger className="h-8 text-sm w-auto min-w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {isManagerOrAbove && (
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Employee</th>
                )}
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Type</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Period</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Days</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                {isManagerOrAbove && (
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={isManagerOrAbove ? 6 : 4} className="text-center text-muted-foreground py-10 px-4">
                    No leave requests
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                    {isManagerOrAbove && (
                      <td className="px-4 py-3 whitespace-nowrap font-medium">
                        {req.employee.firstName} {req.employee.lastName}
                      </td>
                    )}
                    <td className="px-4 py-3 text-muted-foreground">{req.leaveType}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatDate(req.startDate)} – {formatDate(req.endDate)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{req.totalDays}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${STATUS_COLORS[req.status] || ""}`}>
                        {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
                      </Badge>
                    </td>
                    {isManagerOrAbove && (
                      <td className="px-4 py-3">
                        {req.status === "PENDING" && (
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => setReviewTarget({ id: req.id, action: "APPROVED" })}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setReviewTarget({ id: req.id, action: "REJECTED" })}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => goToPage(page - 1)} disabled={page <= 1}>Previous</Button>
              <Button size="sm" variant="outline" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Apply dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleApply} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Leave Type</Label>
              <Select name="leaveTypeId" required>
                <SelectTrigger><SelectValue placeholder="Select type…" /></SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" name="startDate" type="date" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" name="endDate" type="date" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason</Label>
              <Textarea id="reason" name="reason" rows={3} required minLength={10} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Submitting…" : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Review confirm */}
      <AlertDialog open={!!reviewTarget} onOpenChange={(o) => !o && setReviewTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {reviewTarget?.action === "APPROVED" ? "Approve" : "Reject"} Leave Request?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => reviewTarget && handleReview(reviewTarget.action)}
              className={reviewTarget?.action === "REJECTED" ? "bg-destructive text-destructive-foreground" : ""}
            >
              {reviewTarget?.action === "APPROVED" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
