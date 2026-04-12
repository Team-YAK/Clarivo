import json
import os
import sys
import unittest
from unittest.mock import AsyncMock, patch


ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND_AI_DIR = os.path.join(ROOT_DIR, "backend-ai")
if BACKEND_AI_DIR not in sys.path:
    sys.path.insert(0, BACKEND_AI_DIR)

from agents import crew_config, orchestrator  # noqa: E402


class DynamicTreeEngineTests(unittest.IsolatedAsyncioTestCase):
    async def test_root_expansion_is_generated_not_static(self):
        generation_payload = {
            "quick_option": {"label": "Coffee", "concept": "coffee", "key": "coffee"},
            "options": [
                {"label": "Coffee", "concept": "coffee", "key": "coffee"},
                {"label": "Walk", "concept": "walk outside", "key": "walk"},
                {"label": "Maria", "concept": "talk to maria", "key": "maria"},
                {"label": "Stretch", "concept": "stretch body", "key": "stretch"},
            ],
        }
        shortlist_payload = {
            "shortlists": {
                "quick": ["coffee", "cup"],
                "opt_0": ["coffee", "cup"],
                "opt_1": ["person-simple-walk", "footprints"],
                "opt_2": ["user-circle", "users"],
                "opt_3": ["barbell", "person-simple-run"],
            }
        }

        chat_mock = AsyncMock(side_effect=[
            json.dumps(generation_payload),
            json.dumps(shortlist_payload),
        ])

        with patch.object(crew_config, "_chat_once", chat_mock):
            result = await crew_config.run_crew_pipeline(
                [],
                {
                    "current_path": [],
                    "conversation_utterances": ["Visitor: 'What do you want to do?'"],
                    "recent_paths": [["coffee"], ["walk"]],
                    "top_paths": [{"key": "coffee", "count": 4}],
                    "recent_concepts": ["coffee", "walk"],
                    "historical_concepts": ["coffee", "walk", "maria"],
                    "preferences": "likes coffee and morning walks",
                    "always_know": "Maria is important",
                },
            )

        labels = [item["label"] for item in result["options"]]
        self.assertEqual(chat_mock.await_count, 2)
        self.assertIn("Coffee", labels)
        self.assertNotIn("Pain", labels)
        self.assertEqual(result["quick_option"]["key"], "coffee")

    async def test_orchestrator_expand_invokes_pipeline_every_time(self):
        fetch_context_mock = AsyncMock(
            return_value={
                "current_path": ["exercise"],
                "conversation_utterances": ["Visitor: 'What next?'"],
                "_metrics": {"context_mongo_skim_ms": 1.0, "context_total_ms": 2.0},
            }
        )
        run_pipeline_mock = AsyncMock(
            return_value={
                "quick_option": {"label": "Run", "key": "run", "icon": "person-simple-run"},
                "options": [{"label": "Run", "key": "run", "icon": "person-simple-run"}],
                "_timings": {
                    "personalization_ms": 1.0,
                    "generation_first_token_ms": 2.0,
                    "icon_resolve_ms": 3.0,
                    "manager_ms": 4.0,
                },
            }
        )

        with patch.object(orchestrator, "fetch_context", fetch_context_mock), patch.object(
            orchestrator, "run_crew_pipeline", run_pipeline_mock
        ):
            await orchestrator.expand("alex_demo", ["exercise"])
            await orchestrator.expand("alex_demo", ["exercise"])

        self.assertEqual(fetch_context_mock.await_count, 2)
        self.assertEqual(run_pipeline_mock.await_count, 2)


if __name__ == "__main__":
    unittest.main()
