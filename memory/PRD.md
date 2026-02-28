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
- [x] Sample data seeding (transactions + accounts)
- [x] Authentication (demo mode)
- [x] Account CRUD endpoints (Feb 28, 2026)
- [x] Accounts balance endpoint (Feb 28, 2026)
- [x] Server terminal logs endpoint (Feb 28, 2026)

### Frontend Pages
- [x] Login page with HSBC branding
- [x] Dashboard with stats cards, charts, recent transactions
- [x] Transactions list with search/filter/sort
- [x] Transaction Detail/Receipt page (SWIFT format)
- [x] New Transaction page
- [x] **Admin Panel** with accounts, balances, terminal (Feb 28, 2026)

### Key Features
- [x] UETR tracking display
- [x] Settlement information
- [x] Print functionality (Emergent badge hidden)
- [x] QR codes and barcodes
- [x] Available Balance EUR / USD / Total (Feb 28, 2026)
- [x] Account management with 5 pre-seeded accounts (Feb 28, 2026)
- [x] SWIFT Server Terminal Console (Feb 28, 2026)

### Transaction Receipt Documents
- [x] Settlement Letter, Confirmation Copy, Status Statement
- [x] MT202 COV, PACS.008, Official Debit Note
- [x] MT910 Credit, MT900 Debit, MT945 Statement
- [x] Server Report, Alliance Message

### Pre-seeded Accounts
1. NADELLA GLOBAL LLC (IBAN: DE93300308800293688071)
2. PLINVEST TRUST (IBAN: DE28300308802486412944)
3. ZHANG YINGFAN (IBAN: DE78300308800440334608)
4. QIRAT EP GMBH (IBAN: DE60300308800600078006)
5. BONA Verwaltungs GmbH (IBAN: DE64300308800601052008)

## P0/P1/P2 Features Remaining

### P0 (Critical)
- None

### P1 (Important)
- Real email notifications (currently mocked)
- Transaction export (CSV/PDF)

### P2 (Nice to Have)
- Refactor TransactionDetail.jsx into sub-components
- Refactor server.py into modules
- Advanced analytics and reporting

## Credentials
- Email: any email (demo mode)
- Password: hsbc2025
