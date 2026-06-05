import { defineConfig } from 'orval'

// Run `npm run generate` while the backend is running on port 8080.
// Generated files land in src/api/generated/ and replace the hand-written stubs in src/api/auth.ts
// and src/api/vehicles.ts.
//
// To include `role` in the generated AuthenticationResponse type, add the field to the backend's
// AuthenticationResponse DTO before running this command.

export default defineConfig({
  vehicleApi: {
    // openapi.json is written by `scripts/fetch-spec.mjs` which strips the `name`
    // field that SpringDoc 2.8.x illegally injects into HTTP security schemes.
    input: 'openapi.json',
    output: {
      mode: 'tags-split',
      target: 'src/api/generated',
      client: 'react-query',
      httpClient: 'axios',
      schemas: {
        path: 'src/api/generated/zod',
        type: 'zod',
      },
      override: {
        mutator: {
          path: 'src/lib/axios.ts',
          name: 'orvalInstance',
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write src/api/generated',
    },
  },
})
