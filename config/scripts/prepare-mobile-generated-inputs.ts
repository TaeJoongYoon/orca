import { fileURLToPath } from 'node:url'
import { runProcess } from '../../src/shared/child-process/run-process'
import { mobileWebAppDependenciesPresent } from './mobile-web-app-bundle-dependencies.mjs'

const generators = [
  'build-terminal-webview-engine.mjs',
  'build-mermaid-webview-engine.mjs',
  'build-mermaid-page-engine.mjs',
  'build-terminal-document-script.mjs',
  'build-rich-markdown-editor-script.mjs'
]

export default async function prepareMobileGeneratedInputs() {
  if (!mobileWebAppDependenciesPresent()) {
    return
  }
  // Generate before workers start so fresh checkouts never race while importing ignored inputs.
  for (const generator of generators) {
    const script = fileURLToPath(new URL(`../../mobile/scripts/${generator}`, import.meta.url))
    const result = await runProcess({ program: process.execPath, args: [script] })
    if (result.code !== 0) {
      throw new Error(`Mobile input generation failed: ${generator}\n${result.stderr}`)
    }
  }
}
