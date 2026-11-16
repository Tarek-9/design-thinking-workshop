# Code standards

The backend, the applicant form and the staff dashboard follow the same rules.
Each part has its own tools, and CI runs them on every pull request that
touches the part. A violation fails the build.

## What runs where

| Part       | Tools                                                  | CI workflow                        |
| ---------- | ------------------------------------------------------ | ---------------------------------- |
| Frontend   | TypeScript, ESLint, Stylelint, Prettier                | `.github/workflows/frontend.yml`   |
| Dashboard  | TypeScript, ESLint, Stylelint, Prettier                | `.github/workflows/dashboard.yml`  |
| Backend    | Checkstyle                                             | `.github/workflows/backend.yml`    |

Run the same checks locally before you push:

```bash
# frontend/ and dashboard/
npm run typecheck && npm run lint && npm run stylelint && npm run format:check

# backend/
./mvnw checkstyle:check
```

The backend has no code formatter yet. Follow the layout of the file you are
editing.

## Magic numbers

A number literal in production code is a named constant, so a reader sees what
it means and a change happens in one place.

```ts
// Good
const HTTP_CREATED = 201;
if (response.status === HTTP_CREATED) { ... }

// Rejected by ESLint
if (response.status === 201) { ... }
```

```java
// Good
@Size(max = FieldLimits.NAME_MAX)

// Rejected by Checkstyle
@Size(max = 120)
```

Enforced by:

- **Frontend and dashboard:** `@typescript-eslint/no-magic-numbers`. `-1`, `0`
  and `1` are allowed, and so are array indexes and default parameter values.
  Object literals are checked too, so `{ top: 4 }` needs a name.
- **Backend:** Checkstyle `MagicNumber`. Constant fields (`static final`) are
  allowed, which is where the name lives.

Exempt, and why:

- **Tests and test helpers** (`*.test.*`, `src/test/`, the frontend's
  `src/mocks/`). A test states the value it expects, so the literal is the
  point.
- **Dashboard fixtures** (`dashboard/src/data/`). They are data shaped like the
  wire, the same reason as tests.
- **Copied third-party components** in the dashboard, listed in
  `dashboard/eslint.config.js`. They stay close to upstream so they can be
  re-synced.
- **Backend demo seed** (`backend/src/main/java/.../demo/DemoSeeder.java`,
  listed in `backend/config/checkstyle/suppressions.xml`). Its numbers are the
  timeline of the demo week, and naming each one would hide that timeline.
- **Backend tests.** Checkstyle checks `src/main` only.

## Shared values

A value that more than one file needs is defined once, in the module that owns
it, and every other file refers to that definition. In the backend this is
`FieldLimits`: the validation of a request and the length of its database column
read the same constant. Changing a limit then cannot leave the two out of step.

Not automated. The reviewer checks it.

## Comments

A comment says something the code cannot say: a constraint, a reason for a
choice, a workaround, a contract with another system. It does not restate what
the next line does, and it does not describe a change that is already in git.

Keep the documentation comments on exported types and functions. They are the
API.

Not automated. The reviewer checks it.

## Changing a rule

Change the tool configuration and this document in the same commit. The
configuration is the source of truth for what CI enforces; this document says
why.

- Frontend and dashboard: `eslint.config.js`, `.stylelintrc.json`
- Backend: `backend/config/checkstyle/checkstyle.xml`, `suppressions.xml`

Rules that belong to one part, such as the design-token rule in the frontend,
are documented in that part's README:
[`frontend/README.md`](../frontend/README.md) and
[`dashboard/README.md`](../dashboard/README.md).
