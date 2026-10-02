import { mkdtemp, mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import { runProcess } from '../../src/shared/child-process/run-process'

const directories = []
afterEach(async () => {
  await Promise.all(directories.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

it.each(['legacy', 'modern'])(
  'packages both architectures using Swift’s %s output directory',
  async (layout) => {
    const root = await mkdtemp(join(tmpdir(), 'orca-computer-build-'))
    directories.push(root)
    await mkdir(join(root, 'config', 'scripts'), { recursive: true })
    await mkdir(join(root, 'resources', 'build'), { recursive: true })
    await writeFile(join(root, 'resources', 'build', 'icon.icns'), 'fixture icon')
    const script = join(root, 'config', 'scripts', 'build-computer-macos.mjs')
    await copyFile(new URL('./build-computer-macos.mjs', import.meta.url), script)
    const preload = join(root, 'toolchain.mjs')
    await writeFile(
      preload,
      `
import cp from 'node:child_process'
import { syncBuiltinESMExports } from 'node:module'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
Object.defineProperty(process, 'platform', { value: 'darwin' })
cp.spawnSync = (command, args) => {
  const ok = (stdout = '') => ({ status: 0, signal: null, stdout })
  if (command === 'security' || command === 'codesign') return ok()
  if (command === 'swift') {
    const scratch = args[args.indexOf('--scratch-path') + 1]
    const triple = args[args.indexOf('--triple') + 1]
    if (!scratch || !triple) throw new Error('build must isolate each architecture')
    const bin = process.env.FIXTURE_LAYOUT === 'modern'
      ? join(scratch, 'out', 'Products', 'Release')
      : join(scratch, triple, 'release')
    if (args.includes('--show-bin-path')) return ok(bin + '\\n')
    mkdirSync(bin, { recursive: true })
    writeFileSync(join(bin, 'orca-computer-use-macos'), triple)
    return ok()
  }
  if (command === 'lipo') {
    const output = args[args.indexOf('-output') + 1]
    const inputs = args.slice(1, args.indexOf('-output'))
    if (new Set(inputs).size !== 2) throw new Error('architecture outputs alias each other')
    mkdirSync(dirname(output), { recursive: true })
    writeFileSync(output, inputs.map((p) => readFileSync(p, 'utf8')).join('\\n'))
    return ok()
  }
  throw new Error('unexpected tool: ' + command)
}
syncBuiltinESMExports()
`
    )
    const result = await runProcess({
      program: process.execPath,
      args: ['--import', preload, script],
      env: { ...process.env, FIXTURE_LAYOUT: layout, ORCA_COMPUTER_MACOS_SIGN_IDENTITY: '-' }
    })
    expect(result.stderr).toBe('')
    expect(result.code).toBe(0)
    const helper = join(
      root,
      'native',
      'computer-use-macos',
      '.build',
      'release',
      'Orca Computer Use.app'
    )
    expect(
      await readFile(join(helper, 'Contents', 'MacOS', 'orca-computer-use-macos'), 'utf8')
    ).toBe('arm64-apple-macosx\nx86_64-apple-macosx')
    expect(await readFile(join(helper, 'Contents', 'Info.plist'), 'utf8')).toContain(
      '<string>orca-computer-use-macos</string>'
    )
  }
)
