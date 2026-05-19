/**
 * Fetches the OpenAPI spec from the running backend, removes the `name` field
 * from HTTP-type security schemes (SpringDoc 2.8.x injects it automatically,
 * but it is invalid per OpenAPI 3.0 and breaks Orval's strict validator),
 * then writes the cleaned spec to openapi.json for Orval to consume.
 */
const res = await fetch('http://localhost:8081/v3/api-docs')
if (!res.ok) throw new Error(`Backend returned ${res.status} — is it running on port 8081?`)

const spec = await res.json()

for (const scheme of Object.values(spec.components?.securitySchemes ?? {})) {
  if (scheme.type === 'http') delete scheme.name
}

import { writeFileSync } from 'fs'
writeFileSync('openapi.json', JSON.stringify(spec, null, 2))
console.log('✔ openapi.json written')
