import type { GitHubRepositoryIdentity } from './pull-request-types'
export function actionsUrl(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  try {
    const url = new URL(value)
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password
      ? url.href
      : null
  } catch {
    return null
  }
}
export function actionsRepositoryUrl(repository: GitHubRepositoryIdentity): string {
  return `https://${repository.host ?? 'github.com'}/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}`
}
