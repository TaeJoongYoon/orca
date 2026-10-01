import { defineMethod } from '../core'
import {
  ActionsRuns,
  ActionsWorkflows,
  ActionsRunDetails
} from '../../../../shared/rpc-contract/github-actions-params'
export const GITHUB_ACTIONS_METHODS = [
  defineMethod({
    name: 'github.actionsRuns',
    params: ActionsRuns,
    handler: (params, { runtime, signal }) =>
      runtime.getRepoActionsRuns(params.repo, params, signal)
  }),
  defineMethod({
    name: 'github.actionsWorkflows',
    params: ActionsWorkflows,
    handler: (params, { runtime, signal }) =>
      runtime.getRepoActionsWorkflows(params.repo, params, signal)
  }),
  defineMethod({
    name: 'github.actionsRunDetails',
    params: ActionsRunDetails,
    handler: (params, { runtime, signal }) =>
      runtime.getRepoActionsRunDetails(params.repo, params, signal)
  })
]
