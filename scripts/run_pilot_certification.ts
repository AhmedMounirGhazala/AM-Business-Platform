import { PilotCertificationGateSuite } from '../src/engine/pilotCertificationGateSuite';

async function run() {
  console.log('========================================================================================');
  console.log('AM ENTERPRISE ERP — AUTHORITATIVE PILOT CERTIFICATION GATE EXECUTION (25 SCENARIOS)');
  console.log('========================================================================================\n');

  const report = await PilotCertificationGateSuite.runAll();

  console.log('+----+---------------------------------------+-------------------+-----------------+---------------------+---------+');
  console.log('| #  | SCENARIO NAME                         | CATEGORY          | STATUS          | HW AVAILABILITY     | VERDICT |');
  console.log('+----+---------------------------------------+-------------------+-----------------+---------------------+---------+');

  for (const r of report.results) {
    const num = String(r.scenarioNumber).padStart(2, ' ');
    const name = r.name.padEnd(37, ' ').slice(0, 37);
    const cat = r.category.padEnd(17, ' ').slice(0, 17);
    const status = r.status.padEnd(15, ' ').slice(0, 15);
    const hw = r.hardwareAvailability.padEnd(19, ' ').slice(0, 19);
    const verdict = r.verdict.padEnd(7, ' ').slice(0, 7);
    console.log(`| ${num} | ${name} | ${cat} | ${status} | ${hw} | ${verdict} |`);
    if (r.status === 'BLOCKED') {
      console.log(`  --> DETAILS: ${r.message}`);
    }
  }

  console.log('+----+---------------------------------------+-------------------+-----------------+---------------------+---------+\n');

  console.log('----------------------------------------------------------------------------------------');
  console.log(`TOTAL SCENARIOS        : ${report.totalScenarios}`);
  console.log(`PASSED (SOFTWARE/LOGIC): ${report.passedScenarios}`);
  console.log(`SIMULATED (HARDWARE)   : ${report.simulatedScenarios}`);
  console.log(`NOT CONNECTED          : ${report.notConnectedScenarios}`);
  console.log(`BLOCKED                : ${report.blockedScenarios}`);
  console.log(`OVERALL PILOT VERDICT  : [ ${report.overallPilotVerdict} ]`);
  console.log(`SUMMARY                : ${report.summaryMessage}`);
  console.log('----------------------------------------------------------------------------------------\n');

  if (report.overallPilotVerdict !== 'PILOT_GO') {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal certification execution error:', err);
  process.exit(1);
});
