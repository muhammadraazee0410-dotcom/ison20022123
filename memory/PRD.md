# ISO 20022 | SWIFT Transfer Platform - PRD

## Original Problem Statement
ISO 20022 | SWIFT Transfer Platform - A banking platform for viewing and managing SWIFT MX pacs.009.001.08 Financial Institution Credit Transfer transactions. Features SWIFT document generation matching official PDF templates, Admin Panel for account management, and comprehensive transaction tracking.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Styling**: ISO 20022 Brand Identity (Red #DB0011, Courier New monospace font for documents)

## User Personas
1. **Bank Operations Staff** - View and monitor SWIFT transactions
2. **Compliance Officers** - Verify CBPR+ compliance status
3. **Transaction Managers** - Track settlement status and Nostro/Vostro movements

## Core Requirements
- SWIFT MX pacs.009.001.08 message format support
- 27 document tabs matching official SWIFT PDF templates
- Real-time dashboard with transaction statistics
- Admin Panel with 10 seeded bank accounts and balance management
- Print-ready receipt documents (Emergent badge hidden on print)
- CBPR+ compliance indicators

## What's Been Implemented

### Backend (server.py)
- [x] Transaction CRUD endpoints
- [x] Dashboard statistics API
- [x] Chart data API
- [x] Sample data seeding (8 transactions + 10 accounts)
- [x] Authentication (demo mode)
- [x] Account CRUD endpoints
- [x] Accounts balance endpoint (EUR ~2.47T, USD ~567B)
- [x] Server terminal logs endpoint

### Frontend Pages
- [x] Login page with ISO 20022 branding
- [x] Dashboard with stats cards, charts, recent transactions
- [x] Transactions list with search/filter/sort
- [x] Transaction Detail with 27 document tabs (REFACTORED - Apr 9, 2026)
- [x] New Transaction page with registered sender dropdown
- [x] Admin Panel with accounts, balances, terminal

### Document Tabs (27 total - REFACTORED Apr 9, 2026)
**4 Main PDF-Matching Tabs** (exact match to uploaded swift mx pacs.009 PDF):
- [x] Settlement Letter - Full confirmation letter with all sections
- [x] SWIFT Confirmation - With IP verification table, multi-level confirmations
- [x] Global Status - SWIFT server status with message identification details
- [x] Alliance Report - Instance search detailed report with XML message text

**23 Brief Document Tabs** (complete transaction details in concise format):
- [x] Payment Tracer, MT202 COV, AFT Validation, MT103 Answer Back
- [x] PACS.008 XML, M1 Fund, Server Report, Funds Tracer
- [x] Fund Location, Beneficiary Credit, Doc Clearance, SMTP Mail
- [x] On Ledger, Officer Comm, MT900 Debit, MT910 Credit
- [x] MT940 Statement, Debit Note, Balance Sheet, Remittance Report
- [x] Credit Notification, Intermediary Bank, Nostro Account Detail

### Key Refactoring (Apr 9, 2026)
- TransactionDetail.jsx refactored from ~2400 lines to ~175 lines
- 27 document tabs extracted into modular components in /components/documents/
- Shared DocHelpers.jsx provides reusable components (DocWrap, IsoLogo, FieldRow, etc.)
- BriefDocuments.jsx provides 23 brief tab components with shared TxnSummary

### Pre-seeded Accounts (10 total)
1. NADELLA GLOBAL LLC (IBAN: DE93300308800293688071)
2. PLINVEST TRUST (IBAN: DE28300308802486412944)
3. ZHANG YINGFAN (IBAN: DE78300308800440334608)
4. QIRAT EP GMBH (IBAN: DE60300308800600078006)
5. BONA Verwaltungs GmbH (IBAN: DE64300308800601052008)
6-10. Additional registered companies

## Code Architecture
```
/app/
├── backend/
│   ├── server.py         # FastAPI app with ALL routes and seeding
│   └── tests/
│       └── test_admin_panel.py
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── documents/          # NEW: Modular document components
│       │   │   ├── index.js        # Barrel export
│       │   │   ├── DocHelpers.jsx  # Shared helpers & formatters
│       │   │   ├── SettlementLetter.jsx
│       │   │   ├── SwiftConfirmation.jsx
│       │   │   ├── GlobalStatus.jsx
│       │   │   ├── AllianceReport.jsx
│       │   │   └── BriefDocuments.jsx  # 23 brief tabs
│       │   └── Layout.jsx
│       └── pages/
│           ├── TransactionDetail.jsx  # Clean orchestrator (~175 lines)
│           ├── AdminPanel.jsx
│           ├── Dashboard.jsx
│           ├── NewTransaction.jsx
│           ├── Transactions.jsx
│           └── Login.jsx
└── memory/
    └── PRD.md
```

## P0/P1/P2 Features Remaining

### P0 (Critical)
- None

### P1 (Important)
- Real email notifications (currently MOCKED - returns static success)
- Transaction export (CSV/PDF)

### P2 (Nice to Have)
- Refactor server.py into separate route/model modules
- Advanced analytics and reporting
- Real-time WebSocket updates

## Credentials
- Email: any email (demo mode)
- Password: hsbc2025
