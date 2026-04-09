"""
Backend API Tests for ISO 20022 SWIFT Transfer Platform
Tests: Authentication, Transactions, Dashboard, Analytics/Reports
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://iso-transaction-hub.preview.emergentagent.com')

class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test successful login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "hsbc2025"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "email" in data
        assert data["email"] == "test@test.com"
        assert "name" in data
        assert "role" in data
        assert "department" in data
    
    def test_login_invalid_password(self):
        """Test login with invalid password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


class TestDashboard:
    """Dashboard endpoint tests"""
    
    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_transactions" in data
        assert "total_volume" in data
        assert "successful_count" in data
        assert "pending_count" in data
        assert "failed_count" in data
        assert "today_transactions" in data
        assert "today_volume" in data
        assert "avg_transaction_amount" in data
    
    def test_total_funds(self):
        """Test total funds endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/total-funds")
        assert response.status_code == 200
        data = response.json()
        assert "funds" in data
        assert "total_eur_equivalent" in data
        assert "last_updated" in data
    
    def test_chart_data(self):
        """Test chart data endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/chart-data")
        assert response.status_code == 200
        data = response.json()
        assert "status_distribution" in data
        assert "daily_volume" in data


class TestTransactions:
    """Transaction CRUD tests"""
    
    def test_get_transactions_list(self):
        """Test getting list of transactions"""
        response = requests.get(f"{BASE_URL}/api/transactions")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            txn = data[0]
            assert "id" in txn
            assert "uetr" in txn
            assert "message_type" in txn
            assert "settlement_info" in txn
            assert "debtor" in txn
            assert "creditor" in txn
    
    def test_get_transactions_with_status_filter(self):
        """Test filtering transactions by status"""
        response = requests.get(f"{BASE_URL}/api/transactions?status=SUCCESSFUL")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for txn in data:
            assert txn.get("tracking_result") == "SUCCESSFUL"
    
    def test_get_single_transaction(self):
        """Test getting a single transaction by ID"""
        # First get list to get a valid ID
        list_response = requests.get(f"{BASE_URL}/api/transactions")
        assert list_response.status_code == 200
        transactions = list_response.json()
        
        if len(transactions) > 0:
            txn_id = transactions[0]["id"]
            response = requests.get(f"{BASE_URL}/api/transactions/{txn_id}")
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == txn_id
            assert "uetr" in data
            assert "settlement_info" in data
    
    def test_get_nonexistent_transaction(self):
        """Test getting a transaction that doesn't exist"""
        response = requests.get(f"{BASE_URL}/api/transactions/nonexistent-id-12345")
        assert response.status_code == 404


class TestAnalyticsReports:
    """Analytics and Reports endpoint tests - NEW FEATURE"""
    
    def test_analytics_reports_endpoint(self):
        """Test the new analytics/reports endpoint"""
        response = requests.get(f"{BASE_URL}/api/analytics/reports")
        assert response.status_code == 200
        data = response.json()
        
        # Check summary section
        assert "summary" in data
        summary = data["summary"]
        assert "total_transactions" in summary
        assert "total_volume" in summary
        assert "successful" in summary
        assert "pending" in summary
        assert "failed" in summary
        assert "total_accounts" in summary
        assert "avg_transaction" in summary
        
        # Check currency distribution
        assert "currency_distribution" in data
        assert isinstance(data["currency_distribution"], list)
        
        # Check monthly volume
        assert "monthly_volume" in data
        assert isinstance(data["monthly_volume"], list)
        if len(data["monthly_volume"]) > 0:
            month_data = data["monthly_volume"][0]
            assert "month" in month_data
            assert "volume" in month_data
            assert "count" in month_data
        
        # Check nostro positions
        assert "nostro_positions" in data
        assert isinstance(data["nostro_positions"], list)
        
        # Check settlement methods
        assert "settlement_methods" in data
        assert isinstance(data["settlement_methods"], list)
        
        # Check compliance stats
        assert "compliance" in data
        compliance = data["compliance"]
        assert "total_screened" in compliance
        assert "sanctions_cleared" in compliance
        assert "aml_passed" in compliance
        assert "kyc_verified" in compliance
        assert "compliance_rate" in compliance
        
        # Check top counterparties
        assert "top_counterparties" in data
        assert isinstance(data["top_counterparties"], list)
        
        # Check daily settlement
        assert "daily_settlement" in data
        assert isinstance(data["daily_settlement"], list)
        
        # Check report metadata
        assert "report_generated" in data
        assert "report_id" in data


class TestAccounts:
    """Account endpoint tests"""
    
    def test_get_accounts_list(self):
        """Test getting list of accounts"""
        response = requests.get(f"{BASE_URL}/api/accounts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_accounts_balance(self):
        """Test getting accounts balance summary"""
        response = requests.get(f"{BASE_URL}/api/accounts-balance")
        assert response.status_code == 200
        data = response.json()
        assert "available_eur" in data
        assert "available_usd" in data
        assert "total_combined_usd" in data
        assert "account_count" in data


class TestServerTerminal:
    """Server terminal logs endpoint tests"""
    
    def test_server_terminal_logs(self):
        """Test server terminal logs endpoint"""
        response = requests.get(f"{BASE_URL}/api/server-terminal")
        assert response.status_code == 200
        data = response.json()
        assert "logs" in data
        assert isinstance(data["logs"], list)


class TestTransactionActions:
    """Transaction action endpoint tests"""
    
    def test_complete_transaction(self):
        """Test completing a transaction"""
        # First get a transaction
        list_response = requests.get(f"{BASE_URL}/api/transactions")
        transactions = list_response.json()
        
        if len(transactions) > 0:
            txn_id = transactions[0]["id"]
            response = requests.patch(f"{BASE_URL}/api/transactions/{txn_id}/complete")
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            assert data["status"] == "FINALIZED"
            assert data["tracking_result"] == "SUCCESSFUL"
    
    def test_send_notification(self):
        """Test sending email notification (MOCKED)"""
        # First get a transaction
        list_response = requests.get(f"{BASE_URL}/api/transactions")
        transactions = list_response.json()
        
        if len(transactions) > 0:
            txn_id = transactions[0]["id"]
            response = requests.post(
                f"{BASE_URL}/api/transactions/{txn_id}/send-notification",
                json={
                    "transaction_id": txn_id,
                    "recipient_email": "test@example.com",
                    "notification_type": "confirmation"
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            assert "notification_id" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
