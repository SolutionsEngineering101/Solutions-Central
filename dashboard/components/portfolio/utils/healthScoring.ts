import type { PortfolioItem, ItemHealthScore } from '../types';

const STATUS_MILESTONE: Record<string, number> = {
  done:           100,
  review:          75,
  in_progress:     50,
  on_hold:         25,
  blocked:         25,
  not_started:      0,
  tbd:              0,
  // not_applicable is excluded from scoring — handled separately
};

const PROGRESSING = new Set(['in_progress', 'review', 'done']);

export function calculateStatusFactor(item: PortfolioItem): number {
  const { backend, frontend, qa } = item.status;

  // Backend: always scored unless N/A
  const backendScore = backend === 'not_applicable' ? null : (STATUS_MILESTONE[backend] ?? 0);

  // Frontend TBD is expected if backend is actively progressing — score as neutral (80)
  let frontendScore: number | null;
  if (frontend === 'not_applicable') {
    frontendScore = null;
  } else if (frontend === 'tbd' && PROGRESSING.has(backend)) {
    frontendScore = 80; // sequential planning — expected, healthy signal
  } else {
    frontendScore = STATUS_MILESTONE[frontend] ?? 0;
  }

  // QA TBD is expected if frontend is progressing or frontend is also sequentially TBD
  let qaScore: number | null;
  if (qa === 'not_applicable') {
    qaScore = null;
  } else if (qa === 'tbd' && (PROGRESSING.has(frontend) || (frontend === 'tbd' && PROGRESSING.has(backend)))) {
    qaScore = 80; // sequential planning — expected, healthy signal
  } else {
    qaScore = STATUS_MILESTONE[qa] ?? 0;
  }

  const scores = [backendScore, frontendScore, qaScore].filter((s): s is number => s !== null);
  if (scores.length === 0) return 100; // all N/A — no work required
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function calculateTimelineFactor(item: PortfolioItem, _velocityTrend: number): number {
  const now = new Date();
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const daysUntilDue = Math.ceil((item.dueDate.getTime() - now.getTime()) / MS_PER_DAY);

  // Ratio-based scoring when start + planned completion dates are available.
  // A 1-SP (1-day) item in progress should not be penalised just because it has 1 day left.
  if (item.backendStartDate && item.backendPlannedCompletionDate) {
    const totalDays = Math.max(1, Math.ceil(
      (item.backendPlannedCompletionDate.getTime() - item.backendStartDate.getTime()) / MS_PER_DAY
    ));
    const ratio = daysUntilDue / totalDays;

    if (ratio > 1)    return 100; // sprint hasn't started yet — fully on track
    if (ratio >= 0.3) return 100; // comfortably within planned window
    if (ratio >= 0.1) return 80;  // final stretch, still within plan
    if (ratio >= 0)   return 60;  // last day — tight but within plan
    if (ratio >= -0.3) return 40; // slightly overdue
    if (ratio >= -1)   return 15; // significantly overdue
    return 0;                     // very overdue
  }

  // Fallback: absolute days when no stage dates are available
  if (daysUntilDue > 14)  return 100;
  if (daysUntilDue >= 7)  return 80;
  if (daysUntilDue >= 3)  return 60;
  if (daysUntilDue >= 1)  return 40;
  if (daysUntilDue === 0) return 30;
  if (daysUntilDue >= -7) return 15;
  return 0;
}

export function calculateBlockerFactor(item: PortfolioItem, allItems: PortfolioItem[]): number {
  let blockerFactor = 100;

  // Active blockers penalty: -15 points per blocker
  for (const blockerId of item.blockers) {
    const blockingItem = allItems.find(i => i.id === blockerId);
    if (blockingItem) {
      // Only count as active blocker if blocking item is not done
      if (blockingItem.status.backend !== 'done' || blockingItem.status.frontend !== 'done' || blockingItem.status.qa !== 'done') {
        blockerFactor -= 15;
      }
    }
  }

  return Math.max(0, blockerFactor);
}

export function calculateItemHealthScore(
  item: PortfolioItem,
  allItems: PortfolioItem[],
  velocityTrend: number = 0
): ItemHealthScore {
  const statusFactor = calculateStatusFactor(item);
  const timelineFactor = calculateTimelineFactor(item, velocityTrend);
  const blockerFactor = calculateBlockerFactor(item, allItems);

  // Weighted calculation: Status 40%, Timeline 35%, Blockers 25%
  const overallScore = Math.round(
    (statusFactor * 0.4) +
    (timelineFactor * 0.35) +
    (blockerFactor * 0.25)
  );

  const { healthColor, healthLabel } = getHealthColorAndLabel(overallScore);
  const recommendedActions = generateRecommendations(item, allItems);
  const predictedCompletion = predictCompletionDate(item, velocityTrend);

  return {
    statusFactor,
    timelineFactor,
    blockerFactor,
    confidenceFactor: 0,
    overallScore,
    healthColor,
    healthLabel,
    recommendedActions,
    predictedCompletion,
    confidence: 0,
  };
}

function getHealthColorAndLabel(score: number): { healthColor: string; healthLabel: string } {
  if (score >= 80) {
    return { healthColor: '#16a34a', healthLabel: 'HEALTHY' };
  } else if (score >= 60) {
    return { healthColor: '#f59e0b', healthLabel: 'AT RISK' };
  } else if (score >= 40) {
    return { healthColor: '#eab308', healthLabel: 'CRITICAL' };
  } else {
    return { healthColor: '#dc2626', healthLabel: 'OFF TRACK' };
  }
}

function generateRecommendations(item: PortfolioItem, allItems: PortfolioItem[]): string[] {
  const recommendations: string[] = [];

  // Check for active blockers
  const activeBlockers = item.blockers.filter(blockerId => {
    const blocker = allItems.find(i => i.id === blockerId);
    return blocker && (blocker.status.backend !== 'done' || blocker.status.frontend !== 'done' || blocker.status.qa !== 'done');
  });

  if (activeBlockers.length > 0) {
    recommendations.push(`Resolve ${activeBlockers.length} active blocker(s)`);
  }

  // Check for overdue items
  const now = new Date();
  const daysUntilDue = Math.ceil((item.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntilDue < 0) {
    recommendations.push(`Item is ${Math.abs(daysUntilDue)} days overdue`);
  } else if (daysUntilDue < 3) {
    recommendations.push(`Due in ${daysUntilDue} days - prioritize completion`);
  }

  // Check for incomplete dependencies
  const incompleteLayers = [];
  if (item.status.backend !== 'done') incompleteLayers.push('Backend');
  if (item.status.frontend !== 'done') incompleteLayers.push('Frontend');
  if (item.status.qa !== 'done') incompleteLayers.push('QA');

  if (incompleteLayers.length > 0) {
    recommendations.push(`${incompleteLayers.join(', ')} still in progress`);
  }

  // Check for missing assignee
  if (!item.assignee) {
    recommendations.push('No assignee - assign owner to increase confidence');
  }

  return recommendations.slice(0, 3); // Top 3 recommendations
}

function predictCompletionDate(item: PortfolioItem, velocityTrend: number): Date {
  const now = new Date();
  const velocity = calculateLayerVelocity([item]);

  // Predict based on remaining story points per layer
  let latestPrediction = new Date(now);
  let hasValidPrediction = false;

  // Backend prediction
  if (item.status.backend !== 'done' && item.backendStoryPoints && velocity.backend > 0) {
    const daysNeeded = Math.ceil(item.backendStoryPoints / velocity.backend);
    const predicted = new Date(now);
    predicted.setDate(predicted.getDate() + daysNeeded);
    if (predicted > latestPrediction) latestPrediction = predicted;
    hasValidPrediction = true;
  }

  // Frontend prediction
  if (item.status.frontend !== 'done' && item.frontendStoryPoints && velocity.frontend > 0) {
    const daysNeeded = Math.ceil(item.frontendStoryPoints / velocity.frontend);
    const predicted = new Date(now);
    predicted.setDate(predicted.getDate() + daysNeeded);
    if (predicted > latestPrediction) latestPrediction = predicted;
    hasValidPrediction = true;
  }

  // QA prediction
  if (item.status.qa !== 'done' && item.qaStoryPoints && velocity.qa > 0) {
    const daysNeeded = Math.ceil(item.qaStoryPoints / velocity.qa);
    const predicted = new Date(now);
    predicted.setDate(predicted.getDate() + daysNeeded);
    if (predicted > latestPrediction) latestPrediction = predicted;
    hasValidPrediction = true;
  }

  // Fallback to due date-based estimation if no velocity data
  if (!hasValidPrediction) {
    const daysUntilDue = Math.ceil((item.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    let estimatedDays = daysUntilDue;

    if (velocityTrend < -15) {
      estimatedDays += 5;
    } else if (velocityTrend < -5) {
      estimatedDays += 2;
    } else if (velocityTrend > 10) {
      estimatedDays -= 2;
    }

    estimatedDays = Math.max(1, estimatedDays);
    latestPrediction = new Date();
    latestPrediction.setDate(latestPrediction.getDate() + estimatedDays);
  }

  return latestPrediction;
}

export function calculatePortfolioHealth(items: PortfolioItem[], allItems: PortfolioItem[], velocityTrend: number): number {
  if (items.length === 0) return 100;

  const healthScores = items.map(item =>
    calculateItemHealthScore(item, allItems, velocityTrend).overallScore
  );

  const avgHealth = Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length);
  return avgHealth;
}

export function getAtRiskItemsCount(items: PortfolioItem[], allItems: PortfolioItem[], velocityTrend: number): number {
  return items.filter(item => {
    const score = calculateItemHealthScore(item, allItems, velocityTrend).overallScore;
    return score < 80;
  }).length;
}

export function getBlockedItemsCount(items: PortfolioItem[]): number {
  return items.filter(item =>
    item.status.backend === 'blocked' || item.status.frontend === 'blocked' || item.status.qa === 'blocked'
  ).length;
}

export function calculateLayerVelocity(items: PortfolioItem[]): { backend: number; frontend: number; qa: number } {
  // Calculate story points per day for each layer based on completed items
  // Assumes 2-week sprint cycle (14 days)

  const SPRINT_DAYS = 14;
  let backendPoints = 0;
  let frontendPoints = 0;
  let qaPoints = 0;

  for (const item of items) {
    // Backend velocity from completed items
    if (item.status.backend === 'done' && item.backendStoryPoints) {
      backendPoints += item.backendStoryPoints;
    }

    // Frontend velocity from completed items
    if (item.status.frontend === 'done' && item.frontendStoryPoints) {
      frontendPoints += item.frontendStoryPoints;
    }

    // QA velocity from completed items
    if (item.status.qa === 'done' && item.qaStoryPoints) {
      qaPoints += item.qaStoryPoints;
    }
  }

  return {
    backend: backendPoints > 0 ? backendPoints / SPRINT_DAYS : 0,
    frontend: frontendPoints > 0 ? frontendPoints / SPRINT_DAYS : 0,
    qa: qaPoints > 0 ? qaPoints / SPRINT_DAYS : 0,
  };
}

export function predictLayerCompletion(item: PortfolioItem, velocity: { backend: number; frontend: number; qa: number }): { backend: Date | null; frontend: Date | null; qa: Date | null } {
  const now = new Date();
  const predictions = {
    backend: null as Date | null,
    frontend: null as Date | null,
    qa: null as Date | null,
  };

  // Backend prediction
  if (item.status.backend !== 'done' && item.backendStoryPoints && velocity.backend > 0) {
    const daysNeeded = Math.ceil(item.backendStoryPoints / velocity.backend);
    const predicted = new Date(now);
    predicted.setDate(predicted.getDate() + daysNeeded);
    predictions.backend = predicted;
  } else if (item.status.backend === 'done' && item.completedDate) {
    predictions.backend = item.completedDate;
  }

  // Frontend prediction
  if (item.status.frontend !== 'done' && item.frontendStoryPoints && velocity.frontend > 0) {
    const daysNeeded = Math.ceil(item.frontendStoryPoints / velocity.frontend);
    const predicted = new Date(now);
    predicted.setDate(predicted.getDate() + daysNeeded);
    predictions.frontend = predicted;
  } else if (item.status.frontend === 'done' && item.completedDate) {
    predictions.frontend = item.completedDate;
  }

  // QA prediction
  if (item.status.qa !== 'done' && item.qaStoryPoints && velocity.qa > 0) {
    const daysNeeded = Math.ceil(item.qaStoryPoints / velocity.qa);
    const predicted = new Date(now);
    predicted.setDate(predicted.getDate() + daysNeeded);
    predictions.qa = predicted;
  } else if (item.status.qa === 'done' && item.completedDate) {
    predictions.qa = item.completedDate;
  }

  return predictions;
}

export function calculateRealVelocityTrend(items: PortfolioItem[]): number {
  // Calculate velocity trend as % change from expected vs. actual completion
  const velocity = calculateLayerVelocity(items);
  const avgVelocity = (velocity.backend + velocity.frontend + velocity.qa) / 3;

  // Baseline velocity for 2-week sprint: ~1.0 pts/day per layer (14 pts/sprint)
  const BASELINE_VELOCITY = 1.0;

  if (avgVelocity === 0) return 0;

  // Percentage change from baseline
  const trend = Math.round(((avgVelocity - BASELINE_VELOCITY) / BASELINE_VELOCITY) * 100);

  return Math.max(-50, Math.min(50, trend)); // Clamp to ±50%
}
