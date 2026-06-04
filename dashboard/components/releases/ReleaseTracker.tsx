"use client";

import { useState } from "react";
import useSWR from "swr";
import { Rocket, Plus, AlertTriangle, ChevronRight } from "lucide-react";
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

const RELEASE_TYPE_BADGE: Record<string, string> = {
  "new-feature": "bg-indigo-900/50 text-indigo-300 border-indigo-700",
  customization: "bg-blue-900/50 text-blue-300 border-blue-700",
  hotfix: "bg-red-900/50 text-red-300 border-red-700",
  integration: "bg-purple-900/50 text-purple-300 border-purple-700",
};

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-gray-800 text-gray-400 border-gray-700",
  "in-progress": "bg-yellow-900/40 text-yellow-300 border-yellow-700",
  blocked: "bg-red-900/40 text-red-300 border-red-700",
  ready: "bg-green-900/40 text-green-300 border-green-700",
  deployed: "bg-indigo-900/40 text-indigo-300 border-indigo-700",
};

const SECTION_DOT_COLOR: Record<SectionStatus, string> = {
  pending: "bg-gray-600",
  "in-progress": "bg-yellow-400",
  complete: "bg-green-400",
  na: "bg-gray-700",
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
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center">
            <Rocket size={16} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg leading-tight">Release Tracker</h1>
            <p className="text-gray-500 text-xs">Production Go-Live Validation Protocol</p>
          </div>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={14} />
          New Release
        </button>
      </div>

      {/* Untracked tickets banner */}
      {untracked.length > 0 && showUntrackedBanner && (
        <div className="flex items-center justify-between bg-amber-900/20 border border-amber-700/50 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2.5 text-amber-300">
            <AlertTriangle size={15} className="shrink-0" />
            <span className="text-sm">
              <strong>{untracked.length}</strong> Jira{" "}
              {untracked.length === 1 ? "ticket" : "tickets"} approaching deployment without a
              release — {untracked.map((t) => t.key).join(", ")}
            </span>
          </div>
          <button
            onClick={() => setShowUntrackedBanner(false)}
            className="text-amber-600 hover:text-amber-400 text-xs transition-colors ml-4 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-600 gap-2">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading releases…</span>
          </div>
        ) : releaseList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Rocket size={32} className="text-gray-700 mb-3" />
            <p className="text-gray-400 text-sm font-medium">No releases yet</p>
            <p className="text-gray-600 text-xs mt-1 max-w-xs">
              Create your first release to start tracking go-live readiness.
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              className="mt-4 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={14} />
              New Release
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs whitespace-nowrap">
                    Release ID
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs whitespace-nowrap">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs whitespace-nowrap">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs whitespace-nowrap">
                    Client(s)
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs whitespace-nowrap">
                    Product
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs whitespace-nowrap">
                    Deploy Date
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs whitespace-nowrap">
                    PM Owner
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs whitespace-nowrap">
                    Sections
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {releaseList.map((release) => {
                  const requiredSections = SECTIONS_FOR_TYPE[release.releaseType];
                  const overallStatus = computeReleaseStatus(release);

                  return (
                    <tr
                      key={release.id}
                      className="hover:bg-gray-800/30 transition-colors"
                    >
                      {/* ID */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-indigo-400 text-xs font-semibold">
                          {release.id}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3">
                        <span className="text-white text-sm font-medium max-w-[200px] truncate block">
                          {release.name}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border whitespace-nowrap ${
                            RELEASE_TYPE_BADGE[release.releaseType] ?? ""
                          }`}
                        >
                          {RELEASE_TYPE_LABELS[release.releaseType] ?? release.releaseType}
                        </span>
                      </td>

                      {/* Clients */}
                      <td className="px-4 py-3">
                        <span className="text-gray-300 text-xs max-w-[140px] truncate block">
                          {release.clients.join(", ") || "—"}
                        </span>
                      </td>

                      {/* Product */}
                      <td className="px-4 py-3">
                        {release.products?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {release.products.map((p) => (
                              <span key={p} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-300 whitespace-nowrap">
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>

                      {/* Deploy Date */}
                      <td className="px-4 py-3">
                        <span className="text-gray-300 text-xs whitespace-nowrap">
                          {release.deploymentDate
                            ? new Date(release.deploymentDate + "T00:00:00").toLocaleDateString()
                            : "—"}
                        </span>
                      </td>

                      {/* PM Owner */}
                      <td className="px-4 py-3">
                        <span className="text-gray-300 text-xs whitespace-nowrap">
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
                                className={`w-2.5 h-2.5 rounded-full ${SECTION_DOT_COLOR[status]}`}
                              />
                            );
                          })}
                        </div>
                      </td>

                      {/* Overall status */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border whitespace-nowrap ${
                            STATUS_BADGE[overallStatus] ?? ""
                          }`}
                        >
                          {overallStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedRelease(release)}
                          className="flex items-center gap-1 text-gray-400 hover:text-white text-xs transition-colors whitespace-nowrap"
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
