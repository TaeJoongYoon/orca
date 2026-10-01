import { getRepoSshConnectionId } from '../../shared/execution-host'
import { isFolderRepo } from '../../shared/repo-kind'
import type {
  ActionsRunsQuery,
  ActionsWorkflowsQuery,
  ActionsDetailsQuery
} from '../../shared/github/actions-types'
import type { GitHubOwnerRepo, GitHubPRFile } from '../../shared/github/pull-request-types'
import type { Repo } from '../../shared/repo-types'
import type { LocalProjectGhExecOptions } from '../project-runtime-git-options'
import {
  getIssue,
  getPRCheckDetails,
  getPRChecks,
  getPRComments,
  listActionsRuns,
  listActionsWorkflows,
  getWorkflowRunDetails
} from '../github/client'
import { getPRFileContents } from '../github/work-item-details'

type LocalGitArgs = [] | [LocalProjectGhExecOptions]

type RuntimeGitHubReviewQueryCommandsDeps = {
  resolveRepo: (selector: string) => Promise<Repo>
  getLocalGitArgs: (repo: Repo) => LocalGitArgs
}

export class RuntimeGitHubReviewQueryCommands {
  constructor(private readonly deps: RuntimeGitHubReviewQueryCommandsDeps) {}

  private async resolveActionsRepo(selector: string): Promise<Repo> {
    const repo = await this.deps.resolveRepo(selector)
    if (isFolderRepo(repo)) {
      throw new Error('Select a registered Git repository for Actions')
    }
    return repo
  }
  async getRepoActionsRuns(selector: string, args: ActionsRunsQuery, signal?: AbortSignal) {
    const repo = await this.resolveActionsRepo(selector)
    return listActionsRuns(
      repo.path,
      args,
      getRepoSshConnectionId(repo),
      this.deps.getLocalGitArgs(repo)[0],
      signal
    )
  }
  async getRepoActionsWorkflows(
    selector: string,
    args: ActionsWorkflowsQuery,
    signal?: AbortSignal
  ) {
    const repo = await this.resolveActionsRepo(selector)
    return listActionsWorkflows(
      repo.path,
      args,
      getRepoSshConnectionId(repo),
      this.deps.getLocalGitArgs(repo)[0],
      signal
    )
  }
  async getRepoActionsRunDetails(
    selector: string,
    args: ActionsDetailsQuery,
    signal?: AbortSignal
  ) {
    const repo = await this.resolveActionsRepo(selector)
    return getWorkflowRunDetails(
      repo.path,
      args,
      getRepoSshConnectionId(repo),
      this.deps.getLocalGitArgs(repo)[0],
      signal
    )
  }

  async getRepoIssue(
    repoSelector: string,
    number: number
  ): Promise<Awaited<ReturnType<typeof getIssue>>> {
    const repo = await this.deps.resolveRepo(repoSelector)
    return getIssue(
      repo.path,
      number,
      repo.connectionId ?? null,
      ...this.deps.getLocalGitArgs(repo)
    )
  }

  async getRepoPRChecks(
    repoSelector: string,
    prNumber: number,
    headSha?: string,
    prRepo?: GitHubOwnerRepo | null,
    options?: { noCache?: boolean }
  ): Promise<Awaited<ReturnType<typeof getPRChecks>>> {
    const repo = await this.deps.resolveRepo(repoSelector)
    return getPRChecks(
      repo.path,
      prNumber,
      headSha,
      prRepo ?? null,
      options,
      repo.connectionId ?? null,
      ...this.deps.getLocalGitArgs(repo)
    )
  }

  async getRepoPRCheckDetails(
    repoSelector: string,
    args: {
      checkRunId?: number
      workflowRunId?: number
      checkName?: string
      url?: string | null
      prRepo?: GitHubOwnerRepo | null
    },
    signal?: AbortSignal
  ): Promise<Awaited<ReturnType<typeof getPRCheckDetails>>> {
    const repo = await this.deps.resolveRepo(repoSelector)
    const localGitOptions = this.deps.getLocalGitArgs(repo)[0] ?? {}
    return getPRCheckDetails(
      repo.path,
      { ...args, prRepo: args.prRepo ?? null },
      repo.connectionId ?? null,
      localGitOptions,
      signal
    )
  }

  async getRepoPRComments(
    repoSelector: string,
    prNumber: number,
    prRepo?: GitHubOwnerRepo | null,
    options?: { noCache?: boolean }
  ): Promise<Awaited<ReturnType<typeof getPRComments>>> {
    const repo = await this.deps.resolveRepo(repoSelector)
    return getPRComments(
      repo.path,
      prNumber,
      { ...options, prRepo: prRepo ?? null },
      repo.connectionId ?? null,
      ...this.deps.getLocalGitArgs(repo)
    )
  }

  async getRepoPRFileContents(
    repoSelector: string,
    args: {
      prNumber: number
      prRepo?: GitHubOwnerRepo | null
      path: string
      oldPath?: string
      status: GitHubPRFile['status']
      headSha: string
      baseSha: string
    }
  ): Promise<Awaited<ReturnType<typeof getPRFileContents>>> {
    const repo = await this.deps.resolveRepo(repoSelector)
    return getPRFileContents({
      repoPath: repo.path,
      connectionId: repo.connectionId ?? null,
      localGitOptions: this.deps.getLocalGitArgs(repo)[0],
      ...args
    })
  }
}
