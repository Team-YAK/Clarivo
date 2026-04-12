import importlib.util
import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

from fastapi import BackgroundTasks, HTTPException


ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_AI_DIR = ROOT_DIR / "backend-ai"
BACKEND_DATA_DIR = ROOT_DIR / "backend-data"

if str(BACKEND_AI_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_AI_DIR))


def _load_module(module_name: str, file_path: Path):
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


from agents import orchestrator  # noqa: E402
from routes import clarify as clarify_route  # noqa: E402
from routes import confirm as confirm_route  # noqa: E402
from routes import intent as intent_route  # noqa: E402
from routes import tree_ai  # noqa: E402

database = _load_module("database", BACKEND_DATA_DIR / "database.py")
mock_db = _load_module("mock_db", BACKEND_DATA_DIR / "mock_db.py")
_load_module("utils", BACKEND_DATA_DIR / "utils.py")
profile_route = _load_module("backend_data_profile_route", BACKEND_DATA_DIR / "routes/profile.py")
sessions_route = _load_module("backend_data_sessions_route", BACKEND_DATA_DIR / "routes/sessions.py")
db = database.db


def _reset_mock_db():
    db.users = mock_db.MockCollection("users")
    db.sessions = mock_db.MockCollection("sessions")
    db.sentences = mock_db.MockCollection("sentences")
    db.context_log = mock_db.MockCollection("context_log")
    db.anchors = mock_db.MockCollection("anchors")
    db.icons = mock_db.MockCollection("icons")
    db.conversations = mock_db.MockCollection("conversations")


class DynamicRuntimeSyncTests(unittest.TestCase):
    def test_tree_router_only_exposes_expand(self):
        paths = sorted(route.path for route in tree_ai.router.routes)
        self.assertEqual(paths, ["/api/tree/expand"])

    def test_legacy_static_tree_surfaces_are_removed(self):
        removed_files = [
            ROOT_DIR / "backend-data/routes/tree.py",
            ROOT_DIR / "backend-data/routes/buttons.py",
            ROOT_DIR / "backend-data/routes/shortcuts.py",
            ROOT_DIR / "backend-data/services/engines.py",
        ]

        for path in removed_files:
            self.assertFalse(path.exists(), f"Expected deleted legacy surface to stay removed: {path}")

        data_main = (ROOT_DIR / "backend-data/main.py").read_text()
        self.assertNotIn("tree_router", data_main)
        self.assertNotIn("buttons_router", data_main)
        self.assertNotIn("shortcuts_router", data_main)

        sessions_source = (ROOT_DIR / "backend-data/routes/sessions.py").read_text()
        self.assertNotIn("/api/sessions/confirm", sessions_source)


class DynamicRuntimeAsyncTests(unittest.IsolatedAsyncioTestCase):
    async def test_expand_calls_context_before_crew(self):
        order: list[str] = []

        async def fake_fetch_context(user_id: str, current_path: list[str]):
            order.append("context")
            return {
                "user_id": user_id,
                "current_path": current_path,
                "_metrics": {"context_mongo_skim_ms": 1.0, "context_total_ms": 2.0},
            }

        async def fake_run_crew_pipeline(current_path: list[str], context: dict):
            self.assertEqual(order, ["context"])
            self.assertEqual(context["current_path"], current_path)
            order.append("crew")
            return {
                "quick_option": {"label": "Coffee", "key": "coffee", "icon": "coffee"},
                "options": [{"label": "Coffee", "key": "coffee", "icon": "coffee"}],
                "_timings": {
                    "personalization_ms": 3.0,
                    "generation_first_token_ms": 4.0,
                    "icon_resolve_ms": 5.0,
                    "manager_ms": 6.0,
                },
            }

        with patch.object(orchestrator, "fetch_context", fake_fetch_context), patch.object(
            orchestrator, "run_crew_pipeline", fake_run_crew_pipeline
        ):
            result = await orchestrator.expand("alex_demo", ["drink"])

        self.assertEqual(order, ["context", "crew"])
        self.assertEqual(result["quick_option"]["key"], "coffee")

    async def test_confirm_persists_pending_intent_session(self):
        intent_route.pending_sessions.clear()
        intent_route.pending_sessions["s_pending"] = {
            "session_id": "s_pending",
            "user_id": "alex_demo",
            "path": ["drink", "coffee"],
            "path_key": "drink→coffee",
            "sentence": "I want coffee",
            "confidence": 0.93,
            "input_mode": "tree",
        }

        create_session_mock = AsyncMock(return_value={"session_id": "s_pending"})
        get_user_mock = AsyncMock(return_value={"voice_id": "mock_voice_id"})
        question_mock = AsyncMock(return_value=None)
        save_question_mock = AsyncMock(return_value={"success": True})

        with patch.object(confirm_route, "create_session", create_session_mock), patch.object(
            confirm_route, "get_user", get_user_mock
        ), patch.object(
            confirm_route, "generate_post_session_question", question_mock
        ), patch.object(
            confirm_route, "save_context_question", save_question_mock
        ):
            response = await confirm_route.confirm(
                confirm_route.ConfirmRequest(session_id="s_pending", user_id="alex_demo"),
                BackgroundTasks(),
            )

        self.assertEqual(response["session_id"], "s_pending")
        self.assertEqual(response["sentence"], "I want coffee")
        self.assertEqual(response["audio_url"], "/audio/mock_patient.mp3")
        self.assertEqual(response["voice_source"], "mock")

        create_session_mock.assert_awaited_once()
        payload = create_session_mock.await_args.args[0]
        self.assertEqual(payload["session_id"], "s_pending")
        self.assertEqual(payload["path"], ["drink", "coffee"])
        self.assertEqual(payload["path_key"], "drink→coffee")
        self.assertEqual(payload["audio_url"], "/audio/mock_patient.mp3")

    async def test_confirm_returns_404_for_unknown_session(self):
        intent_route.pending_sessions.clear()

        with self.assertRaises(HTTPException) as exc:
            await confirm_route.confirm(
                confirm_route.ConfirmRequest(session_id="missing", user_id="alex_demo"),
                BackgroundTasks(),
            )

        self.assertEqual(exc.exception.status_code, 404)

    async def test_create_session_updates_frequency_and_tree_skim(self):
        _reset_mock_db()

        await db.users.insert_one(
            {
                "_id": "alex_demo",
                "preferences": {
                    "known_preferences": "Likes coffee.",
                    "always_know": "Morning drinks matter.",
                },
                "path_frequencies": {},
                "context_answers": [],
                "correction_history": [],
            }
        )
        await db.conversations.insert_one(
            {
                "_id": "conv_1",
                "user_id": "alex_demo",
                "active": True,
                "utterances": [
                    {"speaker": "Caregiver", "text": "Do you want anything?"},
                    {"speaker": "Patient", "text": "Coffee."},
                ],
            }
        )

        await sessions_route.create_session(
            sessions_route.SessionCreate(
                session_id="s_first",
                user_id="alex_demo",
                path=["drink", "coffee"],
                sentence="I want coffee",
                confidence=0.91,
                input_mode="tree",
                audio_url="/audio/first.mp3",
            )
        )
        await sessions_route.create_session(
            sessions_route.SessionCreate(
                session_id="s_second",
                user_id="alex_demo",
                path=["drink", "coffee"],
                sentence="Coffee please",
                confidence=0.88,
                input_mode="tree",
                audio_url="/audio/second.mp3",
            )
        )

        first = await db.sessions.find_one({"_id": "s_first"})
        second = await db.sessions.find_one({"_id": "s_second"})
        user = await db.users.find_one({"_id": "alex_demo"})
        skim = await profile_route.get_tree_context_skim("alex_demo")

        self.assertTrue(first["is_first_occurrence"])
        self.assertFalse(second["is_first_occurrence"])
        self.assertEqual(user["path_frequencies"]["drink→coffee"], 2)
        self.assertEqual(skim["recent_paths"], [["drink", "coffee"]])
        self.assertEqual(skim["top_paths"][0], {"key": "drink→coffee", "count": 2})
        self.assertEqual(skim["preferences"]["known_preferences"], "Likes coffee.")
        self.assertEqual(skim["conversation_utterances"][-1]["text"], "Coffee.")

    async def test_clarify_returns_empty_options_when_generation_fails(self):
        with patch.object(
            clarify_route, "get_user", AsyncMock(return_value={"profile": {"name": "Alex"}})
        ), patch.object(
            clarify_route, "build_context_string", lambda user_data: "ctx"
        ), patch.object(
            clarify_route, "generate_clarification_options", AsyncMock(return_value=None)
        ):
            result = await clarify_route.clarify(
                clarify_route.ClarifyRequest(path=["pain"], user_id="alex_demo", input_mode="tree")
            )

        self.assertEqual(result, {"options": []})


if __name__ == "__main__":
    unittest.main()
