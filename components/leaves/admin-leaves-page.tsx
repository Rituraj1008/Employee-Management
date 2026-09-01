"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils/date";
import {
  Search, Check, X, Calendar, Clock, FileText, User,
  Building2, Briefcase, CalendarDays, ChevronLeft, ChevronRight,
  ClipboardList, CheckCircle2, XCircle, Timer,
} from "lucide-react";

/* ── Types ── */

interface AdminLeaveRequest {
  id: string;
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    role: string;
    department: string | null;
    designation: string | null;
    joiningDate: string;
  };
  leaveType: { id: string; name: string };
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface EmployeeProfile {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string | null;
  designation: string | null;
  joiningDate: string;
  balances: { leaveTypeName: string; totalDays: number; usedDays: number; remainingDays: number }[];
}

interface AdminLeavesPageProps {
  requests: AdminLeaveRequest[];
  total: number;
  page: number;
  totalPages: number;
  leaveTypes: { id: string; name: string }[];
  statusCounts: { PENDING: number; APPROVED: number; REJECTED: number; CANCELLED: number };
}

/* ── Constants ── */

const STATUS_STYLES: Record<string, string> = {
  PENDING:   "text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  APPROVED:  "text-emerald-700 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
  REJECTED:  "text-red-600 border-red-200 bg-red-50 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
  CANCELLED: "text-zinc-500 border-zinc-200 bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
};

const ROLE_STYLES: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  HR:          "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
  MANAGER:     "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  EMPLOYEE:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
};

function roleLabel(r: string) {
  return r === "SUPER_ADMIN" ? "Super Admin" : r.charAt(0) + r.slice(1).toLowerCase();
}

function statusLabel(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

/* ── Avatar ── */
function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-14 w-14 text-lg" : size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <div className={`${sizeClass} rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 border border-primary/20`}>
      {name}
    </div>
  );
}

/* ── Main component ── */

export function AdminLeavesPage({
  requests,
  total,
  page,
  totalPages,
  leaveTypes,
  statusCounts,
}: AdminLeavesPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedRequest, setSelectedRequest] = useState<AdminLeaveRequest | null>(null);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ id: string; action: "APPROVED" | "REJECTED" } | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ── Filtering ── */
  function setParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") p.set(key, value);
    else p.delete(key);
    p.delete("page");
    router.push(`/leaves?${p.toString()}`);
  }

  function goToPage(n: number) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("page", String(n));
    router.push(`/leaves?${p.toString()}`);
  }

  /* ── Open detail ── */
  async function openDetail(req: AdminLeaveRequest) {
    setSelectedRequest(req);
    setProfile(null);
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/leaves/employee/${req.employee.id}`);
      const data = await res.json();
      if (res.ok) setProfile(data.data);
    } catch {
      // non-critical
    } finally {
      setProfileLoading(false);
    }
  }

  /* ── Review ── */
  async function handleReview(status: "APPROVED" | "REJECTED") {
    if (!reviewTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/leaves/${reviewTarget.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote: reviewNote || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed"); return; }
      toast.success(status === "APPROVED" ? "Leave approved" : "Leave rejected");
      setReviewTarget(null);
      setReviewNote("");
      setSelectedRequest(null);
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  const pendingCount = statusCounts.PENDING;
  const currentStatus = searchParams.get("status") || "all";
  const currentType = searchParams.get("type") || "all";
  const currentSearch = searchParams.get("search") || "";

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-base font-semibold">Leave Management</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Review and approve leave requests across your organisation
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Timer className="h-4 w-4" />}
          label="Pending"
          value={statusCounts.PENDING}
          color="amber"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Approved"
          value={statusCounts.APPROVED}
          color="emerald"
        />
        <StatCard
          icon={<XCircle className="h-4 w-4" />}
          label="Rejected"
          value={statusCounts.REJECTED}
          color="red"
        />
        <StatCard
          icon={<ClipboardList className="h-4 w-4" />}
          label="Total"
          value={statusCounts.PENDING + statusCounts.APPROVED + statusCounts.REJECTED + statusCounts.CANCELLED}
          color="primary"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="Search employee…"
            defaultValue={currentSearch}
            onKeyDown={(e) => {
              if (e.key === "Enter") setParam("search", (e.target as HTMLInputElement).value);
            }}
            onBlur={(e) => setParam("search", e.target.value)}
          />
        </div>

        <Select defaultValue={currentStatus} onValueChange={(v) => setParam("status", v)}>
          <SelectTrigger className="h-8 text-sm w-auto min-w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending {pendingCount > 0 ? `(${pendingCount})` : ""}</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue={currentType} onValueChange={(v) => setParam("type", v)}>
          <SelectTrigger className="h-8 text-sm w-auto min-w-36">
            <SelectValue placeholder="Leave Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {leaveTypes.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-xs text-muted-foreground ml-auto">{total} request{total !== 1 ? "s" : ""}</span>
      </div>

      {/* List */}
      <div className="space-y-2">
        {requests.length === 0 ? (
          <EmptyState />
        ) : (
          requests.map((req) => (
            <LeaveCard
              key={req.id}
              request={req}
              onClick={() => openDetail(req)}
              onApprove={(e) => { e.stopPropagation(); setReviewTarget({ id: req.id, action: "APPROVED" }); }}
              onReject={(e) => { e.stopPropagation(); setReviewTarget({ id: req.id, action: "REJECTED" }); }}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-1.5">
            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail sheet */}
      <Sheet open={!!selectedRequest} onOpenChange={(o) => { if (!o) setSelectedRequest(null); }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto" side="right">
          {selectedRequest && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle>Leave Request</SheetTitle>
              </SheetHeader>

              {/* Employee profile */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar
                    name={initials(selectedRequest.employee.firstName, selectedRequest.employee.lastName)}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm leading-snug">
                      {selectedRequest.employee.firstName} {selectedRequest.employee.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{selectedRequest.employee.employeeCode}</p>
                    <span className={`mt-1.5 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[selectedRequest.employee.role] ?? ""}`}>
                      {roleLabel(selectedRequest.employee.role)}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-y-2.5 text-xs">
                  {selectedRequest.employee.department && (
                    <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span>{selectedRequest.employee.department}</span>
                      {selectedRequest.employee.designation && (
                        <>
                          <span className="text-border">·</span>
                          <Briefcase className="h-3.5 w-3.5 shrink-0" />
                          <span>{selectedRequest.employee.designation}</span>
                        </>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    <span>Joined {formatDate(selectedRequest.employee.joiningDate)}</span>
                  </div>
                </div>

                {/* Leave balances */}
                <Separator />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Leave Balance {new Date().getFullYear()}</p>

                {profileLoading ? (
                  <div className="space-y-2.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-1.5 w-full rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : profile && profile.balances.length > 0 ? (
                  <div className="space-y-2.5">
                    {profile.balances.map((b) => {
                      const usedPct = b.totalDays > 0 ? Math.round((b.usedDays / b.totalDays) * 100) : 0;
                      const remainPct = 100 - usedPct;
                      return (
                        <div key={b.leaveTypeName} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-foreground font-medium">{b.leaveTypeName}</span>
                            <span className="text-muted-foreground tabular-nums">
                              {b.remainingDays} / {b.totalDays} left
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${remainPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : !profileLoading ? (
                  <p className="text-xs text-muted-foreground">No leave balance data</p>
                ) : null}
              </div>

              {/* Request details */}
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Request Details</span>
                  <Badge variant="outline" className={`text-xs ${STATUS_STYLES[selectedRequest.status] ?? ""}`}>
                    {statusLabel(selectedRequest.status)}
                  </Badge>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <DetailField label="Leave Type" value={selectedRequest.leaveType.name} />
                    <DetailField label="Duration" value={`${selectedRequest.totalDays} day${selectedRequest.totalDays !== 1 ? "s" : ""}`} />
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Start Date</p>
                      <p className="font-medium flex items-center gap-1.5 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatDate(selectedRequest.startDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">End Date</p>
                      <p className="font-medium flex items-center gap-1.5 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatDate(selectedRequest.endDate)}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" /> Reason
                    </p>
                    <p className="text-sm leading-relaxed">{selectedRequest.reason}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Applied on {formatDate(selectedRequest.createdAt)}
                  </div>
                </div>

                {/* Review note (if already reviewed) */}
                {selectedRequest.reviewNote && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Review Note</p>
                    <p className="leading-relaxed">{selectedRequest.reviewNote}</p>
                    {selectedRequest.reviewedAt && (
                      <p className="text-xs text-muted-foreground">
                        Reviewed {formatDate(selectedRequest.reviewedAt)}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                {selectedRequest.status === "PENDING" && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(null);
                        setReviewTarget({ id: selectedRequest.id, action: "APPROVED" });
                      }}
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button
                      className="flex-1 gap-1.5"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRequest(null);
                        setReviewTarget({ id: selectedRequest.id, action: "REJECTED" });
                      }}
                    >
                      <X className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-red-600">Reject</span>
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Review confirm */}
      <AlertDialog
        open={!!reviewTarget}
        onOpenChange={(o) => { if (!o) { setReviewTarget(null); setReviewNote(""); } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {reviewTarget?.action === "APPROVED" ? "Approve Leave Request?" : "Reject Leave Request?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {reviewTarget?.action === "APPROVED"
                ? "This will approve the leave and deduct from the employee's leave balance."
                : "Provide a reason for rejection (optional)."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-0 pb-2">
            <Textarea
              placeholder={reviewTarget?.action === "APPROVED" ? "Note (optional)…" : "Reason for rejection (optional)…"}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={() => reviewTarget && handleReview(reviewTarget.action)}
              className={
                reviewTarget?.action === "REJECTED"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }
            >
              {submitting ? "Processing…" : reviewTarget?.action === "APPROVED" ? "Yes, Approve" : "Yes, Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ── Sub-components ── */

function StatCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "amber" | "emerald" | "red" | "primary";
}) {
  const colorMap = {
    amber:   { bg: "bg-amber-50 dark:bg-amber-950/30",   icon: "text-amber-500",   num: "text-amber-700 dark:text-amber-400" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: "text-emerald-500", num: "text-emerald-700 dark:text-emerald-400" },
    red:     { bg: "bg-red-50 dark:bg-red-950/30",       icon: "text-red-500",     num: "text-red-700 dark:text-red-400" },
    primary: { bg: "bg-primary/5",                       icon: "text-primary",     num: "text-primary" },
  }[color];

  return (
    <div className={`rounded-xl border border-border ${colorMap.bg} p-4 flex items-start gap-3`}>
      <div className={`mt-0.5 ${colorMap.icon}`}>{icon}</div>
      <div>
        <p className={`text-xl font-semibold tabular-nums ${colorMap.num}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function LeaveCard({
  request,
  onClick,
  onApprove,
  onReject,
}: {
  request: AdminLeaveRequest;
  onClick: () => void;
  onApprove: (e: React.MouseEvent) => void;
  onReject: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className="rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer p-4"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar
          name={initials(request.employee.firstName, request.employee.lastName)}
          size="sm"
        />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug">
                {request.employee.firstName} {request.employee.lastName}
                <span className="text-xs text-muted-foreground ml-1.5">{request.employee.employeeCode}</span>
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_STYLES[request.employee.role] ?? ""}`}>
                  {roleLabel(request.employee.role)}
                </span>
                {request.employee.department && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> {request.employee.department}
                  </span>
                )}
              </div>
            </div>

            <Badge variant="outline" className={`text-xs shrink-0 ${STATUS_STYLES[request.status] ?? ""}`}>
              {statusLabel(request.status)}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{request.leaveType.name}</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(request.startDate)} – {formatDate(request.endDate)}
            </span>
            <span className="font-medium text-foreground">
              {request.totalDays} day{request.totalDays !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1 ml-auto">
              <Clock className="h-3 w-3" />
              {formatDate(request.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Pending actions row */}
      {request.status === "PENDING" && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          <Button
            size="sm"
            className="flex-1 h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={onApprove}
          >
            <Check className="h-3 w-3" /> Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-7 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 dark:border-red-900"
            onClick={onReject}
          >
            <X className="h-3 w-3" /> Reject
          </Button>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <ClipboardList className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No leave requests found</p>
      <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
    </div>
  );
}
