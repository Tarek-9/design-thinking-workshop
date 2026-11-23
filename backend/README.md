# Backend

Spring Boot service backing the applicant form and the staff dashboard. See
[`../docs/CODE_STANDARDS.md`](../docs/CODE_STANDARDS.md) for the code rules.

The [refactoring pass](../docs/REFACTORING.md) records the method, implemented
improvements, deferred candidates and verification limits for ticket #11.

## Staff accounts

The dashboard has no self-registration and no user administration, so
`staff/StaffSeeder.java` is the only way an account comes into being: five of
them, one per staff member (`A1`, `A17`), invented people at the association's
domain. The addresses are sign-in identities and nothing else. No mail is ever
sent to a staff member, so none of these mailboxes has to exist.

**The five initial passwords come from the environment**, `STAFF_1_PASSWORD`
through `STAFF_5_PASSWORD` in `.env` (see `../.env.example`); the only password
literal in this repo is the demo login below. Each is read once, when its account is
created, and hashed with bcrypt. Set them to five distinct values before the
first start and hand each staff member their own. Passwords are hashed with
bcrypt at cost 12. After a change to the cost factor, existing passwords must be
set anew, since the seeder reads them only when an account is first created.

The seeder works account by account rather than behind one "is the table empty"
check, which decides two things worth knowing:

- an **already-seeded** deployment starts without any of these variables, since
  it creates nothing;
- a **missing** password is fatal only for an account that is actually absent:
  the backend refuses to start and names the variable, because a dashboard
  nobody can sign in to fails later and less clearly.

A `Sign-in` lasts twelve hours of sliding inactivity and lives in this process's
memory, so **restarting the backend signs everybody out** (`A17`). Repeated
failures from one address answer `429 RATE_LIMITED` rather than locking the
account, since five staff members with no administrator would stay locked
(`A20`); the numbers are `sign-in.attempt-limit` and `sign-in.attempt-window` in
`application.properties`.

## Demo data

`demo/DemoSeeder.java` seeds a week that reads like a real one: thirteen
Applications across the four Categories and all six statuses, some owned and
some not, six older than seven days, two discarded and one discarded and
restored (`A21`). **It runs only under the `demo` profile**. The Categories and
the staff accounts are platform data, while these Applications are a
presentation artifact, so a database only gets applicant-shaped rows when
somebody asks for it:

```
SPRING_PROFILES_ACTIVE=demo ./mvnw spring-boot:run
```

`docker-compose.yml` sets the profile for you, since that stack _is_ the demo
environment; `SPRING_PROFILES_ACTIVE=` in `.env` turns it off again. The seeder
is skipped whole once there is any Application at all, so a restart mid-demo
neither duplicates the week nor brings back a set somebody cleared.

`demo/DemoAccountSeeder.java` adds the presentation login **`test@test.de` /
`test`** (name "Test") when it is missing, also under the `demo` profile only.
It runs after the demo week, because `DemoSeeder` picks Owners by their position
in the staff list. A fresh volume therefore has a working dashboard login without
any manual step.

Every Application carries the **State changes that lead to it**, dated when they
happened, which is what makes Übersicht's sparklines a real trend rather than
today's number repeated seven times (`dashboard/API.md`, "Which makes seeding
part of this contract"). A seed declares only its timeline; the current Status,
Owner and discarded state are folded out of it, so the two cannot disagree.

The applicants are invented and their addresses sit at `example.org`, which
[RFC 2606](https://www.rfc-editor.org/rfc/rfc2606) reserves. No mailbox can
exist there. That is the point: the consent text names the association as the
party that stores an applicant's details, and on our own domain that is not who
receives them, so nothing a real person wrote may end up in this database
(`dashboard/API.md`, "Deployment").

## Applicant documents

An applicant may attach files to their Application (`A23` in
[`../docs/ASSUMPTIONS.md`](../docs/ASSUMPTIONS.md)). The upload is a separate
request after the Application exists:

```
POST /api/v1/applications/{id}/documents     multipart, part name "files"
GET  /api/v1/staff/applications/{id}/documents
GET  /api/v1/staff/applications/{id}/documents/{documentId}
```

The upload is public, like the form it follows. Listing and downloading need a
Sign-in, and the download is served as an attachment.

Limits, all in `application/DocumentProperties.java`:

- **Kinds:** PDF, DOC, DOCX, JPEG and PNG. The declared type must be one of
  these, and the first bytes of the file must be that type's signature, so a
  renamed file does not pass.
- **Size:** 5 MB per file. `spring.servlet.multipart.max-file-size` is 6 MB in
  `application.properties`, which is Spring's own ceiling above that.
- **Count:** three documents per Application, counted across uploads.

Each request is all or nothing: a refused file leaves no row and no file behind.
The field codes are `DOCUMENT_REQUIRED`, `DOCUMENT_TYPE_UNSUPPORTED`,
`DOCUMENT_TOO_LARGE` and `DOCUMENT_LIMIT_REACHED`, all on the field `files`.

**Where the files go.** Only the metadata is in the database. The bytes are
written to `document.upload-dir`, which defaults to
`/var/lib/ichbinhier/documents` and can be set with `DOCUMENT_UPLOAD_DIR`. The
file name on disk is a random UUID; the name the applicant sent is kept as
metadata only, reduced to its last segment. Erasing an Application
(`DELETE …/permanently`) removes the rows, and once that commits, the files.

In `docker-compose.yml` the folder is the named volume `document-files`, mounted
at `/var/lib/ichbinhier/documents`. The image creates that folder owned by the
`app` user, so the volume starts writable. To run the backend outside Docker,
point `DOCUMENT_UPLOAD_DIR` at any writable folder.

## Transactional email

The confirmation email an applicant gets on submit (`A8` in
[`../docs/ASSUMPTIONS.md`](../docs/ASSUMPTIONS.md)) goes through
[Resend](https://resend.com). `email/ResendEmailSender.java` calls their HTTP
API directly: no SDK dependency, the API is one POST request.

Every Status change sends the applicant one mail as well (`A24`): the German
text per Status lives in `email/StatusChangeMailer.java`, it is sent after the
change is stored, and a mail failure is logged and never fails the change.

Without `RESEND_API_KEY` set, `email/NoopEmailSender.java` takes over
automatically and logs the email instead of sending it. Local development and
the test suite need nothing configured.

**To send real email**, the target configuration (the confirmation must
reach every applicant address, not just the account owner):

1. Sign up at [resend.com](https://resend.com), free tier is enough for this
   project's volume.
2. Verify a sending domain (a subdomain keeps this independent of the
   association's branding): in the Resend dashboard add
   `tmp-ichbinhier.tarek.foo` as a domain, copy the SPF + DKIM DNS records it
   shows into the Cloudflare zone with proxy disabled, and wait for the
   verification to pass. This is what lets Resend send from the domain to any
   address, not just the account's own inbox.
3. Create an API key in the dashboard of type `sending_access` and restrict it
   to that domain. Set it as `RESEND_API_KEY` in the deployment environment
   only (see `.env.example`). Never commit the key itself.
4. Set `RESEND_FROM=noreply@tmp-ichbinhier.tarek.foo` in the deployment
   environment.

The DNS records, the sending domain and the API key are set up separately as
an operations step; the code and this document only prepare the configuration.
Until that verification is done, fall back to `onboarding@resend.dev`, which
sends only to the email address on the Resend account itself, enough to show
the flow with your own inbox.

Both `resend.api-key` and `resend.from` are read from environment variables in
`application.properties`; nothing provider-specific lives outside the `email`
package.

## Static analysis

Checkstyle runs in CI (`.github/workflows/backend.yml`) and fails the build on
a violation. Run it locally with `./mvnw checkstyle:check`. The rules, and why
the demo seed is exempt, are in
[`../docs/CODE_STANDARDS.md`](../docs/CODE_STANDARDS.md).
