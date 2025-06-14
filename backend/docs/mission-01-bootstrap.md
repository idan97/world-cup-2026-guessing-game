# Mission 01 – Project & Tooling Bootstrap

**Goal:**
Set up the backend project with Node.js, TypeScript, ESLint, Prettier, and git. Ensure you can run and build TypeScript code locally.

## Checklist

- [ ] Initialize Node.js project (`npm init` or `pnpm init`)
- [ ] Add TypeScript (`npm i -D typescript ts-node @types/node`)
- [ ] Add ESLint & Prettier (`npm i -D eslint prettier eslint-config-prettier eslint-plugin-prettier`)
- [ ] Create `tsconfig.json` (strict mode)
- [ ] Create `.eslintrc`, `.prettierrc`
- [ ] Add `src/` directory and a sample `src/index.ts`
- [ ] Add scripts to `package.json` for build, start, lint, format
- [ ] Initialize git repo if not already

## Acceptance Criteria

- `npm run build` compiles TypeScript
- `npm run lint` and `npm run format` work
- You can run `src/index.ts` with `ts-node`

**Design doc reference:** Section 2 (Tech stack)
