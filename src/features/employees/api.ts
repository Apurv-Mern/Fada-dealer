import { apiFetch, isMockMode } from "@/lib/api";
import {
  buildQuery,
  mockDelay,
  normalizeListPayload,
  unwrapApiData,
} from "@/lib/api/parse";
import { getOutletOptions } from "@/features/branches/api";
import { parseEmployeeImportCsv } from "@/features/employees/csv-template";
import { ApiError } from "@/lib/api/errors";
import {
  employeeFilterOptions as mockFilterOptions,
  employeeStats as mockStats,
  employees as mockEmployees,
  getMockEmployeeDetail,
  mockEmployeeDocuments,
  mockEmployeeJoiningCandidates,
} from "@/features/employees/mocks/data";
import { addMockJoinInvitation } from "@/features/employment-requests/mocks/data";
import type {
  Employee,
  EmployeeDetail,
  EmployeeDocument,
  EmployeeDocumentStats,
  EmployeeExperience,
  EmployeeFilterOptions,
  EmployeeImportItem,
  EmployeeImportResult,
  EmployeeImportRowError,
  EmployeeImportSkippedRow,
  EmployeeInput,
  EmployeeJourneyItem,
  EmployeeListParams,
  EmployeeJoiningCandidate,
  EmployeeStats,
  EmployeeStatus,
  EmployeeTransferInput,
} from "@/features/employees/types";
import type { ListResult } from "@/types/api";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function readNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return 0;
}

function readBool(record: Record<string, unknown>, key: string): boolean {
  const value = record[key];
  return value === true || value === "true" || value === 1;
}

function nested(record: Record<string, unknown>, key: string): Record<string, unknown> {
  return asRecord(record[key]);
}

export function mapApiEmployee(raw: unknown): Employee {
  const record = asRecord(raw);
  const employee = nested(record, "employee");
  const assignment = nested(record, "assignment");
  const assignmentOutlet = nested(assignment, "outlet");
  const assignmentBranch = nested(assignment, "branch");
  const assignmentDepartment = nested(assignment, "department");
  const assignmentDesignation = nested(assignment, "designation");
  const outlet = nested(record, "outlet");
  const designationObj = nested(record, "designation");
  const nestedDesignation = nested(designationObj, "designation");
  const nestedDepartment = nested(designationObj, "department");
  const isActive = "isActive" in record
    ? readBool(record, "isActive")
    : "isActive" in employee
      ? readBool(employee, "isActive")
      : true;

  let status: EmployeeStatus = isActive ? "Active" : "Inactive";
  const statusRaw = (
    readString(record, "status") || readString(employee, "status")
  ).toLowerCase();
  if (statusRaw.includes("notice")) status = "On Notice";
  else if (statusRaw === "inactive" || statusRaw === "exited") status = "Inactive";
  else if (statusRaw === "active") status = "Active";

  const branchName =
    readString(assignmentBranch, "name") ||
    readString(assignmentOutlet, "name") ||
    readString(outlet, "name") ||
    readString(record, "branch") ||
    readString(record, "outletName") ||
    "—";
  const branchId =
    readString(assignment, "outletId") ||
    readString(assignmentBranch, "id") ||
    readString(assignmentOutlet, "id") ||
    readString(outlet, "id") ||
    readString(record, "outletId") ||
    readString(record, "branchId") ||
    "";

  const designationName =
    readString(assignmentDesignation, "name") ||
    readString(nestedDesignation, "name") ||
    readString(designationObj, "name") ||
    readString(employee, "designation") ||
    readString(record, "designation") ||
    "—";
  const designationId =
    readString(assignmentDesignation, "id") ||
    readString(assignment, "designationId") ||
    readString(designationObj, "designationId") ||
    readString(nestedDesignation, "id") ||
    readString(record, "designationId") ||
    "";
  const departmentId =
    readString(assignmentDepartment, "id") ||
    readString(assignment, "departmentId") ||
    readString(designationObj, "departmentId") ||
    readString(nestedDepartment, "id") ||
    readString(record, "departmentId") ||
    "";

  const id =
    readString(employee, "id") ||
    readString(record, "employeeId") ||
    readString(record, "id") ||
    String(employee.id ?? record.id ?? "");
  const assignmentId =
    readString(assignment, "id") ||
    (assignment.id != null ? String(assignment.id) : "") ||
    undefined;

  return {
    id,
    name:
      readString(record, "name") ||
      readString(employee, "name") ||
      "Employee",
    email: readString(record, "email") || readString(employee, "email"),
    phone: readString(record, "phone") || readString(employee, "phone"),
    fadaId:
      readString(record, "fadaId") ||
      readString(record, "fadaID") ||
      readString(employee, "fadaId") ||
      readString(employee, "fadaID") ||
      "—",
    branch: branchName,
    branchId,
    designation: designationName,
    designationId,
    departmentId: departmentId || undefined,
    assignmentId: assignmentId || undefined,
    status,
    fadaScore:
      readNumber(record, "score") ||
      readNumber(record, "fadaScore") ||
      readNumber(employee, "score") ||
      readNumber(employee, "fadaScore"),
    isActive,
    joinedDate:
      readString(record, "joinedDate") ||
      readString(employee, "joinedDate") ||
      undefined,
  };
}

function asUnknownArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function formatAddressParts(parts: Array<string | undefined>): string | undefined {
  const joined = parts.map((p) => p?.trim()).filter(Boolean).join(", ");
  return joined || undefined;
}

function pickAddressRecord(
  record: Record<string, unknown>,
  employee: Record<string, unknown>,
): Record<string, unknown> {
  const addresses = asUnknownArray(record.addresses ?? employee.addresses)
    .map(asRecord)
    .filter((row) => Object.keys(row).length > 0);
  const active = addresses.find((row) => {
    if (!("isActive" in row)) return true;
    return readBool(row, "isActive");
  });
  if (active) return active;
  if (addresses[0]) return addresses[0];
  const nestedAddress = nested(record, "address");
  if (Object.keys(nestedAddress).length > 0) return nestedAddress;
  return nested(employee, "address");
}

function safeHttpUrl(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") return trimmed;
  } catch {
    return undefined;
  }
  return undefined;
}

function readStringList(
  source: Record<string, unknown>,
  key: string,
): string[] | undefined {
  const value = source[key];
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      const row = asRecord(item);
      return (
        readString(row, "name") ||
        readString(row, "skillName") ||
        readString(row, "skill") ||
        readString(row, "language") ||
        ""
      ).trim();
    })
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function mapWorkExperiences(raw: unknown): EmployeeExperience[] {
  const experiences: EmployeeExperience[] = [];
  for (const item of asUnknownArray(raw)) {
    const row = asRecord(item);
    const dealership = nested(row, "dealership");
    const branch = nested(row, "branch");
    const designation = nested(row, "designation");
    const branchName = readString(branch, "name");
    const city = readString(branch, "city");
    const state = readString(branch, "state");
    const location = [city, state].filter(Boolean).join(", ");
    const subtitle = [branchName, location].filter(Boolean).join(" · ") || undefined;
    const id =
      readString(row, "id") ||
      String(row.id ?? `${branchName}-${readString(row, "startDate")}`);
    if (!id && !branchName && !readString(designation, "name")) continue;
    experiences.push({
      id: id || `exp-${Math.random().toString(36).slice(2, 8)}`,
      title:
        readString(designation, "name") ||
        readString(row, "roleTitle") ||
        "Employee",
      subtitle,
      company:
        readString(dealership, "name") ||
        readString(row, "company") ||
        branchName ||
        "—",
      isCurrent: readBool(row, "isCurrentlyWorking"),
      startDate: readString(row, "startDate") || undefined,
      endDate: readString(row, "endDate") || undefined,
      employmentType:
        readString(row, "employeementType") ||
        readString(row, "employmentType") ||
        undefined,
      highlights: readString(row, "highlights") || undefined,
    });
  }
  return experiences;
}

function mapJourneyItems(
  raw: unknown,
  keys: {
    title: string[];
    meta?: string[];
    date?: string[];
    description?: string[];
    attachment?: string[];
  },
): EmployeeJourneyItem[] {
  const items: EmployeeJourneyItem[] = [];
  for (const item of asUnknownArray(raw)) {
    const row = asRecord(item);
    const title =
      keys.title.map((k) => readString(row, k)).find(Boolean) || "";
    if (!title) continue;
    const metaParts =
      keys.meta
        ?.map((k) => readString(row, k))
        .map((v) => v.trim())
        .filter(Boolean) ?? [];
    const meta = metaParts.length > 0 ? metaParts.join(" · ") : undefined;
    const date =
      keys.date?.map((k) => readString(row, k)).find(Boolean) || undefined;
    const description =
      keys.description?.map((k) => readString(row, k)).find(Boolean) ||
      undefined;
    const attachmentRaw =
      keys.attachment?.map((k) => readString(row, k)).find(Boolean) || "";
    items.push({
      id: readString(row, "id") || String(row.id ?? title),
      title,
      meta: meta || undefined,
      date: date || undefined,
      description: description || undefined,
      attachmentUrl: safeHttpUrl(attachmentRaw),
    });
  }
  return items;
}

function mapJourneyPhotos(raw: unknown): EmployeeJourneyItem[] {
  const items: EmployeeJourneyItem[] = [];
  for (const item of asUnknownArray(raw)) {
    const row = asRecord(item);
    const title = readString(row, "title");
    if (!title) continue;

    let attachmentUrl: string | undefined;
    for (const attachment of asUnknownArray(row.attachments)) {
      const url =
        typeof attachment === "string"
          ? safeHttpUrl(attachment)
          : safeHttpUrl(readString(asRecord(attachment), "url"));
      if (url) {
        attachmentUrl = url;
        break;
      }
    }

    items.push({
      id: readString(row, "id") || String(row.id ?? title),
      title,
      meta: readString(row, "subtitle") || undefined,
      date: readString(row, "journeyDate") || undefined,
      attachmentUrl,
    });
  }
  return items;
}

/** Normalize profile payload: object, or rare `data: [employee]` array. */
export function unwrapEmployeeProfilePayload(body: unknown): unknown {
  const data = unwrapApiData(body);
  if (Array.isArray(data)) {
    if (data.length === 0) {
      throw new ApiError({ message: "Employee not found", status: 404 });
    }
    return data[0];
  }
  if (data == null || typeof data !== "object") {
    throw new ApiError({ message: "Employee not found", status: 404 });
  }
  return data;
}

export function mapApiEmployeeDetail(raw: unknown): EmployeeDetail {
  const record = asRecord(raw);
  const employee = nested(record, "employee");
  const assignment = nested(record, "assignment");
  const assignmentDepartment = nested(assignment, "department");
  const assignmentBranch = nested(assignment, "branch");
  const addressObj = pickAddressRecord(record, employee);
  const base = mapApiEmployee(raw);

  const workExperienceRaw = asUnknownArray(
    record.workExperiences ?? employee.workExperiences,
  );
  const workExperiences = mapWorkExperiences(workExperienceRaw);
  const currentWork =
    workExperiences.find((exp) => exp.isCurrent) ?? workExperiences[0];
  const historyRaw = asRecord(workExperienceRaw[0]);
  const historyBranch = nested(historyRaw, "branch");
  const historyDesignation = nested(historyRaw, "designation");
  const historyDepartment = nested(historyRaw, "department");
  const historyDealership = nested(historyRaw, "dealership");
  const hasAssignment = Object.keys(assignment).length > 0;

  const departmentName =
    readString(assignmentDepartment, "name") ||
    (!hasAssignment ? readString(historyDepartment, "name") : "") ||
    readString(record, "departmentName") ||
    readString(employee, "departmentName") ||
    undefined;

  const addressLine =
    readString(record, "address") ||
    readString(employee, "address") ||
    formatAddressParts([
      readString(addressObj, "addressLine1"),
      readString(addressObj, "addressLine2"),
      readString(addressObj, "city"),
      readString(addressObj, "state"),
      readString(addressObj, "pinCode") || readString(addressObj, "pincode"),
      readString(addressObj, "country"),
    ]);

  const experienceYears =
    readString(record, "experienceYears") ||
    readString(record, "experience") ||
    readString(record, "totalExperience") ||
    readString(employee, "experienceYears") ||
    readString(employee, "experience") ||
    readString(employee, "totalExperience") ||
    undefined;

  const experiences: EmployeeExperience[] =
    workExperiences.length > 0
      ? workExperiences
      : base.branch
        ? [
            {
              id: `current-${base.id}`,
              title: base.designation !== "—" ? base.designation : "Employee",
              subtitle: "Outlet assignment",
              company:
                readString(record, "dealershipName") ||
                readString(employee, "dealershipName") ||
                base.branch,
              isCurrent: true,
            },
          ]
        : [];

  const skillItems = mapJourneyItems(record.skills ?? employee.skills, {
    title: ["skillName", "name", "skill"],
    meta: ["skillCategory", "proficiencyLevel", "learningSource"],
    date: ["skillDate"],
    description: ["description"],
  });

  const skills =
    readStringList(record, "skills") ||
    readStringList(employee, "skills") ||
    (skillItems.length > 0 ? skillItems.map((s) => s.title) : undefined);

  return {
    ...base,
    branch: hasAssignment
      ? base.branch
      : readString(historyBranch, "name") || base.branch,
    branchId: hasAssignment
      ? base.branchId
      : readString(historyBranch, "id") || base.branchId,
    designation: hasAssignment
      ? base.designation
      : readString(historyDesignation, "name") || base.designation,
    designationId: hasAssignment
      ? base.designationId
      : readString(historyDesignation, "id") || base.designationId,
    departmentId: hasAssignment
      ? base.departmentId
      : readString(historyDepartment, "id") || base.departmentId,
    assignmentId:
      base.assignmentId ||
      readString(historyRaw, "id") ||
      undefined,
    dateOfBirth:
      readString(record, "dateOfBirth") ||
      readString(record, "dob") ||
      readString(employee, "dateOfBirth") ||
      readString(employee, "dob") ||
      undefined,
    gender:
      readString(record, "gender") || readString(employee, "gender") || undefined,
    city:
      readString(record, "city") ||
      readString(employee, "city") ||
      readString(addressObj, "city") ||
      readString(assignmentBranch, "city") ||
      readString(historyBranch, "city") ||
      undefined,
    bloodGroup:
      readString(record, "bloodGroup") ||
      readString(employee, "bloodGroup") ||
      undefined,
    address: addressLine,
    experienceYears: experienceYears || undefined,
    qualification:
      readString(record, "qualification") ||
      readString(employee, "qualification") ||
      undefined,
    isQualificationVerified:
      "isQualificationVerified" in record
        ? readBool(record, "isQualificationVerified")
        : "isQualificationVerified" in employee
          ? readBool(employee, "isQualificationVerified")
          : undefined,
    skills,
    languages:
      readStringList(record, "languages") ||
      readStringList(employee, "languages"),
    profilePictureUrl:
      readString(record, "profilePicture") ||
      readString(record, "profilePictureUrl") ||
      readString(employee, "profilePicture") ||
      undefined,
    isEmailVerified:
      "isEmailVerified" in record
        ? readBool(record, "isEmailVerified")
        : "isEmailVerified" in employee
          ? readBool(employee, "isEmailVerified")
          : undefined,
    isPhoneVerified:
      "isPhoneVerified" in record
        ? readBool(record, "isPhoneVerified")
        : "isPhoneVerified" in employee
          ? readBool(employee, "isPhoneVerified")
          : undefined,
    isKycCompleted:
      "isKycCompleted" in record
        ? readBool(record, "isKycCompleted")
        : "isKycCompleted" in employee
          ? readBool(employee, "isKycCompleted")
          : undefined,
    dealershipName:
      readString(historyDealership, "name") ||
      readString(record, "dealershipName") ||
      readString(employee, "dealershipName") ||
      currentWork?.company ||
      undefined,
    departmentName,
    experiences,
    certificates: mapJourneyItems(record.certificates ?? employee.certificates, {
      title: ["certificateName", "name", "title"],
      meta: ["issuingAuthority", "certificateNumber"],
      date: ["issueDate"],
      description: ["description"],
      attachment: ["attachment"],
    }),
    trainings: mapJourneyItems(record.trainings ?? employee.trainings, {
      title: ["trainingTitle", "name", "title"],
      meta: ["trainingProvider"],
      date: ["completionDate"],
      description: ["keyLearnings", "description"],
      attachment: ["attachment"],
    }),
    appreciations: mapJourneyItems(
      record.appreciations ?? employee.appreciations,
      {
        title: ["appreciationTitle", "name", "title"],
        meta: ["issuedBy"],
        date: ["appreciationDate"],
        description: ["description", "quote"],
        attachment: ["attachment"],
      },
    ),
    promotions: mapJourneyItems(record.promotions ?? employee.promotions, {
      title: ["roleTitle", "name", "title"],
      meta: ["issuedBy"],
      date: ["promotionDate"],
      description: ["description"],
      attachment: ["attachment"],
    }),
    skillItems,
    journeys: mapJourneyPhotos(record.journeys ?? employee.journeys),
  };
}

function asDocArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const record = asRecord(data);
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.documents)) return record.documents;
  if (Array.isArray(record.data)) return record.data;
  return [];
}

export function mapEmployeeDocument(raw: unknown): EmployeeDocument {
  const record = asRecord(raw);
  const upload = asRecord(record.upload ?? record.employeeDocument);
  const statusRaw = (
    readString(upload, "status") ||
    readString(record, "status") ||
    ""
  ).toLowerCase();
  let status: EmployeeDocument["status"];
  if (statusRaw === "approved" || readBool(upload, "isApproved")) {
    status = "approved";
  } else if (statusRaw === "rejected") {
    status = "rejected";
  } else if (statusRaw === "pending" || upload.id || record.isUploaded) {
    status = "pending";
  }

  const isUploaded =
    readBool(record, "isUploaded") ||
    Boolean(upload.id) ||
    Boolean(readString(upload, "frontImage"));

  return {
    id:
      readString(record, "documentId") ||
      readString(record, "id") ||
      String(record.id ?? ""),
    name: readString(record, "name") || readString(record, "documentName") || "Document",
    isMandatory: readBool(record, "isMandatory"),
    isUploaded,
    status,
    frontImageUrl:
      readString(upload, "frontImage") ||
      readString(upload, "documentUrl") ||
      undefined,
    backImageUrl: readString(upload, "backImage") || undefined,
    reason:
      readString(upload, "reason") ||
      readString(record, "reason") ||
      undefined,
  };
}

export function computeEmployeeDocumentStats(
  documents: EmployeeDocument[],
): EmployeeDocumentStats {
  const mandatory = documents.filter((d) => d.isMandatory);
  return {
    uploaded: documents.filter((d) => d.isUploaded).length,
    total: documents.length,
    mandatoryUploaded: mandatory.filter((d) => d.isUploaded).length,
    mandatoryTotal: mandatory.length,
    mandatoryApproved: mandatory.filter((d) => d.status === "approved").length,
  };
}

/** Assignment fields may live on `assignment` (list rows) or the row itself (work experiences). */
function assignmentRecordFromRaw(raw: unknown): Record<string, unknown> {
  const record = asRecord(raw);
  const assignment = nested(record, "assignment");
  return Object.keys(assignment).length > 0 ? assignment : record;
}

function assignmentStatusScore(raw: unknown): number {
  const assignment = assignmentRecordFromRaw(raw);
  const status = readString(assignment, "status").toLowerCase();
  if (status === "verified") return 3;
  if (status === "pending") return 2;
  if (status === "rejected") return 0;
  return 1;
}

function assignmentUpdatedAt(raw: unknown): number {
  const assignment = assignmentRecordFromRaw(raw);
  const updatedAt =
    readString(assignment, "updatedAt") || readString(asRecord(raw), "updatedAt");
  const parsed = Date.parse(updatedAt);
  return Number.isFinite(parsed) ? parsed : 0;
}

function assignmentRecordId(raw: unknown): number {
  const assignment = assignmentRecordFromRaw(raw);
  return readNumber(assignment, "id") || readNumber(asRecord(raw), "id");
}

function employeeIdFromRaw(raw: unknown): string {
  const record = asRecord(raw);
  const employee = nested(record, "employee");
  return (
    readString(employee, "id") ||
    readString(record, "employeeId") ||
    readString(record, "id") ||
    ""
  );
}

/** Higher rank wins when collapsing duplicate employee rows. */
export function employeeAssignmentRank(raw: unknown): number {
  const assignment = assignmentRecordFromRaw(raw);
  let rank = 0;

  const currentlyWorking =
    "isCurrentlyWorking" in assignment
      ? readBool(assignment, "isCurrentlyWorking")
      : undefined;
  if (currentlyWorking === true) rank += 100;
  else if (currentlyWorking === false) rank -= 100;

  const assignmentActive =
    "isActive" in assignment ? readBool(assignment, "isActive") : undefined;
  if (assignmentActive === true) rank += 10;
  else if (assignmentActive === false) rank -= 10;

  const endDate =
    readString(assignment, "endDate") || readString(asRecord(raw), "endDate");
  if (endDate) rank -= 50;

  rank += assignmentStatusScore(raw) * 2;

  return rank;
}

/** Positive when `a` is a better assignment/work-experience row than `b`. */
export function compareAssignmentRows(a: unknown, b: unknown): number {
  const rankDiff = employeeAssignmentRank(a) - employeeAssignmentRank(b);
  if (rankDiff !== 0) return rankDiff;

  const statusDiff = assignmentStatusScore(a) - assignmentStatusScore(b);
  if (statusDiff !== 0) return statusDiff;

  const updatedDiff = assignmentUpdatedAt(a) - assignmentUpdatedAt(b);
  if (updatedDiff !== 0) return updatedDiff;

  return assignmentRecordId(a) - assignmentRecordId(b);
}

/** Pick the best assignment or work-experience row from a list. */
export function pickBestAssignmentRow(rows: unknown[]): unknown | undefined {
  if (rows.length === 0) return undefined;
  return rows.reduce((best, row) =>
    compareAssignmentRows(row, best) > 0 ? row : best,
  );
}

/** Collapse duplicate employee list rows — keep the first API row per employee id. */
export function dedupeEmployeeRows(rows: unknown[]): unknown[] {
  const seen = new Set<string>();
  const result: unknown[] = [];
  for (const row of rows) {
    const id = employeeIdFromRaw(row);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(row);
  }
  return result;
}

/** Keep the first mapped row per employee id. */
export function dedupeEmployees(items: Employee[]): Employee[] {
  const seen = new Set<string>();
  return items.filter((employee) => {
    if (!employee.id || seen.has(employee.id)) return false;
    seen.add(employee.id);
    return true;
  });
}

export function buildEmployeeRequestBody(input: EmployeeInput) {
  const departmentId = input.departmentId?.trim();
  const designationId = input.designationId?.trim();
  const outletId = input.outletId?.trim();
  const assignmentId = input.assignmentId?.trim();

  return {
    name: input.name,
    email: input.email,
    phone: input.phone,
    score: input.score,
    joinedDate: input.joinedDate,
    isActive: input.isActive ?? true,
    assignment:
      outletId || departmentId || designationId || assignmentId
        ? {
            ...(assignmentId
              ? { id: Number(assignmentId) || assignmentId }
              : {}),
            outletId: outletId ? Number(outletId) || outletId : undefined,
            departmentId: departmentId
              ? Number(departmentId) || departmentId
              : undefined,
            designationId: designationId
              ? Number(designationId) || designationId
              : undefined,
            isActive: input.isActive ?? true,
          }
        : undefined,
  };
}

function filterEmployees(
  rows: Employee[],
  params: EmployeeListParams,
): Employee[] {
  const q = params.q?.trim().toLowerCase() ?? "";
  return rows.filter((row) => {
    if (params.branchId && row.branchId !== params.branchId) return false;
    if (params.designationId && row.designationId !== params.designationId) {
      return false;
    }
    if (params.status && row.status !== params.status) return false;
    if (!q) return true;
    return (
      row.name.toLowerCase().includes(q) ||
      row.email.toLowerCase().includes(q) ||
      row.fadaId.toLowerCase().includes(q) ||
      row.branch.toLowerCase().includes(q)
    );
  });
}

function deriveStats(rows: Employee[]): EmployeeStats {
  return {
    total: rows.length,
    active: rows.filter((r) => r.status === "Active").length,
    newJoins: 0,
    exited: rows.filter((r) => r.status === "Inactive").length,
  };
}

async function getEmployeesMock(
  params: EmployeeListParams = {},
): Promise<ListResult<Employee>> {
  await mockDelay();
  const page = params.page ?? DEFAULT_PAGE;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const filtered = filterEmployees(mockEmployees, params);
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
  };
}

export async function getEmployees(
  params: EmployeeListParams = {},
): Promise<ListResult<Employee>> {
  if (isMockMode()) return getEmployeesMock(params);

  const page = params.page ?? DEFAULT_PAGE;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const needsClientFilter =
    Boolean(params.designationId) || params.status === "On Notice";

  // Server-supported: search, outletId, isActive. Designation / On Notice → client.
  let isActive: boolean | undefined;
  if (params.status === "Active") isActive = true;
  else if (params.status === "Inactive") isActive = false;

  const limit = needsClientFilter ? 100 : pageSize;
  const offset = needsClientFilter ? 0 : (page - 1) * pageSize;

  const query = buildQuery({
    search: params.q,
    outletId: params.branchId
      ? Number(params.branchId) || params.branchId
      : undefined,
    isActive,
    limit,
    offset,
  });

  const body = await apiFetch<unknown>(`/dealers/employees${query}`);
  const normalized = normalizeListPayload(body, {
    page: needsClientFilter ? 1 : page,
    pageSize: limit,
  });
  const dedupedRaw = dedupeEmployeeRows(normalized.items);
  const mapped = dedupedRaw.map(mapApiEmployee);
  let items = mapped;
  // API pagination.total is unique employees; do not subtract duplicate rows.
  const total = Math.max(normalized.total, dedupedRaw.length);

  if (!needsClientFilter) {
    return {
      items,
      total,
      page: normalized.page,
      pageSize,
    };
  }

  if (params.designationId) {
    items = items.filter((e) => e.designationId === params.designationId);
  }
  if (params.status === "On Notice") {
    items = items.filter((e) => e.status === "On Notice");
  }

  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

export async function getEmployeeStats(): Promise<EmployeeStats> {
  if (isMockMode()) {
    await mockDelay(120);
    return mockStats;
  }

  // No dedicated stats endpoint — derive from a broader list fetch.
  const result = await getEmployees({ page: 1, pageSize: 100 });
  return deriveStats(result.items);
}

export async function getEmployeeFilterOptions(): Promise<EmployeeFilterOptions> {
  if (isMockMode()) {
    await mockDelay(80);
    return mockFilterOptions;
  }

  const [outlets, list] = await Promise.all([
    getOutletOptions(),
    getEmployees({ page: 1, pageSize: 100 }),
  ]);

  const designationMap = new Map<string, string>();
  for (const emp of list.items) {
    if (emp.designationId && emp.designation && emp.designation !== "—") {
      designationMap.set(emp.designationId, emp.designation);
    }
  }

  return {
    branches: outlets,
    designations: Array.from(designationMap.entries()).map(([value, label]) => ({
      value,
      label,
    })),
  };
}

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  if (isMockMode()) {
    await mockDelay();
    return {
      id: `mock-${Date.now()}`,
      name: input.name,
      email: input.email ?? "",
      phone: input.phone ?? "",
      fadaId: "—",
      branch: "—",
      branchId: input.outletId ?? "",
      designation: "—",
      designationId: input.designationId ?? "",
      departmentId: input.departmentId,
      assignmentId: input.assignmentId,
      status: input.isActive === false ? "Inactive" : "Active",
      fadaScore: input.score ?? 0,
      isActive: input.isActive !== false,
      joinedDate: input.joinedDate,
    };
  }

  const body = await apiFetch<unknown>("/dealers/employees", {
    method: "POST",
    body: buildEmployeeRequestBody(input),
  });
  return mapApiEmployee(unwrapApiData(body) ?? body);
}

export async function updateEmployee(
  id: string,
  input: EmployeeInput,
): Promise<Employee> {
  if (isMockMode()) {
    await mockDelay();
    return {
      id,
      name: input.name,
      email: input.email ?? "",
      phone: input.phone ?? "",
      fadaId: "—",
      branch: "—",
      branchId: input.outletId ?? "",
      designation: "—",
      designationId: input.designationId ?? "",
      departmentId: input.departmentId,
      assignmentId: input.assignmentId,
      status: input.isActive === false ? "Inactive" : "Active",
      fadaScore: input.score ?? 0,
      isActive: input.isActive !== false,
      joinedDate: input.joinedDate,
    };
  }

  const body = await apiFetch<unknown>(`/dealers/employees/${id}`, {
    method: "PUT",
    body: buildEmployeeRequestBody(input),
  });
  return mapApiEmployee(unwrapApiData(body) ?? body);
}

export async function deleteEmployee(id: string): Promise<void> {
  if (isMockMode()) {
    await mockDelay();
    return;
  }
  await apiFetch(`/dealers/employees/${id}`, { method: "DELETE" });
}

export async function deactivateEmployee(employee: Employee): Promise<Employee> {
  return updateEmployee(employee.id, {
    name: employee.name,
    email: employee.email,
    phone: employee.phone,
    score: employee.fadaScore,
    outletId: employee.branchId || undefined,
    isActive: false,
    joinedDate: employee.joinedDate,
  });
}

function mapImportSkippedRow(raw: unknown): EmployeeImportSkippedRow | null {
  const record = asRecord(raw);
  const name = readString(record, "name");
  if (!name) return null;

  return {
    name,
    email: readString(record, "email"),
    phone: readString(record, "phone"),
    designation: readString(record, "designation"),
    department: readString(record, "department"),
    outletCode: readString(record, "outletCode"),
    startDate: readString(record, "startDate"),
    reason: readString(record, "reason") || "Import skipped",
  };
}

function findImportRowNumber(
  items: EmployeeImportItem[],
  skipped: EmployeeImportSkippedRow,
): number {
  const email = skipped.email.trim().toLowerCase();
  const phone = skipped.phone.trim();
  const index = items.findIndex(
    (item) =>
      item.email.trim().toLowerCase() === email ||
      (phone && item.phone.trim() === phone),
  );
  return index >= 0 ? index + 2 : 0;
}

/** Map parsed items + API skipped rows into UI result counts. */
export function buildEmployeeImportResult(
  items: EmployeeImportItem[],
  skippedRows: EmployeeImportSkippedRow[],
  parseErrors: EmployeeImportRowError[] = [],
): EmployeeImportResult {
  if (parseErrors.length > 0) {
    return {
      total: items.length + parseErrors.length,
      created: 0,
      failed: parseErrors.length,
      errors: parseErrors,
    };
  }

  const total = items.length;
  const errors: EmployeeImportRowError[] = skippedRows.map((row) => ({
    row: findImportRowNumber(items, row),
    message: row.reason,
  }));
  const failed = errors.length;

  return {
    total,
    created: total - failed,
    failed,
    errors,
  };
}

function mapImportSkippedRows(raw: unknown): EmployeeImportSkippedRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(mapImportSkippedRow)
    .filter((row): row is EmployeeImportSkippedRow => row != null);
}

function mockImportSkippedRows(
  items: EmployeeImportItem[],
): EmployeeImportSkippedRow[] {
  return items
    .filter((item) => item.email.toLowerCase().includes("skip"))
    .map((item) => ({
      ...item,
      reason: "Employee already working presently.",
    }));
}

/**
 * Bulk CSV import. Parses CSV client-side, then POST JSON array to
 * `/dealers/employees/import`. See `deploy/EMPLOYEE_CSV_IMPORT_API.md`.
 */
export async function importEmployeesCsv(
  file: File,
): Promise<EmployeeImportResult> {
  const { items, errors: parseErrors } = await parseEmployeeImportCsv(file);

  if (parseErrors.length > 0) {
    return buildEmployeeImportResult(items, [], parseErrors);
  }

  if (items.length === 0) {
    return {
      total: 0,
      created: 0,
      failed: 0,
      errors: [{ row: 1, message: "CSV has no data rows" }],
    };
  }

  if (isMockMode()) {
    await mockDelay(400);
    const skipped = mockImportSkippedRows(items);
    return buildEmployeeImportResult(items, skipped);
  }

  const body = await apiFetch<unknown>("/dealers/employees/import", {
    method: "POST",
    body: items,
  });
  const skipped = mapImportSkippedRows(unwrapApiData(body) ?? body);
  return buildEmployeeImportResult(items, skipped);
}

export async function createEmployeeTransfer(
  input: EmployeeTransferInput,
  meta?: { employeeName: string; fadaId: string; toBranch: string },
): Promise<void> {
  if (input.fromOutletId && input.fromOutletId === input.outletId) {
    throw new ApiError({
      message: "Select a different outlet",
      status: 409,
    });
  }

  if (isMockMode()) {
    await mockDelay(200);
    const today = new Date().toISOString().slice(0, 10);
    addMockJoinInvitation({
      id: `inv-xfer-${Date.now()}`,
      employeeName: meta?.employeeName ?? "Employee",
      fadaId: meta?.fadaId ?? "—",
      requestType: "Join",
      fromTo: meta?.toBranch ?? "—",
      branchId: input.outletId,
      branchName: meta?.toBranch ?? "—",
      requestedAt: today,
      status: "Pending",
      canDecide: true,
    });
    return;
  }

  await apiFetch("/dealers/employeement-transfer", {
    method: "POST",
    body: {
      employeeId: Number(input.employeeId) || input.employeeId,
      outletId: Number(input.outletId) || input.outletId,
      departmentId: Number(input.departmentId) || input.departmentId,
      designationId: Number(input.designationId) || input.designationId,
    },
  });
}

function mapEmployeeJoiningCandidate(raw: unknown): EmployeeJoiningCandidate {
  const record = asRecord(raw);
  return {
    id: readString(record, "id") || String(record.id ?? ""),
    fadaId: readString(record, "fadaId") || readString(record, "fadaID") || "—",
    name: readString(record, "name") || "Employee",
    email: readString(record, "email"),
    phone: readString(record, "phone"),
  };
}

/** Live API may return a single object; Swagger documents an array. */
function normalizeJoiningSearchResults(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") return [data];
  return [];
}

export async function searchEmployeesForJoining(
  search: string,
): Promise<EmployeeJoiningCandidate[]> {
  const q = search.trim();
  if (!q) {
    throw new ApiError({ message: "Enter a FADA ID", status: 422 });
  }

  if (isMockMode()) {
    await mockDelay(200);
    const needle = q.toLowerCase();
    const matches = mockEmployeeJoiningCandidates.filter(
      (row) =>
        row.fadaId.toLowerCase().includes(needle) ||
        row.name.toLowerCase().includes(needle),
    );
    if (matches.length === 0) {
      throw new ApiError({
        message: "No employee found for that FADA ID",
        status: 404,
      });
    }
    return matches.map((row) => ({ ...row }));
  }

  const body = await apiFetch<unknown>(
    `/dealers/employees/joining${buildQuery({ search: q })}`,
  );
  const items = normalizeJoiningSearchResults(unwrapApiData(body));
  if (items.length === 0) {
    throw new ApiError({
      message: "No employee found for that FADA ID",
      status: 404,
    });
  }
  return items.map(mapEmployeeJoiningCandidate);
}

export async function getEmployee(id: string): Promise<EmployeeDetail> {
  if (isMockMode()) {
    await mockDelay();
    const detail = getMockEmployeeDetail(id);
    if (!detail) {
      throw new ApiError({ message: "Employee not found", status: 404 });
    }
    return detail;
  }

  const body = await apiFetch<unknown>(`/dealers/employees/profile/${id}`);
  return mapApiEmployeeDetail(unwrapEmployeeProfilePayload(body));
}

export async function getEmployeeDocuments(
  employeeId: string,
): Promise<EmployeeDocument[]> {
  if (isMockMode()) {
    await mockDelay();
    if (!mockEmployees.some((e) => e.id === employeeId)) {
      throw new ApiError({ message: "Employee not found", status: 404 });
    }
    return mockEmployeeDocuments.map((doc) => ({ ...doc }));
  }

  const body = await apiFetch<unknown>(
    `/dealers/employees/${employeeId}/documents`,
  );
  return asDocArray(unwrapApiData(body)).map(mapEmployeeDocument);
}

export async function approveEmployeeDocument(
  employeeId: string,
  documentId: string,
): Promise<void> {
  if (isMockMode()) {
    await mockDelay();
    const doc = mockEmployeeDocuments.find((d) => d.id === documentId);
    if (doc) {
      doc.status = "approved";
    }
    return;
  }

  await apiFetch(
    `/dealers/employees/${employeeId}/approve-documents/${documentId}`,
    { method: "PUT" },
  );
}
