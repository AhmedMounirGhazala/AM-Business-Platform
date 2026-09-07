# CHANGELOG — AM BUSINESS PLATFORM

All notable changes to the AM Business Platform project are documented in this file.

## [2.9.0] - 2026-08-14
### Banking, Cash Management & Treasury Domain v1.0 (CERTIFIED & HARDENED)
- **Added**: Bank & Cash Master Account Governance (`validateBankLimits`, `validateAccountLockStatus`) enforcing multi-currency account controls, IBAN validation, signatory limits, and administrative freeze mechanics.
- **Added**: Sequential Gapless Treasury Transaction Numbering Engine (`TreasuryEngine.generateGaplessTreasuryNumber`) enforcing strict format `TR-{YEAR}-{TYPE_PREFIX}-{SEQ:5}` (e.g., `TR-2026-TRF-00001`) preventing duplication and skipped sequences.
- **Added**: Treasury Transaction Idempotency Engine (`validateTransactionIdempotency`, `processTreasuryTransaction`) preventing duplicate Deposits, Withdrawals, Internal Transfers, Bank Charges, FX Revaluations, and imported statement lines.
- **Added**: Cheque & Post-Dated Cheque (PDC) Vault Lifecycle Machine (`validateChequeTransition`, `processPdcDishonour`) supporting full incoming (`RECEIVED` -> `HELD_IN_VAULT` -> `DEPOSITED` -> `CLEARED` / `BOUNCED`) and outgoing (`ISSUED` -> `PRINTED` -> `DELIVERED` -> `CLEARED` / `STOPPED`) state machines with automated bounce penalty fees and debtor balance restoration.
- **Added**: Multi-Format Bank Statement Import & Automated Reconciliation Engine (`importBankStatement`, `executeAutoReconciliation`, `completeReconciliationSession`) supporting MT940, ISO 20022 CAMT.053, and CSV with multi-pass matching rules and mathematical integrity balancing (`Reconciled Book = Reconciled Bank`).
- **Added**: Cash Flow Forecasting & Liquidity Analysis Suite (`generateLiquidityAnalysisReport`, `generateCashForecastTimeline`) implementing IAS 7 multi-horizon projections (Daily, 30-Day, 90-Day, Annual) across AP, AR, PDCs, and recurring budgets with liquidity buffer monitoring.
- **Added**: Dual Authorization & Approval Governance Engine (`validateApprovalAuthorization`) enforcing configurable amount thresholds and strict Segregation of Duties (SoD) preventing creators from approving their own transactions.
- **Added**: Intercompany Cash Concentration & Pooling Engine (`processIntercompanyCashTransfer`) with bilateral sweeping and complementary Due-To / Due-From GL account postings.
- **Added**: IAS 21 Multi-Currency Valuation & Bank Charges Engine (`calculateFxRevaluation`, `processBankCharge`) evaluating revaluation gains/losses on foreign bank accounts and automating fee/interest postings.
- **Added**: Immutable Liquidity Snapshot Registry & SHA-256 Audit Vault (`createImmutableLiquiditySnapshot`, `createTreasuryAuditRecord`, `verifyTreasuryAuditChain`, `computeSha256Hash`) storing cryptographically chained, tamper-evident audit logs and point-in-time liquidity seals.
- **Added**: Automated 15-Point Enterprise Quality Gate Suite (`Phase29HardeningSuite.runFullQualityGate`) verifying all architectural, statutory, idempotency, numbering, and cryptographic criteria with 100% pass rate.
- **Added**: Full REST API Suite (`/api/v1/treasury/*`) in Express server (`server.ts`) including bank/cash accounts, transactions, cheques/PDCs, statements, reconciliations, forecasts, intercompany transfers, snapshots, audit vault, and quality gate execution.
- **Certified**: Approved Architecture Baseline v2.7 and Treasury & Cash Management Domain Certification v1.0 with 0 build or lint errors.

## [2.8.0] - 2026-08-14
### Fixed Assets & Asset Lifecycle Management Domain v1.0 (CERTIFIED & HARDENED)
- **Added**: Asset Master Governance Engine (`FixedAssetsEngine.generateGaplessAssetNumber`, `validateAssetLockStatus`) enforcing company-, year-, and class-aware sequential gapless numbering (`FA-{YEAR}-{CLASS}-{SEQ:4}`) and statutory lock mechanisms.
- **Added**: Capitalization & Acquisition Idempotency Engine (`validateAcquisitionIdempotency`, `processAssetAcquisition`) preventing duplicate asset capitalization and ensuring IFRS / IAS 16 & IAS 23 compliance.
- **Added**: Multi-Method Depreciation Calculation Suite (`calculateAssetDepreciationSchedule`, `runMonthlyDepreciation`) supporting Straight Line, Declining Balance, Double Declining, Sum of Years' Digits, Units of Production, and Custom Tables with strict Net Book Value floor protection (`NBV >= ResidualValue`).
- **Added**: Depreciation Protection & Idempotency (`validateDepreciationPeriodRun`) preventing duplicate period runs, supporting authorized rollbacks, and generating cryptographic audit records.
- **Added**: Asset Transfer Governance Engine (`processAssetTransfer`) supporting location, department, cost center, custodian, and inter-company transfers with cryptographic lineage tracking.
- **Added**: Asset Disposal Engine (`validateDisposalRules`, `processAssetDisposal`) supporting Scrap, Sale, Trade-In, and Casualty/Donation, automated gain/loss recognition, and open maintenance collision blockers.
- **Added**: IAS 16 Revaluation Engine (`processAssetRevaluation`) recognizing fair value gains into Revaluation Surplus Equity (Account 320000) and debiting asset gross book value.
- **Added**: IAS 36 Impairment Engine (`validateIAS36Impairment`, `processAssetImpairment`) evaluating recoverable amount, recognizing impairment loss, and strictly enforcing IAS 36.117 reversal ceilings.
- **Added**: Maintenance Work Orders & PMS Engine (`validateMaintenanceIntegrity`, `logMaintenanceRecord`) tracking preventive and corrective maintenance with concurrent work order collision protection.
- **Added**: Physical Asset Verification Engine (`processPhysicalCountScan`) supporting barcode/serial cycle counts, location discrepancy detection, and duplicate scan guards.
- **Added**: Immutable Asset Snapshot & Audit Vault (`createImmutableSnapshot`, `verifySnapshotIntegrity`, `computeSha256Hash`) storing sealed point-in-time registers with SHA-256 validation.
- **Added**: Asset Register & Roll-Forward Reporting (`generateAssetRegisterReport`, `generateAssetRollForwardReport`) providing IFRS notes disclosure schedules with complete reconciliation integrity.
- **Added**: Automated 15-Point Enterprise Quality Gate Suite (`Phase28HardeningSuite.runFullQualityGate`) verifying all architectural, statutory, and lifecycle criteria with 100% pass rate.
- **Added**: Full REST API Suite (`/api/v1/assets/*`) in Express server (`server.ts`) including gapless creation, acquisitions, depreciation runs & rollbacks, transfers, disposals, revaluations, impairments, maintenance, physical counts, lock/unlock, snapshots, and quality gate execution.
- **Certified**: Approved Architecture Baseline v2.6 and Fixed Assets Domain Certification v1.0 with 0 build or lint errors.

## [2.7.0] - 2026-08-13
### Financial Reporting, Management Reporting & Business Intelligence Domain v1.0 (CERTIFIED & HARDENED)
- **Added**: Financial Statement Engine (`FinancialReportingEngine.generateBalanceSheet`, `generateIncomeStatement`, `generateIndirectCashFlowStatement`, `generateStatementOfChangesInEquity`) fully compliant with IFRS, IAS 1, IAS 7, and IAS 8.
- **Added**: Trial Balance Reporting Suite (`generateTrialBalance`) supporting Standard, Comparative, Multi-Period, Monthly, Branch, and Department trial balances.
- **Added**: Financial Ratios Engine (`calculateFinancialRatios`) computing 16 core liquidity, solvency, profitability, and activity metrics including Current Ratio, Quick Ratio, Debt Ratio, Working Capital, Gross/Net/Operating Margins, EBITDA, ROA, ROE, Inventory Turnover, DSO, DPO, and Cash Conversion Cycle.
- **Added**: Executive Dashboard Engine (`generateExecutiveDashboard`) delivering real-time YTD Revenue, Gross/Net Profit, Cash Position, Total AR/AP, Inventory Valuation, Working Capital, 12-Month Trends, Top Customers/Vendors/Products/Categories, and Branch/Warehouse Performance.
- **Added**: Dynamic Report Builder (`buildDynamicReport`) providing custom grouping, filtering, sorting, date ranges, templates, and bookmarking capabilities.
- **Added**: Budget vs Actual Framework (`generateBudgetVsActualReport`) managing budget/forecast versions, line-by-line variances, and favorable/unfavorable indicators.
- **Added**: Cost Center & Profit Center Reporting (`generateCostCenterReport`, `generateProfitCenterReport`, `allocateOverheads`) supporting cost/profit center contribution analysis and overhead allocation distribution rules.
- **Added**: Consolidation Readiness Engine (`generateConsolidatedReport`) providing multi-company consolidation, intercompany elimination entries (AR/AP, Revenue/Expense), and IAS 21 currency translation reserve handling.
- **Added**: Business Intelligence Layer (`generateBIDataset`) generating pivot table datasets, drill-down/drill-through metadata, heatmaps, and waterfall charts.
- **Added**: Multi-Format Export Engine (`exportReport`) generating EXCEL, PDF, CSV, JSON, XML, and PRINT_LAYOUT outputs.
- **Added**: Immutable Report Snapshot Engine (`createReportSnapshot`, `getReportSnapshot`, `getReportSnapshots`, `verifySnapshotIntegrity`) storing frozen report payloads with SHA-256 verification.
- **Added**: 5-Level KPI Traceability & Audit Lineage Engine (`getKPITraceabilityLineage`) providing drill-down from KPI metric -> Financial Statement -> GL Account -> Journal Entry -> Subledger Source Document.
- **Added**: Comparative Analysis Engine (`generateMonthOverMonthReport`, `generateYearOverYearReport`) calculating line-by-line MoM/YoY absolute variances, percentage variances, and financial trends.
- **Added**: Enterprise Quality Gate Hardening Test Suite (`Phase27HardeningSuite`) executing 11 rigorous automated verification tests across financial mathematical integrity, snapshot engines, dynamic RBAC, BI datasets, exports, comparative analysis, consolidation, KPI lineage, financial ratios, immutability, and cross-domain zero-regression with 100% pass rate.
- **Added**: Complete REST APIs (`/api/v1/reports/*`) in Express server layer (`server.ts`) including `/snapshots`, `/snapshots/:id/verify`, `/kpi-lineage/:kpiId`, `/comparative/mom`, `/comparative/yoy`, and `/quality-gate`.
- **Certified**: Approved Architecture Baseline v2.5 and Financial Reporting Domain Certification v1.0 with 0 build or lint errors.

## [2.6.0] - 2026-08-13
### Certified & Hardened - General Ledger & Financial Closing Domain v1.0
- **Added**: Journal Entry Creation Idempotency & Key Engine (`idempotencyKey`) preventing duplicate journal creation and duplicate postings.
- **Added**: Sequential Gapless Journal Numbering Engine (`generateSequentialJournalNumber`) enforcing strict company-, year-, and period-aware sequence formats.
- **Added**: Journal Lock & Immutability Enforcement (HTTP 403 Forbidden on PUT/DELETE for `POSTED` or `REVERSED` journals).
- **Added**: Multi-Subledger Pre-Close Checklist Engine (`evaluatePreCloseChecklist`) verifying draft journals, trial balance integrity, Inventory closing, Procurement PO unbilled receipts, Accounts Payable unposted invoices, Accounts Receivable unposted invoices, and financial event queue status.
- **Added**: Fiscal Period Reopen Governance (`reopenFiscalPeriod`) enforcing mandatory business justification reasons, tracking `reopenCounter`, and generating immutable audit logs.
- **Added**: Trial Balance Integrity Engine (`validateTrialBalanceIntegrity`) verifying mathematical relation `OpeningNet + PeriodNet = ClosingNet` and debit/credit equality with SHA-256 validation.
- **Added**: Suspense & Clearing Account Detection Engine (`detectSuspenseAccounts`) scanning Chart of Accounts for unresolved temporary balances.
- **Added**: IAS 21 Foreign Currency Valuation Snapshot Engine (`createIAS21FXSnapshot`) capturing unrealized gain/loss calculations with cryptographic SHA-256 signatures.
- **Added**: Immutable Period Closing Snapshot Engine (`generateClosingSnapshot`) storing deep snapshot data bundles of Chart of Accounts, Trial Balance, Journal Counts, and FX rates.
- **Added**: General Ledger Linked Audit Trail (`GLAuditRecord`) enforcing cryptographic SHA-256 hashes and correlation ID tracking across all financial actions.
- **Added**: Enterprise Quality Gate Hardening Test Suite (`Phase26HardeningSuite`) running automated verification across all 11 enterprise criteria with 100% pass rate.
- **Certified**: Approved Architecture Baseline v2.4 and General Ledger Domain Certification v1.0 with 0 build or lint errors.

## [2.5.0] - 2026-08-13
### Certified & Hardened - Accounts Receivable & Order-to-Cash Domain v1.0
- **Added**: Duplicate Sales Invoice Protection (`validateDuplicateInvoice`) enforcing company-level idempotency and date bounds to prevent duplicate AR postings.
- **Added**: Concurrent Allocation Lock Guard (`isAllocationLocked`, `lockedBy`, `lockedAt`) preventing concurrent receipt application race conditions.
- **Added**: Receipt Reversal & Un-allocation Engine (`reverseReceipt`) restoring open invoice balances and logging immutable audit records.
- **Added**: AR Credit Control Engine (`validateCreditControl`) with structured Executive Override workflows (`isOverrideAllowed`, `isOverridden`, `overrideReason`).
- **Added**: Collections Activity Lifecycle Engine (`createCollectionNote`, `createPromiseToPay`) supporting lifecycle states (`REMINDER`, `CALL`, `PROMISE_TO_PAY`, `BROKEN_PROMISE`, `LEGAL_ACTION`, `CLOSED`) and status state machines.
- **Added**: Customer Statement Cryptographic Hash Engine (`generateCustomerStatement`) generating deterministic SHA-256 equivalent hashes for tamper-evident statement verification.
- **Added**: Days Sales Outstanding (DSO) Calculation Engine integrated into real-time aging reports and historical aging snapshots (`CustomerAgingSnapshotRecord`).
- **Added**: Revenue Recognition Schedule Engine (`buildRevenueRecognitionSchedule`) implementing IFRS 15 performance obligation allocation and deferred revenue tracking.
- **Added**: Multi-Currency FX Realization Settlement Engine (`calculateSettlementFXDifference`) calculating exchange rate differences between invoice posting and receipt settlement dates.
- **Added**: Cryptographic AR Audit Trail (`ARAuditRecord`) tracking state transitions, entity modifications, and user actions with hash protection.
- **Added**: Complete REST API Endpoints for Accounts Receivable and Order-to-Cash (`/api/v1/ar/*`).
- **Certified**: Approved Architecture Baseline v2.3 and Accounts Receivable Domain Certification v1.0 with 0 build or lint errors.

## [2.4.0] - 2026-08-12
### Certified & Hardened - Accounts Payable & Financial Matching Domain v1.0
- **Added**: Duplicate Supplier Invoice Protection (`validateDuplicateInvoice`) preventing duplicate invoice creation by Vendor ID + Invoice Ref / Invoice Number.
- **Added**: Payment Allocation Engine (`allocatePayment`) supporting AUTOMATIC, MANUAL, FIFO, and PARTIAL allocation modes with voucher balance restoration.
- **Added**: Vendor Credit Control (`validateVendorCreditControl`) enforcing credit limit checks, overdue balance limits, and administrative block rules.
- **Added**: Realized Exchange Rate Gain/Loss Calculation (`calculateExchangeRateDifference`) for foreign currency invoice settlement readiness.
- **Added**: Extended Supplier Invoice Lifecycle (`SupplierInvoiceStatus`) supporting DRAFT, MATCHED, VARIANCE_HOLD, APPROVED, POSTED, PARTIALLY_PAID, PAID, CANCELLED, and REVERSED.
- **Added**: Invoice Hold Workflow (`releaseVarianceBlock`, `holdReason`, `varianceCode`) with manager justification audit trails.
- **Added**: Early Payment Discount Engine (`calculateEarlyPaymentDiscount`) evaluating discount percentages, cutoff dates, and potential savings.
- **Added**: Immutable Vendor Aging Snapshot Engine (`createVendorAgingSnapshot`) capturing point-in-time AP aging records with SHA-256 hashes.
- **Added**: Cryptographic AP Audit Trail (`APAuditRecord`) with correlation IDs, SHA-256 hash validation, and state transition history.
- **Added**: Payment Batch Reversal Engine (`reversePaymentBatch`) restoring unpaid/partially-paid balances on AP vouchers with audit trail and financial event emission.
- **Added**: End-to-end REST API endpoints for all Accounts Payable and Financial Matching operations (`/api/v1/ap/*`).
- **Certified**: Approved Architecture Baseline v2.2 and Accounts Payable Domain Certification v1.0 with 0 build or lint errors.

## [2.3.0] - 2026-08-12
### Certified & Hardened - Procurement & Purchasing Domain v1.0
- **Added**: Full Procurement Lifecycle Engine (`ProcurementEngine`) covering Vendor Master, Purchase Requisitions, RFQs, Vendor Quotations, Bid Comparison Matrix, Purchase Orders, PO Amendments, Partial Goods Receipts, Vendor Returns, and SHA-256 Audit Logging.
- **Added**: Vendor Price History Engine (`VendorPriceHistoryRecord`) maintaining an append-only historical price ledger per Item + Vendor pair.
- **Added**: Supplier Performance Foundation (`SupplierPerformanceKPIs`) tracking On-Time Delivery %, Lead Time, Quality Score %, Rejection Rate %, Total Orders, and Volume Procured.
- **Added**: Three-Way Matching Readiness with automated `GOODS_RECEIPT_POSTED` financial event emission (`EVT_PURCHASE_GRN_*`) targeting GR/IR Clearing Account.
- **Added**: Purchase Order Versioning Engine preserving complete pre-amendment snapshots, version numbers, change reasons, previous total amounts, and user audit trails.
- **Added**: Procurement Role Separation (RBAC) across Requester, Buyer, Approver, and Procurement Manager roles.
- **Added**: Blanket Purchase Order Readiness architecture documentation.
- **Added**: REST Endpoints for Vendor Price History (`GET /api/v1/procurement/vendor-price-history`) and Vendor Performance (`GET /api/v1/procurement/vendor-performance`).
- **Certified**: Approved Architecture Baseline v2.1 and Procurement Domain Certification v1.0 with 0 build errors.

## [2.2.5] - 2026-08-12
### Certified & Hardened - Inventory Closing & Inventory Control Engine
- **Added**: Inventory Closing & Period Engine (`Open`, `Closing`, `Closed`, `Reopened`).
- **Added**: Immutable Snapshot Engine for Closing Periods (Inventory, Quants, FIFO Layers, AVCO, Standard Cost, Values).
- **Added**: Fiscal Inventory Lock Engine (`Company`, `Branch`, `Warehouse`).
- **Added**: Reopen Governance with mandatory audit reasons and `reopenCounter` tracking.
- **Added**: Physical Inventory Cycle Engine with blind counting, count sheets, recounts, and variance approval workflows.
- **Added**: Deterministic Inventory Health Engine scoring algorithm.
- **Added**: 7-Point Integrity Diagnostic Suite (Orphan quants, broken FIFO layers, duplicate serials/lots, negative stock, valuation mismatches).
- **Added**: Immutable Inventory Certificate Records with cryptographic hashes.
- **Hardened**: Zero technical debt, full TypeScript compliance (`tsc --noEmit` clean), and 100% REST API integration.

## [2.2.4] - 2026-08-11
### Certified - Inventory Financial Integration
- **Added**: Decoupled Financial Event Queue for Inventory transactions.
- **Added**: Standardized Financial Event Payloads (`EVT_GOODS_RECEIPT`, `EVT_GOODS_ISSUE`, `EVT_TRANSFER`, `EVT_ADJUSTMENT`).

## [2.2.3] - 2026-08-11
### Certified - Inventory Costing Engine
- **Added**: Multi-valuation method support (FIFO, AVCO, Standard Cost, Specific Identification).

## [2.2.2] - 2026-08-11
### Certified - Demand Allocation & Reservation Engine
- **Added**: ATP calculation engine and reservation lifecycle controls.

## [2.2.1] - 2026-08-11
### Certified - Inventory Execution Engine
- **Added**: Stock movement engine, multi-warehouse, bin location management, serial and batch tracking.
