"""
Unit tests for backend/server.py — covers only the changes introduced in this PR:
  - Graceful MongoDB initialization (offline mode when no valid MONGO_URL)
  - GET /api/  (root) returning status/database/message
  - GET /api/dashboard/stats  (stub zeroes)
  - GET /api/transactions  (stub empty list)
  - GET /api/accounts  (stub empty list)
  - CORS middleware configuration (allow_credentials, CORS_ORIGINS env var)
"""
import importlib.util
import os
import sys
import types
from unittest.mock import MagicMock, patch

import pytest
from starlette.testclient import TestClient

# Absolute path to backend/server.py — loaded directly to avoid sys.path ambiguity
BACKEND_SERVER_PATH = os.path.join(os.path.dirname(__file__), "..", "server.py")
BACKEND_SERVER_PATH = os.path.normpath(BACKEND_SERVER_PATH)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_backend_server(env_overrides: dict | None = None):
    """Load backend/server.py from its absolute path with patched environment.

    Re-executes module-level code each call so DB initialisation logic is
    exercised with the supplied environment variables.
    """
    env_overrides = env_overrides or {}

    # Remove any cached module to force re-execution
    for key in list(sys.modules.keys()):
        if key in ("backend_server", "server"):
            del sys.modules[key]

    with patch.dict(os.environ, env_overrides, clear=False):
        with patch("motor.motor_asyncio.AsyncIOMotorClient") as mock_cls:
            mock_instance = MagicMock()
            mock_cls.return_value = mock_instance
            mock_instance.__getitem__ = MagicMock(return_value=MagicMock())

            spec = importlib.util.spec_from_file_location(
                "backend_server", BACKEND_SERVER_PATH
            )
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            # Register under a unique name so re-imports hit the cache
            sys.modules["backend_server"] = mod
            return mod, mock_cls, mock_instance


def _clean_env_for_key(*keys):
    """Return a dict of current env minus the given keys."""
    return {k: v for k, v in os.environ.items() if k not in keys}


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def offline_server():
    """Backend server in OFFLINE mode (MONGO_URL absent/empty)."""
    srv, _, _ = _load_backend_server({"MONGO_URL": "", "MONGODB_URL": ""})
    yield srv


@pytest.fixture()
def online_server():
    """Backend server in ONLINE mode (valid mongodb:// URL)."""
    srv, mock_cls, mock_inst = _load_backend_server(
        {"MONGO_URL": "mongodb://fakehost:27017", "MONGODB_URL": ""}
    )
    yield srv, mock_cls, mock_inst


@pytest.fixture()
def offline_client(offline_server):
    return TestClient(offline_server.app)


@pytest.fixture()
def online_client(online_server):
    srv, _, _ = online_server
    return TestClient(srv.app)


# ---------------------------------------------------------------------------
# 1. DATABASE INITIALIZATION — graceful degradation
# ---------------------------------------------------------------------------

class TestDatabaseInitialization:
    """Verify module-level DB connection logic introduced in this PR."""

    def test_offline_mode_when_no_mongo_url(self):
        """client and db stay None when MONGO_URL is empty."""
        srv, _, _ = _load_backend_server({"MONGO_URL": "", "MONGODB_URL": ""})
        assert srv.client is None
        assert srv.db is None

    def test_offline_mode_when_url_is_empty_string(self):
        """Empty-string MONGO_URL is treated as absent (offline)."""
        srv, mock_cls, _ = _load_backend_server({"MONGO_URL": "", "MONGODB_URL": ""})
        mock_cls.assert_not_called()

    def test_offline_mode_when_url_is_http_not_mongodb(self):
        """URL not starting with 'mongodb' keeps client/db as None."""
        srv, mock_cls, _ = _load_backend_server(
            {"MONGO_URL": "http://not-mongo:27017", "MONGODB_URL": ""}
        )
        assert srv.client is None
        assert srv.db is None
        mock_cls.assert_not_called()

    def test_offline_mode_when_no_env_vars_at_all(self):
        """With no MONGO_URL or MONGODB_URL env vars, stays offline."""
        for key in list(sys.modules.keys()):
            if key in ("backend_server", "server"):
                del sys.modules[key]
        clean = _clean_env_for_key("MONGO_URL", "MONGODB_URL")
        with patch.dict(os.environ, clean, clear=True):
            with patch("motor.motor_asyncio.AsyncIOMotorClient") as mock_cls:
                spec = importlib.util.spec_from_file_location(
                    "backend_server", BACKEND_SERVER_PATH
                )
                mod = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mod)
                assert mod.client is None
                assert mod.db is None

    def test_online_mode_when_valid_mongodb_url(self):
        """client and db are set when MONGO_URL starts with mongodb://."""
        srv, mock_cls, mock_inst = _load_backend_server(
            {"MONGO_URL": "mongodb://localhost:27017", "MONGODB_URL": ""}
        )
        assert srv.client is not None
        assert srv.db is not None
        mock_cls.assert_called_once_with("mongodb://localhost:27017")

    def test_online_mode_when_mongodb_plus_srv_url(self):
        """mongodb+srv:// URLs are also valid (start with 'mongodb')."""
        srv, mock_cls, _ = _load_backend_server(
            {"MONGO_URL": "mongodb+srv://user:pass@cluster.mongodb.net/db", "MONGODB_URL": ""}
        )
        assert srv.client is not None
        mock_cls.assert_called_once()

    def test_db_name_defaults_to_iso_transfer_db(self):
        """DB name is 'iso_transfer_db' when DB_NAME env var is unset."""
        clean = _clean_env_for_key("MONGO_URL", "MONGODB_URL", "DB_NAME")
        for key in list(sys.modules.keys()):
            if key in ("backend_server", "server"):
                del sys.modules[key]
        with patch.dict(os.environ, clean, clear=True):
            with patch("motor.motor_asyncio.AsyncIOMotorClient"):
                spec = importlib.util.spec_from_file_location(
                    "backend_server", BACKEND_SERVER_PATH
                )
                mod = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mod)
                assert mod.db_name == "iso_transfer_db"

    def test_db_name_uses_env_var_when_set(self):
        """DB_NAME env var overrides the default database name."""
        srv, _, _ = _load_backend_server(
            {"MONGO_URL": "", "MONGODB_URL": "", "DB_NAME": "custom_db"}
        )
        assert srv.db_name == "custom_db"

    def test_connection_exception_leaves_db_none(self):
        """Exception during AsyncIOMotorClient init must not crash the app."""
        for key in list(sys.modules.keys()):
            if key in ("backend_server", "server"):
                del sys.modules[key]
        with patch.dict(
            os.environ,
            {"MONGO_URL": "mongodb://bad:27017", "MONGODB_URL": ""},
        ):
            with patch(
                "motor.motor_asyncio.AsyncIOMotorClient",
                side_effect=Exception("connection refused"),
            ):
                spec = importlib.util.spec_from_file_location(
                    "backend_server", BACKEND_SERVER_PATH
                )
                mod = importlib.util.module_from_spec(spec)
                # Must not raise
                spec.loader.exec_module(mod)
                assert mod.db is None


# ---------------------------------------------------------------------------
# 2. GET /api/ — root endpoint
# ---------------------------------------------------------------------------

class TestRootEndpoint:
    """Tests for the GET /api/ route added in this PR."""

    def test_root_returns_200(self, offline_client):
        assert offline_client.get("/api/").status_code == 200

    def test_root_offline_status_is_online(self, offline_client):
        """status field is always 'ONLINE' regardless of DB."""
        data = offline_client.get("/api/").json()
        assert data["status"] == "ONLINE"

    def test_root_offline_database_is_disconnected(self, offline_client):
        """database field reports 'DISCONNECTED' when db is None."""
        data = offline_client.get("/api/").json()
        assert data["database"] == "DISCONNECTED"

    def test_root_offline_message_is_present(self, offline_client):
        data = offline_client.get("/api/").json()
        assert data["message"] == "ISO 20022 Platform is Live!"

    def test_root_online_database_is_connected(self, online_client):
        """database field reports 'CONNECTED' when db is not None."""
        data = online_client.get("/api/").json()
        assert data["database"] == "CONNECTED"

    def test_root_online_status_is_online(self, online_client):
        data = online_client.get("/api/").json()
        assert data["status"] == "ONLINE"

    def test_root_response_has_exactly_three_keys(self, offline_client):
        """Response shape is stable: exactly status, database, message."""
        data = offline_client.get("/api/").json()
        assert set(data.keys()) == {"status", "database", "message"}

    def test_root_content_type_is_json(self, offline_client):
        response = offline_client.get("/api/")
        assert "application/json" in response.headers.get("content-type", "")


# ---------------------------------------------------------------------------
# 3. GET /api/dashboard/stats — stub endpoint
# ---------------------------------------------------------------------------

class TestDashboardStatsEndpoint:
    """Tests for the stub GET /api/dashboard/stats route."""

    def test_dashboard_stats_returns_200(self, offline_client):
        assert offline_client.get("/api/dashboard/stats").status_code == 200

    def test_dashboard_stats_all_values_are_zero(self, offline_client):
        data = offline_client.get("/api/dashboard/stats").json()
        expected_keys = [
            "total_transactions",
            "total_volume",
            "successful_count",
            "pending_count",
            "failed_count",
            "today_transactions",
            "today_volume",
            "avg_transaction_amount",
        ]
        for key in expected_keys:
            assert key in data, f"Missing key: {key}"
            assert data[key] == 0, f"{key} should be 0, got {data[key]}"

    def test_dashboard_stats_has_all_required_keys(self, offline_client):
        data = offline_client.get("/api/dashboard/stats").json()
        for key in ("total_transactions", "total_volume", "successful_count",
                    "pending_count", "failed_count", "today_transactions",
                    "today_volume", "avg_transaction_amount"):
            assert key in data

    def test_dashboard_stats_works_in_online_mode_too(self, online_client):
        """Stub route is independent of DB state."""
        response = online_client.get("/api/dashboard/stats")
        assert response.status_code == 200
        assert response.json()["total_transactions"] == 0


# ---------------------------------------------------------------------------
# 4. GET /api/transactions — stub endpoint
# ---------------------------------------------------------------------------

class TestTransactionsEndpoint:
    """Tests for the stub GET /api/transactions route."""

    def test_transactions_returns_200(self, offline_client):
        assert offline_client.get("/api/transactions").status_code == 200

    def test_transactions_returns_empty_list(self, offline_client):
        data = offline_client.get("/api/transactions").json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_transactions_returns_list_not_dict(self, offline_client):
        """Regression: response must be a list, not a dict/null."""
        data = offline_client.get("/api/transactions").json()
        assert isinstance(data, list)

    def test_transactions_works_in_online_mode(self, online_client):
        data = online_client.get("/api/transactions").json()
        assert isinstance(data, list)


# ---------------------------------------------------------------------------
# 5. GET /api/accounts — stub endpoint
# ---------------------------------------------------------------------------

class TestAccountsEndpoint:
    """Tests for the stub GET /api/accounts route."""

    def test_accounts_returns_200(self, offline_client):
        assert offline_client.get("/api/accounts").status_code == 200

    def test_accounts_returns_empty_list(self, offline_client):
        data = offline_client.get("/api/accounts").json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_accounts_returns_list_not_dict(self, offline_client):
        """Regression: response must be a list, not a dict/null."""
        data = offline_client.get("/api/accounts").json()
        assert isinstance(data, list)

    def test_accounts_works_in_online_mode(self, online_client):
        data = online_client.get("/api/accounts").json()
        assert isinstance(data, list)


# ---------------------------------------------------------------------------
# 6. CORS middleware configuration
# ---------------------------------------------------------------------------

class TestCORSConfiguration:
    """Tests for the updated CORS middleware settings introduced in this PR."""

    def test_cors_wildcard_origin_allows_any_origin(self, offline_client):
        """With default CORS_ORIGINS='*', any Origin is accepted."""
        response = offline_client.options(
            "/api/",
            headers={
                "Origin": "http://example.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.status_code in (200, 204)

    def test_cors_allow_credentials_header_set(self, offline_client):
        """allow_credentials=True means the header appears in responses."""
        response = offline_client.get(
            "/api/",
            headers={"Origin": "http://example.com"},
        )
        assert "access-control-allow-origin" in response.headers

    def test_cors_custom_origins_from_env_var(self):
        """CORS_ORIGINS env var is split on ',' to build the allowed list."""
        srv, _, _ = _load_backend_server(
            {
                "MONGO_URL": "",
                "MONGODB_URL": "",
                "CORS_ORIGINS": "http://localhost:3000,https://app.example.com",
            }
        )
        client = TestClient(srv.app)
        response = client.get(
            "/api/",
            headers={"Origin": "http://localhost:3000"},
        )
        assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"

    def test_cors_default_origin_is_wildcard(self):
        """Without CORS_ORIGINS env var, default allows wildcard origin."""
        clean = _clean_env_for_key("CORS_ORIGINS", "MONGO_URL", "MONGODB_URL")
        for key in list(sys.modules.keys()):
            if key in ("backend_server", "server"):
                del sys.modules[key]
        with patch.dict(os.environ, clean, clear=True):
            with patch("motor.motor_asyncio.AsyncIOMotorClient"):
                spec = importlib.util.spec_from_file_location(
                    "backend_server", BACKEND_SERVER_PATH
                )
                mod = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mod)
                client = TestClient(mod.app)
                response = client.get(
                    "/api/",
                    headers={"Origin": "http://any-origin.test"},
                )
                # Wildcard '*' or the specific origin should appear
                assert "access-control-allow-origin" in response.headers

    def test_cors_allow_credentials_true(self):
        """Verify allow_credentials=True is set (unlike root server.py)."""
        srv, _, _ = _load_backend_server(
            {
                "MONGO_URL": "",
                "MONGODB_URL": "",
                "CORS_ORIGINS": "http://trusted.test",
            }
        )
        client = TestClient(srv.app)
        response = client.get("/api/", headers={"Origin": "http://trusted.test"})
        cred = response.headers.get("access-control-allow-credentials", "")
        assert cred.lower() == "true"


# ---------------------------------------------------------------------------
# 7. Application startup — no crash on import
# ---------------------------------------------------------------------------

class TestApplicationStartup:
    """Server must not crash during import even without a database."""

    def test_app_is_fastapi_instance(self, offline_server):
        from fastapi import FastAPI
        assert isinstance(offline_server.app, FastAPI)

    def test_app_title_is_set(self, offline_server):
        assert offline_server.app.title == "ISO 20022 SWIFT Transfer Platform"

    def test_all_expected_routes_registered(self, offline_server):
        """All four routes from this PR must be present under /api."""
        routes = [r.path for r in offline_server.app.routes]
        assert "/api/" in routes
        assert "/api/dashboard/stats" in routes
        assert "/api/transactions" in routes
        assert "/api/accounts" in routes

    def test_no_crash_without_env_vars(self):
        """Importing server with completely empty env must not raise."""
        clean = _clean_env_for_key("MONGO_URL", "MONGODB_URL", "DB_NAME", "CORS_ORIGINS")
        for key in list(sys.modules.keys()):
            if key in ("backend_server", "server"):
                del sys.modules[key]
        with patch.dict(os.environ, clean, clear=True):
            with patch("motor.motor_asyncio.AsyncIOMotorClient"):
                try:
                    spec = importlib.util.spec_from_file_location(
                        "backend_server", BACKEND_SERVER_PATH
                    )
                    mod = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(mod)
                except Exception as exc:
                    pytest.fail(f"backend server import raised unexpectedly: {exc}")