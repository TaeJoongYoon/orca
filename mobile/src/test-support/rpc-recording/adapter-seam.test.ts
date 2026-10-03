import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { operationModuleLoader } from './operation-module-loader'
import { MOUNTED_OPERATION_MODULES } from './adapters/mounted-operation-modules'
import {
  HOST_CLIENT_CONTEXT_LOCAL,
  HOST_CLIENT_CONTEXT_MODULE,
  loadHostClientContext,
  hostClientContextExposure
} from './host-client-context-exposure'

const root = resolve(import.meta.dirname, '../../../..')
const engine = resolve(import.meta.dirname)
const directory = join(engine, 'adapters')
/** The register is the seam's own index, not an adapter. */
const REGISTER = 'mounted-operation-modules.ts'
const sources = MOUNTED_OPERATION_MODULES.map((module) => module.source)

describe('the adapter directory', () => {
  // A module left out of the register mounts nothing, so its scenarios fail as unknown operations.
  it('registers every file in the adapter directory', () => {
    const present = readdirSync(directory).filter((file) => file !== REGISTER)
    expect(present.sort()).toEqual([...sources].sort())
  })

  it('loads the stable context export through the recording compiler', () => {
    const context = readFileSync(join(root, HOST_CLIENT_CONTEXT_MODULE), 'utf8')
    expect(context).toContain(`export const ${HOST_CLIENT_CONTEXT_LOCAL} = createContext`)
    const modules = operationModuleLoader(root, undefined, [hostClientContextExposure])
    const loaded = loadHostClientContext(modules)
    expect(loaded.Provider).toBeTruthy()
    expect(loadHostClientContext(modules)).toBe(loaded)
    expect(modules.load(HOST_CLIENT_CONTEXT_MODULE)[HOST_CLIENT_CONTEXT_LOCAL]).toBe(loaded)
  })
})
