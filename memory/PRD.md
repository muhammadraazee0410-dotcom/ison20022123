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

## What's Been Implemented (January 2026)

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

### Key Features
- [x] UETR tracking display
- [x] Settlement information (amount, date, method, priority)
- [x] Instructing/Instructed Agent BIC details
- [x] Debtor/Creditor information with IBANs
- [x] Status & Compliance section
- [x] Nostro/Vostro movement indicators
- [x] Print functionality for receipts

## P0/P1/P2 Features Remaining

### P0 (Critical)
- None - Core functionality complete

### P1 (Important)
- Real user authentication with proper security
- Transaction export (CSV/PDF)
- Date range filtering
- Multi-currency support

### P2 (Nice to Have)
- Advanced analytics and reporting
- Transaction approval workflows
- Email notifications
- Audit logging

## Next Tasks
1. Add date range filter for transactions
2. Implement CSV export functionality
3. Add transaction comparison feature
4. Enhance search with advanced filters (amount range, date range)
