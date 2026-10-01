import { getRepoExecutionHostId } from '../../../../shared/execution-host'
import { actionsStatusLabel } from './actions-status-label'
import { useDelayedStatus } from '@/hooks/use-delayed-status'
import { useState } from 'react'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { translate } from '@/i18n/i18n'
import { useActionsRepositories } from './use-actions-repositories'
import { useActionsRuns } from './use-actions-runs'
import { ActionsChoice } from './ActionsChoice'
import { openActionsRun } from '@/store/github/actions-detail-tabs'
import { ACTIONS_STATUSES } from '../../../../shared/github/actions-types'
import { actionsRepositoryUrl } from '../../../../shared/github/actions-web-url'

export default function ActionsPanel(): React.JSX.Element {
  const workspaceId = useAppStore((state) => state.activeWorktreeId)
  const repositories = useActionsRepositories(workspaceId)
  const [selection, setSelection] = useState<{ workspace: string | null; repoId: string }>({
    workspace: null,
    repoId: ''
  })
  const option =
    repositories.options.find(
      (entry) => entry.repo.id === (selection.workspace === workspaceId ? selection.repoId : '')
    ) ?? (repositories.options.length === 1 ? repositories.options[0] : undefined)
  const model = useActionsRuns(option)
  const [branchState, setBranchState] = useState({ repoId: '', value: '' })
  const branchDraft = branchState.repoId === option?.repo.id ? branchState.value : ''
  const setBranchDraft = (value: string): void =>
    setBranchState({ repoId: option?.repo.id ?? '', value })
  const showLoading = useDelayedStatus(option?.repo.id ?? '', model.loading ? true : null, 150)
  const repositoryLabel = option
    ? `${option.repository.host ?? 'github.com'}/${option.repository.owner}/${option.repository.repo}`
    : ''
  const filtered = Boolean(model.query.branch || model.query.status || model.query.workflowId)
  const openGitHub = (): void => {
    if (option) {
      void window.api.shell.openUrl(`${actionsRepositoryUrl(option.repository)}/actions`)
    }
  }
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-2 border-b border-border p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium">{translate('actions.title', 'Actions')}</h2>
          <Button
            variant="outline"
            size="xs"
            disabled={!option || model.loading}
            onClick={model.refresh}
          >
            {translate('actions.refresh', 'Refresh')}
          </Button>
        </div>
        {repositories.options.length > 1 && (
          <ActionsChoice
            value={option?.repo.id ?? ''}
            label={translate('actions.chooseRepo', 'Choose repository')}
            options={repositories.options.map((entry) => ({
              value: entry.repo.id,
              label: `${entry.repository.host ?? 'github.com'}/${entry.repository.owner}/${entry.repository.repo} · ${getRepoExecutionHostId(entry.repo)}`
            }))}
            onChange={(repoId) => setSelection({ workspace: workspaceId, repoId })}
          />
        )}
        {option && (
          <>
            <p className="truncate text-xs text-muted-foreground">{repositoryLabel}</p>
            <Button variant="link" size="xs" onClick={openGitHub}>
              {translate('actions.openActions', 'Open Actions on GitHub')}
            </Button>
            <ActionsChoice
              value={String(model.query.workflowId ?? '')}
              label={translate('actions.workflow', 'Workflow')}
              disabled={model.loading}
              options={[
                { value: '', label: translate('actions.allWorkflows', 'All workflows') },
                ...model.workflows.items.map((workflow) => ({
                  value: String(workflow.id),
                  label: workflow.name
                }))
              ]}
              onChange={(value) =>
                model.setQuery({
                  ...model.query,
                  page: 1,
                  workflowId: value ? Number(value) : undefined
                })
              }
            />
            {model.workflows.more && (
              <Button
                variant="link"
                size="xs"
                disabled={model.workflows.loading}
                onClick={model.moreWorkflows}
              >
                {translate('actions.moreWorkflows', 'Load more workflows')}
              </Button>
            )}
            {model.workflows.limit && (
              <p className="text-xs text-muted-foreground">
                {translate(
                  'actions.workflowsLimit',
                  'Showing up to 1,000 workflows. Open Actions on GitHub for more.'
                )}
              </p>
            )}
            {model.workflows.error && (
              <div role="alert" className="break-words text-xs text-destructive">
                {model.workflows.error}
                <Button variant="link" size="xs" disabled={model.loading} onClick={model.refresh}>
                  {translate('actions.retryWorkflows', 'Retry workflows')}
                </Button>
              </div>
            )}
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                model.setQuery({ ...model.query, page: 1, branch: branchDraft.trim() || undefined })
              }}
            >
              <Input
                value={branchDraft}
                onChange={(event) => setBranchDraft(event.target.value)}
                placeholder={translate('actions.allBranches', 'All branches')}
                aria-label={translate('actions.branch', 'Branch')}
              />
              <Button type="submit" variant="outline" size="sm" disabled={model.loading}>
                {translate('actions.apply', 'Apply')}
              </Button>
            </form>
            <Select
              value={model.query.status ?? 'all'}
              disabled={model.loading}
              onValueChange={(status) =>
                model.setQuery({
                  ...model.query,
                  page: 1,
                  status: status === 'all' ? undefined : status
                })
              }
            >
              <SelectTrigger aria-label={translate('actions.status', 'Status')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {translate('actions.allStatuses', 'All statuses')}
                </SelectItem>
                {ACTIONS_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {actionsStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filtered && (
              <Button
                variant="link"
                size="xs"
                disabled={model.loading}
                onClick={() => {
                  setBranchDraft('')
                  model.setQuery({ page: 1 })
                }}
              >
                {translate('actions.clear', 'Clear filters')}
              </Button>
            )}
          </>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 scrollbar-sleek">
        {repositories.loading && (
          <p role="status" className="text-sm text-muted-foreground">
            {translate('actions.resolving', 'Checking repository…')}
          </p>
        )}
        {repositories.error && (
          <div role="alert" className="break-words text-sm text-destructive">
            {repositories.error}
            <Button variant="outline" size="sm" onClick={repositories.retry}>
              {translate('actions.retry', 'Retry')}
            </Button>
          </div>
        )}
        {!repositories.loading && !option && (
          <p className="text-sm text-muted-foreground">
            {repositories.options.length
              ? translate('actions.selectRepo', 'Select a repository to browse workflow runs.')
              : translate(
                  'actions.unavailable',
                  'Actions is available for registered GitHub repositories. Add or open a GitHub repository to continue.'
                )}
          </p>
        )}
        {option && showLoading && (
          <p role="status" className="mb-2 text-xs text-muted-foreground">
            {translate('actions.loading', 'Loading runs…')}
            {model.data && ` ${translate('actions.stale', 'Showing previous data.')}`}
          </p>
        )}
        {model.error && (
          <div role="alert" className="mb-3 break-words text-sm text-destructive">
            {model.error}
            <Button variant="outline" size="sm" disabled={model.loading} onClick={model.refresh}>
              {translate('actions.retry', 'Retry')}
            </Button>
          </div>
        )}
        {option &&
          model.data?.items.map((run) => (
            <button
              key={run.id}
              type="button"
              className="mb-1 w-full rounded-md p-2 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => {
                if (workspaceId) {
                  openActionsRun(
                    useAppStore.getState(),
                    workspaceId,
                    { repoId: option.repo.id, repoPath: option.repo.path },
                    model.data!.repository,
                    run
                  )
                }
              }}
            >
              <div className="truncate text-sm font-medium" title={run.displayTitle}>
                {run.displayTitle}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {run.name} · #{run.runNumber} · {actionsStatusLabel(run.conclusion ?? run.status)}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {run.headBranch} · {run.headSha?.slice(0, 7)} · {run.event}
              </div>
              <div className="text-xs text-muted-foreground">
                {run.createdAt ? new Date(run.createdAt).toLocaleString() : '—'}
              </div>
            </button>
          ))}
        {model.data && !model.loading && !model.error && model.data.items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {filtered
              ? translate('actions.noMatches', 'No workflow runs match these filters.')
              : translate('actions.noRuns', 'This repository has no workflow runs.')}
          </p>
        )}
      </div>
      {model.data && (
        <div className="space-y-2 border-t border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="xs"
              disabled={model.loading || model.data.page === 1}
              onClick={() => model.setQuery({ ...model.query, page: model.data!.page - 1 })}
            >
              {translate('actions.previous', 'Previous')}
            </Button>
            <span className="text-xs text-muted-foreground">
              {model.data.items.length
                ? `${(model.data.page - 1) * model.data.perPage + 1}–${(model.data.page - 1) * model.data.perPage + model.data.items.length}`
                : '0'}
            </span>
            <Button
              variant="outline"
              size="xs"
              disabled={model.loading || !model.data.hasNextPage}
              onClick={() => model.setQuery({ ...model.query, page: model.data!.page + 1 })}
            >
              {translate('actions.next', 'Next')}
            </Button>
          </div>
          {model.data.limitReached && (
            <p className="text-xs text-muted-foreground">
              {translate(
                'actions.runsLimit',
                'Showing up to 1,000 runs. Open Actions on GitHub for older runs.'
              )}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
