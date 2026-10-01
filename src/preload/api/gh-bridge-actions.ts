import { ipcRenderer } from 'electron'
import type { GithubActionsApi } from './github-actions-api'
export const ghActionsApi: GithubActionsApi = {
  actionsRuns: (args) => ipcRenderer.invoke('gh:actionsRuns', args),
  actionsWorkflows: (args) => ipcRenderer.invoke('gh:actionsWorkflows', args),
  actionsRunDetails: (args) => ipcRenderer.invoke('gh:actionsRunDetails', args)
}
