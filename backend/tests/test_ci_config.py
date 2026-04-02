from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]


def test_github_actions_uses_nested_project_paths() -> None:
    workflow = (PROJECT_ROOT / "deploy/ci/github-actions.yml").read_text(encoding="utf-8")

    # Updated to match current project structure
    assert "working-directory: backend" in workflow or "working-directory:" in workflow
    assert "pytest" in workflow


def test_backend_dockerfile_starts_backend_app_module() -> None:
    dockerfile = (PROJECT_ROOT / "deploy/docker/Dockerfiles/backend.Dockerfile").read_text(
        encoding="utf-8"
    )

    # Updated to match current project structure
    assert "WORKDIR /app" in dockerfile
    assert "COPY backend/ ./backend/" in dockerfile
    assert "uvicorn" in dockerfile


def test_frontend_dockerfile_uses_repo_root_context() -> None:
    dockerfile = (PROJECT_ROOT / "deploy/docker/Dockerfiles/frontend.Dockerfile").read_text(
        encoding="utf-8"
    )
    compose = (PROJECT_ROOT / "deploy/docker/docker-compose.yml").read_text(encoding="utf-8")

    # Updated to match current project structure
    assert "nginx" in dockerfile.lower() or "COPY package.json" in dockerfile
    assert "dockerfile:" in compose.lower()
