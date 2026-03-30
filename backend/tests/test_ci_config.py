from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def test_github_actions_uses_nested_project_paths() -> None:
    workflow = (PROJECT_ROOT / "deploy/ci/github-actions.yml").read_text(encoding="utf-8")

    assert "working-directory: tonghua-project/backend" in workflow
    assert "working-directory: tonghua-project/frontend/web-react" in workflow
    assert "run: pytest ../tests/ -v --tb=short" in workflow
    assert 'run: echo "No frontend test script defined; skipping."' in workflow


def test_backend_dockerfile_starts_backend_app_module() -> None:
    dockerfile = (PROJECT_ROOT / "deploy/docker/Dockerfiles/backend.Dockerfile").read_text(
        encoding="utf-8"
    )

    assert "WORKDIR /app/backend" in dockerfile
    assert "COPY backend/ ./" in dockerfile
    assert 'CMD ["python", "-m", "uvicorn", "app.main:app"' in dockerfile
    assert '--port", "8080"' in dockerfile


def test_frontend_dockerfile_uses_repo_root_context() -> None:
    dockerfile = (PROJECT_ROOT / "deploy/docker/Dockerfiles/frontend.Dockerfile").read_text(
        encoding="utf-8"
    )
    compose = (PROJECT_ROOT / "deploy/docker/docker-compose.yml").read_text(encoding="utf-8")

    assert "COPY frontend/web-react/package.json frontend/web-react/package-lock.json* ./" in dockerfile
    assert "COPY frontend/web-react/ ./" in dockerfile
    assert "COPY deploy/docker/nginx/nginx.conf" in dockerfile
    assert "context: ../../" in compose
    assert "dockerfile: deploy/docker/Dockerfiles/frontend.Dockerfile" in compose
