"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  LogOut,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
  XCircle,
  AlertTriangle,
  Grid3X3,
  Trash2,
  Ban,
  Pause,
  Play,
  Plus,
  Edit3,
  ChevronUp,
  ChevronDown,
  ListTodo,
} from "lucide-react";
import type { CampaignSnapshot, CampaignTask } from "@/types/gtd";
import { DEFAULT_CAMPAIGN_TASKS } from "@/types/gtd";

interface OverviewMetrics {
  totalUsers: number;
  totalPuzzlesGenerated: number;
  totalPuzzlesSolved: number;
  totalClaimsSubmitted: number;
  pendingVerification: number;
  pendingInitialReview: number;
  proofRequestedCount: number;
  approvedUsers: number;
  rejectedUsers: number;
  remainingSpots: number;
  occupiedSpots: number;
  maxWinners: number;
  campaignStatus: string;
}

interface AdminSubmissionRow {
  id: string;
  submissionCode: string;
  winnerId: string | null;
  twitterUsername: string;
  displayUsername: string;
  walletAddress: string;
  puzzleId: string;
  puzzleGridSize: number;
  puzzleStatus: string;
  puzzleCompletedAt: string | null;
  puzzleAttempts: number;
  commentPostUrl?: string | null;
  announcementPostUrl: string;
  proofLinks: string[];
  tasksConfirmed: boolean;
  followVerified: boolean;
  likeVerified: boolean;
  retweetVerified: boolean;
  commentVerified: boolean;
  announcementVerified: boolean;
  verifiedChecksCount: number;
  status: string;
  ipAddress?: string | null;
  ipSubmissionsCount?: number;
  isIpBlocked?: boolean;
  adminNotes: string | null;
  rejectionReason: string | null;
  reservedAt: string;
  reviewedAt: string | null;
  reviewedByEmail: string | null;
}

interface AuditLogRow {
  id: string;
  action: string;
  notes: string | null;
  createdAt: string;
  adminEmail: string;
  submission: {
    submissionCode: string;
    user: { displayUsername: string };
  } | null;
}

export function AdminPuzzleDashboard({ email }: { email: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "submissions" | "tasks" | "settings" | "audit"
  >("submissions");

  // Tasks Management state
  const [tasks, setTasks] = useState<CampaignTask[]>(DEFAULT_CAMPAIGN_TASKS);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksSaving, setTasksSaving] = useState(false);
  const [tasksMsg, setTasksMsg] = useState<string | null>(null);
  const [tasksError, setTasksError] = useState<string | null>(null);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
  const [taskForm, setTaskForm] = useState<CampaignTask>({
    id: "",
    title: "",
    actionLabel: "OPEN LINK",
    actionUrl: "https://x.com/Buzquitos",
    isRequired: true,
    needsUrlInput: false,
    urlInputPlaceholder: "https://x.com/username/status/...",
    urlInputDescription: "Paste proof URL here.",
  });

  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [campaign, setCampaign] = useState<CampaignSnapshot | null>(null);
  const [submissions, setSubmissions] = useState<AdminSubmissionRow[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [searchQ, setSearchQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [selectedSub, setSelectedSub] = useState<AdminSubmissionRow | null>(null);
  const [checks, setChecks] = useState({
    followVerified: false,
    likeVerified: false,
    retweetVerified: false,
    commentVerified: false,
    announcementVerified: false,
  });
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [proofRequestNote, setProofRequestNote] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<string | null>(null);

  const [settingsForm, setSettingsForm] = useState({
    name: "",
    officialTwitterUrl: "",
    officialTwitterHandle: "",
    pinnedPostUrl: "",
    requiredHashtags: "",
    defaultGridSize: 3 as 3 | 9,
    maxWinners: 500,
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [blockedIps, setBlockedIps] = useState<string[]>([]);

  const loadOverview = useCallback(async () => {
    const res = await fetch("/api/gtd/admin/overview", { cache: "no-store" });
    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setOverview(data.overview);
      setCampaign(data.campaign);
      if (data.campaign) {
        setSettingsForm({
          name: data.campaign.name,
          officialTwitterUrl: data.campaign.officialTwitterUrl,
          officialTwitterHandle: data.campaign.officialTwitterHandle,
          pinnedPostUrl: data.campaign.pinnedPostUrl,
          requiredHashtags: data.campaign.requiredHashtags,
          defaultGridSize: data.campaign.defaultGridSize === 9 ? 9 : 3,
          maxWinners: data.campaign.maxWinners,
        });
      }
    }
  }, [router]);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: String(page),
        pageSize: "20",
      });
      if (searchQ.trim()) params.set("q", searchQ.trim());
      const res = await fetch(`/api/gtd/admin/submissions?${params.toString()}`, {
        cache: "no-store",
      });
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions ?? []);
        if (Array.isArray(data.blockedIps)) setBlockedIps(data.blockedIps);
        setTotalSubmissions(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, searchQ, router]);

  const loadAuditLogs = useCallback(async () => {
    const res = await fetch("/api/gtd/admin/audit-logs", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setAuditLogs(data.logs ?? []);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    setTasksError(null);
    try {
      const res = await fetch("/api/gtd/admin/tasks", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tasks)) {
          setTasks(data.tasks);
        }
      }
    } catch {
      setTasksError("Failed to load verification tasks.");
    } finally {
      setTasksLoading(false);
    }
  }, []);

  async function handleSaveTasksList(updatedList: CampaignTask[]) {
    setTasksSaving(true);
    setTasksMsg(null);
    setTasksError(null);
    try {
      const res = await fetch("/api/gtd/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: updatedList }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTasksError(data.error || "Failed to save verification tasks.");
        return;
      }
      setTasks(data.tasks);
      setTasksMsg("Verification tasks updated successfully.");
      setTimeout(() => setTasksMsg(null), 4000);
    } catch {
      setTasksError("Network error while saving tasks.");
    } finally {
      setTasksSaving(false);
    }
  }

  function handleOpenAddTask() {
    setEditingTaskIndex(null);
    setTaskForm({
      id: `task_${Date.now()}`,
      title: "",
      actionLabel: "FOLLOW ON X",
      actionUrl: "https://x.com/Buzquitos",
      isRequired: true,
      needsUrlInput: false,
      urlInputPlaceholder: "https://x.com/username/status/...",
      urlInputDescription: "Paste direct link to your reply or submission.",
    });
    setTaskModalOpen(true);
  }

  function handleOpenEditTask(idx: number) {
    setEditingTaskIndex(idx);
    setTaskForm({ ...tasks[idx] });
    setTaskModalOpen(true);
  }

  function handleDeleteTask(idx: number) {
    if (tasks.length <= 1) {
      alert("At least 1 verification task must remain in the campaign.");
      return;
    }
    if (!confirm(`Are you sure you want to delete task #${idx + 1}: "${tasks[idx].title}"?`)) return;
    const next = tasks.filter((_, i) => i !== idx);
    setTasks(next);
    handleSaveTasksList(next);
  }

  function handleMoveTask(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= tasks.length) return;
    const next = [...tasks];
    const temp = next[idx];
    next[idx] = next[target];
    next[target] = temp;
    setTasks(next);
    handleSaveTasksList(next);
  }

  function handleSaveTaskModal() {
    if (!taskForm.title.trim() || taskForm.title.trim().length < 3) {
      alert("Please provide a task title with at least 3 characters.");
      return;
    }
    let next: CampaignTask[];
    if (editingTaskIndex !== null) {
      next = tasks.map((t, i) => (i === editingTaskIndex ? { ...taskForm } : t));
    } else {
      next = [
        ...tasks,
        {
          ...taskForm,
          id: taskForm.id || `task_${Date.now()}`,
        },
      ];
    }
    setTasks(next);
    setTaskModalOpen(false);
    handleSaveTasksList(next);
  }

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  useEffect(() => {
    if (activeTab === "audit") {
      loadAuditLogs();
    }
  }, [activeTab, loadAuditLogs]);

  useEffect(() => {
    if (activeTab === "tasks") {
      loadTasks();
    }
  }, [activeTab, loadTasks]);

  function openInspector(sub: AdminSubmissionRow) {
    setSelectedSub(sub);
    setChecks({
      followVerified: sub.followVerified,
      likeVerified: sub.likeVerified,
      retweetVerified: sub.retweetVerified,
      commentVerified: sub.commentVerified,
      announcementVerified: sub.announcementVerified,
    });
    setAdminNotes(sub.adminNotes ?? "");
    setRejectionReason(sub.rejectionReason ?? "");
    setProofRequestNote("");
    setModalFeedback(null);
  }

  async function runSubmissionAction(
    action: "UPDATE_CHECKS" | "APPROVE" | "REJECT" | "REQUEST_PROOF"
  ) {
    if (!selectedSub || actionBusy) return;
    setModalFeedback(null);

    if (action === "REJECT" && rejectionReason.trim().length < 3) {
      setModalFeedback("Error: Please enter a clear rejection reason first.");
      return;
    }
    if (action === "REQUEST_PROOF" && proofRequestNote.trim().length < 3) {
      setModalFeedback(
        "Error: Please specify what additional proof the user needs to provide."
      );
      return;
    }

    setActionBusy(true);
    try {
      const payload =
        action === "UPDATE_CHECKS"
          ? { action, ...checks, adminNotes }
          : action === "APPROVE"
            ? { action, ...checks, notes: adminNotes }
            : action === "REJECT"
              ? { action, rejectionReason: rejectionReason.trim(), notes: adminNotes }
              : { action, notes: proofRequestNote.trim() };

      const res = await fetch(`/api/gtd/admin/submissions/${selectedSub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setModalFeedback(`Error: ${data.error || "Action failed."}`);
        return;
      }

      setModalFeedback(
        action === "APPROVE"
          ? `Approved! Assigned Winner ID: ${data.submission?.winnerId ?? "Generated"}`
          : action === "REJECT"
            ? "Submission rejected and provisional spot released back to pool."
            : action === "REQUEST_PROOF"
              ? "Additional proof requested. Provisional spot remains held."
              : "Verification checks and notes saved."
      );

      await Promise.all([loadOverview(), loadSubmissions()]);
      if (action !== "UPDATE_CHECKS") {
        setTimeout(() => setSelectedSub(null), 900);
      }
    } catch {
      setModalFeedback("Error: Network failure.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsMsg(null);
    try {
      const res = await fetch("/api/gtd/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settingsForm,
          maxWinners: Number(settingsForm.maxWinners),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSettingsMsg(`Error: ${data.error || "Failed to save settings."}`);
        return;
      }
      setSettingsMsg("Campaign settings updated successfully.");
      await loadOverview();
    } catch {
      setSettingsMsg("Error: Network error.");
    } finally {
      setSettingsSaving(false);
    }
  }

  async function handleDeleteSubmission(id: string) {
    if (
      !confirm(
        "Are you sure you want to permanently delete this submission? This will release the spot back to the pool."
      )
    )
      return;
    setActionBusy(true);
    try {
      const res = await fetch(`/api/gtd/admin/submissions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSelectedSub(null);
        await Promise.all([loadOverview(), loadSubmissions()]);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to remove submission.");
      }
    } finally {
      setActionBusy(false);
    }
  }

  async function handleToggleBlockIp(ip: string, block: boolean) {
    setActionBusy(true);
    try {
      const res = await fetch(
        `/api/gtd/admin/submissions/${selectedSub?.id || "ip"}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: block ? "BLOCK_IP" : "UNBLOCK_IP",
            ipAddress: ip,
          }),
        }
      );
      if (res.ok) {
        await Promise.all([loadOverview(), loadSubmissions()]);
        if (selectedSub && selectedSub.ipAddress === ip) {
          setSelectedSub((prev) => (prev ? { ...prev, isIpBlocked: block } : null));
        }
      }
    } finally {
      setActionBusy(false);
    }
  }

  async function handleResetTestData() {
    if (
      !confirm(
        "DANGER: This will delete ALL test submissions, test puzzles, and reset spots claimed to 0 / 500. Are you sure?"
      )
    )
      return;
    setSettingsSaving(true);
    try {
      const res = await fetch("/api/gtd/admin/reset-test-data", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        alert("All test data has been wiped! Spots claimed is now 0 / 500.");
        await Promise.all([loadOverview(), loadSubmissions()]);
      } else {
        alert(data.error || "Failed to reset test data.");
      }
    } finally {
      setSettingsSaving(false);
    }
  }

  async function handleTogglePause(paused: boolean) {
    setSettingsSaving(true);
    try {
      const res = await fetch("/api/gtd/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaused: paused }),
      });
      if (res.ok) {
        await loadOverview();
      }
    } finally {
      setSettingsSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const statusPill = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "border-[#c2ed55]/50 bg-[#c2ed55]/15 text-[#c2ed55]";
      case "REJECTED":
        return "border-[#e42c24]/50 bg-[#e42c24]/15 text-red-300";
      case "ADDITIONAL_PROOF_REQUESTED":
        return "border-[#f6d52b]/50 bg-[#f6d52b]/15 text-[#f6d52b]";
      default:
        return "border-white/25 bg-white/10 text-white";
    }
  };

  return (
    <div className="admin-bg pb-16">
      <header className="sticky top-0 z-40 border-b border-[#343744] bg-[#11131a]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c2ed55] text-[#171820]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-black text-white">
                BUZQUITOS GTD PUZZLE ADMIN
              </div>
              <div className="font-mono text-[11px] text-white/60">
                {email}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#343744] bg-[#1c1f29] px-3 py-2 text-xs font-semibold text-white hover:border-[#c2ed55]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Main Admin
            </Link>
            <button
              type="button"
              onClick={() => {
                loadOverview();
                loadSubmissions();
                if (activeTab === "audit") loadAuditLogs();
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#343744] bg-[#1c1f29] px-3 py-2 text-xs font-semibold text-white hover:border-[#c2ed55]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#e42c24]/60 bg-[#e42c24]/15 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-[#e42c24]/30"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 pt-8 sm:px-6 lg:px-8">
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Registered Users",
              value: overview?.totalUsers ?? "—",
              icon: Users,
              accent: "text-white",
            },
            {
              label: "Puzzles Generated",
              value: overview?.totalPuzzlesGenerated ?? "—",
              icon: Grid3X3,
              accent: "text-white",
            },
            {
              label: "Puzzles Solved",
              value: overview?.totalPuzzlesSolved ?? "—",
              icon: CheckCircle2,
              accent: "text-[#c2ed55]",
            },
            {
              label: "Claims Submitted",
              value: overview?.totalClaimsSubmitted ?? "—",
              icon: ClipboardList,
              accent: "text-white",
            },
            {
              label: "Pending Verification",
              value: overview?.pendingVerification ?? "—",
              icon: Clock,
              accent: "text-[#f6d52b]",
            },
            {
              label: "Approved Winners",
              value: overview?.approvedUsers ?? "—",
              icon: Award,
              accent: "text-[#c2ed55]",
            },
            {
              label: "Rejected Claims",
              value: overview?.rejectedUsers ?? "—",
              icon: XCircle,
              accent: "text-[#e42c24]",
            },
            {
              label: "Remaining GTD Spots",
              value: overview
                ? `${overview.remainingSpots} / ${overview.maxWinners}`
                : "—",
              icon: AlertTriangle,
              accent: "text-[#f6d52b]",
            },
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="admin-card p-4">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>{metric.label}</span>
                  <Icon className={`h-4 w-4 ${metric.accent}`} />
                </div>
                <div
                  className={`mt-2 font-mono text-2xl font-bold ${metric.accent}`}
                >
                  {metric.value}
                </div>
              </div>
            );
          })}
        </section>

        <div className="flex flex-wrap items-center gap-2 border-b border-[#343744] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("submissions")}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === "submissions"
                ? "bg-[#c2ed55] text-[#171820]"
                : "text-white/75 hover:bg-white/5"
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            Submissions ({totalSubmissions})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === "settings"
                ? "bg-[#c2ed55] text-[#171820]"
                : "text-white/75 hover:bg-white/5"
            }`}
          >
            <Settings className="h-4 w-4" />
            Campaign Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === "audit"
                ? "bg-[#c2ed55] text-[#171820]"
                : "text-white/75 hover:bg-white/5"
            }`}
          >
            <FileText className="h-4 w-4" />
            Audit Logs
          </button>
        </div>

        {activeTab === "submissions" && (
          <section className="admin-card p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                  <input
                    type="text"
                    placeholder="Search Submission ID, @username, wallet, Puzzle ID..."
                    value={searchQ}
                    onChange={(e) => {
                      setSearchQ(e.target.value);
                      setPage(1);
                    }}
                    className="admin-field rounded-lg !pl-9"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="admin-field !w-auto rounded-lg"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING_VERIFICATION">Pending Verification</option>
                  <option value="ADDITIONAL_PROOF_REQUESTED">
                    Additional Proof Requested
                  </option>
                  <option value="APPROVED">Approved Winners</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <a
                href={`/api/gtd/admin/submissions?format=csv&status=${encodeURIComponent(statusFilter)}&q=${encodeURIComponent(searchQ)}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#f6d52b] px-4 py-2.5 text-xs font-black text-[#171820] hover:bg-[#c2ed55]"
              >
                <Download className="h-3.5 w-3.5" />
                EXPORT CSV
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#343744] font-mono text-[11px] uppercase tracking-wider text-white/55">
                    <th className="px-3 py-3">Submission ID</th>
                    <th className="px-3 py-3">Twitter/X</th>
                    <th className="px-3 py-3">Wallet</th>
                    <th className="px-3 py-3">IP Address</th>
                    <th className="px-3 py-3">Puzzle ID</th>
                    <th className="px-3 py-3">Puzzle</th>
                    <th className="px-3 py-3">Checks</th>
                    <th className="px-3 py-3">Submitted</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#343744]/60">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-white/50">
                        Loading submissions...
                      </td>
                    </tr>
                  ) : submissions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-white/50">
                        No submissions match the current filter.
                      </td>
                    </tr>
                  ) : (
                    submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-white/[0.03]">
                        <td className="px-3 py-3 font-mono font-bold text-[#c2ed55]">
                          <div>{sub.submissionCode}</div>
                          {sub.winnerId && (
                            <div className="text-[10px] text-[#f6d52b]">
                              {sub.winnerId}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 font-mono text-white">
                          @{sub.displayUsername}
                        </td>
                        <td className="px-3 py-3 font-mono text-white/75">
                          {sub.walletAddress.slice(0, 8)}...
                          {sub.walletAddress.slice(-6)}
                        </td>
                        <td className="px-3 py-3 font-mono text-white/75">
                          <div>{sub.ipAddress || "—"}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {sub.ipSubmissionsCount && sub.ipSubmissionsCount > 1 ? (
                              <span className="rounded bg-[#f6d52b]/20 text-[#f6d52b] px-1.5 py-0.2 font-mono text-[9px] font-bold">
                                {sub.ipSubmissionsCount} subs
                              </span>
                            ) : sub.ipAddress ? (
                              <span className="text-[9px] text-white/40">1 sub</span>
                            ) : null}
                            {sub.isIpBlocked && (
                              <span className="rounded bg-[#e42c24] text-white px-1 py-0.2 text-[9px] font-bold">
                                BLOCKED
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 font-mono text-white/75">
                          {sub.puzzleId}
                        </td>
                        <td className="px-3 py-3">
                          <span className="rounded bg-[#c2ed55]/15 px-2 py-0.5 font-mono text-[10px] text-[#c2ed55]">
                            {sub.puzzleGridSize}×{sub.puzzleGridSize} SOLVED
                          </span>
                        </td>
                        <td className="px-3 py-3 font-mono text-white/80">
                          {sub.verifiedChecksCount} / 5
                        </td>
                        <td className="px-3 py-3 font-mono text-[11px] text-white/55">
                          {new Date(sub.reservedAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusPill(sub.status)}`}
                          >
                            {sub.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openInspector(sub)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#c2ed55] px-3 py-1.5 text-xs font-black text-[#171820] hover:bg-[#f6d52b]"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-[#343744] pt-4 text-xs text-white/60">
                <span>
                  Page {page} of {totalPages} ({totalSubmissions} total)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded border border-[#343744] px-3 py-1 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded border border-[#343744] px-3 py-1 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "settings" && (
          <div className="max-w-4xl space-y-6">
            {/* Live Campaign Status & Pause / Resume Control */}
            <section className="admin-card p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                      Campaign Live Status:
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-xs font-bold ${
                        campaign?.status === "PAUSED"
                          ? "border border-[#e42c24]/50 bg-[#e42c24]/20 text-red-300"
                          : "border border-[#c2ed55]/50 bg-[#c2ed55]/20 text-[#c2ed55]"
                      }`}
                    >
                      {campaign?.status === "PAUSED" ? "PAUSED" : "ACTIVE"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/60">
                    {campaign?.status === "PAUSED"
                      ? "Campaign is paused. New puzzle generation and spot claims are held; users see a paused notice."
                      : "Campaign is active and accepting puzzle solutions and GTD whitelist claims."}
                  </p>
                </div>

                <div>
                  {campaign?.status === "PAUSED" ? (
                    <button
                      type="button"
                      disabled={settingsSaving}
                      onClick={() => handleTogglePause(false)}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#c2ed55] px-5 py-2.5 text-xs font-black text-[#171820] hover:bg-[#f6d52b] disabled:opacity-50"
                    >
                      <Play className="h-4 w-4" />
                      RESUME CAMPAIGN
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={settingsSaving}
                      onClick={() => handleTogglePause(true)}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#f6d52b]/60 bg-[#f6d52b]/15 px-5 py-2.5 text-xs font-black text-[#f6d52b] hover:bg-[#f6d52b]/25 disabled:opacity-50"
                    >
                      <Pause className="h-4 w-4" />
                      PAUSE CAMPAIGN
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Campaign & Social Verification Settings Form */}
            <section className="admin-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-white">
                Campaign &amp; Social Verification Settings
              </h2>
              <p className="mt-1 text-xs text-white/60">
                Updates apply live across the `/puzzle` page, social checklist, and tweet
                composer.
              </p>

              <form onSubmit={handleSaveSettings} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-white/75">
                      Campaign Name
                    </label>
                    <input
                      type="text"
                      value={settingsForm.name}
                      onChange={(e) =>
                        setSettingsForm((s) => ({ ...s, name: e.target.value }))
                      }
                      className="admin-field rounded-md"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-white/75">
                      Max GTD Spots (FCFS Cap)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={settingsForm.maxWinners}
                      onChange={(e) =>
                        setSettingsForm((s) => ({
                          ...s,
                          maxWinners: Number(e.target.value),
                        }))
                      }
                      className="admin-field rounded-md font-mono"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-white/75">
                      Official Twitter/X Handle
                    </label>
                    <input
                      type="text"
                      value={settingsForm.officialTwitterHandle}
                      onChange={(e) =>
                        setSettingsForm((s) => ({
                          ...s,
                          officialTwitterHandle: e.target.value,
                        }))
                      }
                      className="admin-field rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-white/75">
                      Official Twitter/X URL
                    </label>
                    <input
                      type="url"
                      value={settingsForm.officialTwitterUrl}
                      onChange={(e) =>
                        setSettingsForm((s) => ({
                          ...s,
                          officialTwitterUrl: e.target.value,
                        }))
                      }
                      className="admin-field rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-white/75">
                    Pinned Campaign Post URL
                  </label>
                  <input
                    type="url"
                    value={settingsForm.pinnedPostUrl}
                    onChange={(e) =>
                      setSettingsForm((s) => ({
                        ...s,
                        pinnedPostUrl: e.target.value,
                      }))
                    }
                    className="admin-field rounded-md"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-white/75">
                      Required Campaign Hashtags
                    </label>
                    <input
                      type="text"
                      value={settingsForm.requiredHashtags}
                      onChange={(e) =>
                        setSettingsForm((s) => ({
                          ...s,
                          requiredHashtags: e.target.value,
                        }))
                      }
                      className="admin-field rounded-md"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-white/75">
                      Default Puzzle Mode
                    </label>
                    <select
                      value={3}
                      disabled
                      className="admin-field rounded-md opacity-80 cursor-not-allowed"
                    >
                      <option value={3}>3×3 Grid (Target Σ = 15)</option>
                    </select>
                  </div>
                </div>

                {settingsMsg && (
                  <div className="rounded-md border border-[#c2ed55]/40 bg-[#c2ed55]/10 px-4 py-3 text-xs text-[#c2ed55]">
                    {settingsMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="cursor-pointer rounded-lg bg-[#c2ed55] px-6 py-3 text-xs font-black text-[#171820] hover:bg-[#f6d52b] disabled:opacity-50"
                >
                  {settingsSaving ? "SAVING..." : "SAVE CAMPAIGN SETTINGS"}
                </button>
              </form>
            </section>

            {/* Blocked IP Addresses Management */}
            <section className="admin-card p-6 sm:p-8">
              <div className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-400" />
                <h3 className="text-lg font-bold text-white">Blocked IP Addresses</h3>
              </div>
              <p className="mt-1 text-xs text-white/60">
                Blocked IP addresses cannot generate puzzles or submit claims. Users on normal IPs have no rate limit.
              </p>

              <div className="mt-4">
                {blockedIps.length === 0 ? (
                  <div className="rounded-lg border border-[#343744] bg-[#11131a] p-4 text-xs text-white/50">
                    No IP addresses currently blocked.
                  </div>
                ) : (
                  <div className="divide-y divide-[#343744] rounded-lg border border-[#343744] bg-[#11131a]">
                    {blockedIps.map((ip) => (
                      <div
                        key={ip}
                        className="flex items-center justify-between px-4 py-2.5 text-xs"
                      >
                        <span className="font-mono text-white">{ip}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleBlockIp(ip, false)}
                          className="rounded border border-[#c2ed55]/50 bg-[#c2ed55]/15 px-2.5 py-1 text-[11px] font-bold text-[#c2ed55] hover:bg-[#c2ed55]/30"
                        >
                          UNBLOCK
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Danger Zone: Reset Test Data */}
            <section className="admin-card border-2 border-[#e42c24]/50 bg-[#e42c24]/5 p-6 sm:p-8">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#e42c24]" />
                <h3 className="text-lg font-bold text-[#e42c24]">Danger Zone: Reset All Test Data</h3>
              </div>
              <p className="mt-1 text-xs text-white/70">
                Permanently wipes all test submissions, test puzzles, and provisional reservations. Sets spots claimed back to <strong className="font-mono text-white">0 / 500</strong>.
              </p>

              <div className="mt-4">
                <button
                  type="button"
                  disabled={settingsSaving}
                  onClick={handleResetTestData}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#e42c24] px-5 py-2.5 text-xs font-black text-white hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  RESET ALL TEST SUBMISSIONS &amp; CLAIMS (SET SPOTS TO 0 / 500)
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === "audit" && (
          <section className="admin-card p-6">
            <h2 className="text-xl font-bold text-white">Admin Audit Trail</h2>
            <p className="mt-1 text-xs text-white/60">
              Complete log of manual verification checks, approvals, rejections, and
              settings updates.
            </p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#343744] font-mono text-[11px] uppercase tracking-wider text-white/55">
                    <th className="px-3 py-2.5">Timestamp</th>
                    <th className="px-3 py-2.5">Admin</th>
                    <th className="px-3 py-2.5">Action</th>
                    <th className="px-3 py-2.5">Submission</th>
                    <th className="px-3 py-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#343744]/60">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-white/55">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-white">
                        {log.adminEmail}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-bold text-[#f6d52b]">
                        {log.action}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-white/75">
                        {log.submission
                          ? `${log.submission.submissionCode} (@${log.submission.user.displayUsername})`
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-white/75">
                        {log.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="admin-card max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 border-b border-[#343744] pb-4">
              <div>
                <div className="font-mono text-xs text-[#c2ed55]">
                  {selectedSub.submissionCode} •{" "}
                  {selectedSub.status.replace(/_/g, " ")}
                </div>
                <h3 className="mt-1 text-2xl font-black text-white">
                  @{selectedSub.displayUsername}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="cursor-pointer rounded-lg border border-[#343744] p-2 text-white/70 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[#343744] bg-[#11131a] p-3.5">
                  <div className="text-[10px] uppercase text-white/50">
                    Twitter/X Profile
                  </div>
                  <a
                    href={`https://x.com/${selectedSub.displayUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 font-mono text-sm font-bold text-[#c2ed55] hover:underline"
                  >
                    @{selectedSub.displayUsername}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                <div className="rounded-lg border border-[#343744] bg-[#11131a] p-3.5">
                  <div className="text-[10px] uppercase text-white/50">
                    BSC Wallet Address
                  </div>
                  <div className="mt-1 break-all font-mono text-xs text-white">
                    {selectedSub.walletAddress}
                  </div>
                </div>

                <div className="rounded-lg border border-[#343744] bg-[#11131a] p-3.5">
                  <div className="text-[10px] uppercase text-white/50">
                    Puzzle Completion Record
                  </div>
                  <div className="mt-1 font-mono text-[#c2ed55]">
                    {selectedSub.puzzleId} ({selectedSub.puzzleGridSize}×
                    {selectedSub.puzzleGridSize}) • {selectedSub.puzzleAttempts}{" "}
                    attempt(s)
                  </div>
                  <div className="mt-0.5 text-[11px] text-white/55">
                    Solved:{" "}
                    {selectedSub.puzzleCompletedAt
                      ? new Date(selectedSub.puzzleCompletedAt).toLocaleString()
                      : "—"}
                  </div>
                </div>

                <div className="rounded-lg border border-[#343744] bg-[#11131a] p-3.5">
                  <div className="text-[10px] uppercase text-white/50">
                    Submitted Proof URLs
                  </div>
                  <div className="mt-1 space-y-1">
                    {selectedSub.commentPostUrl ? (
                      <a
                        href={selectedSub.commentPostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 truncate text-[#c2ed55] font-bold hover:underline"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        Comment on Pinned Post (Required)
                      </a>
                    ) : null}

                    {selectedSub.announcementPostUrl &&
                    selectedSub.announcementPostUrl !== selectedSub.commentPostUrl ? (
                      <a
                        href={selectedSub.announcementPostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 truncate text-[#f6d52b] hover:underline"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        Personal Post (Optional)
                      </a>
                    ) : !selectedSub.commentPostUrl && selectedSub.announcementPostUrl ? (
                      <a
                        href={selectedSub.announcementPostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 truncate text-[#c2ed55] hover:underline"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        Submitted URL: {selectedSub.announcementPostUrl}
                      </a>
                    ) : null}

                    {campaign?.pinnedPostUrl && (
                      <a
                        href={campaign.pinnedPostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 truncate text-white/60 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        Campaign Pinned Post
                      </a>
                    )}
                    {Array.isArray(selectedSub.proofLinks) &&
                      selectedSub.proofLinks.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 truncate text-white/75 hover:text-white hover:underline"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          Additional Proof #{idx + 1}
                        </a>
                      ))}
                  </div>
                </div>

                {/* IP Address & Network Intelligence */}
                <div className="rounded-lg border border-[#343744] bg-[#11131a] p-3.5 sm:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase text-white/50">
                        IP Address &amp; Network Intelligence
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-white">
                        <span className="font-bold text-[#c2ed55]">{selectedSub.ipAddress || "Unknown IP"}</span>
                        {selectedSub.ipSubmissionsCount ? (
                          <span className="rounded bg-[#f6d52b]/20 px-2 py-0.5 font-mono text-[11px] font-bold text-[#f6d52b]">
                            {selectedSub.ipSubmissionsCount} submission{selectedSub.ipSubmissionsCount > 1 ? "s" : ""} from this IP
                          </span>
                        ) : null}
                        {selectedSub.isIpBlocked && (
                          <span className="rounded bg-[#e42c24] px-2 py-0.5 text-[11px] font-bold text-white">
                            BLOCKED IP
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-white/50">
                        No limits enforced on submissions per IP (shared Wi-Fi allowed). Admin can observe counts and block malicious IPs.
                      </p>
                    </div>

                    {selectedSub.ipAddress && (
                      <div className="flex items-center gap-2">
                        {selectedSub.isIpBlocked ? (
                          <button
                            type="button"
                            disabled={actionBusy}
                            onClick={() => handleToggleBlockIp(selectedSub.ipAddress!, false)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#c2ed55]/50 bg-[#c2ed55]/15 px-3 py-1.5 text-xs font-bold text-[#c2ed55] hover:bg-[#c2ed55]/30 disabled:opacity-50"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            UNBLOCK IP
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={actionBusy}
                            onClick={() => handleToggleBlockIp(selectedSub.ipAddress!, true)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#e42c24]/50 bg-[#e42c24]/15 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-[#e42c24]/30 disabled:opacity-50"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            BLOCK IP
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#343744] bg-[#11131a] p-4">
                <div className="mb-3 font-bold text-white">
                  Manual Social Task Verification Checklist
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {[
                    { key: "followVerified" as const, label: "1. Follow official @Buzquitos verified (Required)" },
                    { key: "commentVerified" as const, label: "2. Like, retweet & comment on pinned post verified (Required)" },
                    {
                      key: "announcementVerified" as const,
                      label: "3. Personal post about Buzquitos verified (Optional)",
                    },
                  ].map((chk) => (
                    <label
                      key={chk.key}
                      className="flex cursor-pointer items-center gap-2.5 rounded border border-[#343744] bg-[#1c1f29] px-3 py-2 text-white/90"
                    >
                      <input
                        type="checkbox"
                        checked={checks[chk.key]}
                        onChange={(e) =>
                          setChecks((prev) => ({
                            ...prev,
                            [chk.key]: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 accent-[#c2ed55]"
                      />
                      <span>{chk.label}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="mb-1 block font-semibold text-white/75">
                    Internal Verification Notes
                  </label>
                  <textarea
                    rows={2}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Record reviewer findings or internal audit notes..."
                    className="admin-field rounded-md"
                  />
                </div>

                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => runSubmissionAction("UPDATE_CHECKS")}
                  className="mt-3 cursor-pointer rounded-lg border border-[#c2ed55]/40 bg-[#c2ed55]/10 px-4 py-2 text-xs font-bold text-[#c2ed55] hover:bg-[#c2ed55]/20"
                >
                  Save Checklist &amp; Notes
                </button>
              </div>

              {selectedSub.status !== "APPROVED" &&
                selectedSub.status !== "REJECTED" && (
                  <div className="space-y-4 rounded-lg border border-[#343744] bg-[#11131a] p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block font-semibold text-red-300">
                          Rejection Reason (Required to Reject)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Did not retweet pinned post"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="admin-field rounded-md"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block font-semibold text-[#f6d52b]">
                          Request Additional Proof Note
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Please attach direct link to your reply"
                          value={proofRequestNote}
                          onChange={(e) => setProofRequestNote(e.target.value)}
                          className="admin-field rounded-md"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() => runSubmissionAction("APPROVE")}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#c2ed55] px-5 py-2.5 text-xs font-black text-[#171820] hover:bg-[#f6d52b] disabled:opacity-50"
                      >
                        <Award className="h-4 w-4" />
                        APPROVE &amp; ISSUE WINNER ID
                      </button>

                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() => runSubmissionAction("REQUEST_PROOF")}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#f6d52b] px-4 py-2.5 text-xs font-black text-[#171820] hover:opacity-90 disabled:opacity-50"
                      >
                        REQUEST ADDITIONAL PROOF
                      </button>

                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() => runSubmissionAction("REJECT")}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#e42c24] px-4 py-2.5 text-xs font-black text-white hover:opacity-90 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        REJECT &amp; RELEASE SPOT
                      </button>
                    </div>
                  </div>
                )}

              {modalFeedback && (
                <div className="rounded-lg border border-[#c2ed55]/40 bg-[#c2ed55]/10 p-3 text-xs text-[#c2ed55]">
                  {modalFeedback}
                </div>
              )}

              {/* Bottom Action Bar: Delete Submission & Close */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#343744] pt-4">
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => handleDeleteSubmission(selectedSub.id)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#e42c24]/50 bg-[#e42c24]/10 px-3.5 py-2 text-xs font-bold text-red-300 hover:bg-[#e42c24]/20 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  DELETE / REMOVE SUBMISSION
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="cursor-pointer rounded-lg border border-[#343744] bg-[#1c1f29] px-4 py-2 text-xs font-bold text-white hover:border-[#c2ed55]"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
