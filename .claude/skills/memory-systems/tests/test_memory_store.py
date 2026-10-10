import importlib.util
import subprocess
import sys
import unittest
from pathlib import Path


MODULE_PATH = (
    Path(__file__).resolve().parents[1] / "scripts" / "memory_store.py"
)
MODULE_SPEC = importlib.util.spec_from_file_location("memory_store", MODULE_PATH)
if MODULE_SPEC is None or MODULE_SPEC.loader is None:
    raise RuntimeError(f"Unable to load memory_store.py from {MODULE_PATH}")
MEMORY_STORE = importlib.util.module_from_spec(MODULE_SPEC)
MODULE_SPEC.loader.exec_module(MEMORY_STORE)


class MemoryStoreTests(unittest.TestCase):
    def test_embedding_is_stable_across_processes(self) -> None:
        code = (
            "import importlib.util, sys; "
            "spec = importlib.util.spec_from_file_location('memory_store', sys.argv[1]); "
            "module = importlib.util.module_from_spec(spec); "
            "spec.loader.exec_module(module); "
            "print(module.VectorStore(8)._embed('same text'))"
        )
        first = subprocess.run(
            [sys.executable, "-c", code, str(MODULE_PATH)],
            check=True,
            capture_output=True,
            text=True,
        )
        second = subprocess.run(
            [sys.executable, "-c", code, str(MODULE_PATH)],
            check=True,
            capture_output=True,
            text=True,
        )

        self.assertEqual(first.stdout, second.stdout)

    def test_time_filter_includes_matching_ranges_before_limit(self) -> None:
        memory = MEMORY_STORE.IntegratedMemorySystem()
        memory.start_session("session")
        memory.store_fact(
            "same memory", "Alice", timestamp=MEMORY_STORE.datetime(2025, 1, 2)
        )
        memory.store_fact(
            "same memory", "Alice", timestamp=MEMORY_STORE.datetime(2025, 1, 3)
        )

        results = memory.retrieve_memories(
            "same memory",
            time_filter={
                "start": "2025-01-02T00:00:00Z",
                "end": "2025-01-02T00:00:00Z",
            },
            limit=1,
        )

        self.assertEqual(len(results), 1)
        self.assertEqual(
            results[0]["metadata"]["valid_from"], "2025-01-02T00:00:00"
        )


if __name__ == "__main__":
    unittest.main()
