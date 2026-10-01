import type {
  ActionsRequestContext,
  ActionsRunsQuery,
  ActionsWorkflowsQuery,
  ActionsDetailsQuery,
  ActionsPage,
  ActionsRun,
  ActionsWorkflow,
  ActionsRunDetails
} from '../../shared/github/actions-types'
export type GithubActionsApi = {
  actionsRuns: (args: ActionsRequestContext & ActionsRunsQuery) => Promise<ActionsPage<ActionsRun>>
  actionsWorkflows: (
    args: ActionsRequestContext & ActionsWorkflowsQuery
  ) => Promise<ActionsPage<ActionsWorkflow>>
  actionsRunDetails: (
    args: ActionsRequestContext & ActionsDetailsQuery
  ) => Promise<ActionsRunDetails>
}
