import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = (
    Path(__file__).resolve().parents[1] / "scripts" / "compaction.py"
)
MODULE_SPEC = importlib.util.spec_from_file_location("compaction", MODULE_PATH)
if MODULE_SPEC is None or MODULE_SPEC.loader is None:
    raise RuntimeError(f"Unable to load compaction.py from {MODULE_PATH}")
COMPACTION = importlib.util.module_from_spec(MODULE_SPEC)
MODULE_SPEC.loader.exec_module(COMPACTION)


class CategorizeMessagesTests(unittest.TestCase):
    def test_tool_results_retrieved_documents_and_both_turn_roles(self) -> None:
        categories = COMPACTION.categorize_messages(
            [
                {"role": "tool", "content": "tool message"},
                {"role": "user", "type": "tool_result", "content": "tool result"},
                {"role": "user", "tags": ["retrieved"], "content": "document"},
                {"role": "user", "content": "question"},
                {"role": "assistant", "content": "answer"},
            ]
        )

        self.assertEqual(len(categories["tool_output"]), 2)
        self.assertEqual(len(categories["retrieved_document"]), 1)
        self.assertEqual(len(categories["conversation"]), 2)


if __name__ == "__main__":
    unittest.main()
