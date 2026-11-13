import { request } from "@/lib/api";

export interface Paged<T> { content: T[]; totalElements: number; totalPages: number; number: number }

const qs = (params: Record<string, string | number | boolean | null | undefined>) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") p.set(k, String(v)); });
  const s = p.toString();
  return s ? `?${s}` : "";
};

// ---------- Dashboard ----------
export interface LabelValue { label: string; value: number | null }
export interface AdminDashboard {
  asOf: string; institutionName: string; academicYear: string;
  counts: { students: number; activeStudents: number; faculty: number; programs: number; courses: number; subjects: number;
            pendingAdmissions: number; upcomingExams: number; activeNotices: number; users: number };
  fees: { billed: number; collected: number; concessions: number; outstanding: number; overdueRecords: number; collectionRate: number };
  attendance: { sessions: number; marked: number; present: number; rate: number | null; threshold: number; studentsBelowThreshold: number };
  library: { titles: number; issued: number; overdue: number };
  studentsByProgram: LabelValue[]; admissionsByStatus: LabelValue[]; attendanceTrend: LabelValue[];
  upcomingExams: { id: number; examCode: string; title: string; program: string; semester: number; examDate: string; startTime: string; venue: string | null }[];
  recentActivity: { id: number; action: string; entityType: string | null; createdAt: string; actor: string }[];
}

// ---------- Notices ----------
export type Audience = "ALL" | "STUDENTS" | "FACULTY" | "STAFF";
export type Priority = "NORMAL" | "IMPORTANT" | "URGENT";
export interface Notice {
  id: number; title: string; body: string; audience: Audience; priority: Priority; pinned: boolean;
  publishAt: string; expiresAt: string | null; state: "ACTIVE" | "SCHEDULED" | "EXPIRED"; createdBy: string | null;
  createdAt: string; updatedAt: string;
}
export interface NoticeInput {
  title: string; body: string; audience: Audience; priority: Priority; pinned: boolean;
  publishAt: string | null; expiresAt: string | null;
}

// ---------- Library ----------
export interface Book {
  id: number; accessionNo: string; isbn: string | null; title: string; author: string; publisher: string | null;
  category: string | null; shelf: string | null; totalCopies: number; availableCopies: number; issuedCopies: number;
}
export type BookInput = Omit<Book, "id" | "availableCopies" | "issuedCopies">;
export interface BookIssue {
  id: number; bookId: number; bookTitle: string; accessionNo: string; studentId: number; rollNumber: string;
  studentName: string; program: string; issueDate: string; dueDate: string; returnDate: string | null;
  status: "ISSUED" | "RETURNED"; overdue: boolean; daysOverdue: number; fine: number; estimatedFine: number; remarks: string | null;
}
export interface LibraryStats {
  titles: number; totalCopies: number; availableCopies: number; issued: number; overdue: number;
  finesCollected: number; finesPending: number;
}

// ---------- Grades ----------
export interface GradeRow {
  id: number; rollNumber: string; studentName: string; program: string; semester: number; examId: number;
  examCode: string; examTitle: string; examType: string; examDate: string; marksObtained: number | null;
  totalMarks: number; percentage: number | null; grade: string | null; gradePoints: number | null;
  absent: boolean; pass: boolean | null;
}
export interface GradeSummary {
  results: number; appeared: number; absent: number; passed: number; failed: number; passRate: number;
  averagePercentage: number | null; highestPercentage: number | null; gradeDistribution: { grade: string; count: number }[];
}
export interface GradeResult extends Paged<GradeRow> { summary: GradeSummary }
export interface GradeOptions { programs: string[]; exams: { id: number; examCode: string; title: string; program: string; semester: number }[] }

// ---------- Settings ----------
export type InstitutionSettings = Record<
  "institutionName" | "shortName" | "address" | "phone" | "email" | "website" | "academicYear" |
  "attendanceThreshold" | "libraryLoanDays" | "libraryFinePerDay" | "libraryMaxBooks", string>;

// ---------- Import ----------
export interface ImportRow {
  fullName: string; email: string; rollNumber: string; program: string; semester: string; batchYear: string;
  phone: string; dateOfBirth: string; guardianName: string; guardianPhone: string; address: string;
}
export interface ImportRowResult {
  row: number; fullName: string; email: string; rollNumber: string; status: "VALID" | "ERROR" | "CREATED";
  errors: string[]; temporaryPassword: string | null;
}
export interface ImportResponse { dryRun: boolean; total: number; valid: number; invalid: number; created: number; rows: ImportRowResult[] }

// ---------- Reports ----------
export type ReportType = "students" | "attendance" | "results" | "fees" | "library";
export interface Report { type: ReportType; title: string; columns: string[]; rows: (string | number | boolean | null)[][]; truncated: boolean }
export interface ReportFilters { program?: string; semester?: string; status?: string; from?: string; to?: string; examId?: string }

export const modulesApi = {
  dashboard: () => request<AdminDashboard>("/admin/dashboard"),

  notices: (search: string, audience: string, state: string, page: number) =>
    request<Paged<Notice>>(`/admin/notices${qs({ search, audience, state, page })}`),
  createNotice: (d: NoticeInput) => request<Notice>("/admin/notices", { method: "POST", body: JSON.stringify(d) }),
  updateNotice: (id: number, d: NoticeInput) => request<Notice>(`/admin/notices/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  deleteNotice: (id: number) => request<void>(`/admin/notices/${id}`, { method: "DELETE" }),

  libraryStats: () => request<LibraryStats>("/admin/library/stats"),
  libraryCategories: () => request<string[]>("/admin/library/categories"),
  books: (search: string, category: string, availableOnly: boolean, page: number) =>
    request<Paged<Book>>(`/admin/library/books${qs({ search, category, availableOnly: availableOnly || undefined, page })}`),
  createBook: (d: BookInput) => request<Book>("/admin/library/books", { method: "POST", body: JSON.stringify(d) }),
  updateBook: (id: number, d: BookInput) => request<Book>(`/admin/library/books/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  deleteBook: (id: number) => request<void>(`/admin/library/books/${id}`, { method: "DELETE" }),
  issues: (search: string, status: string, page: number) =>
    request<Paged<BookIssue>>(`/admin/library/issues${qs({ search, status, page })}`),
  issueBook: (d: { bookId: number; rollNumber: string; dueDate: string | null; remarks: string }) =>
    request<BookIssue>("/admin/library/issues", { method: "POST", body: JSON.stringify(d) }),
  returnBook: (id: number, d: { waiveFine: boolean; remarks: string }) =>
    request<BookIssue>(`/admin/library/issues/${id}/return`, { method: "POST", body: JSON.stringify(d) }),

  grades: (f: { program: string; semester: string; examId: string; search: string; outcome: string; page: number }) =>
    request<GradeResult>(`/admin/grades${qs(f)}`),
  gradeOptions: () => request<GradeOptions>("/admin/grades/options"),

  settings: () => request<InstitutionSettings>("/admin/settings"),
  saveSettings: (d: Partial<InstitutionSettings>) => request<InstitutionSettings>("/admin/settings", { method: "PUT", body: JSON.stringify(d) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>("/admin/settings/password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) }),

  importStudents: (rows: ImportRow[], dryRun: boolean) =>
    request<ImportResponse>("/admin/students/import", { method: "POST", body: JSON.stringify({ rows, dryRun }) }),

  report: (type: ReportType, f: ReportFilters) => request<Report>(`/admin/reports/${type}${qs({ ...f })}`),
};

export function errorMessage(err: unknown, fallback: string): string {
  const e = err as { message?: string; errors?: string[] };
  if (e?.errors?.length) return e.errors.join(", ");
  return e?.message || fallback;
}

/** Excel-friendly CSV (UTF-8 BOM so ₹ and Indian names open correctly in Excel). */
export function downloadCsv(filename: string, columns: string[], rows: unknown[][]) {
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = "﻿" + [columns, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const inr = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d.length === 10 ? d + "T00:00:00" : d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
