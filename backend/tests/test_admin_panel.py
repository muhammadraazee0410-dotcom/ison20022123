"""
Admin Panel Backend API Tests
Tests for:
- GET /api/accounts - List all accounts
- GET /api/accounts-balance - Get EUR/USD balance summary
- POST /api/accounts - Create new account
- DELETE /api/accounts/{id} - Delete account
- GET /api/server-terminal - Get server terminal logs
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

class TestAdminPanelAPIs:
    """Test Admin Panel backend APIs"""
    
    def test_api_root(self, api_client):
        """Test API root endpoint"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"API Root: {data}")
    
    def test_get_accounts_returns_5_seeded(self, api_client):
        """Test GET /api/accounts returns 5 pre-seeded accounts"""
        response = api_client.get(f"{BASE_URL}/api/accounts")
        assert response.status_code == 200
        accounts = response.json()
        assert isinstance(accounts, list)
        assert len(accounts) >= 5, f"Expected at least 5 accounts, got {len(accounts)}"
        
        # Verify expected account names
        company_names = [a.get("company_name") for a in accounts]
        expected_names = ["NADELLA GLOBAL LLC", "PLINVEST TRUST", "ZHANG YINGFAN", "QIRAT EP GMBH", "BONA Verwaltungs GmbH"]
        for name in expected_names:
            assert name in company_names, f"Missing expected account: {name}"
        
        # Verify account structure
        first_account = accounts[0]
        assert "id" in first_account
        assert "company_name" in first_account
        assert "iban" in first_account
        assert "balance_eur" in first_account
        assert "balance_usd" in first_account
        assert "representative" in first_account
        print(f"Accounts found: {len(accounts)}")
    
    def test_get_accounts_balance(self, api_client):
        """Test GET /api/accounts-balance returns EUR, USD, and total balance"""
        response = api_client.get(f"{BASE_URL}/api/accounts-balance")
        assert response.status_code == 200
        data = response.json()
        
        # Verify all balance fields
        assert "available_eur" in data
        assert "available_usd" in data
        assert "total_combined_eur" in data
        assert "account_count" in data
        
        # Verify values are numeric and positive
        assert isinstance(data["available_eur"], (int, float))
        assert isinstance(data["available_usd"], (int, float))
        assert data["available_eur"] > 0, "EUR balance should be positive"
        assert data["available_usd"] > 0, "USD balance should be positive"
        assert data["account_count"] >= 5, "Should have at least 5 accounts"
        
        print(f"Balance - EUR: {data['available_eur']}, USD: {data['available_usd']}, Total EUR: {data['total_combined_eur']}")
    
    def test_get_server_terminal_logs(self, api_client):
        """Test GET /api/server-terminal returns server logs with color levels"""
        response = api_client.get(f"{BASE_URL}/api/server-terminal")
        assert response.status_code == 200
        data = response.json()
        
        assert "logs" in data
        logs = data["logs"]
        assert isinstance(logs, list)
        assert len(logs) > 0, "Should have at least some logs"
        
        # Verify log structure
        first_log = logs[0]
        assert "ts" in first_log, "Log should have timestamp"
        assert "level" in first_log, "Log should have level"
        assert "msg" in first_log, "Log should have message"
        
        # Check for different log levels (OK, ERROR, WARN, SYSTEM, INFO)
        levels = [log["level"] for log in logs]
        assert "SYSTEM" in levels, "Should have SYSTEM level logs"
        
        print(f"Server logs count: {len(logs)}")
        print(f"Log levels found: {set(levels)}")
    
    def test_create_account_and_verify(self, api_client):
        """Test POST /api/accounts creates new account"""
        payload = {
            "account_type": "company",
            "company_name": "TEST_PYTEST_COMPANY",
            "company_address": "123 Test Street, Berlin, Germany",
            "registration_nr": "PYTEST12345",
            "representative": {
                "name": "Test Manager",
                "passport_no": "PYTEST987654"
            },
            "bank_name": "HSBC Continental Europe, Germany",
            "bank_address": "Hansaallee 3, 40549 Dusseldorf, Germany",
            "account_name": "TEST_PYTEST_COMPANY",
            "iban": "DE89370400440532013998",
            "swift_code": "TUBDDEDD",
            "balance_eur": 50000.00,
            "balance_usd": 45000.00
        }
        
        response = api_client.post(f"{BASE_URL}/api/accounts", json=payload)
        assert response.status_code == 200
        created = response.json()
        
        assert "id" in created
        assert created["company_name"] == "TEST_PYTEST_COMPANY"
        assert created["balance_eur"] == 50000.00
        assert created["balance_usd"] == 45000.00
        assert created["iban"] == "DE89370400440532013998"
        assert created["status"] == "ACTIVE"
        
        # Verify account appears in list
        list_response = api_client.get(f"{BASE_URL}/api/accounts")
        accounts = list_response.json()
        created_ids = [a["id"] for a in accounts if a.get("company_name") == "TEST_PYTEST_COMPANY"]
        assert len(created_ids) > 0, "Created account should appear in list"
        
        # Store ID for cleanup
        self.created_account_id = created["id"]
        print(f"Created account ID: {created['id']}")
    
    def test_delete_account(self, api_client):
        """Test DELETE /api/accounts/{id} removes account"""
        # First create an account to delete
        payload = {
            "account_type": "individual",
            "company_name": "TEST_DELETE_ACCOUNT",
            "representative": {
                "name": "Delete Test Person",
                "passport_no": "DELETE12345"
            },
            "bank_name": "HSBC Continental Europe, Germany",
            "bank_address": "Hansaallee 3, 40549 Dusseldorf, Germany",
            "account_name": "TEST_DELETE_ACCOUNT",
            "iban": "DE89370400440532013997",
            "swift_code": "TUBDDEDD",
            "balance_eur": 1000.00,
            "balance_usd": 900.00
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/accounts", json=payload)
        assert create_response.status_code == 200
        created = create_response.json()
        account_id = created["id"]
        
        # Delete the account
        delete_response = api_client.delete(f"{BASE_URL}/api/accounts/{account_id}")
        assert delete_response.status_code == 200
        delete_data = delete_response.json()
        assert delete_data["message"] == "Account deleted"
        assert delete_data["id"] == account_id
        
        # Verify account no longer in list
        list_response = api_client.get(f"{BASE_URL}/api/accounts")
        accounts = list_response.json()
        deleted_account = [a for a in accounts if a["id"] == account_id]
        assert len(deleted_account) == 0, "Deleted account should not appear in list"
        
        print(f"Successfully deleted account: {account_id}")
    
    def test_delete_nonexistent_account_returns_404(self, api_client):
        """Test DELETE /api/accounts/{id} with invalid ID returns 404"""
        fake_id = "non-existent-id-12345"
        response = api_client.delete(f"{BASE_URL}/api/accounts/{fake_id}")
        assert response.status_code == 404
        print(f"Correctly returned 404 for non-existent account")
    
    def test_account_balance_updates_after_crud(self, api_client):
        """Test balance totals update after account CRUD operations"""
        # Get initial balance
        initial_balance_response = api_client.get(f"{BASE_URL}/api/accounts-balance")
        initial_balance = initial_balance_response.json()
        initial_eur = initial_balance["available_eur"]
        initial_count = initial_balance["account_count"]
        
        # Create account with known balance
        payload = {
            "account_type": "company",
            "company_name": "TEST_BALANCE_CHECK",
            "representative": {"name": "Balance Tester", "passport_no": "BALANCE123"},
            "bank_name": "HSBC Continental Europe, Germany",
            "bank_address": "Hansaallee 3, 40549 Dusseldorf, Germany",
            "account_name": "TEST_BALANCE_CHECK",
            "iban": "DE89370400440532013996",
            "swift_code": "TUBDDEDD",
            "balance_eur": 10000.00,
            "balance_usd": 8000.00
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/accounts", json=payload)
        created = create_response.json()
        
        # Check balance increased
        updated_balance_response = api_client.get(f"{BASE_URL}/api/accounts-balance")
        updated_balance = updated_balance_response.json()
        assert updated_balance["available_eur"] == initial_eur + 10000.00
        assert updated_balance["account_count"] == initial_count + 1
        
        # Cleanup - delete the test account
        api_client.delete(f"{BASE_URL}/api/accounts/{created['id']}")
        
        # Verify balance restored
        final_balance_response = api_client.get(f"{BASE_URL}/api/accounts-balance")
        final_balance = final_balance_response.json()
        assert final_balance["available_eur"] == initial_eur
        assert final_balance["account_count"] == initial_count
        
        print(f"Balance correctly updated: Initial EUR={initial_eur}, After add={updated_balance['available_eur']}, After delete={final_balance['available_eur']}")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_accounts(self, api_client):
        """Remove any TEST_ prefixed accounts"""
        response = api_client.get(f"{BASE_URL}/api/accounts")
        accounts = response.json()
        
        test_accounts = [a for a in accounts if a.get("company_name", "").startswith("TEST_")]
        for acc in test_accounts:
            api_client.delete(f"{BASE_URL}/api/accounts/{acc['id']}")
            print(f"Cleaned up test account: {acc['company_name']}")
        
        # Verify original accounts remain (10 seeded accounts)
        final_response = api_client.get(f"{BASE_URL}/api/accounts")
        final_accounts = final_response.json()
        test_remaining = [a for a in final_accounts if a.get("company_name", "").startswith("TEST_")]
        assert len(test_remaining) == 0, f"Expected 0 test accounts after cleanup, got {len(test_remaining)}"
        print(f"Final account count: {len(final_accounts)}")
