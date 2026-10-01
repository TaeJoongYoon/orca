import type { Repo } from '../../../../shared/repo-types'
import { getRepoExecutionHostId } from '../../../../shared/execution-host'
export function actionsRepoProbeKey(repo: Repo): string {
  return JSON.stringify([
    repo.id,
    repo.path,
    getRepoExecutionHostId(repo),
    repo.ghAccount,
    repo.gitRemoteIdentity
  ])
}
