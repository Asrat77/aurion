"use client";

import Link from "next/link";
import { Broadcast, Prohibit, Sparkle, Timer, WarningCircle } from "@phosphor-icons/react";
import { useSourcingMonitor } from "@/lib/businessNetwork";
import { businessHref } from "@/lib/channel";
import { formatBase } from "@/lib/money";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import { StatRowSkeleton } from "@/components/ui/Skeleton";

/**
 * Operations' view of the matching engine. Everything here is a queue someone
 * can act on: shortlists the scorer could not fill, invitations nobody has
 * answered, and the trades currently in flight.
 */
export default function SourcingMonitor() {
  const monitor = useSourcingMonitor();

  if (monitor.isLoading) return <StatRowSkeleton />;
  if (!monitor.data) {
    return <EmptyState icon={<WarningCircle size={24} />} title="The sourcing monitor is unavailable." />;
  }

  const { funnel, exceptions, recentMatchRuns, pipeline, slowestResponses, network, assistant } = monitor.data;
  const pipelineEntries = Object.entries(pipeline);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="display-heading">Sourcing monitor</h3>
        <span className="text-xs text-[var(--text-muted)]">Refreshes every minute</span>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-6">
        <StatCard label="Invited" value={String(funnel.invited)} />
        <StatCard label="Viewed" value={String(funnel.viewed)} />
        <StatCard label="Quoted" value={String(funnel.quoted)} />
        <StatCard label="Declined" value={String(funnel.declined)} />
        <StatCard label="Awarded" value={String(funnel.awarded)} />
        <StatCard label="Awaiting reply" value={String(funnel.awaitingResponse)} />
      </div>

      <section className="mb-8">
        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
          <WarningCircle size={16} className="text-[var(--warning)]" />
          Exception queue
        </h4>
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          Requests the deterministic matcher could not fill with at least three eligible suppliers.
        </p>
        {exceptions.length ? (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[620px]">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Organization</th>
                  <th>Requirement</th>
                  <th>Severity</th>
                  <th className="num">Matches</th>
                </tr>
              </thead>
              <tbody>
                {exceptions.map((exception) => (
                  <tr key={exception.requestForQuoteId}>
                    <td className="font-[family-name:var(--font-mono)]">{exception.reference}</td>
                    <td>{exception.organizationName ?? "—"}</td>
                    <td className="max-w-[220px] truncate">{exception.productInterest ?? "—"}</td>
                    <td>
                      <span
                        className={
                          exception.severity === "manual_sourcing"
                            ? "text-[var(--danger)]"
                            : "text-[var(--warning)]"
                        }
                      >
                        {exception.severity === "manual_sourcing" ? "Needs manual sourcing" : "Thin shortlist"}
                      </span>
                    </td>
                    <td className="num">{exception.matchCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Broadcast size={22} />} title="Every open request has a viable shortlist." />
        )}
      </section>

      <section className="mb-8">
        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
          <Timer size={16} className="text-[var(--gold)]" />
          Longest-waiting invitations
        </h4>
        {slowestResponses.length ? (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[520px]">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th className="num">Waiting</th>
                </tr>
              </thead>
              <tbody>
                {slowestResponses.map((invitation) => (
                  <tr key={invitation.id}>
                    <td className="font-[family-name:var(--font-mono)]">{invitation.reference}</td>
                    <td>{invitation.vendorName}</td>
                    <td>{invitation.status}</td>
                    <td className="num">{invitation.waitingHours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Timer size={22} />} title="No invitation is outstanding." />
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h4 className="mb-3 text-sm font-semibold text-white">Trade pipeline</h4>
          {pipelineEntries.length ? (
            <ul className="divide-y divide-[var(--border-subtle)]">
              {pipelineEntries.map(([status, count]) => (
                <li key={status} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-[var(--text-secondary)]">{status.replaceAll("_", " ")}</span>
                  <span className="font-[family-name:var(--font-mono)] text-white">{count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<Prohibit size={22} />} title="No trade orders yet." />
          )}
          <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">
            {network.protection.label} Value currently held:{" "}
            {network.trades.protectedCents > 0 ? formatBase(network.trades.protectedCents) : "none"}.
          </p>
        </section>

        <section>
          <h4 className="mb-3 text-sm font-semibold text-white">Recent match runs</h4>
          {recentMatchRuns.length ? (
            <ol className="divide-y divide-[var(--border-subtle)]">
              {recentMatchRuns.map((run) => (
                <li key={run.id} className="py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--gold)]">{run.event}</span>
                    <span className="shrink-0 text-xs text-[var(--text-muted)]">
                      {new Date(run.occurredAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    {run.requestForQuoteId ? (
                      <Link
                        href={businessHref(`/rfqs?rfq=${run.requestForQuoteId}`)}
                        className="text-[var(--gold-light)] hover:text-white"
                      >
                        {run.reference ?? `Request ${run.requestForQuoteId}`}
                      </Link>
                    ) : null}
                    {typeof run.details?.invited_count === "number" ? (
                      <span>invited {String(run.details.invited_count)}</span>
                    ) : null}
                    {typeof run.details?.match_count === "number" ? (
                      <span>{String(run.details.match_count)} eligible</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState icon={<Broadcast size={22} />} title="No matching has run yet." />
          )}
        </section>
      </div>

      <section className="mt-8 border-t border-[var(--border-subtle)] pt-6">
        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkle size={16} className="text-[var(--gold)]" />
          Assistant activity
        </h4>
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          {assistant.config.enabled
            ? `Answering through ${assistant.config.provider} (${assistant.config.model}).`
            : assistant.config.reason}
        </p>

        <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard label="Questions, 7 days" value={String(assistant.last7Days)} />
          <StatCard label="Answered" value={String(assistant.answered)} />
          <StatCard label="Failed" value={String(assistant.failed)} />
          <StatCard
            label="Median latency"
            value={assistant.medianLatencyMs != null ? `${assistant.medianLatencyMs}ms` : "—"}
          />
        </div>

        {assistant.recent.length ? (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[620px]">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Grounded on</th>
                  <th className="num">Latency</th>
                </tr>
              </thead>
              <tbody>
                {assistant.recent.map((exchange) => (
                  <tr key={exchange.id}>
                    <td className="max-w-[280px] truncate">{exchange.question}</td>
                    <td>{exchange.task.replace("_", " ")}</td>
                    <td className={exchange.status === "failed" ? "text-[var(--danger)]" : ""}>{exchange.status}</td>
                    <td className="text-xs text-[var(--text-muted)]">
                      {Object.entries(exchange.groundedOn)
                        .map(([key, count]) => `${count} ${key}`)
                        .join(", ") || "—"}
                    </td>
                    <td className="num">{exchange.latencyMs != null ? `${exchange.latencyMs}ms` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Sparkle size={22} />} title="No one has asked the assistant anything yet." />
        )}
      </section>
    </div>
  );
}
