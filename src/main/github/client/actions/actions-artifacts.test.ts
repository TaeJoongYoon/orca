import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import * as execution from '../../github-api-repository'
import * as gh from '../../gh-utils'
import * as rateLimit from '../../rate-limit'
import { listActionsArtifacts, startActionsArtifactDownload } from './actions-artifacts'
import {
  artifactSessionOwner,
  readArtifactSession,
  releaseArtifactSession
} from './artifact-download-sessions'
import { ACTIONS_ARTIFACT_MAX_BYTES } from '../../../../shared/github/actions-artifact-types'
const repository = { owner: 'acme', repo: 'widgets', host: 'github.enterprise.test' }
const metadata = {
  id: 7,
  name: '../report',
  size_in_bytes: 22,
  expired: false,
  workflow_run: { id: 900 }
}
// A stored ZIP with an inert hello.txt payload; never extracted or executed.
const zip = Buffer.from(
  'UEsDBBQAAAAAAAAAIVwCDJr/IwAAACMAAAAJAAAAaGVsbG8udHh0SGVsbG8gZnJvbSB0aGUgT3JjYSBtb2NrIGFydGlmYWN0LgpQSwECFAMUAAAAAAAAACFcAgya/yMAAAAjAAAACQAAAAAAAAAAAAAAgAEAAAAAaGVsbG8udHh0UEsFBgAAAAABAAEANwAAAEoAAAAAAA==',
  'base64'
)
const call = vi.fn<typeof gh.ghExecFileAsync>()
beforeEach(() => {
  vi.spyOn(execution, 'resolveGitHubRepoExecution').mockResolvedValue({
    ownerRepo: repository,
    ghOptions: { host: repository.host, ghAccount: { host: repository.host, user: 'tester' } }
  })
  vi.spyOn(gh, 'acquire').mockResolvedValue(undefined)
  vi.spyOn(gh, 'release').mockImplementation(() => {})
  vi.spyOn(rateLimit, 'repositoryRateLimitGuard').mockReturnValue({ blocked: false })
  call.mockReset()
  vi.spyOn(gh, 'ghExecFileAsync').mockImplementation(call)
})
afterEach(() => vi.restoreAllMocks())
const query = { repository, runId: 900, artifactId: 7 }
describe('Actions artifacts', () => {
  it('lists a bounded page with metadata and pagination', async () => {
    call.mockResolvedValue({
      stdout: JSON.stringify({ artifacts: [metadata], total_count: 1001 }),
      stderr: ''
    })
    const page = await listActionsArtifacts('/repo', { repository, runId: 900, page: 10 })
    expect(page.items[0]).toMatchObject({ id: 7, name: '../report', sizeBytes: 22, expired: false })
    expect(page).toMatchObject({ limitReached: true, hasNextPage: false })
    expect(call).toHaveBeenCalledWith(
      ['api', 'repos/acme/widgets/actions/runs/900/artifacts?per_page=100&page=10'],
      expect.objectContaining({ host: repository.host })
    )
  })
  it.each([
    { ...metadata, expired: true },
    { ...metadata, expires_at: '2020-01-01T00:00:00Z' },
    { ...metadata, workflow_run: { id: 901 } },
    { ...metadata, size_in_bytes: ACTIONS_ARTIFACT_MAX_BYTES + 1 }
  ])('rejects unavailable or unowned metadata before fetching any archive', async (row) => {
    call.mockResolvedValue({ stdout: JSON.stringify(row), stderr: '' })
    await expect(startActionsArtifactDownload('/repo', query)).rejects.toThrow()
    expect(call).toHaveBeenCalledTimes(1)
  })
  it('returns exact ZIP bytes as bounded chunks without unpacking and sanitizes the name', async () => {
    call
      .mockResolvedValueOnce({ stdout: JSON.stringify(metadata), stderr: '' })
      .mockResolvedValueOnce({ stdout: zip.toString('base64'), stderr: '' })
    const transfer = await startActionsArtifactDownload('/repo', query)
    const owner = artifactSessionOwner('/repo')
    try {
      expect(transfer.fileName).toBe('.._report.zip')
      expect(
        Buffer.from(readArtifactSession(transfer.transferId, owner, 0).contentBase64, 'base64')
      ).toEqual(zip)
      expect(call).toHaveBeenLastCalledWith(
        ['api', 'repos/acme/widgets/actions/artifacts/7/zip'],
        expect.objectContaining({ encoding: 'base64', host: repository.host })
      )
    } finally {
      releaseArtifactSession(transfer.transferId, owner)
    }
  })
  it('rejects a non-ZIP response', async () => {
    call
      .mockResolvedValueOnce({ stdout: JSON.stringify(metadata), stderr: '' })
      .mockResolvedValueOnce({
        stdout: Buffer.from('not an archive').toString('base64'),
        stderr: ''
      })
    await expect(startActionsArtifactDownload('/repo', query)).rejects.toThrow('ZIP archive')
  })
  it.each([
    'HTTP 403 authorization required',
    'HTTP 404 artifact not found',
    'Network connection reset'
  ])('propagates an archive request failure: %s', async (message) => {
    call
      .mockResolvedValueOnce({ stdout: JSON.stringify(metadata), stderr: '' })
      .mockRejectedValueOnce(new Error(message))
    await expect(startActionsArtifactDownload('/repo', query)).rejects.toThrow(message)
    expect(call).toHaveBeenCalledTimes(2)
    expect(gh.release).toHaveBeenCalled()
  })
})
