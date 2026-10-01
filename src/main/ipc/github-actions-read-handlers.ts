import {
  ActionsRunsQuery as RunsSchema,
  ActionsWorkflowsQuery as WorkflowsSchema,
  ActionsDetailsQuery as DetailsSchema
} from '../../shared/rpc-contract/github-actions-params'
import {
  getRepoExecutionHostId,
  parseExecutionHostId,
  getRepoSshConnectionId
} from '../../shared/execution-host'
import { isFolderRepo } from '../../shared/repo-kind'
import { ipcMain } from 'electron'
import type {
  ActionsRequestContext,
  ActionsRunsQuery,
  ActionsWorkflowsQuery,
  ActionsDetailsQuery
} from '../../shared/github/actions-types'
import { listActionsRuns, listActionsWorkflows, getWorkflowRunDetails } from '../github/client'
import type { Store } from '../persistence'
import { assertRegisteredGitHubRepo, getGitHubLocalGitOptionArgs } from './github-repo-routing'

function registeredActionsRepo(args: ActionsRequestContext, store: Store) {
  const repo = assertRegisteredGitHubRepo(args, store)
  if (
    isFolderRepo(repo) ||
    parseExecutionHostId(getRepoExecutionHostId(repo))?.kind === 'runtime'
  ) {
    throw new Error('Actions must be requested on the registered Git repository execution host')
  }
  return repo
}
export function registerGitHubActionsReadHandlers(store: Store): void {
  ipcMain.handle('gh:actionsRuns', (_event, args: ActionsRequestContext & ActionsRunsQuery) => {
    const query = RunsSchema.parse(args)
    const repo = registeredActionsRepo(args, store)
    return listActionsRuns(
      repo.path,
      query,
      getRepoSshConnectionId(repo),
      ...getGitHubLocalGitOptionArgs(store, repo)
    )
  })
  ipcMain.handle(
    'gh:actionsWorkflows',
    (_event, args: ActionsRequestContext & ActionsWorkflowsQuery) => {
      const query = WorkflowsSchema.parse(args)
      const repo = registeredActionsRepo(args, store)
      return listActionsWorkflows(
        repo.path,
        query,
        getRepoSshConnectionId(repo),
        ...getGitHubLocalGitOptionArgs(store, repo)
      )
    }
  )
  ipcMain.handle(
    'gh:actionsRunDetails',
    (_event, args: ActionsRequestContext & ActionsDetailsQuery) => {
      const query = DetailsSchema.parse(args)
      const repo = registeredActionsRepo(args, store)
      return getWorkflowRunDetails(
        repo.path,
        query,
        getRepoSshConnectionId(repo),
        ...getGitHubLocalGitOptionArgs(store, repo)
      )
    }
  )
}
