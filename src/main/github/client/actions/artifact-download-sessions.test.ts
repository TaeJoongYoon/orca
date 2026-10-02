import { afterEach, expect, it, vi } from 'vitest'
import {
  artifactSessionOwner,
  createArtifactSession,
  readArtifactSession,
  releaseArtifactSession
} from './artifact-download-sessions'
import { ACTIONS_ARTIFACT_CHUNK_BYTES } from '../../../../shared/github/actions-artifact-types'
afterEach(() => vi.useRealTimers())
it('bounds chunks, binds downloads to the repository/account/host and expires abandoned sessions', () => {
  vi.useFakeTimers()
  const owner = artifactSessionOwner('/repo', 'ssh-a', {
    ghAccount: { host: 'github.com', user: 'a' }
  })
  const changed = artifactSessionOwner('/repo', 'ssh-a', {
    ghAccount: { host: 'github.com', user: 'b' }
  })
  const archive = Buffer.alloc(ACTIONS_ARTIFACT_CHUNK_BYTES + 10, 7)
  const transfer = createArtifactSession(owner, archive, 'report.zip')
  expect(() => readArtifactSession(transfer.transferId, changed, 0)).toThrow('owner changed')
  expect(() => releaseArtifactSession(transfer.transferId, changed)).toThrow('owner changed')
  const first = readArtifactSession(transfer.transferId, owner, 0)
  expect(Buffer.from(first.contentBase64, 'base64')).toHaveLength(ACTIONS_ARTIFACT_CHUNK_BYTES)
  expect(first.done).toBe(false)
  expect(readArtifactSession(transfer.transferId, owner, first.nextOffset).done).toBe(true)
  expect(() => readArtifactSession(transfer.transferId, owner, -1)).toThrow('offset')
  vi.advanceTimersByTime(5 * 60_000)
  expect(() => readArtifactSession(transfer.transferId, owner, 0)).toThrow('expired')
})
