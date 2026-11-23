# Auto-deploy runs on a polling cron against Coolify's API, not webhooks

Each branch of the fork that Tarek deploys (`develop`, `staging` and `main`)
owns one Coolify application, and a working tree push must rebuild the
affected one automatically. The obvious pusher is Coolify's own GitHub App
integration: it is wired per application (`is_auto_deploy_enabled`, source
type `GithubApp`) and would rebuild the moment a branch changes. It never
fires, though: Coolify listens on the private port 8000, and the host's UFW
only opens 22, 80 and 443, so the `/webhooks/source/github/events` payload
needs a public ingress that does not exist (no instance domain, no tunnel).
Opening port 8000 would trade the one public Coolify surface against a
webhook path nobody can observe from outside, and there is already a polling
mechanism on the host, the `coolify-autodeploy` cron, that Detour has used for
weeks.

**Decision:** deployment stays push-free on GitHub's side. On the VPS, the cron
`/etc/cron.d/coolify-autodeploy` runs `coolify-autodeploy.sh` every minute
under `/usr/local/bin/`. For each target it reads the branch head via
`git ls-remote` (the fork and the upstream are public, so no token sits on the
server) and compares it with the SHA stored in
`/var/lib/coolify-autodeploy/<key>`. On a
match it does nothing; on a change it calls `POST /api/v1/deploy?uuid=…` with
Coolify's deploy token and records the new SHA. One entry per environment
maps the branch to its application: `ichbinhier-form-develop`, `-staging`
and `-main` (later also the separate team instance on the upstream's `main`).

The deploy call is a **POST**. The first version of `deploy_if_new` issued a
plain `GET`, Coolify answers `405`, and the script (under `set -e` inside a
`… || status=1` chain) swallowed the failure, logged "Deploy … angestossen",
advanced the state file and never rebuilt a thing. The same silent no-op hit
the Detour entry. The fixed function treats a failed `curl` as an error and
returns non-zero, logging `FEHLGESCHLAGEN`, and only touches the state file
after a successful response.

**Why:** reachable, testable, and cheap. The mechanism already ran in
production for Detour, needs no new network exposure, and its failure mode is
a visible journal entry with a non-zero exit instead of a quiet gap. A real
push on a branch is proven end-to-end: pre-seed the state file with the
deployed SHA, force an old SHA, run: the application rebuilds, the state file
heals to the branch head. The only trade-off is latency: up to a minute
between push and deploy, which a school project can afford. If a project ever
needs sub-minute deploys, the correct upgrade is a public webhook ingress,
not polling harder.

## Consequences

- The cron polls public repositories through `git ls-remote` and needs no
  credential on the server; private repositories would have to use Coolify's
  GitHub App API (`app_sha`) or add one.
- A new target is two lines plus a state file: `deploy_if_new <key> …`, and
  write the currently deployed SHA into `/var/lib/coolify-autodeploy/<key>`
  so the first run does not rebuild everything.
- Deploys leave an audit trail in `journalctl -t coolify-autodeploy`
  („Deploy … angestossen fuer <short-sha>") and a per-key state file showing
  the last built SHA; state files are not secrets.
- The next real push on `develop` is the acceptance test: it must trigger
  `ichbinhier-form-develop` to rebuild within the following minute.
- Coolify's `is_auto_deploy_enabled` stays `true` on the applications but is
  inert while no ingress exists; it is not the trigger the cron uses.
