# HSBC Germany MX Transaction Platform - PRD

## Original Problem Statement
HSBC GERMANY MX TRANSACTION PLATFORM - A banking platform for viewing and managing SWIFT MX pacs.009.001.08 Financial Institution Credit Transfer transactions based on sample SWIFT payment confirmation document.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Styling**: HSBC Brand Identity (Red #DB0011, IBM Plex Sans font)

## User Personas
1. **Bank Operations Staff** - View and monitor SWIFT transactions
2. **Compliance Officers** - Verify CBPR+ compliance status
3. **Transaction Managers** - Track settlement status and Nostro/Vostro movements

## Core Requirements (Static)
- SWIFT MX pacs.009.001.08 message format support
- Transaction receipt view matching official SWIFT confirmation documents
- Real-time dashboard with transaction statistics
- Search and filter capabilities
- Status tracking (SUCCESSFUL, PENDING, FAILED)
- CBPR+ compliance indicators

## What's Been Implemented

### Backend (server.py)
- [x] Transaction CRUD endpoints
- [x] Dashboard statistics API
- [x] Chart data API
- [x] Sample data seeding
- [x] Authentication (demo mode)

### Frontend Pages
- [x] Login page with HSBC branding
- [x] Dashboard with stats cards, charts, recent transactions
- [x] Transactions list with search/filter/sort
- [x] Transaction Detail/Receipt page (SWIFT format)
- [x] New Transaction page

### Key Features
- [x] UETR tracking display
- [x] Settlement information (amount, date, method, priority)
- [x] Instructing/Instructed Agent BIC details
- [x] Debtor/Creditor information with IBANs
- [x] Status & Compliance section
- [x] Nostro/Vostro movement indicators
- [x] Print functionality for receipts
- [x] **Print: Emergent badge hidden** (Feb 28, 2026)

### Transaction Receipt Documents
- [x] Settlement Letter
- [x] Confirmation Copy
- [x] Status Statement
- [x] MT202 COV
- [x] PACS.008
- [x] Official Debit Note
- [x] MT910 Credit Confirmation
- [x] MT900 Debit Confirmation
- [x] MT945 Statement
- [x] Server Report
- [x] Alliance Message
- [x] HSBC Germany branding
- [x] Barcode and QR code components

## P0/P1/P2 Features Remaining

### P0 (Critical)
- None - All critical issues resolved

### P1 (Important)
- Real email notifications (currently mocked)
- Real user authentication with proper security
- Transaction export (CSV/PDF)
- Date range filtering

### P2 (Nice to Have)
- Refactor TransactionDetail.jsx into sub-components
- Refactor server.py into modular routes/models/services
- Advanced analytics and reporting
- Transaction approval workflows
- Audit logging

## Credentials
- Email: any email (demo mode)
- Password: hsbc2025
