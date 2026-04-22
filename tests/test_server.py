"""
Unit tests for server.py - covering changes introduced in PR:
1. Environment variable priority order: MONGO_URL > MONGODB_URL > DATABASE_URL > default
2. Root endpoint version string changed to "6.0.0"

These tests use lightweight stubs for fastapi and motor so they run without
those packages being installed in the test environment.
"""
import os
import sys
import types
import unittest
from unittest.mock import MagicMock


# ---------------------------------------------------------------------------
# Lightweight stubs for fastapi, motor, and starlette.middleware.cors
# ---------------------------------------------------------------------------

def _build_fastapi_stub():
    """
    Build just enough of fastapi / starlette to let server.py be imported and
    its app.routes be callable from a minimal ASGI test.
    """
    # --- route storage -------------------------------------------------------
    _routes = {}  # method -> path -> coroutine

    class _APIRouter:
        def __init__(self, prefix=""):
            self._prefix = prefix
            self._routes = {}

        def get(self, path):
            full = self._prefix + path

            def decorator(fn):
                _routes[("GET", full)] = fn
                return fn

            return decorator

        def post(self, path):
            full = self._prefix + path

            def decorator(fn):
                _routes[("POST", full)] = fn
                return fn

            return decorator

    class _FastAPI:
        def __init__(self):
            pass

        def include_router(self, router):
            _routes.update(router._routes if hasattr(router, "_routes") else {})

        def add_middleware(self, cls, **kwargs):
            pass  # ignore middleware in tests

    fastapi_mod = types.ModuleType("fastapi")
    fastapi_mod.FastAPI = _FastAPI
    fastapi_mod.APIRouter = _APIRouter

    # Expose _routes so tests can look up handlers
    fastapi_mod._routes = _routes

    # starlette.middleware.cors stub
    cors_mod = types.ModuleType("starlette.middleware.cors")
    cors_mod.CORSMiddleware = MagicMock()

    starlette_pkg = sys.modules.get("starlette") or types.ModuleType("starlette")
    starlette_middleware = types.ModuleType("starlette.middleware")
    starlette_pkg.middleware = starlette_middleware

    sys.modules.setdefault("starlette", starlette_pkg)
    sys.modules["starlette.middleware"] = starlette_middleware
    sys.modules["starlette.middleware.cors"] = cors_mod

    return fastapi_mod, _routes


def _build_motor_stub():
    """Build a minimal motor.motor_asyncio stub."""
    mock_client_instance = MagicMock()
    mock_client_instance.get_database.return_value = MagicMock()

    motor_pkg = types.ModuleType("motor")
    motor_async = types.ModuleType("motor.motor_asyncio")
    motor_async.AsyncIOMotorClient = MagicMock(return_value=mock_client_instance)
    motor_pkg.motor_asyncio = motor_async

    return motor_pkg, motor_async


def _install_stubs():
    """Install fastapi and motor stubs into sys.modules."""
    fastapi_mod, routes = _build_fastapi_stub()
    motor_pkg, motor_async = _build_motor_stub()

    sys.modules["fastapi"] = fastapi_mod
    sys.modules["motor"] = motor_pkg
    sys.modules["motor.motor_asyncio"] = motor_async

    return fastapi_mod, routes


def _reload_server_with_env(env_vars: dict):
    """
    Load server.py under a controlled environment and with stubs installed.
    Returns the ``url`` string that the module computed at import time.
    """
    _install_stubs()
    sys.modules.pop("server", None)

    saved = os.environ.copy()
    os.environ.clear()
    os.environ.update(env_vars)
    try:
        import server as srv  # noqa: PLC0415
        captured_url = srv.url
    finally:
        os.environ.clear()
        os.environ.update(saved)
        sys.modules.pop("server", None)

    return captured_url


# ---------------------------------------------------------------------------
# Env-var priority tests
# ---------------------------------------------------------------------------

class TestEnvironmentVariablePriority(unittest.TestCase):
    """
    Tests for the changed env-var priority order (PR change):
        MONGO_URL > MONGODB_URL > DATABASE_URL > 'mongodb://localhost:27017'
    """

    def test_mongo_url_takes_priority_when_all_set(self):
        """MONGO_URL must win when all three variables are present."""
        env = {
            "MONGO_URL": "mongodb://mongo-url-host:27017",
            "MONGODB_URL": "mongodb://mongodb-url-host:27017",
            "DATABASE_URL": "mongodb://database-url-host:27017",
        }
        url = _reload_server_with_env(env)
        self.assertEqual(url, "mongodb://mongo-url-host:27017")

    def test_mongodb_url_used_when_mongo_url_absent(self):
        """MONGODB_URL is the second choice when MONGO_URL is not set."""
        env = {
            "MONGODB_URL": "mongodb://mongodb-url-host:27017",
            "DATABASE_URL": "mongodb://database-url-host:27017",
        }
        url = _reload_server_with_env(env)
        self.assertEqual(url, "mongodb://mongodb-url-host:27017")

    def test_database_url_used_when_others_absent(self):
        """DATABASE_URL is the third choice when the first two are absent."""
        env = {
            "DATABASE_URL": "mongodb://database-url-host:27017",
        }
        url = _reload_server_with_env(env)
        self.assertEqual(url, "mongodb://database-url-host:27017")

    def test_default_fallback_when_no_env_vars_set(self):
        """Falls back to the hardcoded localhost URL when no env var is present."""
        url = _reload_server_with_env({})
        self.assertEqual(url, "mongodb://localhost:27017")

    def test_mongo_url_beats_mongodb_url(self):
        """Regression: old code checked MONGODB_URL first; now MONGO_URL must win."""
        env = {
            "MONGO_URL": "mongodb://correct-host:27017",
            "MONGODB_URL": "mongodb://wrong-host:27017",
        }
        url = _reload_server_with_env(env)
        self.assertEqual(url, "mongodb://correct-host:27017")
        self.assertNotEqual(url, "mongodb://wrong-host:27017")

    def test_mongo_url_beats_database_url(self):
        """MONGO_URL must beat DATABASE_URL."""
        env = {
            "MONGO_URL": "mongodb://correct-host:27017",
            "DATABASE_URL": "mongodb://wrong-host:27017",
        }
        url = _reload_server_with_env(env)
        self.assertEqual(url, "mongodb://correct-host:27017")

    def test_mongodb_url_beats_database_url(self):
        """MONGODB_URL must beat DATABASE_URL when MONGO_URL is absent."""
        env = {
            "MONGODB_URL": "mongodb://correct-host:27017",
            "DATABASE_URL": "mongodb://wrong-host:27017",
        }
        url = _reload_server_with_env(env)
        self.assertEqual(url, "mongodb://correct-host:27017")

    def test_empty_mongo_url_falls_through_to_mongodb_url(self):
        """An empty MONGO_URL is falsy and must give way to MONGODB_URL."""
        env = {
            "MONGO_URL": "",
            "MONGODB_URL": "mongodb://mongodb-url-host:27017",
        }
        url = _reload_server_with_env(env)
        self.assertEqual(url, "mongodb://mongodb-url-host:27017")


# ---------------------------------------------------------------------------
# Root endpoint tests  (call the async handler directly)
# ---------------------------------------------------------------------------

# Module-level reference to avoid Python binding it as an instance method.
_root_fn = None


class TestRootEndpoint(unittest.IsolatedAsyncioTestCase):
    """
    Tests for GET /api/ — version changed from 'COMPLETED-MASTER' to '6.0.0'.

    We call the ``root`` coroutine directly (no HTTP stack required) so these
    tests do not depend on fastapi or starlette being fully installed.
    """

    @classmethod
    def setUpClass(cls):
        global _root_fn
        _install_stubs()
        sys.modules.pop("server", None)

        saved = os.environ.copy()
        os.environ.clear()
        try:
            import server as srv  # noqa: PLC0415
            _root_fn = srv.root
        finally:
            os.environ.clear()
            os.environ.update(saved)

    async def test_root_version_is_600(self):
        """Root endpoint version must be '6.0.0' (changed from 'COMPLETED-MASTER')."""
        result = await _root_fn()
        self.assertEqual(result["version"], "6.0.0")

    async def test_root_version_not_old_value(self):
        """Regression: version must NOT be the old value 'COMPLETED-MASTER'."""
        result = await _root_fn()
        self.assertNotEqual(result["version"], "COMPLETED-MASTER")

    async def test_root_status_is_online(self):
        """Root handler must report status ONLINE."""
        result = await _root_fn()
        self.assertEqual(result["status"], "ONLINE")

    async def test_root_database_is_connected(self):
        """Root handler must report database CONNECTED."""
        result = await _root_fn()
        self.assertEqual(result["database"], "CONNECTED")

    async def test_root_response_has_all_expected_keys(self):
        """Root handler must return a dict with status, database, and version."""
        result = await _root_fn()
        self.assertIsInstance(result, dict)
        self.assertIn("status", result)
        self.assertIn("database", result)
        self.assertIn("version", result)

    async def test_root_response_has_exactly_three_keys(self):
        """Root handler dict must not have unexpected extra keys."""
        result = await _root_fn()
        self.assertEqual(set(result.keys()), {"status", "database", "version"})

    async def test_root_values_are_strings(self):
        """All values returned by root handler must be strings."""
        result = await _root_fn()
        for key, value in result.items():
            self.assertIsInstance(value, str, f"Value for '{key}' should be a string")

    async def test_root_version_semver_format(self):
        """Version string '6.0.0' must match a semantic-version pattern."""
        import re
        result = await _root_fn()
        self.assertRegex(result["version"], r"^\d+\.\d+\.\d+$")


if __name__ == "__main__":
    unittest.main()