import { Phase31HardeningSuite } from '../src/engine/phase31HardeningSuite';
import { Phase32AHardeningSuite } from '../src/engine/phase32AHardeningSuite';
import { Phase32B01HardeningSuite } from '../src/engine/phase32B01HardeningSuite';
import { Phase32B02HardeningSuite } from '../src/engine/phase32B02HardeningSuite';
import { Phase32B03HardeningSuite } from '../src/engine/phase32B03HardeningSuite';
import { Phase32B04HardeningSuite } from '../src/engine/phase32B04HardeningSuite';
import { Phase32B05HardeningSuite } from '../src/engine/phase32B05HardeningSuite';
import { Phase32B06HardeningSuite } from '../src/engine/phase32B06HardeningSuite';
import { Phase32B07HardeningSuite } from '../src/engine/phase32B07HardeningSuite';
import { Phase32B08HardeningSuite } from '../src/engine/phase32B08HardeningSuite';
import { Phase32C01HardeningSuite } from '../src/engine/phase32C01HardeningSuite';
import { Phase32C02HardeningSuite } from '../src/engine/phase32C02HardeningSuite';
import { Phase32C03HardeningSuite } from '../src/engine/phase32C03HardeningSuite';
import { Phase32C04HardeningSuite } from '../src/engine/phase32C04HardeningSuite';
import { Phase32C05HardeningSuite } from '../src/engine/phase32C05HardeningSuite';
import { Phase32D01HardeningSuite } from '../src/engine/phase32D01HardeningSuite';
import { Phase32D02HardeningSuite } from '../src/engine/phase32D02HardeningSuite';
import { Phase32D03HardeningSuite } from '../src/engine/phase32D03HardeningSuite';
import { Phase32D04HardeningSuite } from '../src/engine/phase32D04HardeningSuite';
import { Phase32D05HardeningSuite } from '../src/engine/phase32D05HardeningSuite';
import { Phase32D06HardeningSuite } from '../src/engine/phase32D06HardeningSuite';
import { Phase32D07HardeningSuite } from '../src/engine/phase32D07HardeningSuite';
import { Phase32D08HardeningSuite } from '../src/engine/phase32D08HardeningSuite';
import { Phase32D09HardeningSuite } from '../src/engine/phase32D09HardeningSuite';
import { PilotReadinessHardeningSuite } from '../src/engine/pilotReadinessHardeningSuite';
import { PilotReadinessPhase2HardeningSuite } from '../src/engine/pilotReadinessPhase2HardeningSuite';
import { PilotReadinessPhase3BHardeningSuite } from '../src/engine/pilotReadinessPhase3BHardeningSuite';
import { PilotReadinessPhase3CHardeningSuite } from '../src/engine/pilotReadinessPhase3CHardeningSuite';
import { PilotReadinessPhase3DHardeningSuite } from '../src/engine/pilotReadinessPhase3DHardeningSuite';
import { PilotCertificationGateSuite } from '../src/engine/pilotCertificationGateSuite';

async function main() {
  console.log('========================================================');
  console.log('AM ENTERPRISE ERP — FULL PHASES QUALITY GATE EXECUTION');
  console.log('========================================================\n');

  let allPassed = true;

  // Phase 3.1
  try {
    const res31 = Phase31HardeningSuite.runAllHardeningTests();
    const passed = res31.passedCount;
    const total = res31.totalTests;
    console.log(`[PHASE 3.1] Sales & POS Hardening: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res31.testResults.filter(t => t.status === 'FAILED').forEach(t => console.error(`  - 3.1 FAIL: ${t.testId} ${t.testName}: ${t.details}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.1] Execution Error:`, err.message);
    allPassed = false;
  }

  // Phase 3.2A
  try {
    const res32A = await Phase32AHardeningSuite.runSuite();
    const passed = res32A.passedCount;
    const total = res32A.totalScenarios;
    console.log(`[PHASE 3.2A] Master Data & Advanced Pricing: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res32A.results.filter(t => t.status === 'FAIL').forEach(t => console.error(`  - 3.2A FAIL: ${t.scenarioId} ${t.name}: ${t.error || t.details}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.2A] Execution Error:`, err.message);
    allPassed = false;
  }

  // Phase 3.2B-01
  try {
    const res32B01 = await Phase32B01HardeningSuite.runSuite();
    const passed = res32B01.passedCount;
    const total = res32B01.totalScenarios;
    console.log(`[PHASE 3.2B-01] Requisitions & Budget Governance: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res32B01.results.filter(t => t.status === 'FAIL').forEach(t => console.error(`  - 3.2B-01 FAIL: ${t.scenarioId} ${t.name}: ${t.error || t.details}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.2B-01] Execution Error:`, err.message);
    allPassed = false;
  }

  // Phase 3.2B-02
  try {
    const res32B02 = await Phase32B02HardeningSuite.runSuite();
    const passed = res32B02.passedCount;
    const total = res32B02.totalScenarios;
    console.log(`[PHASE 3.2B-02] RFQ & Supplier Quotations: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res32B02.results.filter(t => t.status === 'FAIL').forEach(t => console.error(`  - 3.2B-02 FAIL: ${t.scenarioId} ${t.name}: ${t.error || t.details}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.2B-02] Execution Error:`, err.message);
    allPassed = false;
  }

  // Phase 3.2B-03
  try {
    const res32B03 = await Phase32B03HardeningSuite.runSuite();
    const passed = res32B03.passedTests;
    const total = res32B03.totalTests;
    console.log(`[PHASE 3.2B-03] Purchase Orders & Contract Pricing: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res32B03.results.filter(t => t.status === 'FAIL').forEach(t => console.error(`  - 3.2B-03 FAIL: ${t.testId} ${t.name}: ${t.error || t.details}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.2B-03] Execution Error:`, err.message);
    allPassed = false;
  }

  // Phase 3.2B-04
  try {
    const res32B04 = await Phase32B04HardeningSuite.runSuite();
    const passed = res32B04.passedTests;
    const total = res32B04.totalTests;
    console.log(`[PHASE 3.2B-04] Goods Receipts & GR/IR Bridge: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res32B04.results.filter(t => t.status === 'FAIL').forEach(t => console.error(`  - 3.2B-04 FAIL: ${t.testId} ${t.name}: ${t.error || t.details}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.2B-04] Execution Error:`, err.message);
    allPassed = false;
  }

  // Phase 3.2B-05
  try {
    const res32B05 = await Phase32B05HardeningSuite.runSuite();
    const passed = res32B05.passedTests;
    const total = res32B05.totalTests;
    console.log(`[PHASE 3.2B-05] Accounts Payable & 3-Way Match: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res32B05.results.filter(t => t.status === 'FAIL').forEach(t => console.error(`  - 3.2B-05 FAIL: ${t.testId} ${t.name}: ${t.error || t.details}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.2B-05] Execution Error:`, err.message);
    allPassed = false;
  }

  // Phase 3.2B-06
  try {
    const res32B06 = await Phase32B06HardeningSuite.runSuite();
    const passed = res32B06.passedTests;
    const total = res32B06.totalTests;
    console.log(`[PHASE 3.2B-06] AP Vouchers, Proposals & Payments: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res32B06.results.filter(t => t.status === 'FAIL').forEach(t => console.error(`  - 3.2B-06 FAIL: ${t.testId} ${t.name}: ${t.error || t.details}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.2B-06] Execution Error:`, err.message);
    allPassed = false;
  }

  // Phase 3.2B-07
  try {
    const res32B07 = await Phase32B07HardeningSuite.runSuite();
    const passed = res32B07.passedTests;
    const total = res32B07.totalTests;
    console.log(`[PHASE 3.2B-07] Supplier Aging, Statements, CN/DN & AP Analytics: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res32B07.results.filter(t => t.status === 'FAIL').forEach(t => console.error(`  - 3.2B-07 FAIL: ${t.testId} ${t.name}: ${t.error || t.details}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.2B-07] Execution Error:`, err.message);
    allPassed = false;
  }

  // Phase 3.2B-08
  try {
    const res32B08 = await Phase32B08HardeningSuite.runSuite();
    const passed = res32B08.passedTests;
    const total = res32B08.totalTests;
    console.log(`[PHASE 3.2B-08] Advanced Procurement (ERS, Consignment, Landed Cost, Scorecards, Prepayments): ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res32B08.results.filter(t => t.status === 'FAIL').forEach(t => console.error(`  - 3.2B-08 FAIL: ${t.testId} ${t.name}: ${t.error || t.details}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.2B-08] Execution Error:`, err.message);
    allPassed = false;
  }

  // Phase 3.2C-01
  try {
    const res32C01 = await Phase32C01HardeningSuite.runSuite();
    const passed = res32C01.passedCount;
    const total = res32C01.totalTests;
    console.log(`[PHASE 3.2C-01] Advanced Order-to-Cash (Contracts, Consignment, Rebates, Dropship, Credit): ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res32C01.results.filter(t => !t.passed).forEach(t => console.error(`  - 3.2C-01 FAIL: #${t.scenarioNumber} ${t.name}: ${t.error || t.details}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.2C-01] Execution Error:`, err.message);
    allPassed = false;
  }

  // Phase 3.2C-02
  try {
    const res32C02 = await Phase32C02HardeningSuite.runSuite();
    const passed = res32C02.passedCount;
    const total = res32C02.totalTests;
    console.log(`[PHASE 3.2C-02] Advanced Outbound Logistics (Deliveries, Waves, HUs, PGI, RMA, ePOD): ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res32C02.results.filter(t => !t.passed).forEach(t => console.error(`  - 3.2C-02 FAIL: #${t.scenarioNumber} ${t.name}: ${t.error || t.details}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.2C-02] Execution Error:`, err.message);
    allPassed = false;
  }

  // Phase 3.2C-03
  try {
    const res32C03 = await Phase32C03HardeningSuite.runSuite();
    const passed = res32C03.passedCount;
    const total = res32C03.totalTests;
    console.log(`[PHASE 3.2C-03] Customer Billing, IFRS 15 Revenue Recognition, Milestone & Dunning: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res32C03.results.filter(t => !t.passed).forEach(t => console.error(`  - 3.2C-03 FAIL: #${t.scenarioNumber} ${t.name}: ${t.error || t.details}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.2C-03] Execution Error:`, err.message);
    allPassed = false;
  }

  // Phase 3.2C-04
  try {
    const res32C04 = await Phase32C04HardeningSuite.runSuite();
    const passed = res32C04.passedCount;
    const total = res32C04.totalTests;
    console.log(`[PHASE 3.2C-04] Cash Applications, Lockbox Automation, Disputes & Deductions: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res32C04.results.filter(t => !t.passed).forEach(t => console.error(`  - 3.2C-04 FAIL: #${t.scenarioNumber} ${t.name}: ${t.error || t.details}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.2C-04] Execution Error:`, err.message);
    allPassed = false;
  }

  // Phase 3.2C-05
  try {
    const res32C05 = await Phase32C05HardeningSuite.runSuite();
    const passed = res32C05.passedCount;
    const total = res32C05.totalTests;
    console.log(`[PHASE 3.2C-05] Customer Aging, Statements, IFRS 9 ECL, Write-Offs & O2C Analytics: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res32C05.results.filter(t => !t.passed).forEach(t => console.error(`  - 3.2C-05 FAIL: #${t.scenarioNumber} ${t.name}: ${t.error || t.details}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.2C-05] Execution Error:`, err.message);
    allPassed = false;
  }

  // Phase 3.2D-01
  try {
    const res32D01 = Phase32D01HardeningSuite.runAll();
    const passed = res32D01.passed;
    const total = res32D01.total;
    console.log(`[PHASE 3.2D-01] Discrete Manufacturing, BOM, Routings, WIP & MRP: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res32D01.results.filter(t => !t.passed).forEach(t => console.error(`  - 3.2D-01 FAIL: ${t.id} ${t.name}: ${t.message}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.2D-01] Execution Error:`, err.message);
    allPassed = false;
  }

  // Phase 3.2D-02
  try {
    const res32D02 = Phase32D02HardeningSuite.runAll();
    const passed = res32D02.passed;
    const total = res32D02.total;
    console.log(`[PHASE 3.2D-02] Shop Floor Dispatching, Machine IoT & Quality Inspections: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res32D02.results.filter(t => !t.passed).forEach(t => console.error(`  - 3.2D-02 FAIL: ${t.id} ${t.name}: ${t.message}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.2D-02] Execution Error:`, err.message);
    allPassed = false;
  }

  // Phase 3.2D-03
  try {
    const res32D03 = Phase32D03HardeningSuite.runAll();
    const passed = res32D03.passed;
    const total = res32D03.total;
    console.log(`[PHASE 3.2D-03] Advanced Product Costing, Manufacturing Variances & Plant Maintenance: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res32D03.results.filter(t => !t.passed).forEach(t => console.error(`  - 3.2D-03 FAIL: ${t.id} ${t.name}: ${t.message}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.2D-03] Execution Error:`, err.message);
    allPassed = false;
  }

  // Phase 3.2D-04
  try {
    const res32D04 = Phase32D04HardeningSuite.runAll();
    const passed = res32D04.passed;
    const total = res32D04.total;
    console.log(`[PHASE 3.2D-04] Process Manufacturing, Finite Capacity Scheduling, Subcontracting & Electronic Kanban: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res32D04.results.filter(t => !t.passed).forEach(t => console.error(`  - 3.2D-04 FAIL: ${t.id} ${t.name}: ${t.message}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.2D-04] Execution Error:`, err.message);
    allPassed = false;
  }

  // Phase 3.2D-05
  try {
    const res32D05 = Phase32D05HardeningSuite.runAll();
    const passed = res32D05.passed;
    const total = res32D05.total;
    console.log(`[PHASE 3.2D-05] PLM Deviations, Variant Config (CTO/ATO), Recall Containment & Carbon ESG: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res32D05.results.filter(t => !t.passed).forEach(t => console.error(`  - 3.2D-05 FAIL: ${t.id} ${t.name}: ${t.message}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.2D-05] Execution Error:`, err.message);
    allPassed = false;
  }

  // Phase 3.2D-06
  try {
    const res32D06 = Phase32D06HardeningSuite.runAll();
    const passed = res32D06.passed;
    const total = res32D06.total;
    console.log(`[PHASE 3.2D-06] Advanced Manufacturing Intelligence, Tooling & eBR Compliance: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res32D06.results.filter(t => !t.passed).forEach(t => console.error(`  - 3.2D-06 FAIL: ${t.id} ${t.name}: ${t.message}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.2D-06] Execution Error:`, err.message);
    allPassed = false;
  }

  // Phase 3.2D-07
  try {
    const res32D07 = Phase32D07HardeningSuite.runAll();
    const passed = res32D07.passed;
    const total = res32D07.total;
    console.log(`[PHASE 3.2D-07] Repetitive Manufacturing, Circular Remanufacturing & Andon Orchestration: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res32D07.results.filter(t => !t.passed).forEach(t => console.error(`  - 3.2D-07 FAIL: ${t.id} ${t.name}: ${t.message}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.2D-07] Execution Error:`, err.message);
    allPassed = false;
  }

  // Phase 3.2D-08
  try {
    const res32D08 = Phase32D08HardeningSuite.runAll();
    const passed = res32D08.passed;
    const total = res32D08.total;
    console.log(`[PHASE 3.2D-08] Manufacturing Yield Optimization, Shift Handover Governance & SPC: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res32D08.results.filter(t => !t.passed).forEach(t => console.error(`  - 3.2D-08 FAIL: ${t.id} ${t.name}: ${t.message}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.2D-08] Execution Error:`, err.message);
    allPassed = false;
  }

  // Phase 3.2D-09
  try {
    const res32D09 = Phase32D09HardeningSuite.runAll();
    const passed = res32D09.passed;
    const total = res32D09.total;
    console.log(`[PHASE 3.2D-09] Co-Products, Batch Genealogy, ECO Redlining & Disassembly: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      res32D09.results.filter(t => !t.passed).forEach(t => console.error(`  - 3.2D-09 FAIL: ${t.id} ${t.name}: ${t.message}`));
    }
  } catch (err: any) {
    console.error(`[PHASE 3.2D-09] Execution Error:`, err.message);
    allPassed = false;
  }

  // PILOT READINESS PHASE 1: Durable SQLite, WAL, SHA-256 Backups, Master Data CSV Onboarding
  try {
    const resPilot = PilotReadinessHardeningSuite.runAll();
    const passed = resPilot.passed;
    const total = resPilot.total;
    console.log(`[PILOT READINESS 1] Retail Deployment Hardening (SQLite, Backups, CSV Master Data): ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      resPilot.results.filter(t => !t.passed).forEach(t => console.error(`  - PILOT-1 FAIL: ${t.id} ${t.name}: ${t.message}`));
    }
  } catch (err: any) {
    console.error(`[PILOT READINESS 1] Execution Error:`, err.message);
    allPassed = false;
  }

  // PILOT READINESS PHASE 2: Offline POS Hardening (IndexedDB, Crash Recovery, Conflict & Authoritative SQLite Sync)
  try {
    const resPilot2 = await PilotReadinessPhase2HardeningSuite.runAll();
    const passed = resPilot2.passed;
    const total = resPilot2.total;
    console.log(`[PILOT READINESS 2] Offline POS Hardening (IndexedDB, Crash Recovery, Sync & Idempotency): ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      resPilot2.results.filter(t => !t.passed).forEach(t => console.error(`  - PILOT-2 FAIL: ${t.id} ${t.name}: ${t.message}`));
    }
  } catch (err: any) {
    console.error(`[PILOT READINESS 2] Execution Error:`, err.message);
    allPassed = false;
  }

  // PILOT READINESS PHASE 3B: POS Hardware Abstraction & Variable EAN-13 Layer
  try {
    const resPilot3B = await PilotReadinessPhase3BHardeningSuite.runAll();
    const passed = resPilot3B.passed;
    const total = resPilot3B.total;
    console.log(`[PILOT READINESS 3B] POS Hardware Abstraction & Variable EAN-13: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      resPilot3B.results.filter(t => !t.passed).forEach(t => console.error(`  - PILOT-3B FAIL: ${t.id} ${t.name}: ${t.message}`));
    }
  } catch (err: any) {
    console.error(`[PILOT READINESS 3B] Execution Error:`, err.message);
    allPassed = false;
  }

  // PILOT READINESS PHASE 3C: Retail POS Hardening (Customer Display & Large Catalog Offline Optimization)
  try {
    const resPilot3C = await PilotReadinessPhase3CHardeningSuite.runAll();
    const passed = resPilot3C.passed;
    const total = resPilot3C.total;
    console.log(`[PILOT READINESS 3C] Customer Display & Large Catalog Optimization: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      resPilot3C.results.filter(t => !t.passed).forEach(t => console.error(`  - PILOT-3C FAIL: ${t.id} ${t.name}: ${t.message}`));
    }
  } catch (err: any) {
    console.error(`[PILOT READINESS 3C] Execution Error:`, err.message);
    allPassed = false;
  }

  // PILOT READINESS PHASE 3D: Production Persistence & Deployment Safety Suite
  try {
    const resPilot3D = await PilotReadinessPhase3DHardeningSuite.runAll();
    const passed = resPilot3D.passed;
    const total = resPilot3D.total;
    console.log(`[PILOT READINESS 3D] Production Persistence & Deployment Safety: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
    if (passed !== total) {
      allPassed = false;
      resPilot3D.results.filter(t => !t.passed).forEach(t => console.error(`  - PILOT-3D FAIL: ${t.id} ${t.name}: ${t.message}`));
    }
  } catch (err: any) {
    console.error(`[PILOT READINESS 3D] Execution Error:`, err.message);
    allPassed = false;
  }

  // PILOT CERTIFICATION GATE: 25-Scenario Complete Operational Verification
  try {
    const resCert = await PilotCertificationGateSuite.runAll();
    const passed = resCert.passedScenarios + resCert.simulatedScenarios;
    const total = resCert.totalScenarios;
    console.log(`[PILOT CERTIFICATION GATE] 25-Scenario Gate Suite: ${passed}/${total} (${resCert.overallPilotVerdict})`);
    if (resCert.overallPilotVerdict !== 'PILOT_GO') {
      allPassed = false;
      resCert.results.filter(t => t.status === 'BLOCKED').forEach(t => console.error(`  - CERT BLOCKED: #${t.scenarioNumber} ${t.name}: ${t.message}`));
    }
  } catch (err: any) {
    console.error(`[PILOT CERTIFICATION GATE] Execution Error:`, err.message);
    allPassed = false;
  }

  console.log('\n========================================================');
  if (allPassed) {
    console.log('>>> ALL SUITES PASSED (100% GREEN) <<<');
  } else {
    console.log('>>> SOME SUITES FAILED <<<');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
