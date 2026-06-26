import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";

import { createDeploymentAction } from "@/app/deployments/actions";
import { DeploymentFields } from "@/app/deployments/deployment-fields";
import { AppShell } from "@/components/app-shell";
import { OfflineMutationForm } from "@/components/offline/offline-mutation-form";
import { OfflineSyncPanel } from "@/components/offline/offline-sync-panel";
import { Button } from "@/components/ui/button";
import {
  deploymentStatusLabels,
  deploymentStatuses,
  type DeploymentStatus,
} from "@/lib/deployments/service";
import { listDeployments } from "@/lib/deployments/server";
import { getMovementReasonLabels } from "@/lib/settings";
import { listMovementReasons } from "@/lib/settings/server";

export const dynamic = "force-dynamic";

type DeploymentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const statusMessages: Record<string, string> = {
  "queued-offline": "Deployment change saved offline and queued for sync.",
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function DeploymentsPage({ searchParams }: DeploymentsPageProps) {
  const query = (await searchParams) ?? {};
  const status = getParam(query.status);
  const from = getParam(query.from);
  const overdueReturn = getParam(query.overdueReturn) === "1";
  const statusMessage = getParam(query.statusMessage);
  const statusFilter = deploymentStatuses.includes(status as DeploymentStatus)
    ? (status as DeploymentStatus)
    : undefined;
  const message = statusMessage ? statusMessages[statusMessage] : null;
  const [visibleDeployments, movementReasons] = await Promise.all([
    listDeployments({ status: statusFilter, from, overdueReturn }),
    listMovementReasons(),
  ]);
  const movementReasonLabels = getMovementReasonLabels(movementReasons);

  return (
    <AppShell>
      <section className="grid gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-red)]">
            Deployments
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--ink)]">
            Deployment records
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">
            Plan, activate, return, and close field deployments before asset assignment is added.
          </p>
        </div>

        {message ? (
          <p className="rounded-md border border-[var(--border)] bg-white p-4 text-sm font-medium text-[var(--ink)]">
            {message}
          </p>
        ) : null}

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Filters</h2>
          </div>
          <form className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Status
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="status"
                defaultValue={statusFilter ?? ""}
              >
                <option value="">All</option>
                {deploymentStatuses.map((item) => (
                  <option key={item} value={item}>
                    {deploymentStatusLabels[item]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              From date
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="from"
                type="date"
                defaultValue={from ?? ""}
              />
            </label>
            <div className="flex items-end">
              <Button type="submit" variant="outline">
                Apply filters
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <div className="flex items-center gap-2">
            <Plus className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Create deployment</h2>
          </div>
          <OfflineMutationForm
            action={createDeploymentAction}
            className="mt-4 grid gap-4 md:grid-cols-3"
            displayLabelFields={["deploymentName", "deploymentId"]}
            entityType="deployment"
            operationType="create"
            redirectPath="/deployments"
          >
            <DeploymentFields movementReasons={movementReasonLabels} />
            <div className="md:col-span-3">
              <Button type="submit">Create deployment</Button>
            </div>
          </OfflineMutationForm>
        </section>

        <OfflineSyncPanel entityTypes={["deployment"]} title="Offline deployment changes" />

        <section className="overflow-hidden rounded-md border border-[var(--border)] bg-white">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Deployment list</h2>
          </div>
          {visibleDeployments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[60rem] border-collapse text-left text-sm">
                <thead className="bg-[var(--surface)] text-xs uppercase text-[var(--muted)]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Deployment</th>
                    <th className="px-5 py-3 font-semibold">Purpose</th>
                    <th className="px-5 py-3 font-semibold">Location</th>
                    <th className="px-5 py-3 font-semibold">Team</th>
                    <th className="px-5 py-3 font-semibold">Start</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {visibleDeployments.map((deployment) => (
                    <tr key={deployment.id}>
                      <td className="px-5 py-4">
                        <Link
                          className="font-medium text-[var(--ink)] hover:text-[var(--brand-red)]"
                          href={`/deployments/${deployment.id}`}
                        >
                          {deployment.deployment_name}
                        </Link>
                        <span className="block text-xs text-[var(--muted)]">
                          {deployment.deployment_id}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">{deployment.purpose_reason}</td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {deployment.deployment_location_site}
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">{deployment.team_name}</td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {dateTime(deployment.start_datetime)}
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {deploymentStatusLabels[deployment.status as DeploymentStatus] ??
                          deployment.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-8 text-sm leading-6 text-[var(--muted)]">
              No deployments match the current filters.
            </p>
          )}
        </section>
      </section>
    </AppShell>
  );
}
