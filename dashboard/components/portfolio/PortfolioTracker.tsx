"use client";
import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import { DashboardHome } from "./DashboardHome";
import { ProjectDetail } from "./ProjectDetail";
import CSVUpload from "./CSVUpload";
import type { Project, PortfolioItem } from "./types";

const STORAGE_KEY = "stt_projects_v1";

function reviveDates(projects: Project[]): Project[] {
  return projects.map(p => ({
    ...p,
    createdDate: new Date(p.createdDate),
    dueDate: new Date(p.dueDate),
    items: p.items.map(i => ({
      ...i,
      dueDate: new Date(i.dueDate),
      createdDate: new Date(i.createdDate),
      completedDate: i.completedDate ? new Date(i.completedDate) : undefined,
      backendStartDate: i.backendStartDate ? new Date(i.backendStartDate) : undefined,
      backendPlannedCompletionDate: i.backendPlannedCompletionDate ? new Date(i.backendPlannedCompletionDate) : undefined,
      frontendStartDate: i.frontendStartDate ? new Date(i.frontendStartDate) : undefined,
      frontendPlannedCompletionDate: i.frontendPlannedCompletionDate ? new Date(i.frontendPlannedCompletionDate) : undefined,
      qaStartDate: i.qaStartDate ? new Date(i.qaStartDate) : undefined,
      qaPlannedCompletionDate: i.qaPlannedCompletionDate ? new Date(i.qaPlannedCompletionDate) : undefined,
    })),
  }));
}

function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return reviveDates(JSON.parse(raw) as Project[]);
  } catch {
    return [];
  }
}

type Screen = "dashboard" | "project" | "upload";

export function PortfolioTracker() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>("dashboard");
  const [atRiskFilter, setAtRiskFilter] = useState(false);

  useEffect(() => {
    setProjects(loadProjects());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
  }, [projects, hydrated]);

  const allItems = projects.flatMap(p => p.items);

  const handleProjectClick = (projectId: string) => {
    void projectId;
    setAtRiskFilter(false);
    setCurrentScreen("project");
  };

  const handleAtRiskClick = () => {
    setAtRiskFilter(true);
    setCurrentScreen("project");
  };

  const handleUpload = (newItems: PortfolioItem[]) => {
    setProjects(prev => {
      const updated: Project[] = prev.map(p => ({ ...p, items: [...p.items] }));

      for (const newItem of newItems) {
        if (!newItem.slNo) continue;

        let found = false;
        for (const project of updated) {
          const idx = project.items.findIndex(i => i.slNo === newItem.slNo);
          if (idx >= 0) {
            project.items[idx] = { ...newItem, projectId: project.id };
            found = true;
            break;
          }
        }

        if (!found) {
          const category = newItem.productCategory || "General";
          let target = updated.find(p => p.name === category);
          if (!target) {
            const pid = `proj-${category.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`;
            target = {
              id: pid,
              name: category,
              description: `${category} requirements`,
              createdDate: new Date(),
              dueDate: newItem.dueDate,
              items: [],
              owner: "",
              ownerId: "",
            };
            updated.push(target);
          }
          target.items.push({ ...newItem, projectId: target.id });
        }
      }

      return updated.map(p => ({
        ...p,
        dueDate: p.items.reduce((m, i) => (i.dueDate > m ? i.dueDate : m), p.dueDate),
      }));
    });

    setCurrentScreen("dashboard");
  };

  const handleDeleteItem = (slNo: string) => {
    setProjects(prev => prev.map(p => ({ ...p, items: p.items.filter(i => i.slNo !== slNo) })));
  };

  const handleDeleteItems = (slNos: string[]) => {
    const slNoSet = new Set(slNos);
    setProjects(prev =>
      prev.map(p => ({ ...p, items: p.items.filter(i => !i.slNo || !slNoSet.has(i.slNo)) }))
    );
  };

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (currentScreen === "upload") {
    return (
      <CSVUpload
        onClose={() => setCurrentScreen("dashboard")}
        onUpload={handleUpload}
        currentItems={allItems}
      />
    );
  }

  if (currentScreen === "project") {
    return (
      <div className="space-y-0">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => { setCurrentScreen("dashboard"); setAtRiskFilter(false); }}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Overview
          </button>
          <button
            onClick={() => setCurrentScreen("upload")}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Upload size={15} />
            Upload CSV
          </button>
        </div>
        <ProjectDetail
          projects={projects}
          allItems={allItems}
          onBack={() => { setCurrentScreen("dashboard"); setAtRiskFilter(false); }}
          onDeleteItem={handleDeleteItem}
          onDeleteItems={handleDeleteItems}
          initialAtRiskFilter={atRiskFilter}
        />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={() => setCurrentScreen("upload")}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Upload size={15} />
          Upload CSV
        </button>
      </div>
      <DashboardHome
        projects={projects}
        onProjectClick={handleProjectClick}
        onViewAllProjects={() => setCurrentScreen("project")}
        onAtRiskClick={handleAtRiskClick}
      />
    </div>
  );
}
