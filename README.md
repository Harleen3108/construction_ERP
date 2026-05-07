# Constructor ERP — Government Construction + Internal eTender System

A complete Government-style **Construction ERP integrated with Internal eTender System**, built end-to-end as per the official 12-stage workflow. Covers full project lifecycle: Proposal → Approval → Tender → Bidding → Award → Execution → Measurement → Billing → Payment → Audit.

## Architecture

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router v6 |
| Backend  | Node.js + Express + TypeScript |
| Database | MongoDB Atlas (Mongoose ODM) |
| File Storage | Cloudinary |
| Auth | JWT + bcrypt with 9 role-based access controls |

## 12-Stage Workflow Implemented

| Stage | Module | Backend Route | Frontend Page |
|---|---|---|---|
| 1 | Project Proposal | `/api/projects` (POST) | `/proposals/new` |
| 2 | Sanction & Approvals (JE→SDO→EE→CE) | `/api/approvals` | `/approvals` |
| 3 | Tender Creation & Approval | `/api/tenders` | `/tenders/new` |
| 4 | Tender Published | `/api/tenders` | `/tenders/published` |
| 5 | Bid Submission (Tech + Financial) | `/api/bids/technical`, `/api/bids/:id/financial` | `/bids/submit/:tenderId` |
| 6 | Bid Evaluation (auto L1) | `/api/bids/financial-evaluation/:tenderId` | `/bids/evaluate` |
| 7 | Tender Award + LOA + Work Order | `/api/work-orders/award/:tenderId` | `/work-orders` |
| 8 | Project Execution + Milestones | `/api/projects/:id/progress`, `/api/milestones` | `/projects/:id` |
| 9 | Measurement Book | `/api/mb` | `/mb/new` |
| 10 | Billing (auto GST/TDS/Security) | `/api/bills` | `/bills/new` |
| 11 | Payment Release (RTGS + UTR) | `/api/payments/release` | `/payments` |
| 12 | Audit & Compliance | `/api/audit` | `/audit` |

## Roles Supported

`JE` · `SDO` · `EE` · `CE` · `TENDER_OFFICER` · `CONTRACTOR` · `ACCOUNTANT` · `TREASURY` · `ADMIN`

Each role has its own dashboard with relevant KPIs (matching the dashboard cards in the workflow image).

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — fill in MONGO_URI, JWT_SECRET, CLOUDINARY_*
npm run seed       # seeds 9 demo users (one per role)
npm run dev        # runs on http://localhost:5000
```

Seeded credentials (after `npm run seed`):

| Role | Email | Password |
|---|---|---|
| Admin | admin@erp.gov.in | admin@123 |
| JE | je@erp.gov.in | pass@123 |
| SDO | sdo@erp.gov.in | pass@123 |
| EE | ee@erp.gov.in | pass@123 |
| CE | ce@erp.gov.in | pass@123 |
| Tender Officer | tender@erp.gov.in | pass@123 |
| Contractor | contractor@abc.com | pass@123 |
| Accountant | accounts@erp.gov.in | pass@123 |
| Treasury | treasury@erp.gov.in | pass@123 |

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev        # runs on http://localhost:5173
```

### 3. Required Cloud Services

- **MongoDB Atlas** — free tier works. Get connection string from Atlas → paste into `MONGO_URI`.
- **Cloudinary** — free tier. Get cloud_name + api_key + api_secret → paste into `.env`.

## End-to-End Demo Flow (Karnal School Example)

1. **JE** logs in → creates proposal "Govt School Building Karnal" ₹5 Cr → submits.
2. **SDO** → **EE** → **CE** approve in sequence (each from `/approvals`).
3. **Tender Officer** creates tender from sanctioned project, adds BOQ, EMD, deadlines.
4. **EE** + **CE** approve tender → auto-publishes.
5. **Contractor** (ABC Infra) sees published tender, submits technical bid then financial bid (₹4.85 Cr).
6. **Tender Officer** evaluates: marks technically qualified → identifies L1 automatically.
7. **Tender Officer / EE** awards tender → LOA + Work Order generated.
8. **Contractor** accepts WO → project becomes IN_PROGRESS.
9. **JE** records MB entries (Excavation: L×W×H × Rate) → SDO → EE approve.
10. **Contractor** raises RA Bill 1 against approved MBs → auto deductions: GST 18%, TDS 1%, Security 5%.
11. Bill flows JE → SDO → EE → Accounts → Treasury releases payment with UTR.
12. **CE** reviews `/audit` page — every action timestamped and logged.

## Backend API Highlights

- **Auto Bill Calculation** — pre-save hook on `Bill` model recalculates net payable.
- **Approval Workflow Engine** — generic `Approval` model handles project, tender, MB, bill stages. `myPendingApprovals` only surfaces items where prior approvals in the chain are done.
- **Auto L1 Detection** — `financialEvaluation` controller sorts qualified bids by quoted amount.
- **Audit Logger** — global middleware logs every mutating call from authenticated users.
- **Role-based Filtering** — all list endpoints filter by user role (e.g., contractors only see their own bids/projects).

## Project Structure

```
constructor_ERP/
├── backend/
│   ├── src/
│   │   ├── config/          # db, cloudinary
│   │   ├── controllers/     # 14 controllers covering all 12 stages
│   │   ├── middleware/      # auth, errorHandler, auditLogger
│   │   ├── models/          # 12 Mongoose models
│   │   ├── routes/          # 14 route files
│   │   ├── utils/           # asyncHandler, generators, seed
│   │   └── server.ts
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/             # axios client w/ JWT
    │   ├── components/
    │   │   ├── layout/      # GovHeader, Sidebar, Topbar, AppLayout
    │   │   └── shared/      # PageHeader, StatusPill, ApprovalTimeline, ProtectedRoute
    │   ├── pages/
    │   │   ├── auth/        # Login, Register
    │   │   ├── dashboards/  # 8 role dashboards
    │   │   ├── proposal/    # Stage 1
    │   │   ├── approval/    # Stage 2
    │   │   ├── tender/      # Stages 3-4
    │   │   ├── bid/         # Stages 5-6
    │   │   ├── workOrder/   # Stage 7
    │   │   ├── execution/   # Stage 8
    │   │   ├── mb/          # Stage 9
    │   │   ├── billing/     # Stage 10
    │   │   ├── payment/     # Stage 11
    │   │   ├── audit/       # Stage 12
    │   │   └── admin/       # Users
    │   ├── store/           # Zustand auth store
    │   ├── types/
    │   ├── utils/           # formatINR (Indian style), formatDate, statusColor
    │   └── App.tsx
    └── package.json
```

## UI Design System

- **Tricolor strip** at top of every page (saffron / white / green)
- **Government navy** (`#0B3D91`) primary, **Saffron** accent, **National Green** for success
- **Indian currency formatting** — ₹50,00,000 (lakh) and ₹5 Cr (crore) compact mode
- **Approval Timeline** component — vertical stepper showing JE → SDO → EE → CE flow

## Future Roadmap (Phase 2)

- File upload integration on every form (using existing `/api/upload` Cloudinary route)
- Real-time notifications (Socket.io)
- AI-powered modules:
  - Auto bid evaluation scoring
  - MB anomaly detection
  - Document OCR for contractor docs
  - RAG-based audit Q&A chatbot
- PWA offline support for field engineers
- DSC-based digital signatures on LOA / Work Order
- Mobile app (React Native, sharing types)

---

© 2026 · Built for Government PWD-style construction departments · MIT License
