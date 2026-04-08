# LEGACY / FROZEN

> **This deployment line (`deploy/docker`) is frozen and no longer maintained.**
>
> Date frozen: 2026-04-08
>
> All Docker-based deployment has been consolidated into **[`deploy/easy`](../easy/)**.
> Please refer to [`deploy/easy/README.md`](../easy/README.md) and
> [`deploy/easy/DOCKER_GUIDE.md`](../easy/DOCKER_GUIDE.md) for the current,
> supported deployment workflow.

## Why was this frozen?

The original `deploy/docker` layout used a multi-service compose file with
separate Dockerfiles under `Dockerfiles/`, an nginx config, RabbitMQ config,
and a `secrets/` directory.  This has been superseded by the simpler
`deploy/easy` stack which:

- consolidates all Dockerfiles (backend, frontend, admin) in one place;
- provides a single `docker-compose.yml` with clearer service definitions;
- includes a comprehensive operations guide (`DOCKER_GUIDE.md`);
- ships with database helper scripts (`db.sh`, `entrypoint.sh`).

## What still references this directory?

| File | Status |
|------|--------|
| `deploy/ci/github-actions.yml` | Migrated to `deploy/easy/` (2026-04-08) |
| `backend/tests/test_ci_config.py` | Migrated to `deploy/easy/` (2026-04-08) |
| `docs/deployment/deployment-guide.md` | Deprecation banner added; content still references legacy paths |
| `docs/DEVELOPMENT_GUIDE.md` | Deprecation banner added; content still references legacy paths |

## Can I delete this directory?

Not yet.  It is kept for historical reference until all CI pipelines and
documentation have been fully migrated to `deploy/easy`.  Once that is done,
the entire `deploy/docker` directory can be removed.
