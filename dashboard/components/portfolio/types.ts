export type ItemStatus = 'not_started' | 'in_progress' | 'review' | 'done' | 'blocked' | 'on_hold' | 'not_applicable' | 'tbd';
export type TeamType = 'backend' | 'frontend' | 'qa';

export interface StatusBreakdown {
  backend: ItemStatus;
  frontend: ItemStatus;
  qa: ItemStatus;
}

export interface PortfolioItem {
  slNo?: string; // Sl No from CSV — primary merge key
  id: string; // Form Req Id
  name: string; // Epic
  projectId: string;
  productCategory?: string;
  status: StatusBreakdown;
  dueDate: Date; // Release Date (Blocker Planned Release Date)
  assignee: string;
  assigneeId: string;
  blockers: string[]; // IDs of blocking items
  createdDate: Date;
  completedDate?: Date;
  notes?: string;
  // Ticket tracking
  backendTicket?: string;
  frontendTicket?: string;
  qaTicket?: string;
  // Layer-specific owners
  backendOwner?: string;
  frontendOwner?: string;
  qaOwner?: string;
  // Documentation
  docLink?: string;
  // Overall status (computed or explicit)
  overallStatus?: ItemStatus;
  // Layer-specific dates for real velocity calculation
  backendStartDate?: Date;
  backendPlannedCompletionDate?: Date;
  frontendStartDate?: Date;
  frontendPlannedCompletionDate?: Date;
  qaStartDate?: Date;
  qaPlannedCompletionDate?: Date;
  // Story points per layer for velocity-based prediction
  backendStoryPoints?: number;
  frontendStoryPoints?: number;
  qaStoryPoints?: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdDate: Date;
  dueDate: Date;
  items: PortfolioItem[];
  owner: string;
  ownerId: string;
}

export interface ActivityFeedItem {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  itemId: string;
  itemName: string;
  projectId: string;
  projectName: string;
  oldValue?: string;
  newValue?: string;
  note?: string;
}

export interface HealthScoreFactors {
  statusFactor: number;
  timelineFactor: number;
  blockerFactor: number;
  confidenceFactor: number;
  overallScore: number;
}

export interface ItemHealthScore extends HealthScoreFactors {
  healthColor: string;
  healthLabel: string;
  recommendedActions: string[];
  predictedCompletion: Date;
  confidence: number;
}

export interface DashboardMetrics {
  portfolioHealth: number;
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  notStartedItems: number;
  atRiskItems: number;
  blockedItems: number;
  avgVelocity: number;
  velocityTrend: number; // % change
  predictedShipDate: Date;
  confidence: number;
}

export interface ViewPreset {
  id: 'executive' | 'team' | 'detailed' | 'custom';
  label: string;
  icon: string;
}

export interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  team: TeamType;
  itemsAssigned: number;
  isAvailable: boolean;
}

export interface Recommendation {
  id: string;
  severity: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  impact: number; // Health score improvement points
  action: string;
  owner?: string;
}
