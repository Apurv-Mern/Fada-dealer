"use client";

import {
  Building2,
  Eye,
  MoreVertical,
  Plus,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import {
  Badge,
  BarChart,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DonutChart,
  ScoreBar,
  Select,
  StatCard,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui";
import {
  branchPerformance,
  branchScores,
  branchStats,
  branches,
  employeesByBranch,
} from "@/features/branches/data";

const typeBadge = {
  Sales: "info",
  Service: "purple",
  "Sales & Service": "orange",
} as const;

export function BranchesPage() {
  return (
    <div>
      <PageHeader
        title="Branch Management"
        description="Configure dealership branches and monitor workforce distribution."
        actions={
          <Button>
            <Plus />
            Add New Branch
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Branches"
          value={branchStats.totalBranches}
          icon={Building2}
          tone="orange"
          hint="Across 2 locations"
        />
        <StatCard
          label="Active Branches"
          value={branchStats.activeBranches}
          icon={Building2}
          tone="green"
          hint="100% operational"
        />
        <StatCard
          label="Total Employees"
          value={branchStats.totalEmployees}
          icon={Users}
          tone="blue"
          hint={
            <span className="inline-flex items-center gap-1 text-[var(--color-success)]">
              <TrendingUp className="size-3" />
              +8.2% vs last month
            </span>
          }
        />
        <StatCard
          label="Avg FADA Score"
          value={branchStats.avgFadaScore}
          icon={UserCheck}
          tone="purple"
          hint="Out of 1000"
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Branch Overview</CardTitle>
          <Select
            aria-label="Period"
            options={[
              { label: "This Month", value: "month" },
              { label: "This Quarter", value: "quarter" },
              { label: "This Year", value: "year" },
            ]}
            value="month"
          />
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <THead>
              <TR>
                <TH>Branch Name</TH>
                <TH>Location</TH>
                <TH>Type</TH>
                <TH>Employees</TH>
                <TH>Active</TH>
                <TH>FADA Score</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {branches.map((branch) => (
                <TR key={branch.id}>
                  <TD className="font-semibold text-[var(--color-heading)]">
                    {branch.name}
                  </TD>
                  <TD className="text-[var(--color-text-muted)]">
                    {branch.location}
                  </TD>
                  <TD>
                    <Badge variant={typeBadge[branch.type]}>{branch.type}</Badge>
                  </TD>
                  <TD>{branch.employees}</TD>
                  <TD>{branch.active}</TD>
                  <TD>
                    <ScoreBar score={branch.fadaScore} />
                  </TD>
                  <TD>
                    <Badge
                      variant={
                        branch.status === "Active" ? "success" : "muted"
                      }
                    >
                      {branch.status}
                    </Badge>
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
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Employees by Branch</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              centerValue={248}
              centerLabel="Employees"
              slices={employeesByBranch}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branch Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {branchPerformance.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)] p-4"
                >
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xl font-semibold text-[var(--color-heading)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Branch FADA Score Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart items={branchScores} max={1000} />
        </CardContent>
      </Card>
    </div>
  );
}
