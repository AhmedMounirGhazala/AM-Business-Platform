# AM BUSINESS PLATFORM — ARCHITECTURE BASELINE v2.5
**Domain**: Financial Reporting, Management Reporting & Business Intelligence (Phase 2.7)
**Status**: APPROVED & ACTIVE BASELINE
**Target Framework Alignment**: SAP S/4HANA Finance, Oracle ERP Cloud Financials, Microsoft Dynamics 365 Finance, IFRS, IAS 1, IAS 7, IAS 8, IAS 21

---

## 1. ARCHITECTURAL OVERVIEW & DOMAIN BOUNDARIES

Architecture Baseline v2.5 incorporates the complete Financial Reporting, Management Reporting, and Business Intelligence Domain (Phase 2.7) into the AM Business Platform core architecture.

The Financial Reporting Engine operates strictly as a **read-only extension layer** over certified subledgers (Inventory, Procurement, AP, AR, General Ledger), guaranteeing zero direct GL modification and complete transactional immutability.

```
+-----------------------------------------------------------------------------------+
|                        BUSINESS INTELLIGENCE & REPORTING LAYER                     |
|                                     (Phase 2.7)                                   |
|  +---------------------+  +---------------------+  +---------------------------+  |
|  | Financial Statements|  | Trial Balance Suite |  | Financial Ratios Engine   |  |
|  | (IAS 1, IAS 7)      |  | (Std, Comp, Multi)  |  | (Liquidity, Profitability)|  |
|  +---------------------+  +---------------------+  +---------------------------+  |
|  +---------------------+  +---------------------+  +---------------------------+  |
|  | Executive Dashboard |  | Dynamic Report Bldr |  | Budget vs Actual Engine   |  |
|  | (Real-time KPIs)    |  | (Custom Filters)    |  | (Versions & Variances)    |  |
|  +---------------------+  +---------------------+  +---------------------------+  |
|  +---------------------+  +---------------------+  +---------------------------+  |
|  | Cost/Profit Center  |  | Consolidation Suite |  | Export Engine             |  |
|  | (Allocations)       |  | (Intercompany/IAS21)|  | (XLSX, PDF, CSV, JSON, XML)|  |
|  +---------------------+  +---------------------+  +---------------------------+  |
+-----------------------------------------------------------------------------------+
                                          |
                      READ-ONLY FINANCIAL EXTENSION INTERFACE
                                          |
+-----------------------------------------------------------------------------------+
|                              CERTIFIED CORE DOMAINS                               |
|   Phase 2.2 Inventory | Phase 2.3 Procurement | Phase 2.4 AP | Phase 2.5 AR      |
|   -----------------------------------------------------------------------------   |
|                         Phase 2.6 General Ledger (FI-GL)                          |
+-----------------------------------------------------------------------------------+
```

---

## 2. CORE FUNCTIONAL MODULES

### 2.1 Financial Statement Engine (IFRS Compliant)
- **Balance Sheet (IAS 1)**: Structured presentation of Current Assets, Non-Current Assets, Current Liabilities, Non-Current Liabilities, and Shareholders' Equity with automated mathematical balance verification ($Assets = Liabilities + Equity$).
- **Income Statement (P&L / IAS 1)**: Net Revenue, Gross Profit, Operating Expenses, Operating Income (EBIT), Net Finance Costs, Zakat/Tax, Net Income, Net Profit Margin %, and EBITDA calculations.
- **Cash Flow Statement (IAS 7 Indirect Method)**: Automated reconciliation starting from Net Income, adding back non-cash Depreciation & Amortization, adjusting for Working Capital movements ($\Delta AR$, $\Delta Inventory$, $\Delta AP$), Capital Expenditures (CAPEX), Dividend distributions, and cash reconciliation check.
- **Statement of Changes in Equity (IAS 1)**: Tracks share capital movements, retained earnings roll-forward (Opening Balance + Net Income - Dividends), revaluation reserves, and closing equity.

### 2.2 Trial Balance Suite
- **Standard Trial Balance**: Account-level opening, period debit/credit movements, and closing net balances.
- **Comparative Trial Balance**: Current vs. Prior period or prior fiscal year variances.
- **Multi-Period & Monthly Trial Balance**: 12-month period-by-period progression.
- **Branch & Department Trial Balance**: Dimensional segment isolation by branch or department ID.

### 2.3 Financial Ratios Engine
- **Liquidity**: Current Ratio, Quick Ratio, Working Capital.
- **Solvency**: Debt Ratio, Debt-to-Equity Ratio.
- **Profitability**: Gross Margin %, Net Profit Margin %, Operating Margin %, EBITDA, Return on Assets (ROA %), Return on Equity (ROE %).
- **Activity & Efficiency**: Inventory Turnover, Receivables Turnover, Payables Turnover, Days Sales Outstanding (DSO), Days Payables Outstanding (DPO), Cash Conversion Cycle (CCC = DSO + DIO - DPO).

### 2.4 Executive Dashboard & BI Layer
- **Real-time KPIs**: Revenue YTD, Gross Profit YTD, Net Profit YTD, Cash Position, Total AR, Total AP, Inventory Valuation, Working Capital.
- **Monthly Trends**: 12-month revenue, expense, profit, cash inflow/outflow trajectory.
- **Top Entity Analysis**: Top 5 Customers, Top 5 Vendors, Top 5 Products, Top 5 Categories, Branch Performance, Warehouse Performance.
- **BI Visualizations**: Pivot analysis data generator, drill-down/drill-through metadata, heatmap matrices, waterfall charts.

### 2.5 Budget vs Actual & Management Reporting Framework
- **Budget Versions**: Master Original Budgets, Revised Budgets, Rolling Forecasts.
- **Variance Analysis**: Line-by-line amount and percentage variances with Favorable / Unfavorable indicators.
- **Cost Center & Profit Center Performance**: Direct costs, allocated overhead distribution using headcount, square footage, revenue, or custom ratios.

### 2.6 Consolidation & Export Engine
- **Consolidation Readiness**: Multi-company consolidation, intercompany elimination entries (AR/AP, Revenue/Expense), and IAS 21 currency translation reserves.
- **Multi-Format Export Engine**: Exports any financial report in EXCEL (formatted table layout), PDF (HTML print format), CSV, JSON, XML, or PRINT_LAYOUT formats.

### 2.7 Snapshot Engine, Comparative Reports & KPI Lineage
- **Immutable Report Snapshot Engine**: Captures full frozen report snapshots with SHA-256 verification hashes (`createReportSnapshot`, `verifySnapshotIntegrity`).
- **5-Level KPI Traceability & Lineage**: Full drill-through from KPI metric -> Financial Statement -> GL Account -> Journal Entry -> Subledger Source Document (`getKPITraceabilityLineage`).
- **Comparative Analysis Engine**: Period-over-period Month-Over-Month and Year-Over-Year absolute and percentage variance calculations (`generateMonthOverMonthReport`, `generateYearOverYearReport`).
- **Automated Hardening Suite**: `Phase27HardeningSuite` verifies 11 core quality criteria (Statement Integrity, Snapshots, RBAC Security, BI Datasets, Exports, Comparative Reports, Consolidation, Lineage, Ratios, Immutability, and Cross-Domain Zero Regression) with 100% pass rate.

---

## 3. AUDIT & SECURITY ARCHITECTURE

- **Cryptographic Audit Hashing**: Every report generated by `FinancialReportingEngine` receives a deterministic SHA-256 report hash based on payload content, filters, and timestamp.
- **Correlation & Tracking GUIDs**: Each execution is stamped with a unique `correlationId`, `auditId`, `generatedBy`, `generatedAt`, `appliedFilters`, and `sourceVersion` ("2.5.0").
- **Role-Based Access Control (RBAC)**: Enforces role permissions across CEO, CFO, Financial Controller, Accountant, Auditor, Manager, and Viewer.

---

## 4. BASELINE COMPLIANCE VERIFICATION

| Requirement ID | Description | Status | Verification Engine |
| :--- | :--- | :--- | :--- |
| **REQ-REP-271** | Financial Statements (BS, IS, Cash Flow, Equity) | COMPLIANT | `FinancialReportingEngine.generate*` |
| **REQ-REP-272** | Trial Balance Suite (Std, Comp, Multi, Branch) | COMPLIANT | `FinancialReportingEngine.generateTrialBalance` |
| **REQ-REP-273** | Financial Ratios Engine (16 Core Ratios) | COMPLIANT | `FinancialReportingEngine.calculateFinancialRatios` |
| **REQ-REP-274** | Executive Dashboard KPIs & Analytics | COMPLIANT | `FinancialReportingEngine.generateExecutiveDashboard` |
| **REQ-REP-275** | Dynamic Report Builder | COMPLIANT | `FinancialReportingEngine.buildDynamicReport` |
| **REQ-REP-276** | Budget vs Actual Variance Framework | COMPLIANT | `FinancialReportingEngine.generateBudgetVsActualReport` |
| **REQ-REP-277** | Cost Center & Profit Center Allocations | COMPLIANT | `FinancialReportingEngine.allocateOverheads` |
| **REQ-REP-278** | Consolidation & Intercompany Eliminations | COMPLIANT | `FinancialReportingEngine.generateConsolidatedReport` |
| **REQ-REP-279** | Business Intelligence & Pivot Datasets | COMPLIANT | `FinancialReportingEngine.generateBIDataset` |
| **REQ-REP-280** | Multi-Format Export Engine (XLS, PDF, CSV, XML) | COMPLIANT | `FinancialReportingEngine.exportReport` |
| **REQ-REP-281** | SHA-256 Report Audit Hashing & Tracking | COMPLIANT | `FinancialReportingEngine.computeAuditMetadata` |
| **REQ-REP-282** | Immutable Report Snapshot Registry | COMPLIANT | `FinancialReportingEngine.createReportSnapshot` |
| **REQ-REP-283** | 5-Level KPI Traceability & Audit Lineage | COMPLIANT | `FinancialReportingEngine.getKPITraceabilityLineage` |
| **REQ-REP-284** | Comparative Analysis (MoM, YoY) | COMPLIANT | `FinancialReportingEngine.generateMonthOverMonthReport` |
| **REQ-REP-285** | Automated Enterprise Quality Gate Suite | COMPLIANT | `Phase27HardeningSuite.runFullSuite` |

---
**Certified by AM Business Platform Architecture Committee**  
*Date: 2026-08-13*
