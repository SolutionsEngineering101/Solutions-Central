export type ReleaseType = 'new-feature' | 'customization' | 'hotfix' | 'integration' | 'enhancement'
export type SectionKey = 'solutions' | 'engineering' | 'qa' | 'devops' | 'clientConfig' | 'deployment' | 'clientValidation'
export type SectionStatus = 'pending' | 'in-progress' | 'complete' | 'na'
export type ReleaseStatus = 'draft' | 'in-progress' | 'blocked' | 'ready' | 'deployed'

export interface CheckItem { id: string; label: string }
export interface CheckSection { key: SectionKey; title: string; items: CheckItem[] }

export interface SectionState {
  status: SectionStatus
  completedChecks: string[]
  naChecks?: string[]
  signedOffBy?: string
  signedOffAt?: string
  notes?: string
}

export type JiraCategory = 'frontend' | 'backend' | 'qa' | 'general'

export interface JiraTicketEntry {
  key: string
  category: JiraCategory
  summary?: string
}

export interface Release {
  id: string
  name: string
  releaseType: ReleaseType
  clients: string[]
  products: string[]
  jiraTickets: JiraTicketEntry[]
  deploymentDate: string
  pmOwner: string
  status: ReleaseStatus
  createdAt: string
  updatedAt: string
  sections: Partial<Record<SectionKey, SectionState>>
}

export const CHECKLIST_DEFINITIONS: Record<SectionKey, CheckSection> = {
  solutions: {
    key: 'solutions',
    title: 'Solutions / Product Sign-Off',
    items: [
      { id: 'scope-freeze', label: 'Final scope freeze confirmed' },
      { id: 'prd-linked', label: 'PRD / Jira tickets linked' },
      { id: 'requirements-docs', label: 'Client-specific requirements documented' },
      { id: 'acceptance-criteria', label: 'Acceptance criteria defined' },
      { id: 'edge-cases', label: 'Edge cases documented' },
      { id: 'dependencies', label: 'Dependencies identified' },
      { id: 'impacted-modules', label: 'Impacted modules listed' },
      { id: 'risk-assessment', label: 'Risk assessment completed' },
      { id: 'rollback-plan', label: 'Rollback plan documented' },
      { id: 'comm-plan', label: 'Communication plan prepared' },
      { id: 'support-informed', label: 'Support team informed' },
      { id: 'cx-pace-informed', label: 'CX and PACE team informed' },
    ],
  },
  engineering: {
    key: 'engineering',
    title: 'Engineering Sign-Off',
    items: [
      { id: 'backward-compat', label: 'Backward compatibility checked' },
      { id: 'migration-scripts', label: 'Migration scripts reviewed' },
      { id: 'staging-migrations', label: 'Migrations tested on staging clone' },
      { id: 'logging-added', label: 'Logging added for critical flows' },
      { id: 'bg-jobs-tested', label: 'Background jobs tested' },
      { id: 'db-indexes', label: 'Indexes added where needed' },
      { id: 'no-destructive-queries', label: 'No destructive queries without backup' },
      { id: 'unique-constraints', label: 'Unique constraints validated' },
      { id: 'data-validation', label: 'Data validation checks implemented' },
      { id: 'sso-verified', label: 'SSO configuration verified' },
      { id: 'hrms-sync', label: 'HRMS sync validated' },
      { id: 'webhooks', label: 'Webhooks verified' },
      { id: 'email-sms', label: 'Email/SMS service verified' },
      { id: 'query-perf', label: 'Query performance reviewed' },
      { id: 'no-n-plus-1', label: 'No N+1 queries' },
      { id: 'caching', label: 'Caching validated' },
      { id: 'load-impact', label: 'Load impact assessed' },
      { id: 'fe-backward-compat', label: 'Frontend backward compatibility with APIs verified' },
      { id: 'fe-error-logging', label: 'Frontend error logging added for critical user flows' },
      { id: 'fe-validation', label: 'Client-side validation checks implemented' },
      { id: 'fe-api-optimized', label: 'API calls optimized (no redundant calls)' },
    ],
  },
  qa: {
    key: 'qa',
    title: 'QA Sign-Off',
    items: [
      { id: 'acceptance-validated', label: 'All acceptance criteria validated' },
      { id: 'positive-flow', label: 'Positive flow testing completed' },
      { id: 'negative-testing', label: 'Negative testing completed' },
      { id: 'edge-cases-tested', label: 'Edge cases tested' },
      { id: 'role-based', label: 'Role-based testing completed' },
      { id: 'regression-full', label: 'Full regression suite executed' },
      { id: 'no-cross-client', label: 'No cross-client impact observed' },
      { id: 'data-accuracy', label: 'Data accuracy verified' },
      { id: 'data-consistency', label: 'Data consistency verified' },
      { id: 'points-mapping', label: 'Currency – Points Mapping verified' },
      { id: 'reporting-accuracy', label: 'Reporting accuracy validated' },
      { id: 'approval-workflows', label: 'Approval workflows verified' },
      { id: 'historical-data', label: 'Historical data intact' },
      { id: 'no-critical-bugs', label: 'No open Critical bugs' },
      { id: 'no-high-bugs', label: 'No open High bugs' },
      { id: 'medium-bugs-documented', label: 'Medium bugs documented with workaround' },
    ],
  },
  devops: {
    key: 'devops',
    title: 'DevOps / Infrastructure Sign-Off',
    items: [
      { id: 'correct-branch', label: 'Correct production branch merged' },
      { id: 'release-tag', label: 'Release tag created' },
      { id: 'cicd-verified', label: 'CI/CD pipeline verified' },
      { id: 'secrets-configured', label: 'Secrets configured in production' },
      { id: 'feature-flags', label: 'Feature flags configured correctly' },
      { id: 'prod-backup', label: 'Production backup taken' },
      { id: 'env-vars', label: 'ENV variables verified' },
      { id: 'cron-jobs', label: 'Cron jobs configured' },
      { id: 'monitoring-enabled', label: 'Monitoring enabled' },
      { id: 'alerts-configured', label: 'Alerts configured' },
      { id: 'debug-disabled', label: 'Debug mode disabled' },
      { id: 'test-endpoints-disabled', label: 'Test endpoints disabled' },
      { id: 'role-permissions', label: 'Role permissions verified' },
      { id: 'pii-checked', label: 'PII exposure checked' },
      { id: 'ssl-verified', label: 'SSL verified' },
    ],
  },
  clientConfig: {
    key: 'clientConfig',
    title: 'Client Configuration (CX / Implementation)',
    items: [
      { id: 'tenant-verified', label: 'Client tenant verified' },
      { id: 'feature-flags-client', label: 'Feature flags enabled correctly' },
      { id: 'catalog-config', label: 'Catalog configuration validated' },
      { id: 'points-rules', label: 'Points rules verified' },
      { id: 'budget-limits', label: 'Budget limits verified' },
      { id: 'approval-matrix', label: 'Approval matrix verified' },
      { id: 'branding', label: 'Branding verified' },
      { id: 'notification-templates', label: 'Notification templates configured' },
      { id: 'sow-verified', label: 'SOW verified' },
      { id: 'role-hierarchy', label: 'Role hierarchy validated' },
    ],
  },
  deployment: {
    key: 'deployment',
    title: 'Controlled Deployment',
    items: [
      { id: 'deploy-window', label: 'Deployment window confirmed' },
      { id: 'eng-standby', label: 'Engineering on standby' },
      { id: 'devops-monitoring', label: 'DevOps monitoring logs live' },
      { id: 'support-informed-deploy', label: 'Support team informed' },
    ],
  },
  clientValidation: {
    key: 'clientValidation',
    title: 'Client Production Validation',
    items: [
      { id: 'sso-login', label: 'SSO login successful' },
      { id: 'role-access', label: 'Role access correct' },
      { id: 'feature-visibility', label: 'Feature visibility correct' },
      { id: 'e2e-transaction', label: 'End-to-end transaction works' },
      { id: 'approval-workflow-works', label: 'Approval workflow works' },
      { id: 'notifications-triggered', label: 'Notifications triggered' },
      { id: 'reports-correct', label: 'Reports reflecting correctly' },
      { id: 'no-duplicate-accounts', label: 'No duplicate accounts created' },
      { id: 'no-incorrect-balances', label: 'No incorrect balances' },
      { id: 'historical-intact', label: 'Historical data intact' },
      { id: 'hrms-sync-client', label: 'HRMS sync verified' },
      { id: 'client-champion-confirmed', label: 'Client Champion confirmation received' },
    ],
  },
}

export const SECTIONS_FOR_TYPE: Record<ReleaseType, SectionKey[]> = {
  'new-feature': ['solutions', 'engineering', 'qa', 'devops', 'clientConfig', 'deployment', 'clientValidation'],
  'integration': ['solutions', 'engineering', 'qa', 'devops', 'clientConfig', 'deployment', 'clientValidation'],
  'customization': ['solutions', 'engineering', 'qa', 'devops', 'clientConfig', 'deployment', 'clientValidation'],
  'enhancement': ['solutions', 'engineering', 'qa', 'devops', 'clientConfig', 'deployment', 'clientValidation'],
  'hotfix': ['engineering', 'devops', 'qa'],
}

export const HOTFIX_CHECKS: Partial<Record<SectionKey, string[]>> = {
  engineering: ['backward-compat', 'no-destructive-queries', 'logging-added', 'migration-scripts'],
  qa: ['no-critical-bugs', 'no-high-bugs', 'medium-bugs-documented'],
  devops: ['correct-branch', 'secrets-configured', 'monitoring-enabled', 'prod-backup', 'cicd-verified'],
}

export function getEffectiveChecks(releaseType: ReleaseType, sectionKey: SectionKey): CheckItem[] {
  const full = CHECKLIST_DEFINITIONS[sectionKey]?.items ?? []
  if (releaseType === 'hotfix') {
    const allowed = HOTFIX_CHECKS[sectionKey]
    if (!allowed) return []
    return full.filter(item => allowed.includes(item.id))
  }
  return full
}

export function computeReleaseStatus(release: Release): ReleaseStatus {
  const requiredSections = SECTIONS_FOR_TYPE[release.releaseType]
  const allComplete = requiredSections.every(k => release.sections[k]?.status === 'complete')
  const anyBlocked = requiredSections.some(k => {
    const s = release.sections[k]
    return s && s.status === 'pending' && s.completedChecks.length === 0
  })
  if (release.status === 'deployed') return 'deployed'
  if (allComplete) return 'ready'
  if (anyBlocked) return 'in-progress'
  return 'in-progress'
}
