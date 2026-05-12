# Project Guidance

## User Preferences

[No preferences yet]

## Verified Commands

**Frontend** (run from `src/frontend/`):

- **install**: `pnpm install --prefer-offline`
- **typecheck**: `pnpm typecheck`
- **lint fix**: `pnpm fix`
- **build**: `pnpm build`

**Backend** (run from `src/backend/`):

- **install**: `mops install`
- **typecheck**: `mops check --fix`
- **build**: `mops build`

**Backend and frontend integration** (run from root):

- **generate bindings**: `pnpm bindgen` This step is necessary to ensure the frontend can call the backend methods.

## Learnings

- bioUpdatedAt maps to bigint | undefined in TS bindings (not null); Option in Motoko becomes optional field in TS. AddPhotoRequest should not include caller-derived fields.
- backend.d.ts types like ReportNote and OrganizerPublicProfile use Principal type for principal/authorId fields; frontend hooks should return mapped string versions using @/types, not cast backend types.
- Biome lint noArrayIndexKey blocks any index-based key in JSX map; restructure to static row arrays keyed by content, not index.
- label elements without htmlFor cause noLabelWithoutControl lint errors; always add id+htmlFor or wrap input inside label.
