import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PencilLine } from "lucide-react";

import {
  checkInDeploymentAssetAction,
  checkOutDeploymentAssetAction,
  updateDeploymentAction,
} from "@/app/deployments/actions";
import { DeploymentFields } from "@/app/deployments/deployment-fields";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { listAssets } from "@/lib/assets/server";
import { deploymentStatusLabels, type DeploymentStatus } from "@/lib/deployments/service";
import { getDeploymentById, listDeploymentAssets } from "@/lib/deployments/server";

export const dynamic = "force-dynamic";

type DeploymentDetailPageProps = {
  params: Promise<{ id: string }>;
};

function dateTime(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function DeploymentDetailPage({ params }: DeploymentDetailPageProps) {
  const { id } = await params;
  const [deployment, deploymentAssets, availableAssets] = await Promise.all([
    getDeploymentById(id),
    listDeploymentAssets(id),
    listAssets({ status: "available" }, "user"),
  ]);

  if (!deployment) {
    notFound();
  }
  const relatedAssets = await listAssets({}, "user");
  const assetById = new Map(relatedAssets.map((asset) => [asset.id, asset]));
  const activeDeploymentAssets = deploymentAssets.filter(
    (deploymentAsset) => !deploymentAsset.checked_in_at,
  );
  const activeAssetIds = new Set(
    activeDeploymentAssets.map((deploymentAsset) => deploymentAsset.asset_id),
  );
  const assignableAssets = availableAssets.filter((asset) => !activeAssetIds.has(asset.id));

  return (
    <AppShell>
      <section className="grid gap-6">
        <div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/deployments">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Deployments
            </Link>
          </Button>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-[var(--brand-red)]">
            {deployment.deployment_id}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[var(--ink)]">
            {deployment.deployment_name}
          </h1>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-medium text-[var(--muted)]">Status</h2>
            <p className="mt-2 text-lg font-semibold text-[var(--ink)]">
              {deploymentStatusLabels[deployment.status as DeploymentStatus] ?? deployment.status}
            </p>
          </article>
          <article className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-medium text-[var(--muted)]">Location/site</h2>
            <p className="mt-2 text-lg font-semibold text-[var(--ink)]">
              {deployment.deployment_location_site}
            </p>
          </article>
          <article className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-medium text-[var(--muted)]">Team</h2>
            <p className="mt-2 text-lg font-semibold text-[var(--ink)]">{deployment.team_name}</p>
          </article>
          <article className="rounded-md border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-medium text-[var(--muted)]">Start</h2>
            <p className="mt-2 text-lg font-semibold text-[var(--ink)]">
              {dateTime(deployment.start_datetime)}
            </p>
          </article>
        </section>

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Deployment details</h2>
          <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="font-medium text-[var(--muted)]">Purpose/reason</dt>
              <dd className="mt-1 text-[var(--ink)]">{deployment.purpose_reason}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Team leader</dt>
              <dd className="mt-1 text-[var(--ink)]">{deployment.team_leader || "Not recorded"}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Contact number</dt>
              <dd className="mt-1 text-[var(--ink)]">
                {deployment.contact_number || "Not recorded"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Expected return</dt>
              <dd className="mt-1 text-[var(--ink)]">
                {dateTime(deployment.expected_return_datetime)}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Actual return</dt>
              <dd className="mt-1 text-[var(--ink)]">
                {dateTime(deployment.actual_return_datetime)}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--muted)]">Notes</dt>
              <dd className="mt-1 text-[var(--ink)]">{deployment.notes || "Not recorded"}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="font-medium text-[var(--muted)]">Damage/fault notes</dt>
              <dd className="mt-1 text-[var(--ink)]">
                {deployment.damage_fault_notes || "Not recorded"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Deployment assets</h2>
          <form action={checkOutDeploymentAssetAction} className="mt-4 grid gap-4 md:grid-cols-3">
            <input name="deploymentId" type="hidden" value={deployment.id} />
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
              Available asset
              <select
                className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="assetId"
                required
              >
                <option value="">Choose asset</option>
                {assignableAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.asset_name} ({asset.unique_asset_id})
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-[var(--ink)] md:col-span-2">
              Notes
              <input
                className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                name="notes"
              />
            </label>
            <div className="md:col-span-3">
              <Button type="submit" disabled={assignableAssets.length === 0}>
                Check out asset
              </Button>
            </div>
          </form>

          {activeDeploymentAssets.length > 0 ? (
            <div className="mt-5 grid gap-3">
              {activeDeploymentAssets.map((deploymentAsset) => {
                const asset = assetById.get(deploymentAsset.asset_id);

                return (
                  <form
                    action={checkInDeploymentAssetAction}
                    className="grid gap-3 rounded-md border border-[var(--border)] p-4 md:grid-cols-4"
                    key={deploymentAsset.id}
                  >
                    <input name="deploymentId" type="hidden" value={deployment.id} />
                    <input name="deploymentAssetId" type="hidden" value={deploymentAsset.id} />
                    <div className="md:col-span-2">
                      <p className="font-medium text-[var(--ink)]">
                        {asset?.asset_name ?? "Unknown asset"}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Checked out {dateTime(deploymentAsset.checked_out_at)}
                      </p>
                    </div>
                    <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                      Return status
                      <select
                        className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                        name="returnStatus"
                        defaultValue="available"
                      >
                        <option value="available">Available</option>
                        <option value="damaged">Damaged</option>
                        <option value="under_maintenance">Under maintenance</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-medium text-[var(--ink)]">
                      Notes
                      <input
                        className="h-10 rounded-md border border-[var(--border)] px-3 text-base font-normal text-[var(--foreground)] outline-none focus:border-[var(--brand-red)]"
                        name="notes"
                      />
                    </label>
                    <div className="md:col-span-4">
                      <Button type="submit" variant="outline" size="sm">
                        Check in asset
                      </Button>
                    </div>
                  </form>
                );
              })}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
              No assets are currently checked out to this deployment.
            </p>
          )}
        </section>

        <section className="rounded-md border border-[var(--border)] bg-white p-5">
          <div className="flex items-center gap-2">
            <PencilLine className="size-5 text-[var(--brand-red)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--ink)]">Edit deployment</h2>
          </div>
          <form action={updateDeploymentAction} className="mt-4 grid gap-4 md:grid-cols-3">
            <input name="id" type="hidden" value={deployment.id} />
            <DeploymentFields deployment={deployment} />
            <div className="md:col-span-3">
              <Button type="submit">Save deployment</Button>
            </div>
          </form>
        </section>
      </section>
    </AppShell>
  );
}
