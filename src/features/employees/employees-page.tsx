"use client";

import { useMemo, useState } from "react";
import {
  Eye,
  Filter,
  MoreVertical,
  Plus,
  Upload,
  UserMinus,
  UserPlus,
  Users,
  UserCheck,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Pagination,
  ScoreBar,
  SearchInput,
  Select,
  StatCard,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui";
import { employees, employeeStats } from "@/features/employees/data";

const statusBadge = {
  Active: "success",
  "On Notice": "warning",
  Inactive: "muted",
} as const;

export function EmployeesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.fadaId.toLowerCase().includes(q) ||
        row.branch.toLowerCase().includes(q),
    );
  }, [query]);

  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const allVisibleSelected =
    pageRows.length > 0 && pageRows.every((row) => selected.includes(row.id));

  function toggleAll() {
    if (allVisibleSelected) {
      setSelected((prev) =>
        prev.filter((id) => !pageRows.some((row) => row.id === id)),
      );
      return;
    }
    setSelected((prev) => [
      ...new Set([...prev, ...pageRows.map((row) => row.id)]),
    ]);
  }

  function toggleOne(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div>
      <PageHeader
        title="Employee Management"
        description="Search, onboard, and manage dealership employment relationships."
        actions={
          <>
            <Button variant="secondary">
              <Upload />
              Import Employees
            </Button>
            <Button>
              <Plus />
              Add New Employee
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Employees"
          value={employeeStats.total}
          icon={Users}
          tone="orange"
          hint="Across all branches"
        />
        <StatCard
          label="Active Employees"
          value={employeeStats.active}
          icon={UserCheck}
          tone="green"
          hint="93% of workforce"
        />
        <StatCard
          label="New Joins"
          value={employeeStats.newJoins}
          icon={UserPlus}
          tone="blue"
          hint="This month"
        />
        <StatCard
          label="Exited"
          value={employeeStats.exited}
          icon={UserMinus}
          tone="red"
          hint="This month"
        />
      </div>

      <Card>
        <CardHeader className="flex-col items-stretch gap-4 sm:flex-row sm:items-center">
          <CardTitle>Employee List</CardTitle>
          <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:items-center">
            <SearchInput
              placeholder="Search by name, FADA ID, email…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              containerClassName="sm:w-72"
            />
            <Select
              aria-label="Branch filter"
              placeholder="All Branches"
              options={[
                { label: "Andheri West", value: "andheri" },
                { label: "Pune Service", value: "pune" },
                { label: "Thane Sales", value: "thane" },
                { label: "Nashik", value: "nashik" },
              ]}
            />
            <Select
              aria-label="Designation filter"
              placeholder="All Designations"
              options={[
                { label: "Sales Consultant", value: "sales" },
                { label: "Service Advisor", value: "service" },
                { label: "Team Lead", value: "lead" },
              ]}
            />
            <Select
              aria-label="Status filter"
              placeholder="All Status"
              options={[
                { label: "Active", value: "active" },
                { label: "On Notice", value: "notice" },
                { label: "Inactive", value: "inactive" },
              ]}
            />
            <Button variant="secondary" size="md">
              <Filter />
              Filters
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          <Table>
            <THead>
              <TR>
                <TH className="w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all employees on page"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    className="size-4 rounded border-[var(--color-border)]"
                  />
                </TH>
                <TH>Employee</TH>
                <TH>FADA ID</TH>
                <TH>Branch</TH>
                <TH>Designation</TH>
                <TH>Status</TH>
                <TH>FADA Score</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {pageRows.map((row) => (
                <TR key={row.id}>
                  <TD>
                    <input
                      type="checkbox"
                      aria-label={`Select ${row.name}`}
                      checked={selected.includes(row.id)}
                      onChange={() => toggleOne(row.id)}
                      className="size-4 rounded border-[var(--color-border)]"
                    />
                  </TD>
                  <TD>
                    <div className="flex items-center gap-3">
                      <Avatar name={row.name} size="md" />
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--color-heading)]">
                          {row.name}
                        </p>
                        <p className="truncate text-xs text-[var(--color-text-muted)]">
                          {row.email}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {row.phone}
                        </p>
                      </div>
                    </div>
                  </TD>
                  <TD className="font-medium">{row.fadaId}</TD>
                  <TD>{row.branch}</TD>
                  <TD>{row.designation}</TD>
                  <TD>
                    <Badge variant={statusBadge[row.status]}>{row.status}</Badge>
                  </TD>
                  <TD>
                    <ScoreBar score={row.fadaScore} />
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label="View">
                        <Eye />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="More">
                        <MoreVertical />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>

          <Pagination
            page={page}
            pageSize={pageSize}
            total={248}
            label="employees"
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
