import { ipcRenderer } from 'electron'
import type { GithubActionsApi } from './github-actions-api'
export const ghActionsApi: GithubActionsApi = {
  actionsArtifacts: (args) => ipcRenderer.invoke('gh:actionsArtifacts', args),
  startActionsArtifactDownload: (args) =>
    ipcRenderer.invoke('gh:startActionsArtifactDownload', args),
  readActionsArtifactChunk: (args) => ipcRenderer.invoke('gh:readActionsArtifactChunk', args),
  releaseActionsArtifactDownload: (args) =>
    ipcRenderer.invoke('gh:releaseActionsArtifactDownload', args),
  actionsRuns: (args) => ipcRenderer.invoke('gh:actionsRuns', args),
  actionsWorkflows: (args) => ipcRenderer.invoke('gh:actionsWorkflows', args),
  actionsRunDetails: (args) => ipcRenderer.invoke('gh:actionsRunDetails', args)
}
