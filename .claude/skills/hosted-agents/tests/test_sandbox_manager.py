import asyncio
import base64
import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = (
    Path(__file__).resolve().parents[1] / "scripts" / "sandbox_manager.py"
)
MODULE_SPEC = importlib.util.spec_from_file_location("sandbox_manager", MODULE_PATH)
if MODULE_SPEC is None or MODULE_SPEC.loader is None:
    raise RuntimeError(f"Unable to load sandbox_manager.py from {MODULE_PATH}")
SANDBOX_MANAGER = importlib.util.module_from_spec(MODULE_SPEC)
MODULE_SPEC.loader.exec_module(SANDBOX_MANAGER)


class RecordingImageBuilder(SANDBOX_MANAGER.ImageBuilder):
    def __init__(self, token: str) -> None:
        super().__init__(lambda: token)
        self.steps = []

    async def _execute_build_step(self, command, environment=None) -> None:
        self.steps.append((command, environment))

    async def _get_commit_sha(self) -> str:
        return "commit"

    async def _finalize_image(self) -> str:
        return "image"


class SandboxManagerTests(unittest.TestCase):
    def test_clone_uses_out_of_band_credentials_and_clean_remote(self) -> None:
        token = "test-token"
        builder = RecordingImageBuilder(token)
        asyncio.run(builder.build_image("org/project"))

        clone_command, clone_environment = builder.steps[0]
        self.assertEqual(
            clone_command,
            ["git", "clone", "https://github.com/org/project.git", "/workspace"],
        )
        self.assertNotIn(token, repr(clone_command))
        self.assertEqual(
            clone_environment["GIT_CONFIG_VALUE_0"],
            "AUTHORIZATION: basic "
            + base64.b64encode(f"x-access-token:{token}".encode()).decode(),
        )
        self.assertEqual(
            builder.steps[-1][0],
            [
                "git",
                "-C",
                "/workspace",
                "remote",
                "set-url",
                "origin",
                "https://github.com/org/project.git",
            ],
        )

    def test_clone_rejects_unvalidated_repository_before_token_lookup(self) -> None:
        token_requested = False

        def get_token() -> str:
            nonlocal token_requested
            token_requested = True
            return "test-token"

        builder = RecordingImageBuilder("unused")
        builder.token_provider = get_token

        with self.assertRaises(ValueError):
            asyncio.run(builder.build_image("org/project; touch /tmp/injected"))
        self.assertFalse(token_requested)

    def test_user_identity_is_passed_as_argument_vectors(self) -> None:
        class FakeSandbox:
            def __init__(self) -> None:
                self.commands = []

            async def execute_command(self, command) -> None:
                self.commands.append(command)

        manager = SANDBOX_MANAGER.SandboxManager([], lambda: "unused")
        sandbox = FakeSandbox()
        identity = SANDBOX_MANAGER.UserIdentity(
            id="id",
            name='Name"; touch /tmp/injected',
            email="name@example.com; touch /tmp/injected",
            github_token="",
        )

        asyncio.run(manager._configure_for_user(sandbox, identity))

        self.assertEqual(
            sandbox.commands,
            [
                ["git", "config", "user.name", identity.name],
                ["git", "config", "user.email", identity.email],
            ],
        )


if __name__ == "__main__":
    unittest.main()
