"use client";

import { useState } from "react";
import useSWR from "swr";
import { Rocket, Plus, AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { Release, SectionKey, SectionStatus } from "./types";
import { SECTIONS_FOR_TYPE, computeReleaseStatus } from "./types";
import CreateReleaseModal from "./CreateReleaseModal";
import ReleaseDetail from "./ReleaseDetail";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const RELEASE_TYPE_LABELS: Record<string, string> = {
  "new-feature": "New Feature",
  customization: "Customization",
  hotfix: "Hotfix",
  integration: "Integration",
};

const RELEASE_TYPE_BADGE: Record<string, NonNullable<BadgeProps["variant"]>> = {
  "new-feature": "brand",
  customization: "info",
  hotfix: "error",
  integration: "neutral",
};

const STATUS_BADGE: Record<string, NonNullable<BadgeProps["variant"]>> = {
  draft: "neutral",
  "in-progress": "warning",
  blocked: "error",
  ready: "success",
  deployed: "brand",
};

const SECTION_DOT_COLOR: Record<SectionStatus, string> = {
  pending: "bg-neutral-300",
  "in-progress": "bg-warning-400",
  complete: "bg-success-400",
  na: "bg-neutral-200",
};

const SECTION_SHORT: Record<SectionKey, string> = {
  solutions: "Sol",
  engineering: "Eng",
  qa: "QA",
  devops: "DevOps",
  clientConfig: "CX",
  deployment: "Deploy",
  clientValidation: "Val",
};

const TEAM_MEMBER_LABELS: Record<string, string> = {
  "hemanga-bharadwaj": "Hemanga B.",
  "pankaj-chakrabarty": "Pankaj C.",
  "bhargav-nath": "Bhargav N.",
  "nilimpa-nizara-bora": "Nilimpa N.",
  "garima-kayal": "Garima K.",
  "kongkona-bayan": "Kongkona B.",
};

function getSectionStatus(release: Release, key: SectionKey): SectionStatus {
  const s = release.sections[key];
  if (!s) return "pending";
  return s.status;
}

interface UntrackedTicket {
  id: string;
  key: string;
  summary: string;
  status: string;
}

export default function ReleaseTracker() {
  const {
    data: releases,
    isLoading,
    mutate: mutateReleases,
  } = useSWR<Release[]>("/api/releases", fetcher, { refreshInterval: 30000 });

  const { data: untrackedRaw } = useSWR<UntrackedTicket[]>(
    "/api/jira/search?untracked=true",
    fetcher,
    { refreshInterval: 60000 }
  );

  const untracked = Array.isArray(untrackedRaw) ? untrackedRaw : [];

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [showUntrackedBanner, setShowUntrackedBanner] = useState(true);

  const releaseList = Array.isArray(releases) ? releases : [];

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center">
            <Rocket size={16} className="text-brand-500" />
          </div>
          <div>
            <h1 className="text-fg-primary font-semibold text-lg leading-tight">Release Tracker</h1>
            <p className="text-fg-secondary text-xs">Production Go-Live Validation Protocol</p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={14} />
          New Release
        </Button>
      </div>

      {/* Untracked tickets banner */}
      {untracked.length > 0 && showUntrackedBanner && (
        <div className="flex items-center justify-between bg-warning-25 border border-warning-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2.5 text-warning-600">
            <AlertTriangle size={15} className="shrink-0" />
            <span className="text-sm">
              <strong>{untracked.length}</strong> Jira{" "}
              {untracked.length === 1 ? "ticket" : "tickets"} approaching deployment without a
              release — {untracked.map((t) => t.key).join(", ")}
            </span>
          </div>
          <button
            onClick={() => setShowUntrackedBanner(false)}
            className="text-warning-600 hover:text-warning-500 text-xs transition-colors duration-200 ease-in-out ml-4 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-surface-card border border-neutral-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-fg-secondary gap-2">
            <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading releases…</span>
          </div>
        ) : releaseList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Rocket size={32} className="text-neutral-300 mb-3" />
            <p className="text-fg-primary text-sm font-medium">No releases yet</p>
            <p className="text-fg-secondary text-xs mt-1 max-w-xs">
              Create your first release to start tracking go-live readiness.
            </p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus size={14} />
              New Release
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left px-4 py-3 text-fg-secondary font-medium text-xs whitespace-nowrap">
                    Release ID
                  </th>
                  <th className="text-left px-4 py-3 text-fg-secondary font-medium text-xs whitespace-nowrap">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-fg-secondary font-medium text-xs whitespace-nowrap">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-fg-secondary font-medium text-xs whitespace-nowrap">
                    Client(s)
                  </th>
                  <th className="text-left px-4 py-3 text-fg-secondary font-medium text-xs whitespace-nowrap">
                    Product
                  </th>
                  <th className="text-left px-4 py-3 text-fg-secondary font-medium text-xs whitespace-nowrap">
                    Deploy Date
                  </th>
                  <th className="text-left px-4 py-3 text-fg-secondary font-medium text-xs whitespace-nowrap">
                    PM Owner
                  </th>
                  <th className="text-left px-4 py-3 text-fg-secondary font-medium text-xs whitespace-nowrap">
                    Sections
                  </th>
                  <th className="text-left px-4 py-3 text-fg-secondary font-medium text-xs whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {releaseList.map((release) => {
                  const requiredSections = SECTIONS_FOR_TYPE[release.releaseType];
                  const overallStatus = computeReleaseStatus(release);

                  return (
                    <tr
                      key={release.id}
                      className="hover:bg-neutral-100 transition-colors duration-200 ease-in-out"
                    >
                      {/* ID */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-brand-500 text-xs font-semibold">
                          {release.id}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3">
                        <span className="text-fg-primary text-sm font-medium max-w-[200px] truncate block">
                          {release.name}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <Badge variant={RELEASE_TYPE_BADGE[release.releaseType] ?? "neutral"} className="whitespace-nowrap">
                          {RELEASE_TYPE_LABELS[release.releaseType] ?? release.releaseType}
                        </Badge>
                      </td>

                      {/* Clients */}
                      <td className="px-4 py-3">
                        <span className="text-fg-secondary text-xs max-w-[140px] truncate block">
                          {release.clients.join(", ") || "—"}
                        </span>
                      </td>

                      {/* Product */}
                      <td className="px-4 py-3">
                        {release.products?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {release.products.map((p) => (
                              <Badge key={p} variant="neutral" className="whitespace-nowrap">
                                {p}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>

                      {/* Deploy Date */}
                      <td className="px-4 py-3">
                        <span className="text-fg-secondary text-xs whitespace-nowrap">
                          {release.deploymentDate
                            ? new Date(release.deploymentDate + "T00:00:00").toLocaleDateString()
                            : "—"}
                        </span>
                      </td>

                      {/* PM Owner */}
                      <td className="px-4 py-3">
                        <span className="text-fg-secondary text-xs whitespace-nowrap">
                          {TEAM_MEMBER_LABELS[release.pmOwner] ?? release.pmOwner}
                        </span>
                      </td>

                      {/* Section status dots */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {requiredSections.map((key) => {
                            const status = getSectionStatus(release, key);
                            return (
                              <span
                                key={key}
                                title={`${key}: ${status}`}
                                className={`w-2.5 h-2.5 rounded-pill ${SECTION_DOT_COLOR[status]}`}
                              />
                            );
                          })}
                        </div>
                      </td>

                      {/* Overall status */}
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_BADGE[overallStatus] ?? "neutral"} className="whitespace-nowrap">
                          {overallStatus}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedRelease(release)}
                          className="flex items-center gap-1 text-fg-secondary hover:text-fg-primary text-xs transition-colors duration-200 ease-in-out whitespace-nowrap"
                        >
                          Manage
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      <CreateReleaseModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => mutateReleases()}
      />

      {/* Detail slide-over */}
      {selectedRelease && (
        <ReleaseDetail
          release={selectedRelease}
          onClose={() => setSelectedRelease(null)}
          onUpdated={() => mutateReleases()}
          onDeleted={() => { setSelectedRelease(null); mutateReleases(); }}
        />
      )}
    </div>
  );
}
