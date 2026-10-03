import type { Context } from 'react'
import type { OperationExposure, operationModuleLoader } from './operation-module-loader'
import type { RpcClientContextValue } from '../../transport/rpc-client-context-contract'

export const HOST_CLIENT_CONTEXT_LOCAL = 'RpcClientContext'
export const HOST_CLIENT_CONTEXT_MODULE = 'mobile/src/transport/rpc-client-context.ts'

// The context is a named product export; no post-transpile local needs to be exposed.
export const hostClientContextExposure: OperationExposure = ['rpc-client-context.ts', '']

export function loadHostClientContext(
  modules: ReturnType<typeof operationModuleLoader>
): Context<RpcClientContextValue | null> {
  return modules.load<{ RpcClientContext: Context<RpcClientContextValue | null> }>(
    HOST_CLIENT_CONTEXT_MODULE
  ).RpcClientContext
}
