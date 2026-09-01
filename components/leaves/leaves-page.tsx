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
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils/date";
import { Plus, Check, X, Calendar, Clock, FileText, User } from "lucide-react";

interface LeaveRequest {
  id: string;
  employee: { firstName: string; lastName: string; role: string };
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  reviewNote: string | null;
  reviewedAt: string | null;
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
  canSeeAll: boolean;
  canApprove: boolean;
  employeeId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  APPROVED:  "text-green-700 border-green-200 bg-green-50 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900",
  REJECTED:  "text-red-600 border-red-200 bg-red-50 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
  CANCELLED: "text-zinc-500 border-zinc-200 bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
};

function statusLabel(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export function LeavesPage({
  requests,
  total,
  page,
  totalPages,
  leaveTypes,
  balances,
  canSeeAll,
  canApprove,
  employeeId,
}: LeavesPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applyOpen, setApplyOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState<LeaveRequest | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{ id: string; action: "APPROVED" | "REJECTED" } | null>(null);
  const [reviewNote, setReviewNote] = useState("");
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
        body: JSON.stringify({ status, reviewNote: reviewNote || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      toast.success(status === "APPROVED" ? "Request approved" : "Request rejected");
      setReviewTarget(null);
      setReviewNote("");
      setDetailRequest(null);
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setPending(false);
    }
  }

  const colCount = (canSeeAll ? 1 : 0) + 4 + (canApprove ? 1 : 0);

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
          {balances.map((b) => {
            const usedPct = b.totalDays > 0 ? Math.round((b.usedDays / b.totalDays) * 100) : 0;
            return (
              <div key={b.leaveTypeName} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{b.leaveTypeName}</p>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-semibold tabular-nums text-foreground">{b.remainingDays}</p>
                  <p className="text-xs text-muted-foreground">/ {b.totalDays}d</p>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${100 - usedPct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{b.usedDays} day{b.usedDays !== 1 ? "s" : ""} used</p>
              </div>
            );
          })}
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
                {canSeeAll && (
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Employee</th>
                )}
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Type</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Period</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Days</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                {canApprove && (
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="text-center text-muted-foreground py-10 px-4">
                    No leave requests
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => setDetailRequest(req)}
                  >
                    {canSeeAll && (
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
                        {statusLabel(req.status)}
                      </Badge>
                    </td>
                    {canApprove && (
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
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

      {/* Leave detail modal */}
      <Dialog open={!!detailRequest} onOpenChange={(o) => !o && setDetailRequest(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
          </DialogHeader>
          {detailRequest && (
            <div className="space-y-4 pt-1">
              {canSeeAll && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">
                    {detailRequest.employee.firstName} {detailRequest.employee.lastName}
                  </span>
                  <Badge variant="outline" className="text-xs ml-auto capitalize">
                    {detailRequest.employee.role.toLowerCase().replace("_", " ")}
                  </Badge>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Leave Type</p>
                  <p className="font-medium">{detailRequest.leaveType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Duration</p>
                  <p className="font-medium">{detailRequest.totalDays} day{detailRequest.totalDays !== 1 ? "s" : ""}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Start Date</p>
                  <p className="font-medium flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatDate(detailRequest.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">End Date</p>
                  <p className="font-medium flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatDate(detailRequest.endDate)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Applied On</p>
                  <p className="text-muted-foreground text-xs flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(detailRequest.createdAt)}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Reason
                </p>
                <p className="text-sm leading-relaxed">{detailRequest.reason}</p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <Badge variant="outline" className={`text-xs ${STATUS_COLORS[detailRequest.status] || ""}`}>
                  {statusLabel(detailRequest.status)}
                </Badge>
              </div>

              {detailRequest.reviewNote && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Review Note</p>
                    <p className="text-sm leading-relaxed">{detailRequest.reviewNote}</p>
                    {detailRequest.reviewedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Reviewed on {formatDate(detailRequest.reviewedAt)}
                      </p>
                    )}
                  </div>
                </>
              )}

              {canApprove && detailRequest.status === "PENDING" && (
                <>
                  <Separator />
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-green-700 border-green-200 hover:bg-green-50"
                      onClick={() => {
                        setDetailRequest(null);
                        setReviewTarget({ id: detailRequest.id, action: "APPROVED" });
                      }}
                    >
                      <Check className="h-3.5 w-3.5 mr-1.5" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => {
                        setDetailRequest(null);
                        setReviewTarget({ id: detailRequest.id, action: "REJECTED" });
                      }}
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" /> Reject
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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

      {/* Review confirm with optional note */}
      <AlertDialog open={!!reviewTarget} onOpenChange={(o) => { if (!o) { setReviewTarget(null); setReviewNote(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {reviewTarget?.action === "APPROVED" ? "Approve" : "Reject"} Leave Request?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {reviewTarget?.action === "REJECTED"
                ? "Provide a reason for rejection (optional)."
                : "Confirm approval of this leave request."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {reviewTarget?.action === "REJECTED" && (
            <div className="px-0 pb-2">
              <Textarea
                placeholder="Review note (optional)…"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => reviewTarget && handleReview(reviewTarget.action)}
              disabled={pending}
              className={reviewTarget?.action === "REJECTED" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {reviewTarget?.action === "APPROVED" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
