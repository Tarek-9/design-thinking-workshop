# Backend refactoring pass

This is the structural review for ticket #11. Terminology follows
[`CONTEXT.md`](../CONTEXT.md). The pass starts at `origin/develop`, commit
`ea637d73adedaf3cfa15828608bd05f6644b8b6f`, rather than combining unfinished
feature branches with cleanup.

Feature branches for #6, #7 and #5 are still outstanding in this base. There
are no Document classes to review here. A follow-up pass can include them
after integration; this pass does not copy code from those branches.

## Method

The method is a risk-first, behavior-preserving review:

1. Read the application, dashboard, email, security configuration and category
   packages, together with their existing tests. Look for long methods, mixed
   responsibilities, duplication, unclear names, nested conditions, misplaced
   logic, literal limits and paths, missing abstractions and unresolved TODOs.
2. Write a candidate list before editing. Each candidate needs an observed
   problem, a reason to change it and a reason to implement or defer it. A
   shorter file alone is not a sufficient benefit.
3. Prioritize by locality and risk. Move existing logic to a clear owner before
   introducing new behavior or a speculative interface. Keep package-local
   helpers where no external caller needs them. Follow existing mapping
   conventions rather than adding a mapping framework.
4. Establish a green baseline. Add characterization tests for the submission
   branches and normalization that the HTTP tests do not fully exercise, then
   commit that safety net before production edits.
5. Make one structural change at a time and run the full backend suite after
   each step. Preserve endpoint routes, JSON fields and types, status codes,
   validation order, persistence order and notification order. Do not broaden
   transactions in the name of cleanup.
6. Inspect the diff, record the implemented and deferred candidates, and
   assess what the method did not prove. Stop before a candidate requires a
   contract decision, new infrastructure or unrelated feature work.

## Candidate list and decisions

### 1. Separate form mapping from submission orchestration

**Status: implemented.**

**Problem:** `ApplicationService.build` mixed request normalization and entity
construction into the class that coordinates submission. Its TODO explicitly
questioned whether mapping belonged there.

**Reason:** Keeping conversion in one package-local `ApplicationMapper.from`
gives mapping its own location without a new Spring bean or public interface.
`submit` retains bot handling, idempotency, category validation, persistence,
event publication and confirmation delivery in their original order.

**Change:** Move the existing builder and trimming logic without changing it.
Empty or whitespace-only `about` remains null; the consent timestamp and
default Status are unchanged. Tests exercise the behavior through `submit`,
not the mapper's internal implementation.

**Files:** `application/ApplicationMapper.java`,
`application/ApplicationService.java`,
`application/ApplicationServiceTests.java`.

### 2. Move dashboard Application operations out of the controller

**Status: implemented.**

**Problem:** `DashboardApplicationController` owned HTTP responses, repository
access, immutable-field validation, Status and Owner changes, State change
recording, permanent erase and stream notifications. Changing a persistence
operation required editing the HTTP adapter.

**Reason:** A package-local `DashboardApplicationService` owns these operations
behind a small interface. The controller owns routing, request validation,
response status and cache headers. Repository names in the extracted class
describe their contents rather than using `appRepo` and `changeRepo`.

**Change:** Move the existing operation bodies, retaining validation and write
order. The permanent erase transaction moves with its operation. State
changes are still erased before the Application, and stream delivery still
waits for commit. PATCH is deliberately not made transactional: that would
change failure behavior and belongs in a separate change, not this pass.

**Files:** `dashboard/DashboardApplicationController.java`,
`dashboard/DashboardApplicationService.java`.

### 3. Give dashboard DTO mapping a consistent home

**Status: implemented.**

**Problem:** `ApplicationDto.of` already owned its wire conversion, while
Category and State change conversion lived in controller-private methods.
Finding or reusing a mapping depended on knowing which controller held it.

**Reason:** Putting `of` next to each DTO follows the established convention
and gives wire conversion one predictable location. No generic mapper or
framework is needed for these small shapes.

**Change:** Move conversion to `CategoryDto.of` and `StateChangeDto.of`, then
use method references at callers. Keep the wire shape unchanged: a discarded
value is a JSON boolean, a Status or Owner identifier is a string, and a
cleared Owner is null. Category fields are copied without new normalization.
Focused tests cover these distinctions.

**Files:** `dashboard/CategoryDto.java`, `dashboard/StateChangeDto.java`,
`dashboard/DashboardCategoryController.java`,
`dashboard/DashboardApplicationService.java`,
`dashboard/DashboardDtoTests.java`.

### 4. Extract category maintenance from its dashboard controller

**Status: not implemented (deferred to a separate, characterized pass).**

**Problem:** `DashboardCategoryController` still combines HTTP handling with
name uniqueness, display-order calculation, deletion checks and reorder
validation. Reordering repeats the list query and response assembly.

**Reason:** A category maintenance module could localize these operations and
remove repeated assembly. However, reorder currently validates and saves
inside one loop; an unknown identifier encountered later can follow earlier
writes. Changing this to validate everything first or adding a transaction
would change failure behavior.

**Why not now:** First characterize successful writes and late-failure cases.
Then separate a mechanical extraction from any atomicity fix. Extending the
Application extraction into all category operations would enlarge this pass
without the same test coverage.

### 5. Name shared text limits instead of repeating literals

**Status: not implemented (deferred to a focused limits pass).**

**Problem:** Name, email, about, consent-version and internal-note limits are
repeated across `Application`, `ApplicationRequest` and
`UpdateApplicationRequest`, including validation and column annotations.

**Reason:** Shared compile-time constants would keep validation and storage
limits aligned and make their purpose explicit. This is compatible with the
named-constants direction of ticket #10.

**Why not now:** Replacing every persistence literal would confuse actual
input limits with enum storage widths. A focused pass should first inventory
those uses and check boundary-value behavior. No number or schema setting is
changed merely to satisfy a refactoring count.

### 6. Separate confirmation rendering from provider delivery

**Status: not implemented (deferred until email requirements settle).**

**Problem:** `ConfirmationMailer.sendConfirmation` combines inline German HTML
formatting with best-effort delivery. `ResendEmailSender` constructs its own
HTTP client and embeds the provider URL and endpoint, making isolated
transport tests less convenient.

**Reason:** Rendering could be tested independently, while an injected client
builder could provide a seam for transport tests. `EmailSender` already has
two adapters, Resend and the no-op sender; another provider interface would
add no value.

**Why not now:** The template is short and its comment explicitly awaits a
category-specific next-step model. A template engine or resource loader now
would be speculative. The email package has no filesystem access in this
base, so there is no file path or storage abstraction to extract. Changes to
HTML escaping, copy, retries or delivery timing would be behavior changes.

### 7. Localize the shared sign-in route knowledge

**Status: not implemented (deferred to a security-focused pass).**

**Problem:** `SecurityConfig`, `CookieAuthenticationFilter` and
`StaffAuthController` know the sign-in route independently. In particular,
the filter must recognize sign-out to avoid adding a refreshed cookie beside
the cleared one.

**Reason:** A narrowly named route constant could reduce drift between the
matcher and sign-out detection. A future route edit should not silently break
cookie handling.

**Why not now:** Authentication is sensitive and the current configuration is
small. Moving route ownership across packages requires care around controller
prefixes and method mappings. CSRF, matcher order and the permissive fallback
are intentionally unchanged; tightening them would be security behavior
work, not a structural refactor.

## Verification

The production paths above are relative to
`backend/src/main/java/de/ichbinhier/volunteerformservice/`. Test classes are
under the equivalent `backend/src/test/java/` tree.

Tests ran from `backend/` with `mvnw.cmd test` and
`JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.5.8-hotspot`:

| Step | Result |
| --- | --- |
| Unchanged develop baseline | `Tests run: 64, Failures: 0, Errors: 0, Skipped: 0`, `BUILD SUCCESS` |
| Submission characterization checkpoint | `Tests run: 74, Failures: 0, Errors: 0, Skipped: 0`, `BUILD SUCCESS` |
| Form mapper extraction | `Tests run: 74, Failures: 0, Errors: 0, Skipped: 0`, `BUILD SUCCESS` |
| Dashboard operation extraction, first run | `Tests run: 74, Failures: 1, Errors: 0, Skipped: 0`, `BUILD FAILURE` |
| Isolated failing stream test | `Tests run: 1, Failures: 0, Errors: 0, Skipped: 0`, `BUILD SUCCESS` |
| Dashboard operation extraction, unchanged repeat | `Tests run: 74, Failures: 0, Errors: 0, Skipped: 0`, `BUILD SUCCESS` |
| DTO mapping extraction and focused tests | `Tests run: 78, Failures: 0, Errors: 0, Skipped: 0`, `BUILD SUCCESS` |
| Final unchanged verification | `Tests run: 78, Failures: 0, Errors: 0, Skipped: 0`, `BUILD SUCCESS` |

The single failure was in `DashboardStreamTests`, method
`reachesEveryOpenStreamIncludingTheOnesThatCausedTheChange`:
`Expected size: 1 but was: 0` for the second stream. It did not reproduce in
the isolated test or the unchanged full-suite repeat. No assertion or stream
implementation was weakened to make the suite pass. Its cause remains
unverified; repeat success is not evidence of a fixed concurrency problem.

## Critical assessment

The candidate-first approach kept three bounded changes separate from feature
work. Characterization tests made previously implicit normalization,
idempotency recovery and notification order visible. Existing HTTP, write,
erase and stream tests checked the extracted operations through the same
endpoints as before, while focused DTO tests checked value types directly.

The method also has limits:

- This is one review pass with subjective candidate selection, not a complete
  architecture audit or an independent review.
- No complexity, duplication, performance or maintenance metrics were measured
  before and after. Better locality is a design judgment, not a measured
  productivity improvement.
- A green suite protects only asserted behavior. H2-backed tests do not prove
  PostgreSQL concurrency behavior, and mocked integrity failures do not
  reproduce a real concurrent submit. No live Resend call was made.
- The intermittent stream failure exposes a testing blind spot. Its cause
  needs a reproducible investigation; it is not silently counted as resolved.
- Extraction relocates complexity rather than removing every branch.
  Dashboard PATCH still combines several field-specific rules, and category
  maintenance remains in a controller.
- The mapper is intentionally small. Another abstraction would not be useful
  without additional callers or varying conversion behavior.
- Unmerged features are outside the inspected code. Integration of #6, #7 and
  #5 warrants a follow-up pass, especially around Document persistence,
  filesystem access and transaction timing if those concerns are introduced.

The result is a bounded structural improvement, not a claim that feature work
is complete, all technical debt is removed or the backend is production-ready.
