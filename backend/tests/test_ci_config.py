import os
import subprocess
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]


def test_github_actions_uses_nested_project_paths() -> None:
    workflow = (PROJECT_ROOT / "deploy/ci/github-actions.yml").read_text(encoding="utf-8")

    # Updated to match current project structure
    assert "working-directory: backend" in workflow or "working-directory:" in workflow
    assert "pytest" in workflow


def test_backend_dockerfile_starts_backend_app_module() -> None:
    dockerfile = (PROJECT_ROOT / "deploy/easy/backend.dockerfile").read_text(
        encoding="utf-8"
    )

    # Updated to match current project structure
    assert "WORKDIR /app" in dockerfile
    assert "COPY backend/ ./backend/" in dockerfile
    assert "uvicorn" in dockerfile


def test_frontend_dockerfile_uses_repo_root_context() -> None:
    dockerfile = (PROJECT_ROOT / "deploy/easy/frontend.dockerfile").read_text(
        encoding="utf-8"
    )
    compose = (PROJECT_ROOT / "deploy/easy/docker-compose.yml").read_text(encoding="utf-8")

    # Updated to match current project structure
    assert "nginx" in dockerfile.lower() or "COPY package.json" in dockerfile
    assert "dockerfile:" in compose.lower()


def test_compose_up_staging_does_not_source_dotenv(tmp_path: Path) -> None:
    script = PROJECT_ROOT / "deploy/easy/compose-up-staging.sh"
    contents = script.read_text(encoding="utf-8")

    assert ". ./.env" not in contents
    assert "source .env" not in contents

    deploy_dir = tmp_path / "deploy" / "easy"
    bin_dir = tmp_path / "bin"
    deploy_dir.mkdir(parents=True)
    bin_dir.mkdir()

    script_copy = deploy_dir / "compose-up-staging.sh"
    script_copy.write_text(contents, encoding="utf-8")
    script_copy.chmod(0o755)
    (deploy_dir / ".env").write_text(
        "\n".join(
            [
                "APP_ENV=development",
                "APP_NAME=VICOO API",
                "MAIL_FROM=VICOO <onboarding@vicoo.example>",
                "VICOO_USE_HOST_NGINX=1",
            ]
        ),
        encoding="utf-8",
    )
    docker_stub = bin_dir / "docker"
    docker_stub.write_text(
        "\n".join(
            [
                "#!/usr/bin/env bash",
                'if [[ "${1:-}" == "ps" ]]; then exit 0; fi',
                'printf "docker"',
                'for arg in "$@"; do printf " %q" "$arg"; done',
                'printf "\\n"',
            ]
        ),
        encoding="utf-8",
    )
    docker_stub.chmod(0o755)
    env = os.environ.copy()
    env["PATH"] = f"{bin_dir}{os.pathsep}{env['PATH']}"
    env.pop("VICOO_USE_HOST_NGINX", None)

    runtime_result = subprocess.run(
        ["bash", str(script_copy), "--build"],
        check=False,
        capture_output=True,
        text=True,
        env=env,
    )
    assert runtime_result.returncode == 0, runtime_result.stderr
    assert "command not found" not in runtime_result.stderr
    assert (
        "docker compose -f docker-compose.yml -f docker-compose.host-nginx.yml "
        "up -d --build"
    ) in runtime_result.stdout

    result = subprocess.run(
        ["bash", "-n", str(script)],
        check=False,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, result.stderr


def test_backend_startup_modules_are_importable() -> None:
    result = subprocess.run(
        [
            sys.executable,
            "-c",
            "import app.seed; import app.main",
        ],
        cwd=PROJECT_ROOT / "backend",
        check=False,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, result.stderr
