// Fetches what the documentation takes from the app, at the commit pinned in docs-source.json (a
// release tag once the next release exists): the OpenAPI specifications the API reference is built
// from and the example alert rules shown on the monitoring page. They belong to the app, so they
// are not kept here; src/generated/ is ignored by git.
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const { repository, ref, specs, files = [] } = JSON.parse(await readFile(new URL('../docs-source.json', import.meta.url), 'utf8'))
const outDir = new URL('../src/generated/', import.meta.url)
await mkdir(outDir, { recursive: true })

for (const name of specs) {
  const url = `https://raw.githubusercontent.com/${repository}/${ref}/openapi/${name}.openapi.json`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url}: ${response.status}`)
  await writeFile(new URL(`${name}.openapi.json`, outDir), await response.text())
  console.log(`fetched ${name}.openapi.json at ${ref.slice(0, 7)}`)
}

for (const path of files) {
  const url = `https://raw.githubusercontent.com/${repository}/${ref}/${path}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url}: ${response.status}`)
  await writeFile(new URL(path.split('/').pop(), outDir), await response.text())
  console.log(`fetched ${path} at ${ref.slice(0, 7)}`)
}
