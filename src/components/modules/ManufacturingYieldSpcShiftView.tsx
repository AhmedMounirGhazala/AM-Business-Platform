import React, { useState } from 'react';
import {
  Scale,
  Activity,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Clock,
  ArrowRight,
  TrendingUp,
  Recycle,
  Sparkles,
  BarChart2,
  Layers,
  ChevronRight,
  UserCheck,
  XCircle,
  AlertOctagon
} from 'lucide-react';
import { ManufacturingYieldSpcShiftEngine } from '../../engine/manufacturingYieldSpcShiftEngine';
import {
  SpcStudy,
  DigitalShiftHandover,
  ProductionYieldAnalysis,
  ScrapRecoveryHarvest,
  YieldFinancialEvent,
  LineBalanceMetrics,
  HeijunkaSchedule
} from '../../types/manufacturingYieldSpcShift';

export const ManufacturingYieldSpcShiftView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'spc' | 'shiftHandover' | 'yieldScrap' | 'lineBalancing'>('spc');

  // -------------------------------------------------------------------------
  // SPC State
  // -------------------------------------------------------------------------
  const [selectedStudy, setSelectedStudy] = useState<SpcStudy>(() => {
    const study = ManufacturingYieldSpcShiftEngine.createSpcStudy({
      tenantId: 'TEN-01',
      companyId: 'COMP-01',
      studyCode: 'SPC-BEARING-6204',
      workCenterId: 'WC-CNC-01',
      productSku: 'PART-BEARING-6204',
      parameterName: 'Outer Ring Diameter',
      unitOfMeasure: 'mm',
      usl: 47.020,
      lsl: 46.980,
      nominalTarget: 47.000
    });

    // Seed baseline subgroups
    ManufacturingYieldSpcShiftEngine.recordSubgroup({
      studyId: study.id,
      operatorId: 'OP-CHENG',
      sampleValues: [47.002, 47.004, 46.998, 47.001, 46.995]
    });
    ManufacturingYieldSpcShiftEngine.recordSubgroup({
      studyId: study.id,
      operatorId: 'OP-CHENG',
      sampleValues: [47.003, 47.001, 46.999, 47.002, 47.000]
    });
    const { study: updated } = ManufacturingYieldSpcShiftEngine.recordSubgroup({
      studyId: study.id,
      operatorId: 'OP-KOWALSKI',
      sampleValues: [47.001, 47.003, 47.000, 46.999, 47.002]
    });

    return updated;
  });

  const [sampleInput, setSampleInput] = useState('47.002, 47.004, 46.999, 47.001, 47.003');
  const [spcOperator, setSpcOperator] = useState('OP-104');
  const [spcFeedback, setSpcFeedback] = useState<string | null>(null);

  const handleRecordSubgroup = (valuesArray?: number[]) => {
    try {
      let values: number[];
      if (valuesArray) {
        values = valuesArray;
      } else {
        values = sampleInput.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
      }
      if (values.length === 0) throw new Error('Please enter valid numeric sample values separated by commas.');

      const { study, newViolations } = ManufacturingYieldSpcShiftEngine.recordSubgroup({
        studyId: selectedStudy.id,
        operatorId: spcOperator,
        sampleValues: values
      });

      setSelectedStudy({ ...study });
      if (newViolations.length > 0) {
        setSpcFeedback(`Subgroup recorded with ${newViolations.length} SPC rule violation(s) detected!`);
      } else {
        setSpcFeedback(`Subgroup recorded successfully. Grand Mean: ${study.controlLimits.centerLine.toFixed(4)} mm, Cpk: ${study.capability?.cpk ?? 'N/A'}`);
      }
    } catch (err: any) {
      setSpcFeedback(`Error: ${err.message}`);
    }
  };

  // -------------------------------------------------------------------------
  // Digital Shift Handover State
  // -------------------------------------------------------------------------
  const [activeHandover, setActiveHandover] = useState<DigitalShiftHandover>(() => {
    return ManufacturingYieldSpcShiftEngine.initiateShiftHandover({
      tenantId: 'TEN-01',
      companyId: 'COMP-01',
      handoverCode: 'SHF-LINE01-M-20260903',
      productionLineId: 'LINE-PRECISION-01',
      shiftDate: '2026-09-03',
      shiftType: 'MORNING',
      outgoingSupervisorId: 'SUP-SARAH-CHEN',
      incomingSupervisorId: 'SUP-MARCUS-VANCE',
      safetyChecklist: [
        { itemCode: 'LOTO-01', description: 'Lock-Out/Tag-Out verification on CNC Spindles', verified: true },
        { itemCode: 'E-STOP', description: 'Emergency Stop circuit actuation verified', verified: true },
        { itemCode: '5S-CLEAN', description: 'Workstation 5S chip sweep & fluid catch cleaned', verified: true }
      ],
      wipItems: [
        {
          itemSku: 'PART-BEARING-6204',
          lotNumber: 'LOT-2026-0903-A',
          workCenterId: 'WC-CNC-01',
          theoreticalSystemQty: 450,
          physicalCountedQty: 450
        },
        {
          itemSku: 'PART-SHAFT-STEEL-20',
          lotNumber: 'LOT-2026-0902-C',
          workCenterId: 'WC-LATHE-02',
          theoreticalSystemQty: 200,
          physicalCountedQty: 198 // -1% variance within tolerance
        }
      ],
      openAndonIncidentsCount: 0,
      openMaintenanceOrdersCount: 1
    });
  });
  const [handoverFeedback, setHandoverFeedback] = useState<string | null>(null);

  const handleOutgoingSign = () => {
    try {
      const updated = ManufacturingYieldSpcShiftEngine.signOutgoingShift({
        handoverId: activeHandover.id,
        supervisorId: activeHandover.outgoingSupervisorId,
        supervisorName: 'Sarah Chen',
        role: 'Morning Shift Production Supervisor'
      });
      setActiveHandover({ ...updated });
      setHandoverFeedback('Outgoing Supervisor digital cryptographic signature recorded (Status: OUTGOING_SIGNED).');
    } catch (err: any) {
      setHandoverFeedback(`Error: ${err.message}`);
    }
  };

  const handleIncomingSign = () => {
    try {
      const updated = ManufacturingYieldSpcShiftEngine.completeShiftHandover({
        handoverId: activeHandover.id,
        supervisorId: activeHandover.incomingSupervisorId,
        supervisorName: 'Marcus Vance',
        role: 'Afternoon Shift Production Supervisor',
        acceptDiscrepancies: true
      });
      setActiveHandover({ ...updated });
      setHandoverFeedback('Custody transferred! Shift handover completed with dual cryptographic signatures.');
    } catch (err: any) {
      setHandoverFeedback(`Error: ${err.message}`);
    }
  };

  // -------------------------------------------------------------------------
  // Yield & Scrap Recovery State
  // -------------------------------------------------------------------------
  const [plannedOutput, setPlannedOutput] = useState(1000);
  const [actualGood, setActualGood] = useState(960);
  const [actualScrap, setActualScrap] = useState(40);
  const [materialCost, setMaterialCost] = useState(14.50);
  const [yieldResult, setYieldResult] = useState<{ analysis: ProductionYieldAnalysis; financialEvent: YieldFinancialEvent } | null>(null);

  const [regrindKg, setRegrindKg] = useState(85);
  const [regrindRate, setRegrindRate] = useState(1.90);
  const [scrapRecoveryResult, setScrapRecoveryResult] = useState<{ harvest: ScrapRecoveryHarvest; financialEvent: YieldFinancialEvent } | null>(null);

  const handleAnalyzeYield = () => {
    try {
      const res = ManufacturingYieldSpcShiftEngine.analyzeProductionYield({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        manufacturingOrderId: 'MO-2026-0903-88',
        productSku: 'PART-BEARING-6204',
        plannedOutputQty: plannedOutput,
        actualGoodQty: actualGood,
        actualScrapQty: actualScrap,
        standardScrapAllowancePct: 2.5,
        materialCostPerUnit: materialCost,
        performedBy: 'COST-ENGINEER-01'
      });
      setYieldResult(res);
    } catch (err: any) {
      alert(`Yield Analysis Error: ${err.message}`);
    }
  };

  const handleHarvestScrap = () => {
    try {
      const res = ManufacturingYieldSpcShiftEngine.harvestScrapRecovery({
        tenantId: 'TEN-01',
        companyId: 'COMP-01',
        manufacturingOrderId: 'MO-2026-0903-88',
        recoveredMaterialSku: 'REGRIND-STEEL-SWARF',
        quantityRecoveredKg: regrindKg,
        recoveryGrade: 'GRADE_PREMIUM_REGRIND',
        unitCreditRate: regrindRate,
        targetWarehouseId: 'WH-METALS-01',
        targetBinId: 'BIN-RECYCLE-A3',
        lotNumber: `LOT-RGR-${Date.now().toString().slice(-4)}`,
        operatorId: 'OP-ECO-RECOVERY'
      });
      setScrapRecoveryResult(res);
    } catch (err: any) {
      alert(`Scrap Recovery Error: ${err.message}`);
    }
  };

  // -------------------------------------------------------------------------
  // Line Balancing State
  // -------------------------------------------------------------------------
  const [lineMetrics, setLineMetrics] = useState<LineBalanceMetrics>(() => {
    return ManufacturingYieldSpcShiftEngine.evaluateLineBalance({
      productionLineId: 'LINE-PRECISION-01',
      taktTimeSeconds: 45,
      stations: [
        { workCenterId: 'ST-01', operationName: 'Blank Cut & Prep', cycleTimeSeconds: 38, standardCycleTimeSeconds: 40, headcount: 1 },
        { workCenterId: 'ST-02', operationName: 'CNC Rough Turn', cycleTimeSeconds: 51, standardCycleTimeSeconds: 45, headcount: 2 },
        { workCenterId: 'ST-03', operationName: 'Grind & Honing', cycleTimeSeconds: 42, standardCycleTimeSeconds: 40, headcount: 1 },
        { workCenterId: 'ST-04', operationName: 'Clean & Ultrasonic Wash', cycleTimeSeconds: 34, standardCycleTimeSeconds: 35, headcount: 1 },
        { workCenterId: 'ST-05', operationName: 'Assembly & Laser Check', cycleTimeSeconds: 40, standardCycleTimeSeconds: 40, headcount: 2 }
      ]
    });
  });

  const [heijunkaSchedule, setHeijunkaSchedule] = useState<HeijunkaSchedule>(() => {
    return ManufacturingYieldSpcShiftEngine.generateHeijunkaSchedule({
      productionLineId: 'LINE-PRECISION-01',
      scheduleDate: '2026-09-03',
      pitchMinutes: 20,
      shiftHours: 8,
      productMixRatio: {
        'PART-BEARING-6204': 50,
        'PART-BEARING-6305': 35,
        'PART-BEARING-CUSTOM': 15
      },
      dailyTotalUnits: 288
    });
  });

  return (
    <div className="space-y-6">
      {/* Subtab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1">
        {[
          { id: 'spc', label: 'SPC & Six Sigma Control Charts', icon: Activity },
          { id: 'shiftHandover', label: 'Digital Shift Handover Governance', icon: ShieldCheck },
          { id: 'yieldScrap', label: 'Yield Variance & Scrap Recovery', icon: Recycle },
          { id: 'lineBalancing', label: 'Line Balancing & Heijunka Pitch', icon: Scale }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: SPC CONTROL CHARTS */}
      {activeSubTab === 'spc' && (
        <div className="space-y-6">
          {/* Header Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Process Capability Cpk</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {selectedStudy.capability?.cpk.toFixed(2) ?? '1.45'}
                </span>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                  (selectedStudy.capability?.cpk ?? 0) >= 1.33
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {selectedStudy.capability?.rating ?? 'CAPABLE'}
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Cp: {selectedStudy.capability?.cp.toFixed(2) ?? '1.52'} • Sigma: {selectedStudy.controlLimits.sigmaEstimate.toFixed(4)}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estimated Defect PPM</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {selectedStudy.capability?.defectPpmEstimated ?? 3} PPM
                </span>
                <span className="text-xs text-emerald-600 font-medium">Six Sigma Target &lt; 3.4</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">Normal distribution tail probability</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Center Line (Grand Mean)</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {selectedStudy.controlLimits.centerLine.toFixed(4)} mm
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Nominal: {selectedStudy.nominalTarget.toFixed(3)} mm [LSL: {selectedStudy.lsl.toFixed(3)}, USL: {selectedStudy.usl.toFixed(3)}]
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quarantine & Status</div>
              <div className="mt-1 flex items-baseline gap-2">
                {selectedStudy.quarantineTriggered ? (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    QUARANTINE ACTIVE
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    IN STATISTICAL CONTROL
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {selectedStudy.violations.length} total rule violations logged
              </div>
            </div>
          </div>

          {/* SPC Chart Visualizer & Subgroup Recorder */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    X-bar Control Chart ({selectedStudy.parameterName})
                  </h3>
                  <p className="text-xs text-slate-500">
                    UCL: {selectedStudy.controlLimits.ucl.toFixed(4)} mm • Center Line: {selectedStudy.controlLimits.centerLine.toFixed(4)} mm • LCL: {selectedStudy.controlLimits.lcl.toFixed(4)} mm
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300">
                    n = {selectedStudy.subgroups[0]?.sampleValues.length || 5}
                  </span>
                </div>
              </div>

              {/* Graphical Trend Representation */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex justify-between text-xs font-mono text-rose-500 border-b border-rose-200 dark:border-rose-900 pb-1">
                  <span>UCL: {selectedStudy.controlLimits.ucl.toFixed(4)}</span>
                  <span>+3σ Limit</span>
                </div>

                {/* Subgroup Points Visualization */}
                <div className="h-40 flex items-center justify-between px-4 relative">
                  <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-indigo-400 opacity-60"></div>
                  {selectedStudy.subgroups.map((sg, idx) => {
                    const cl = selectedStudy.controlLimits.centerLine || 47.000;
                    const ucl = selectedStudy.controlLimits.ucl || 47.015;
                    const lcl = selectedStudy.controlLimits.lcl || 46.985;
                    const rangeSpan = Math.max(0.001, ucl - lcl);
                    // Normalization to 0..100%
                    const pct = Math.min(100, Math.max(0, ((sg.mean - lcl) / rangeSpan) * 100));
                    const isViolating = sg.mean > ucl || sg.mean < lcl;

                    return (
                      <div key={idx} className="flex flex-col items-center group relative">
                        <div
                          style={{ bottom: `${pct}%` }}
                          className={`absolute w-3 h-3 rounded-full border-2 transform -translate-x-1/2 ${
                            isViolating
                              ? 'bg-rose-600 border-rose-300 animate-pulse'
                              : 'bg-indigo-600 border-white dark:border-slate-900'
                          }`}
                        />
                        <span className="absolute -bottom-6 text-[10px] text-slate-500 font-mono">
                          #{idx + 1}
                        </span>
                        {/* Tooltip */}
                        <div className="hidden group-hover:block absolute bottom-8 z-10 bg-slate-900 text-white text-[11px] p-1.5 rounded shadow whitespace-nowrap">
                          Mean: {sg.mean.toFixed(4)} mm<br />
                          Range: {sg.range.toFixed(4)} mm<br />
                          Op: {sg.operatorId}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between text-xs font-mono text-rose-500 border-t border-rose-200 dark:border-rose-900 pt-1">
                  <span>LCL: {selectedStudy.controlLimits.lcl.toFixed(4)}</span>
                  <span>-3σ Limit</span>
                </div>
              </div>

              {/* Violations Log */}
              {selectedStudy.violations.length > 0 && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-1.5">
                  <div className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    Western Electric & Nelson Rule Violations
                  </div>
                  {selectedStudy.violations.slice(-3).map((v, i) => (
                    <div key={i} className="text-xs text-rose-800 dark:text-rose-300 font-mono">
                      • [{v.ruleId}] {v.ruleDescription} (Trigger: {v.triggerValue.toFixed(4)})
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subgroup Entry Form */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Record Subgroup Sample</span>
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Operator Badge ID
                  </label>
                  <input
                    type="text"
                    value={spcOperator}
                    onChange={e => setSpcOperator(e.target.value)}
                    className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Sample Readings (n=5, comma separated)
                  </label>
                  <input
                    type="text"
                    value={sampleInput}
                    onChange={e => setSampleInput(e.target.value)}
                    placeholder="47.001, 47.002, 46.999..."
                    className="mt-1 w-full px-3 py-1.5 font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRecordSubgroup()}
                    className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition-colors"
                  >
                    Post Subgroup
                  </button>
                  <button
                    onClick={() => handleRecordSubgroup([47.030, 47.032, 47.028, 47.031, 47.029])}
                    className="px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-lg hover:bg-rose-100"
                    title="Simulate Out of Control Point to test Rule 1"
                  >
                    Simulate +3σ Breach
                  </button>
                </div>

                {spcFeedback && (
                  <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200">
                    {spcFeedback}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: DIGITAL SHIFT HANDOVER */}
      {activeSubTab === 'shiftHandover' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {activeHandover.handoverCode}
                  </span>
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                    activeHandover.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : activeHandover.status === 'OUTGOING_SIGNED'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                  }`}>
                    {activeHandover.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Line: {activeHandover.productionLineId} • Shift: {activeHandover.shiftType} ({activeHandover.shiftDate}) • Outgoing: {activeHandover.outgoingSupervisorId} • Incoming: {activeHandover.incomingSupervisorId}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {activeHandover.status === 'INITIATED' && (
                  <button
                    onClick={handleOutgoingSign}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow"
                  >
                    <UserCheck className="w-4 h-4" />
                    Sign as Outgoing Supervisor
                  </button>
                )}

                {activeHandover.status === 'OUTGOING_SIGNED' && (
                  <button
                    onClick={handleIncomingSign}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Accept Custody & Complete Handover
                  </button>
                )}
              </div>
            </div>

            {handoverFeedback && (
              <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-xs text-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                {handoverFeedback}
              </div>
            )}

            {/* Safety & WIP Snapshot Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Safety Checklist */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Safety, LOTO & 5S Handover Checklist</span>
                </h4>
                <div className="space-y-2">
                  {activeHandover.safetyChecklist.map((item, i) => (
                    <div key={i} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">[{item.itemCode}]</span>{' '}
                        <span className="text-slate-600 dark:text-slate-400">{item.description}</span>
                      </div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* WIP Inventory Count & Variance */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>Work-in-Progress (WIP) Physical Custody</span>
                </h4>
                <div className="space-y-2">
                  {activeHandover.wipItems.map((item, i) => (
                    <div key={i} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{item.itemSku}</div>
                        <div className="text-slate-500">Lot: {item.lotNumber} • Center: {item.workCenterId}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-slate-900 dark:text-white">
                          Counted: {item.physicalCountedQty} / Sys: {item.theoreticalSystemQty}
                        </div>
                        <div className={`text-[11px] font-bold ${
                          item.discrepancyFlag
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          Var: {item.varianceQty} ({item.variancePct}%) {item.discrepancyFlag && '⚠️ FLAG'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cryptographic Signatures */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="font-bold text-slate-700 dark:text-slate-300">Outgoing Supervisor Signature:</div>
                {activeHandover.outgoingSignature ? (
                  <div className="text-emerald-600 dark:text-emerald-400 mt-1 break-all">
                    SIGNED by {activeHandover.outgoingSignature.supervisorName} ({activeHandover.outgoingSignature.role})<br />
                    Token: {activeHandover.outgoingSignature.signatureToken.slice(0, 32)}...
                  </div>
                ) : (
                  <div className="text-slate-400 mt-1">Pending outgoing supervisor signature</div>
                )}
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="font-bold text-slate-700 dark:text-slate-300">Incoming Supervisor Signature:</div>
                {activeHandover.incomingSignature ? (
                  <div className="text-emerald-600 dark:text-emerald-400 mt-1 break-all">
                    SIGNED by {activeHandover.incomingSignature.supervisorName} ({activeHandover.incomingSignature.role})<br />
                    Token: {activeHandover.incomingSignature.signatureToken.slice(0, 32)}...
                  </div>
                ) : (
                  <div className="text-slate-400 mt-1">Pending incoming custody acceptance</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: YIELD & SCRAP RECOVERY */}
      {activeSubTab === 'yieldScrap' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Manufacturing Yield Variance */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-600" />
                <span>Order Production Yield Analyzer</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-500">Planned Output Qty</label>
                  <input
                    type="number"
                    value={plannedOutput}
                    onChange={e => setPlannedOutput(Number(e.target.value))}
                    className="mt-1 w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-slate-500">Actual Good Units</label>
                  <input
                    type="number"
                    value={actualGood}
                    onChange={e => setActualGood(Number(e.target.value))}
                    className="mt-1 w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-slate-500">Actual Scrap Units</label>
                  <input
                    type="number"
                    value={actualScrap}
                    onChange={e => setActualScrap(Number(e.target.value))}
                    className="mt-1 w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-slate-500">Standard Cost / Unit ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={materialCost}
                    onChange={e => setMaterialCost(Number(e.target.value))}
                    className="mt-1 w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  />
                </div>
              </div>

              <button
                onClick={handleAnalyzeYield}
                className="w-full px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow"
              >
                Calculate Yield Variance & Generate GL Postings
              </button>

              {yieldResult && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center font-bold">
                    <span>Yield Efficiency:</span>
                    <span className="text-indigo-600">{yieldResult.analysis.yieldEfficiencyPct}%</span>
                  </div>
                  <div className="flex justify-between items-center font-bold">
                    <span>Scrap Variance:</span>
                    <span className={yieldResult.analysis.isFavorableVariance ? 'text-emerald-600' : 'text-rose-600'}>
                      {yieldResult.analysis.scrapVarianceQty} units (${yieldResult.analysis.materialYieldVarianceCost.toFixed(2)}{' '}
                      {yieldResult.analysis.isFavorableVariance ? 'FAVORABLE' : 'UNFAVORABLE'})
                    </span>
                  </div>
                  <div className="font-mono text-[11px] pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="font-bold text-slate-700 dark:text-slate-300">GL Double-Entry Event:</div>
                    {yieldResult.financialEvent.glPostings.map((p, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{p.accountCode} - {p.accountName}</span>
                        <span>{p.debitAmount > 0 ? `DR $${p.debitAmount.toFixed(2)}` : `CR $${p.creditAmount.toFixed(2)}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Scrap Regrind Harvesting & Circular Recovery */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Recycle className="w-4 h-4 text-emerald-600" />
                <span>Circular Scrap Harvesting & Regrind Inflow</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-500">Recovered Scrap (kg)</label>
                  <input
                    type="number"
                    value={regrindKg}
                    onChange={e => setRegrindKg(Number(e.target.value))}
                    className="mt-1 w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-slate-500">Credit Rate ($ / kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={regrindRate}
                    onChange={e => setRegrindRate(Number(e.target.value))}
                    className="mt-1 w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  />
                </div>
              </div>

              <button
                onClick={handleHarvestScrap}
                className="w-full px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow"
              >
                Harvest Scrap to Secondary Inventory
              </button>

              {scrapRecoveryResult && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 space-y-2 text-xs">
                  <div className="flex justify-between items-center font-bold text-emerald-900 dark:text-emerald-200">
                    <span>Total Recovery Value:</span>
                    <span>${scrapRecoveryResult.harvest.totalRecoveryValue.toFixed(2)}</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px]">
                    Dest: {scrapRecoveryResult.harvest.targetWarehouseId} / {scrapRecoveryResult.harvest.targetBinId} • Lot: {scrapRecoveryResult.harvest.lotNumber}
                  </div>
                  <div className="font-mono text-[11px] pt-2 border-t border-emerald-200 dark:border-emerald-800 space-y-1">
                    <div className="font-bold text-emerald-800 dark:text-emerald-300">GL Double-Entry Postings:</div>
                    {scrapRecoveryResult.financialEvent.glPostings.map((p, i) => (
                      <div key={i} className="flex justify-between text-slate-800 dark:text-slate-200">
                        <span>{p.accountCode} - {p.accountName}</span>
                        <span>{p.debitAmount > 0 ? `DR $${p.debitAmount.toFixed(2)}` : `CR $${p.creditAmount.toFixed(2)}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: LINE BALANCING & HEIJUNKA */}
      {activeSubTab === 'lineBalancing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Line Efficiency</div>
              <div className="mt-1 text-2xl font-black text-indigo-600">
                {lineMetrics.lineBalanceEfficiencyPct}%
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Balance Delay: {lineMetrics.balanceDelayPct}%
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bottleneck Workstation</div>
              <div className="mt-1 text-2xl font-black text-rose-600">
                {lineMetrics.bottleneckStationId} ({lineMetrics.bottleneckCycleTimeSeconds}s)
              </div>
              <div className="mt-1 text-xs text-rose-500 font-medium">
                {lineMetrics.bottleneckStarvationAlert && '⚠️ Exceeds Takt Time (45s)'}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Smoothness Index (SI)</div>
              <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {lineMetrics.smoothnessIndex}
              </div>
              <div className="mt-1 text-xs text-slate-500">Root sum squared variance</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Heijunka Pitch Slots</div>
              <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {heijunkaSchedule.slots.length} Slots
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {heijunkaSchedule.pitchMinutes} min pitch • {heijunkaSchedule.dailyTotalUnits} units/day
              </div>
            </div>
          </div>

          {/* Heijunka Schedule Sequence Box */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Heijunka Leveling Box Schedule (Line: {heijunkaSchedule.productionLineId})</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {heijunkaSchedule.slots.map((slot, i) => (
                <div key={i} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1">
                  <div className="font-mono text-[10px] text-slate-500">{slot.timeSlot}</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 truncate" title={slot.productSku}>
                    {slot.productSku.replace('PART-BEARING-', '')}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-indigo-600 dark:text-indigo-400">
                    <span>Batch: {slot.batchQty}</span>
                    <span className="font-mono">{slot.kanbanCardId.slice(-7)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
