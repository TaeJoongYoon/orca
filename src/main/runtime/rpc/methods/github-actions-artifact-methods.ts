import { defineMethod } from '../core'
import {
  ActionsArtifacts,
  ActionsArtifactDownload,
  ActionsArtifactTransfer
} from '../../../../shared/rpc-contract/github-actions-artifact-params'
export const GITHUB_ACTIONS_ARTIFACT_METHODS = [
  defineMethod({
    name: 'github.actionsArtifacts',
    params: ActionsArtifacts,
    handler: (params, { runtime, signal }) =>
      runtime.getRepoActionsArtifacts(params.repo, params, signal)
  }),
  defineMethod({
    name: 'github.startActionsArtifactDownload',
    params: ActionsArtifactDownload,
    handler: (params, { runtime, signal }) =>
      runtime.startRepoActionsArtifactDownload(params.repo, params, signal)
  }),
  defineMethod({
    name: 'github.readActionsArtifactChunk',
    params: ActionsArtifactTransfer,
    handler: (params, { runtime }) => runtime.readRepoActionsArtifactChunk(params.repo, params)
  }),
  defineMethod({
    name: 'github.releaseActionsArtifactDownload',
    params: ActionsArtifactTransfer,
    handler: (params, { runtime }) =>
      runtime.releaseRepoActionsArtifactDownload(params.repo, params)
  })
]
