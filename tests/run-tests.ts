/**
 * Scaffolding.ai Test Runner
 * Executes unit tests for KiddieOps SRS requirements REQ01–REQ10.
 */

import { runAllKiddieOpsTests } from "./kiddieops.test";

async function main() {
  console.log("================================================================================");
  console.log("🚀 KiddieOps — Scaffolding.ai Automated Unit Test Runner");
  console.log("   Grounded in KiddieOps_SRS.docx (REQ01–REQ10 & Cloudinary Upload)");
  console.log("================================================================================\n");

  const startTime = Date.now();
  const results = await runAllKiddieOpsTests();
  const elapsed = Date.now() - startTime;

  let passedCount = 0;
  let failedCount = 0;

  console.log("REQ ID   | STATUS | TEST DESCRIPTION");
  console.log("---------+--------+-------------------------------------------------------------");

  for (const r of results) {
    const reqCol = r.reqId.padEnd(8);
    if (r.passed) {
      passedCount++;
      console.log(`\x1b[36m${reqCol}\x1b[0m | \x1b[32mPASS  \x1b[0m | ${r.testName}`);
    } else {
      failedCount++;
      console.log(`\x1b[31m${reqCol} | FAIL   | ${r.testName} (${r.message})\x1b[0m`);
    }
  }

  console.log("---------+--------+-------------------------------------------------------------");
  console.log(`\n📊 Test Execution Summary:`);
  console.log(`   Total Test Cases: ${results.length}`);
  console.log(`   Passed:           \x1b[32m${passedCount}\x1b[0m`);
  console.log(`   Failed:           ${failedCount > 0 ? `\x1b[31m${failedCount}\x1b[0m` : `0`}`);
  console.log(`   Success Rate:     \x1b[32m${((passedCount / results.length) * 100).toFixed(1)}%\x1b[0m`);
  console.log(`   Duration:         ${elapsed}ms\n`);

  if (failedCount > 0) {
    console.error("❌ Some unit tests failed.");
    process.exit(1);
  } else {
    console.log("✅ All Scaffolding.ai unit tests passed successfully!");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
