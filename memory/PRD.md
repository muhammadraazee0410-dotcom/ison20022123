# ISO 20022 | SWIFT Transfer Platform - PRD

## Original Problem Statement
ISO 20022 | SWIFT Transfer Platform - A banking platform for viewing and managing SWIFT MX pacs.009.001.08 Financial Institution Credit Transfer transactions. Features SWIFT document generation matching official PDF templates, Admin Panel for account management, advanced banking analytics, and comprehensive transaction tracking.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Recharts + html2pdf.js + qrcode.react
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Styling**: ISO 20022 Brand Identity (Red #DB0011, Courier New monospace for documents)

## Core Requirements
- SWIFT MX pacs.009.001.08 message format support
- 27 document tabs matching official SWIFT PDF templates with barcode + QR on every tab
- Real-time dashboard with transaction statistics
- Advanced Banking Reports with charts, analytics, barcodes, QR codes
- Admin Panel with 10 seeded bank accounts and balance management
- Print-ready receipt documents (Emergent badge hidden on print)
- PDF export functionality for all documents and reports
- CBPR+ compliance indicators

## What's Been Implemented

### Completed Features
- [x] Authentication (demo mode - any email + hsbc2025)
- [x] Dashboard with stats, charts, recent transactions
- [x] Transactions list with search/filter/sort
- [x] Transaction Detail with 27 document tabs (modular components)
- [x] 4 main PDF-matching tabs (Settlement Letter, SWIFT Confirmation, Global Status, Alliance Report)
- [x] 23 brief document tabs with complete transaction details
- [x] New Transaction page with registered sender dropdown
- [x] Admin Panel with 10 accounts, balances, terminal
- [x] ISO 20022 branding with custom iso-logo.png (bigger size w-16)
- [x] Barcode + QR code on ALL 27 document tabs (DocHeaderStrip)
- [x] PDF export via html2pdf.js on TransactionDetail and BankingReports
- [x] Advanced Banking Reports page (/reports) with:
  - Transaction volume analytics (monthly area chart)
  - Settlement status pie chart
  - Daily settlement flow (30-day bar chart)
  - Currency distribution pie chart
  - Nostro/Vostro position summary table with QR codes
  - Compliance & AML screening stats
  - Top counterparties by volume
  - Settlement method distribution
  - Report header/footer with barcodes + QR codes
- [x] Print functionality (Emergent badge hidden)
- [x] pytest backend test suite (15 tests passing)

## Code Architecture
```
/app/
├── backend/
│   ├── server.py
│   └── tests/
│       ├── test_admin_panel.py
│       └── test_api.py
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── documents/
│       │   │   ├── index.js
│       │   │   ├── DocHelpers.jsx (IsoLogo w-16, Barcode, QR, DocHeaderStrip)
│       │   │   ├── SettlementLetter.jsx
│       │   │   ├── SwiftConfirmation.jsx
│       │   │   ├── GlobalStatus.jsx
│       │   │   ├── AllianceReport.jsx
│       │   │   └── BriefDocuments.jsx (23 brief tabs)
│       │   └── Layout.jsx
│       └── pages/
│           ├── TransactionDetail.jsx (~260 lines, orchestrator)
│           ├── BankingReports.jsx (new - analytics page)
│           ├── AdminPanel.jsx
│           ├── Dashboard.jsx
│           ├── NewTransaction.jsx
│           ├── Transactions.jsx
│           └── Login.jsx
```

## API Endpoints
- GET /api/analytics/reports - Advanced banking analytics
- GET /api/dashboard/stats - Dashboard summary
- GET /api/dashboard/total-funds - EUR/USD fund totals
- GET /api/dashboard/chart-data - Chart data
- GET /api/transactions - List transactions
- GET /api/transactions/:id - Single transaction
- POST /api/transactions - Create transaction
- PATCH /api/transactions/:id/complete - Complete transaction
- GET /api/accounts - List accounts
- GET /api/accounts-balance - Aggregated balances
- GET /api/server-terminal - Server logs
- POST /api/transactions/:id/send-notification - MOCKED email

## P1/P2 Features Remaining
- P1: Real email notifications (currently MOCKED)
- P1: Transaction export (CSV)
- P2: Refactor server.py into separate route/model modules
- P2: Real-time WebSocket updates

## Credentials
- Email: any email (demo mode)
- Password: hsbc2025
