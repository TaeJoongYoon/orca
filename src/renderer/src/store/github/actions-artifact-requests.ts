import type { AppState } from '../types'
import type { ActionsRequestContext, ActionsPage } from '../../../../shared/github/actions-types'
import type {
  ActionsArtifact,
  ActionsArtifactsQuery,
  ActionsArtifactDownloadQuery,
  ActionsArtifactTransferQuery,
  ActionsArtifactTransfer,
  ActionsArtifactChunk
} from '../../../../shared/github/actions-artifact-types'
import { requestActions } from './actions-requests'
export function fetchActionsArtifacts(
  state: AppState,
  context: ActionsRequestContext,
  args: ActionsArtifactsQuery
) {
  return requestActions<ActionsPage<ActionsArtifact>>(
    state,
    context,
    'github.actionsArtifacts',
    args,
    () => window.api.gh.actionsArtifacts({ ...context, ...args })
  )
}
export function startActionsArtifactDownload(
  state: AppState,
  context: ActionsRequestContext,
  args: ActionsArtifactDownloadQuery
) {
  return requestActions<ActionsArtifactTransfer>(
    state,
    context,
    'github.startActionsArtifactDownload',
    args,
    () => window.api.gh.startActionsArtifactDownload({ ...context, ...args })
  )
}
export function readActionsArtifactChunk(
  state: AppState,
  context: ActionsRequestContext,
  args: ActionsArtifactTransferQuery
) {
  return requestActions<ActionsArtifactChunk>(
    state,
    context,
    'github.readActionsArtifactChunk',
    args,
    () => window.api.gh.readActionsArtifactChunk({ ...context, ...args })
  )
}
export function releaseActionsArtifactDownload(
  state: AppState,
  context: ActionsRequestContext,
  args: ActionsArtifactTransferQuery
) {
  return requestActions<void>(state, context, 'github.releaseActionsArtifactDownload', args, () =>
    window.api.gh.releaseActionsArtifactDownload({ ...context, ...args })
  )
}
