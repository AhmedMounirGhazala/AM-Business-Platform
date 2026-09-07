# API CATALOG — AM BUSINESS PLATFORM (TREASURY, FIXED ASSETS, REPORTING, GL, AR, AP, PROCUREMENT & INVENTORY DOMAINS v2.7)

## Base URL
`/api/v1`

---

## REST Endpoints Summary

### 0. Banking, Cash Management & Treasury Domain (Phase 2.9 Certified)
- `GET /api/v1/treasury/bank-accounts` — Fetch Bank Account Masters with balance & lock status.
- `POST /api/v1/treasury/bank-accounts` — Create Bank Account with IBAN and signatory limits.
- `GET /api/v1/treasury/cash-accounts` — Fetch Cash Register Accounts with custodian profiles.
- `POST /api/v1/treasury/cash-accounts` — Create Cash Account / Petty Cash register.
- `GET /api/v1/treasury/transactions` — Fetch Treasury Transactions with status, type, and date filters.
- `POST /api/v1/treasury/transactions` — Create Treasury Transaction with gapless numbering (`TR-{YEAR}-{TYPE}-{SEQ:5}`) and idempotency key protection.
- `POST /api/v1/treasury/transactions/:id/approve` — Approve Treasury Transaction with SoD role validation.
- `POST /api/v1/treasury/transactions/:id/post` — Post approved transaction & emit financial domain event for decoupled GL posting.
- `POST /api/v1/treasury/transactions/:id/cancel` — Cancel pending Treasury Transaction with audit reason.
- `GET /api/v1/treasury/cheques` — Fetch Cheque & PDC Vault register.
- `POST /api/v1/treasury/cheques` — Issue or register incoming/outgoing Cheque / PDC.
- `POST /api/v1/treasury/cheques/:id/transition` — Transition Cheque lifecycle state (`RECEIVED` -> `HELD_IN_VAULT` -> `DEPOSITED` -> `CLEARED`).
- `POST /api/v1/treasury/cheques/:id/bounce` — Process PDC bounce / dishonour with penalty fees & debtor balance restoration.
- `GET /api/v1/treasury/statements` — Fetch imported Bank Statements.
- `POST /api/v1/treasury/statements/import` — Import MT940, CAMT.053, or CSV Bank Statement with duplicate content hash check.
- `POST /api/v1/treasury/reconciliation/auto-match` — Run multi-pass automated bank statement line matching engine.
- `GET /api/v1/treasury/reconciliation/sessions` — Fetch Bank Reconciliation sessions.
- `POST /api/v1/treasury/reconciliation/sessions` — Complete Bank Reconciliation session with mathematical balancing check.
- `GET /api/v1/treasury/forecast/liquidity` — Generate IAS 7 Multi-Horizon Liquidity Analysis Report.
- `GET /api/v1/treasury/payment-calendar` — Fetch unified AP/AR/PDC Payment Calendar.
- `POST /api/v1/treasury/intercompany-transfer` — Execute bilateral intercompany cash pool transfer with Due-To / Due-From accounting.
- `POST /api/v1/treasury/revaluation/fx` — Execute foreign currency bank account revaluation (IAS 21).
- `POST /api/v1/treasury/bank-charges` — Process Bank Charge / Fee with GL expense debit.
- `GET /api/v1/treasury/snapshots` — Fetch immutable sealed liquidity snapshots.
- `POST /api/v1/treasury/snapshots` — Create immutable point-in-time liquidity snapshot with SHA-256 digital seal.
- `GET /api/v1/treasury/audit-trail` — Fetch cryptographically chained SHA-256 Treasury Audit Vault records.
- `GET /api/v1/treasury/quality-gate` — Run 15-Point Automated Enterprise Quality Gate Suite (`Phase29HardeningSuite`).

### 1. Fixed Assets & Asset Lifecycle Management Domain (Phase 2.8 Certified)
- `GET /api/v1/assets` — Fetch Fixed Asset Master register (supports filters for `classId`, `locationId`, `costCenterId`, `status`, `search`).
- `POST /api/v1/assets` — Create Asset Master with gapless sequential numbering (`FA-{YEAR}-{CLASS}-{SEQ:4}`) and IAS 16 validation.
- `GET /api/v1/assets/classes` — Fetch Asset Classes configuration.
- `POST /api/v1/assets/acquisitions` — Capitalize Asset (CWIP or direct purchase) with acquisition idempotency key check.
- `POST /api/v1/assets/depreciation/schedule` — Calculate simulated depreciation schedule across supported methods (SL, DB, DDB, SYD, UOP, Tables).
- `POST /api/v1/assets/depreciation/run` — Execute monthly depreciation run across all eligible assets with period protection and SHA-256 vault sealing.
- `POST /api/v1/assets/depreciation/rollback` — Rollback depreciation run for specific fiscal period.
- `POST /api/v1/assets/transfers` — Execute multi-dimensional asset transfer (location, dept, CC, custodian) with cryptographic lineage.
- `POST /api/v1/assets/disposals` — Execute asset disposal (sale, scrap, trade-in) with realized gain/loss GL postings and open maintenance collision blocking.
- `POST /api/v1/assets/revaluations` — Execute IAS 16 asset revaluation with fair value appraisal adjustment and Revaluation Surplus equity reservation.
- `POST /api/v1/assets/impairments` — Execute IAS 36 asset impairment loss posting or reversal with strict IAS 36.117 ceiling checks.
- `POST /api/v1/assets/maintenances` — Log maintenance work order (preventive/corrective) with concurrent work order collision protection.
- `GET /api/v1/assets/maintenances` — Fetch maintenance history records.
- `POST /api/v1/assets/verification/sessions` — Initiate physical count verification session for warehouse/location.
- `POST /api/v1/assets/verification/scan` — Process physical barcode/serial scan with duplicate scan detection and location reconciliation.
- `POST /api/v1/assets/:id/lock` — Administratively lock asset against modifications.
- `POST /api/v1/assets/:id/unlock` — Administratively unlock asset with compliance reason.
- `GET /api/v1/assets/snapshots` — Fetch immutable asset snapshots.
- `POST /api/v1/assets/snapshots/create` — Create immutable snapshot of asset register or subledger with SHA-256 seal.
- `POST /api/v1/assets/snapshots/verify` — Cryptographically verify snapshot SHA-256 hash integrity.
- `POST /api/v1/assets/quality-gate/run` — Run 15-Point Automated Enterprise Hardening Quality Gate Suite (`Phase28HardeningSuite`).
- `GET /api/v1/assets/quality-gate/latest` — Fetch latest Phase 2.8 Quality Gate verification telemetry report.
- `GET /api/v1/assets/reports/register` — Generate IFRS Asset Register report.
- `GET /api/v1/assets/reports/roll-forward` — Generate IFRS Asset Roll-Forward schedule disclosure report.
- `GET /api/v1/assets/audit-trail` — Fetch SHA-256 sealed Fixed Asset audit logs.

### 1. Financial Reporting, Management Reporting & Business Intelligence Domain (Phase 2.7 Certified)
- `GET /api/v1/reports/financial/balance-sheet` — Generate IAS 1 compliant Balance Sheet report (Current/Non-Current Assets, Liabilities, Equity, Balance verification).
- `GET /api/v1/reports/financial/income-statement` — Generate IAS 1 compliant Income Statement / P&L (Gross Revenue, Discounts, Net Revenue, COGS, Gross Profit, OpEx, Operating Income EBIT, Taxes, Net Income, Margins %, EBITDA).
- `GET /api/v1/reports/financial/cash-flow` — Generate IAS 7 compliant Statement of Cash Flows (Indirect Method: Operating, Investing, Financing activities, Net Cash Flow, Cash Reconciliation).
- `GET /api/v1/reports/financial/changes-in-equity` — Generate IAS 1 compliant Statement of Changes in Equity (Share Capital, Retained Earnings, Revaluation Reserves).
- `GET /api/v1/reports/trial-balance` — Generate Trial Balance Suite (Standard, Comparative, Multi-Period, Monthly, Branch, Department views).
- `GET /api/v1/reports/ratios` — Calculate 16 Core Financial Ratios (Liquidity, Solvency, Profitability, Activity/Efficiency, DSO, DPO, Cash Conversion Cycle).
- `GET /api/v1/reports/executive-dashboard` — Generate Real-Time Executive Dashboard KPIs (Revenue YTD, Gross Profit, Net Profit, Cash Position, Total AR, Total AP, Inventory Value, Working Capital, 12-Month Trends, Top Customers/Vendors/Products/Categories).
- `GET /api/v1/reports/budget-vs-actual` — Generate Budget vs Actual Variance Analysis Report (Versions, line-by-line variances, Favorable/Unfavorable indicators).
- `GET /api/v1/reports/cost-centers` — Generate Cost Center Performance & Overhead Allocation Reports.
- `GET /api/v1/reports/profit-centers` — Generate Profit Center Contribution & Margin Reports.
- `GET /api/v1/reports/consolidated` — Generate Consolidated Financial Statements & Intercompany Elimination Readiness Report (IAS 21 FX Translation).
- `GET /api/v1/reports/bi-dataset` — Generate Business Intelligence Datasets (Pivot Table analysis, Drill-Downs, Heatmaps, Waterfall charts).
- `POST /api/v1/reports/dynamic/build` — Execute Custom Dynamic Report Definitions (custom grouping, filtering, sorting, date ranges).
- `POST /api/v1/reports/export` — Export financial reports in EXCEL, PDF, CSV, JSON, XML, or PRINT_LAYOUT formats with embedded SHA-256 report hash.
- `POST /api/v1/reports/snapshots` — Create immutable, tamper-evident report snapshot record.
- `GET /api/v1/reports/snapshots` — Fetch registered report snapshots.
- `GET /api/v1/reports/snapshots/:id/verify` — Cryptographically verify snapshot SHA-256 hash integrity.
- `GET /api/v1/reports/kpi-lineage/:kpiId` — Retrieve 5-level KPI traceability & drill-through lineage (KPI -> Financial Statement -> GL Account -> Journal -> Source Document).
- `GET /api/v1/reports/comparative/mom` — Generate Month-Over-Month comparative report with absolute & percentage variance.
- `GET /api/v1/reports/comparative/yoy` — Generate Year-Over-Year comparative report with absolute & percentage variance.
- `GET /api/v1/reports/quality-gate` — Execute 11-point Enterprise Quality Gate Test Suite (`Phase27HardeningSuite`).

### 2. General Ledger & Financial Closing Domain (Phase 2.6 Certified)
- `GET /api/v1/gl/accounts` — Fetch Chart of Accounts.
- `POST /api/v1/gl/accounts` — Create Chart of Accounts record.
- `PUT /api/v1/gl/accounts/:id` — Update GL Account.
- `GET /api/v1/gl/journals` — Fetch General Ledger Journals (with status, journalType, period, year filters).
- `POST /api/v1/gl/journals` — Create GL Journal Entry with idempotency key (`x-idempotency-key`) and sequential gapless numbering (`JE-{COMPANY}-{YEAR}-{PERIOD}-{SEQ}`).
- `POST /api/v1/gl/journals/:id/post` — Post GL Journal Entry (idempotent, updates account balances, generates SHA-256 audit entry).
- `POST /api/v1/gl/journals/:id/reverse` — Reverse GL Journal Entry (creates reversing double-entry journal).
- `PUT /api/v1/gl/journals/:id` — Update Draft GL Journal (rejects POSTED or REVERSED journals with HTTP 403 Forbidden under IFRS / IAS 1).
- `DELETE /api/v1/gl/journals/:id` — Delete Draft GL Journal (rejects POSTED or REVERSED journals with HTTP 403 Forbidden).
- `GET /api/v1/gl/posting-rules` — Fetch Posting Rules catalog.
- `POST /api/v1/gl/posting-rules` — Create Posting Rule.
- `GET /api/v1/gl/fiscal-years` — Fetch Fiscal Years.
- `POST /api/v1/gl/fiscal-years` — Create Fiscal Year.
- `GET /api/v1/gl/fiscal-periods` — Fetch Fiscal Periods.
- `PUT /api/v1/gl/fiscal-periods/:id/status` — Update Fiscal Period status (`OPEN`, `CLOSING`, `CLOSED`, `REOPENED`).
- `POST /api/v1/gl/fiscal-periods/:id/reopen` — Reopen closed Fiscal Period with mandatory justification reason and reopen counter increment.
- `GET /api/v1/gl/recurring-schedules` — Fetch Recurring Journal Schedules.
- `POST /api/v1/gl/recurring-schedules` — Create Recurring Journal Schedule.
- `POST /api/v1/gl/recurring-schedules/execute` — Execute due Recurring Journal Schedules.
- `GET /api/v1/gl/trial-balance` — Generate Trial Balance report.
- `GET /api/v1/gl/trial-balance/verify` — Run Trial Balance Integrity Engine (`OpeningNet + PeriodNet = ClosingNet` and `Debit = Credit`).
- `GET /api/v1/gl/suspense-accounts` — Scan Chart of Accounts for unresolved suspense/clearing balances.
- `GET /api/v1/gl/closing/checklist/:periodId` — Evaluate Multi-Subledger Pre-Close Checklist (GL, Inventory, Procurement, AP, AR, Events).
- `POST /api/v1/gl/closing/period-close` — Execute Financial Period Closing & generate immutable Closing Data Bundle Snapshot.
- `GET /api/v1/gl/closing/snapshots` — Fetch immutable Period Closing Snapshots.
- `POST /api/v1/gl/closing/year-end-close` — Execute Year-End Retained Earnings Closing (IAS 1).
- `POST /api/v1/gl/ias21-revaluation` — Execute IAS 21 Foreign Currency Revaluation & generate FX Snapshot with SHA-256 hash.
- `GET /api/v1/gl/ias21-revaluation/snapshots` — Fetch IAS 21 Foreign Currency Valuation Snapshots.
- `GET /api/v1/gl/audit-logs` — Fetch immutable SHA-256 hashed General Ledger Audit Trail.
- `GET /api/v1/gl/hardening/quality-gate` — Run automated 11-point Enterprise Quality Gate Test Suite (`Phase26HardeningSuite`).

### 2. Accounts Receivable & Order-to-Cash Domain
- `GET /api/v1/ar/customers` — Fetch Customer Master records (credit limits, tax numbers, risk ratings).
- `POST /api/v1/ar/customers` — Create Customer Master record.
- `PUT /api/v1/ar/customers/:id` — Update Customer Master record.
- `GET /api/v1/ar/invoices` — Fetch Customer Sales Invoices.
- `POST /api/v1/ar/invoices` — Create & Post Sales Invoice with duplicate invoice protection & emit `CUSTOMER_INVOICE_POSTED` financial event.
- `POST /api/v1/ar/invoices/:id/transition` — Transition Sales Invoice status (`POSTED`, `PARTIALLY_PAID`, `PAID`, `CANCELLED`, `DISPUTED`).
- `GET /api/v1/ar/credit-notes` — Fetch Customer Credit Notes & Debit Memos.
- `POST /api/v1/ar/credit-notes` — Post Customer Credit Note & emit `CUSTOMER_CREDIT_NOTE_POSTED` financial event.
- `GET /api/v1/ar/receipts` — Fetch Customer Receipts.
- `POST /api/v1/ar/receipts` — Post Customer Receipt with optional auto-allocation & emit `CUSTOMER_RECEIPT_POSTED` financial event.
- `POST /api/v1/ar/receipts/:id/reverse` — Reverse Customer Receipt, restore invoice balances, and emit `CUSTOMER_PAYMENT_REVERSED` event.
- `GET /api/v1/ar/allocations` — Fetch Receipt Allocation records.
- `POST /api/v1/ar/allocations` — Execute Receipt Allocation (FIFO, MANUAL) with concurrent allocation lock protection.
- `GET /api/v1/ar/credit-control/:customerId` — Run Customer Credit Control check (credit limit, overdue days, block status, override workflows).
- `GET /api/v1/ar/aging` — Generate Customer Aging & Days Sales Outstanding (DSO) Report.
- `GET /api/v1/ar/aging/snapshots` — Fetch Customer Aging Snapshots.
- `POST /api/v1/ar/aging/snapshot` — Generate immutable Customer Aging Snapshot with DSO metrics and SHA-256 hash.
- `GET /api/v1/ar/statements/:customerId` — Generate Customer Statement of Account with cryptographic `statementHash`.
- `GET /api/v1/ar/collections/notes/:customerId` — Fetch Collection Activity Notes by customer.
- `POST /api/v1/ar/collections/notes` — Create Collection Activity Note with lifecycle state (`REMINDER`, `CALL`, `PROMISE_TO_PAY`, etc.).
- `GET /api/v1/ar/collections/promises/:customerId` — Fetch Promise-to-Pay records.
- `POST /api/v1/ar/collections/promises` — Record Promise to Pay for open invoice.
- `PUT /api/v1/ar/collections/promises/:id/status` — Update Promise to Pay status (`KEPT`, `BROKEN`, `CANCELLED`).
- `POST /api/v1/ar/settlement-fx` — Calculate multi-currency realized FX gain/loss on settlement.
- `GET /api/v1/ar/rev-rec/schedules` — Fetch Revenue Recognition Schedules (IFRS 15).
- `POST /api/v1/ar/rev-rec/schedule` — Create Revenue Recognition Schedule with performance obligations.
- `GET /api/v1/ar/audit-logs` — Fetch cryptographic Accounts Receivable Audit Trail.

### 2. Accounts Payable & Financial Matching Domain
- `GET /api/v1/ap/supplier-invoices` — Fetch Supplier Invoices with optional status, vendor, and PO filters.
- `POST /api/v1/ap/supplier-invoices` — Create Supplier Invoice & execute automated 3-Way Matching with duplicate protection.
- `POST /api/v1/ap/supplier-invoices/:id/transition` — Transition Supplier Invoice state with correlation ID & reason audit.
- `POST /api/v1/ap/supplier-invoices/:id/release-variance` — Release Price/Quantity Variance Block with manager justification.
- `POST /api/v1/ap/supplier-invoices/:id/post` — Post Supplier Invoice (generates AP Voucher & emits `SUPPLIER_INVOICE_POSTED` financial event).
- `GET /api/v1/ap/grir-clearing` — Run GR/IR Clearing Engine for GRN vs Invoice reconciliation.
- `GET /api/v1/ap/vouchers` — Fetch AP Vouchers with vendor and open balance filters.
- `GET /api/v1/ap/credit-notes` — Fetch Supplier Credit Notes / Debit Memos.
- `POST /api/v1/ap/credit-notes` — Post Supplier Credit Note & emit `SUPPLIER_CREDIT_NOTE_POSTED` financial event.
- `GET /api/v1/ap/payment-proposals` — Fetch Payment Proposals.
- `POST /api/v1/ap/payment-proposals` — Generate Payment Proposal by cutoff due date capturing early payment discounts.
- `GET /api/v1/ap/payment-batches` — Fetch Payment Execution Batches.
- `POST /api/v1/ap/payment-batches` — Execute Payment Batch & emit `SUPPLIER_PAYMENT_POSTED` financial event.
- `POST /api/v1/ap/payment-batches/:id/reverse` — Reverse Payment Batch, restore voucher balances, and emit `SUPPLIER_PAYMENT_REVERSED` event.
- `GET /api/v1/ap/payment-reversals` — Fetch Payment Reversal Records.
- `GET /api/v1/ap/allocations` — Fetch Payment Allocation Records.
- `POST /api/v1/ap/allocations` — Execute Payment Allocation (AUTOMATIC, MANUAL, FIFO, PARTIAL).
- `GET /api/v1/ap/credit-control/:vendorId` — Run Vendor Credit Control check (credit limit, overdue limit, block status).
- `POST /api/v1/ap/exchange-rate-diff` — Calculate foreign currency realized exchange rate gain/loss.
- `POST /api/v1/ap/early-discount-check` — Calculate early payment discount eligibility & savings.
- `GET /api/v1/ap/vendor-statements/:vendorId` — Generate Vendor Statement of Account.
- `GET /api/v1/ap/vendor-aging` — Generate Vendor Aging Report (0-30, 31-60, 61-90, 90+ days).
- `GET /api/v1/ap/vendor-aging/snapshots` — Fetch Vendor Aging Snapshots.
- `POST /api/v1/ap/vendor-aging/snapshot` — Generate immutable Vendor Aging Snapshot with SHA-256 hash.
- `GET /api/v1/ap/purchase-accruals` — Calculate Purchase Accruals for uninvoiced goods receipts.
- `GET /api/v1/ap/audit-logs` — Fetch cryptographic AP Audit Trail.

### 2. Procurement & Purchasing Domain
- `GET /api/v1/procurement/vendors` — Fetch Vendor Master records (includes performance KPIs).
- `POST /api/v1/procurement/vendors` — Create/Update Vendor Master.
- `GET /api/v1/procurement/vendor-price-history` — Fetch immutable historical prices per Item + Vendor.
- `GET /api/v1/procurement/vendor-performance` — Fetch Supplier Performance KPIs (On-time %, Lead time, Quality %, Rejection %).
- `GET /api/v1/procurement/requisitions` — Fetch Purchase Requisitions.
- `POST /api/v1/procurement/requisitions` — Create Purchase Requisition.
- `POST /api/v1/procurement/requisitions/:id/submit` — Submit Requisition for multi-threshold approval.
- `GET /api/v1/procurement/rfqs` — Fetch Requests for Quotation (RFQs).
- `POST /api/v1/procurement/rfqs` — Generate RFQ from approved Requisition.
- `GET /api/v1/procurement/quotations` — Fetch Vendor Quotations (supports filtering by `rfqId`).
- `POST /api/v1/procurement/quotations` — Submit Vendor Quotation.
- `GET /api/v1/procurement/quotations/comparison-matrix` — Generate Bid Comparison Matrix across vendors.
- `GET /api/v1/procurement/purchase-orders` — Fetch Purchase Orders.
- `POST /api/v1/procurement/purchase-orders` — Create Purchase Order with budget check & approval routing.
- `POST /api/v1/procurement/purchase-orders/:id/approve` — Approve Purchase Order based on RBAC authority.
- `POST /api/v1/procurement/purchase-orders/:id/amend` — Amend Purchase Order (preserves complete snapshot & versioning).
- `POST /api/v1/procurement/purchase-orders/:id/partial-delivery` — Post Partial/Full Goods Receipt (emits 3-way match financial event & records price history).
- `GET /api/v1/procurement/vendor-returns` — Fetch Vendor Return Notes.
- `POST /api/v1/procurement/vendor-returns` — Issue Vendor Return Note (Debit Memo) with reason code & stock adjustment.
- `GET /api/v1/procurement/audit-logs` — Fetch immutable SHA-256 hashed Procurement Audit Trail.

### 3. Inventory Domain
- `GET /api/v1/procurement/vendors` — Fetch Vendor Master records (includes performance KPIs).
- `POST /api/v1/procurement/vendors` — Create/Update Vendor Master.
- `GET /api/v1/procurement/vendor-price-history` — Fetch immutable historical prices per Item + Vendor.
- `GET /api/v1/procurement/vendor-performance` — Fetch Supplier Performance KPIs (On-time %, Lead time, Quality %, Rejection %).
- `GET /api/v1/procurement/requisitions` — Fetch Purchase Requisitions.
- `POST /api/v1/procurement/requisitions` — Create Purchase Requisition.
- `POST /api/v1/procurement/requisitions/:id/submit` — Submit Requisition for multi-threshold approval.
- `GET /api/v1/procurement/rfqs` — Fetch Requests for Quotation (RFQs).
- `POST /api/v1/procurement/rfqs` — Generate RFQ from approved Requisition.
- `GET /api/v1/procurement/quotations` — Fetch Vendor Quotations (supports filtering by `rfqId`).
- `POST /api/v1/procurement/quotations` — Submit Vendor Quotation.
- `GET /api/v1/procurement/quotations/comparison-matrix` — Generate Bid Comparison Matrix across vendors.
- `GET /api/v1/procurement/purchase-orders` — Fetch Purchase Orders.
- `POST /api/v1/procurement/purchase-orders` — Create Purchase Order with budget check & approval routing.
- `POST /api/v1/procurement/purchase-orders/:id/approve` — Approve Purchase Order based on RBAC authority.
- `POST /api/v1/procurement/purchase-orders/:id/amend` — Amend Purchase Order (preserves complete snapshot & versioning).
- `POST /api/v1/procurement/purchase-orders/:id/partial-delivery` — Post Partial/Full Goods Receipt (emits 3-way match financial event & records price history).
- `GET /api/v1/procurement/vendor-returns` — Fetch Vendor Return Notes.
- `POST /api/v1/procurement/vendor-returns` — Issue Vendor Return Note (Debit Memo) with reason code & stock adjustment.
- `GET /api/v1/procurement/audit-logs` — Fetch immutable SHA-256 hashed Procurement Audit Trail.

### 2. Inventory Domain
- `GET /api/v1/inventory/items` — Fetch all inventory item masters.
- `GET /api/v1/inventory/items/:sku` — Fetch item by SKU.
- `POST /api/v1/inventory/movements` — Execute stock movement (Receipt, Issue, Transfer, Adjustment).
- `GET /api/v1/inventory/quants` — Fetch active stock quants.
- `GET /api/v1/inventory/periods` — Fetch inventory periods.
- `POST /api/v1/inventory/periods/:id/close` — Close inventory period & generate immutable snapshot.
- `POST /api/v1/inventory/periods/:id/reopen` — Reopen closed inventory period with audit justification.
- `GET /api/v1/inventory/snapshots` — Fetch immutable period snapshots.
- `GET /api/v1/inventory/fiscal-locks` — Fetch active fiscal locks.
- `POST /api/v1/inventory/fiscal-locks` — Create or update fiscal lock (`Company`, `Branch`, `Warehouse`).
- `GET /api/v1/inventory/count-sessions` — Fetch count sessions.
- `POST /api/v1/inventory/count-sessions` — Initiate new physical count session.
- `POST /api/v1/inventory/count-sessions/:id/sheets` — Submit count sheet results (supports blind counting).
- `GET /api/v1/inventory/reconciliation-proposals` — Fetch variance reconciliation proposals.
- `POST /api/v1/inventory/reconciliation-proposals/:id/approve` — Approve variance & emit financial adjustment event.
- `GET /api/v1/inventory/health` — Fetch deterministic inventory health metrics.
- `GET /api/v1/inventory/integrity-report` — Run 7-point automated integrity diagnostic suite.
- `GET /api/v1/inventory/certification-report` — Generate immutable Inventory Domain Certification Report.
- `GET /api/v1/inventory/certificates` — Fetch historical immutable certification records.
