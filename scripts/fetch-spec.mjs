// Fetches the OpenAPI specifications the API reference is built from, at the commit pinned in
// docs-source.json (a release tag once the next release exists). They are generated files of the
// app, so they are not kept here; src/generated/ is ignored by git.
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const { repository, ref, specs } = JSON.parse(await readFile(new URL('../docs-source.json', import.meta.url), 'utf8'))
const outDir = new URL('../src/generated/', import.meta.url)
await mkdir(outDir, { recursive: true })

for (const name of specs) {
  const url = `https://raw.githubusercontent.com/${repository}/${ref}/openapi/${name}.openapi.json`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url}: ${response.status}`)
  await writeFile(new URL(`${name}.openapi.json`, outDir), await response.text())
  console.log(`fetched ${name}.openapi.json at ${ref.slice(0, 7)}`)
}
