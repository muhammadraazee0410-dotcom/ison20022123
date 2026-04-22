"""
Unit tests for the root server.py — covers only the changes introduced in this PR:
  - Simplified module (removed auth/transaction routes, logging, models)
  - GET /api/ root endpoint returning status/database/version
  - DB connection always attempted using env-var chain
    (MONGO_URL → MONGODB_URL → DATABASE_URL → localhost)
  - CORS middleware with allow_origins=["*"]
"""
import importlib.util
import os
import sys
from unittest.mock import MagicMock, patch

import pytest
from starlette.testclient import TestClient

# Absolute path to root server.py
ROOT_SERVER_PATH = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "server.py")
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_root_server(env_overrides: dict | None = None):
    """Load the root server.py by absolute path with patched environment.

    Always patches AsyncIOMotorClient so no real socket is opened.
    """
    env_overrides = env_overrides or {}

    # Evict any cached module with this name
    for key in list(sys.modules.keys()):
        if key in ("root_server",):
            del sys.modules[key]

    with patch.dict(os.environ, env_overrides, clear=False):
        with patch("motor.motor_asyncio.AsyncIOMotorClient") as mock_cls:
            mock_instance = MagicMock()
            mock_cls.return_value = mock_instance
            mock_instance.get_database = MagicMock(return_value=MagicMock())
            mock_instance.__getitem__ = MagicMock(return_value=MagicMock())

            spec = importlib.util.spec_from_file_location(
                "root_server", ROOT_SERVER_PATH
            )
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            sys.modules["root_server"] = mod
            return mod, mock_cls, mock_instance


def _clean_env_for_key(*keys):
    return {k: v for k, v in os.environ.items() if k not in keys}


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def server_module():
    srv, mock_cls, mock_inst = _load_root_server()
    return srv, mock_cls, mock_inst


@pytest.fixture()
def api_client(server_module):
    srv, _, _ = server_module
    return TestClient(srv.app)


# ---------------------------------------------------------------------------
# 1. Module imports cleanly
# ---------------------------------------------------------------------------

class TestRootServerImport:
    """Verify the simplified server.py loads without errors."""

    def test_module_loads_without_exception(self):
        try:
            _load_root_server()
        except Exception as exc:
            pytest.fail(f"root server.py import raised: {exc}")

    def test_app_is_fastapi_instance(self, server_module):
        from fastapi import FastAPI
        srv, _, _ = server_module
        assert isinstance(srv.app, FastAPI)

    def test_api_root_route_exists(self, server_module):
        srv, _, _ = server_module
        routes = [r.path for r in srv.app.routes]
        assert "/api/" in routes

    def test_no_auth_login_route(self, server_module):
        """auth/login was removed in this PR."""
        srv, _, _ = server_module
        routes = [r.path for r in srv.app.routes]
        assert "/api/auth/login" not in routes

    def test_no_dashboard_stats_route(self, server_module):
        """dashboard/stats was removed from root server.py in this PR."""
        srv, _, _ = server_module
        routes = [r.path for r in srv.app.routes]
        assert "/api/dashboard/stats" not in routes

    def test_no_transactions_route_in_root_server(self, server_module):
        """transaction detail route was removed from root server.py."""
        srv, _, _ = server_module
        routes = [r.path for r in srv.app.routes]
        matching = [r for r in routes if "transactions" in r]
        assert len(matching) == 0


# ---------------------------------------------------------------------------
# 2. Database connection — always attempted, env-var chain
# ---------------------------------------------------------------------------

class TestDatabaseConnection:
    """Verify the env-var precedence chain in root server.py."""

    def test_mongo_url_takes_first_priority(self):
        """MONGO_URL is used when set."""
        _, mock_cls, _ = _load_root_server({
            "MONGO_URL": "mongodb://primary:27017",
            "MONGODB_URL": "mongodb://secondary:27017",
            "DATABASE_URL": "mongodb://tertiary:27017",
        })
        mock_cls.assert_called_once_with("mongodb://primary:27017")

    def test_mongodb_url_used_as_fallback(self):
        """MONGODB_URL is used when MONGO_URL is absent."""
        clean = _clean_env_for_key("MONGO_URL", "MONGODB_URL", "DATABASE_URL")
        for key in list(sys.modules.keys()):
            if key == "root_server":
                del sys.modules[key]
        with patch.dict(os.environ, clean, clear=True):
            with patch.dict(os.environ, {"MONGODB_URL": "mongodb://fallback:27017"}):
                with patch("motor.motor_asyncio.AsyncIOMotorClient") as mock_cls:
                    mock_cls.return_value = MagicMock()
                    spec = importlib.util.spec_from_file_location(
                        "root_server", ROOT_SERVER_PATH
                    )
                    mod = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(mod)
                    mock_cls.assert_called_once_with("mongodb://fallback:27017")

    def test_database_url_used_as_second_fallback(self):
        """DATABASE_URL is used when MONGO_URL and MONGODB_URL are absent."""
        clean = _clean_env_for_key("MONGO_URL", "MONGODB_URL", "DATABASE_URL")
        for key in list(sys.modules.keys()):
            if key == "root_server":
                del sys.modules[key]
        with patch.dict(os.environ, clean, clear=True):
            with patch.dict(os.environ, {"DATABASE_URL": "mongodb://dburl:27017"}):
                with patch("motor.motor_asyncio.AsyncIOMotorClient") as mock_cls:
                    mock_cls.return_value = MagicMock()
                    spec = importlib.util.spec_from_file_location(
                        "root_server", ROOT_SERVER_PATH
                    )
                    mod = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(mod)
                    mock_cls.assert_called_once_with("mongodb://dburl:27017")

    def test_localhost_fallback_when_no_env_vars(self):
        """Falls back to mongodb://localhost:27017 when no env var is set."""
        clean = _clean_env_for_key("MONGO_URL", "MONGODB_URL", "DATABASE_URL")
        for key in list(sys.modules.keys()):
            if key == "root_server":
                del sys.modules[key]
        with patch.dict(os.environ, clean, clear=True):
            with patch("motor.motor_asyncio.AsyncIOMotorClient") as mock_cls:
                mock_cls.return_value = MagicMock()
                spec = importlib.util.spec_from_file_location(
                    "root_server", ROOT_SERVER_PATH
                )
                mod = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mod)
                mock_cls.assert_called_once_with("mongodb://localhost:27017")

    def test_client_is_always_initialised(self, server_module):
        """Unlike backend/server.py, root server always creates a client."""
        srv, _, _ = server_module
        assert srv.client is not None

    def test_db_is_always_set(self, server_module):
        """db is always assigned (no offline guard in root server.py)."""
        srv, _, _ = server_module
        assert srv.db is not None

    def test_no_offline_guard(self):
        """Root server.py always calls AsyncIOMotorClient, even with empty URL."""
        clean = _clean_env_for_key("MONGO_URL", "MONGODB_URL", "DATABASE_URL")
        for key in list(sys.modules.keys()):
            if key == "root_server":
                del sys.modules[key]
        with patch.dict(os.environ, clean, clear=True):
            with patch("motor.motor_asyncio.AsyncIOMotorClient") as mock_cls:
                mock_cls.return_value = MagicMock()
                spec = importlib.util.spec_from_file_location(
                    "root_server", ROOT_SERVER_PATH
                )
                mod = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mod)
                # Must have been called (no offline check)
                mock_cls.assert_called_once()


# ---------------------------------------------------------------------------
# 3. GET /api/ — root endpoint
# ---------------------------------------------------------------------------

class TestRootEndpoint:
    """Tests for the simplified GET /api/ route in root server.py."""

    def test_root_returns_200(self, api_client):
        assert api_client.get("/api/").status_code == 200

    def test_root_status_is_online(self, api_client):
        assert api_client.get("/api/").json()["status"] == "ONLINE"

    def test_root_database_is_connected(self, api_client):
        """Root server always reports CONNECTED (no offline mode)."""
        assert api_client.get("/api/").json()["database"] == "CONNECTED"

    def test_root_version_is_6_0_0(self, api_client):
        """Version was changed to 6.0.0 in this PR."""
        assert api_client.get("/api/").json()["version"] == "6.0.0"

    def test_root_response_has_exactly_three_keys(self, api_client):
        """Response shape: status, database, version."""
        data = api_client.get("/api/").json()
        assert set(data.keys()) == {"status", "database", "version"}

    def test_root_has_no_message_field(self, api_client):
        """Root server.py does not include a 'message' field (unlike backend)."""
        data = api_client.get("/api/").json()
        assert "message" not in data

    def test_root_has_no_fix_version_field(self, api_client):
        """FIX_VERSION was removed in this PR."""
        data = api_client.get("/api/").json()
        assert "FIX_VERSION" not in data

    def test_root_content_type_is_json(self, api_client):
        response = api_client.get("/api/")
        assert "application/json" in response.headers.get("content-type", "")

    def test_root_boundary_version_not_old(self, api_client):
        """Regression: version must not be the old value (7.0.0)."""
        assert api_client.get("/api/").json()["version"] != "7.0.0"


# ---------------------------------------------------------------------------
# 4. CORS middleware — allow_origins=["*"]
# ---------------------------------------------------------------------------

class TestCORSMiddleware:
    """Tests for the CORS configuration in root server.py."""

    def test_cors_wildcard_allows_any_origin(self, api_client):
        response = api_client.get(
            "/api/",
            headers={"Origin": "http://arbitrary-origin.example.com"},
        )
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers

    def test_cors_wildcard_value_in_response(self, api_client):
        response = api_client.get(
            "/api/",
            headers={"Origin": "http://frontend.test"},
        )
        assert response.headers.get("access-control-allow-origin") == "*"

    def test_cors_preflight_returns_ok(self, api_client):
        response = api_client.options(
            "/api/",
            headers={
                "Origin": "http://frontend.test",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.status_code in (200, 204)

    def test_cors_no_allow_credentials_header(self, api_client):
        """Root server.py does NOT set allow_credentials=True (unlike backend)."""
        response = api_client.get(
            "/api/",
            headers={"Origin": "http://any.test"},
        )
        cred_header = response.headers.get("access-control-allow-credentials", "")
        assert cred_header.lower() != "true"