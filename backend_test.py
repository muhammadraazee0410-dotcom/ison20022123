import requests
import sys
import json
from datetime import datetime

class HSBCAPITester:
    def __init__(self, base_url="https://hsbc-txn-platform.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
            self.failed_tests.append({"name": name, "details": details})

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        default_headers = {'Content-Type': 'application/json'}
        if self.token:
            default_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            default_headers.update(headers)

        try:
            print(f"\n🔍 Testing {name}...")
            print(f"   URL: {url}")
            
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=30)

            success = response.status_code == expected_status
            details = f"Expected {expected_status}, got {response.status_code}"
            
            if success:
                try:
                    response_data = response.json()
                    self.log_test(name, True)
                    return True, response_data
                except:
                    self.log_test(name, True)
                    return True, {}
            else:
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'No error details')}"
                except:
                    details += f" - {response.text[:100]}"
                self.log_test(name, False, details)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, data = self.run_test(
            "Root API Endpoint",
            "GET",
            "/",
            200
        )
        return success

    def test_login(self):
        """Test login endpoint with valid credentials"""
        success, response = self.run_test(
            "Login with Valid Credentials",
            "POST",
            "/auth/login",
            200,
            data={"email": "admin@hsbc.com", "password": "hsbc2025"}
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Token received: {self.token[:20]}...")
            return True
        return False

    def test_login_invalid(self):
        """Test login with invalid credentials"""
        success, response = self.run_test(
            "Login with Invalid Password",
            "POST", 
            "/auth/login",
            401,
            data={"email": "admin@hsbc.com", "password": "wrong"}
        )
        return success

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        success, data = self.run_test(
            "Dashboard Stats",
            "GET",
            "/dashboard/stats",
            200
        )
        if success:
            required_fields = ['total_transactions', 'total_volume', 'successful_count', 'pending_count', 'failed_count']
            for field in required_fields:
                if field not in data:
                    self.log_test(f"Dashboard Stats - {field} field", False, f"Missing field: {field}")
                    return False
            print(f"   Stats: {data['total_transactions']} transactions, {data['total_volume']} volume")
        return success

    def test_dashboard_chart_data(self):
        """Test dashboard chart data endpoint"""
        success, data = self.run_test(
            "Dashboard Chart Data",
            "GET",
            "/dashboard/chart-data", 
            200
        )
        if success:
            if 'status_distribution' not in data or 'daily_volume' not in data:
                self.log_test("Dashboard Chart Data - Structure", False, "Missing chart data structure")
                return False
            print(f"   Chart data: {len(data.get('status_distribution', []))} status entries, {len(data.get('daily_volume', []))} daily entries")
        return success

    def test_seed_data(self):
        """Test seeding sample data"""
        success, response = self.run_test(
            "Seed Sample Data",
            "POST",
            "/seed-data",
            200
        )
        if success:
            print(f"   Response: {response.get('message', 'No message')}")
        return success

    def test_transactions_list(self):
        """Test transactions list endpoint"""
        success, data = self.run_test(
            "Transactions List", 
            "GET",
            "/transactions",
            200
        )
        if success and isinstance(data, list):
            print(f"   Found {len(data)} transactions")
            return True
        return success

    def test_transactions_filtering(self):
        """Test transaction filtering"""
        # Test status filter
        success1, data1 = self.run_test(
            "Transactions Filter by Status",
            "GET", 
            "/transactions?status=successful",
            200
        )
        
        # Test search filter
        success2, data2 = self.run_test(
            "Transactions Search",
            "GET",
            "/transactions?search=HSBC",
            200
        )
        
        return success1 and success2

    def test_transaction_detail(self):
        """Test single transaction detail endpoint"""
        # First get transactions list to get an ID
        success, transactions = self.run_test(
            "Get Transactions for Detail Test",
            "GET",
            "/transactions?limit=1", 
            200
        )
        
        if success and transactions and len(transactions) > 0:
            txn_id = transactions[0]['id']
            success_detail, transaction = self.run_test(
                "Transaction Detail",
                "GET",
                f"/transactions/{txn_id}",
                200
            )
            
            if success_detail:
                required_fields = ['id', 'uetr', 'message_type', 'instructing_agent', 'instructed_agent', 'settlement_info']
                for field in required_fields:
                    if field not in transaction:
                        self.log_test(f"Transaction Detail - {field} field", False, f"Missing field: {field}")
                        return False
                print(f"   Transaction ID: {transaction['id']}")
                print(f"   UETR: {transaction['uetr']}")
            return success_detail
        else:
            self.log_test("Transaction Detail", False, "No transactions available to test detail endpoint")
            return False

    def test_transaction_not_found(self):
        """Test transaction detail with invalid ID"""
        success, response = self.run_test(
            "Transaction Not Found",
            "GET",
            "/transactions/invalid-id",
            404
        )
        return success

    def test_create_transaction(self):
        """Test creating a new transaction"""
        transaction_data = {
            "message_type": "pacs.009.001.08",
            "uetr": "test-uetr-12345678-90ab-cdef-1234-567890abcdef",
            "business_service": "swift.finplus",
            "instructing_agent": {
                "bic": "TUBDDEDDXXX",
                "name": "HSBC (CONTINENTAL EUROPE)", 
                "country": "DE"
            },
            "instructed_agent": {
                "bic": "BSCHESMMXXX",
                "name": "BANCO SANTANDER S.A.",
                "country": "ES"
            },
            "settlement_info": {
                "method": "INGA",
                "priority": "NORMAL",
                "settlement_date": "2025-12-10",
                "interbank_settlement_amount": 1000000.00,
                "currency": "EUR"
            },
            "debtor": {
                "name": "TEST COMPANY LIMITED",
                "iban": "DE59300308800000499005",
                "country": "DE"
            },
            "creditor": {
                "name": "TEST RECEIVER LIMITED",
                "iban": "ES9121000418450200051332",
                "country": "ES"
            },
            "remittance_info": "TEST PAYMENT PURPOSE",
            "status": "PENDING",
            "tracking_result": "PENDING",
            "cbpr_compliant": True,
            "nostro_credited": False,
            "vostro_debited": False,
            "network_ack": False,
            "reversal_possibility": "POSSIBLE",
            "manual_intervention": "NOT REQUIRED"
        }
        
        success, response = self.run_test(
            "Create New Transaction",
            "POST",
            "/transactions",
            200,
            data=transaction_data
        )
        
        if success:
            required_fields = ['id', 'uetr', 'message_type', 'created_at']
            for field in required_fields:
                if field not in response:
                    self.log_test(f"Create Transaction - {field} field", False, f"Missing field: {field}")
                    return False
            print(f"   Created Transaction ID: {response['id']}")
            print(f"   UETR: {response['uetr']}")
            # Store the ID for potential cleanup
            self.created_transaction_id = response['id']
        return success

def main():
    """Main test function"""
    print("=" * 60)
    print("HSBC MX Transaction Platform - API Testing")
    print("=" * 60)
    
    tester = HSBCAPITester()
    
    # Test sequence
    tests = [
        ("Root Endpoint", tester.test_root_endpoint),
        ("Login Valid", tester.test_login),
        ("Login Invalid", tester.test_login_invalid),
        ("Dashboard Stats", tester.test_dashboard_stats), 
        ("Dashboard Charts", tester.test_dashboard_chart_data),
        ("Seed Data", tester.test_seed_data),
        ("Transactions List", tester.test_transactions_list),
        ("Transactions Filtering", tester.test_transactions_filtering),
        ("Transaction Detail", tester.test_transaction_detail),
        ("Transaction Not Found", tester.test_transaction_not_found)
    ]
    
    print(f"\nStarting {len(tests)} API tests...\n")
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            tester.log_test(test_name, False, f"Test function error: {str(e)}")
    
    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Total Tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {len(tester.failed_tests)}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.failed_tests:
        print("\nFAILED TESTS:")
        for test in tester.failed_tests:
            print(f"- {test['name']}: {test['details']}")
    
    return 0 if len(tester.failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())