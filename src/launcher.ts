/**
 * @license
 * Copyright 2019 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { argv } from 'yargs';

import * as sql from './settings/cloud-sql';
import * as connectivity from './settings/connectivities';
import * as device from './settings/devices';
import { sdks } from './settings/sdks';
import * as latencyTester from './testers/sdk-latency-tester';
import * as sizeTester from './testers/sdk-size-tester';
import { CloudSqlClient } from './utils/cloud-sql-client';
import * as helper from './utils/sdk-helper';
import * as log from './utils/test-logger';
import { TestResultsAggregator } from './utils/test-results-aggregator';

async function run(testRun: number): Promise<void> {
  const latest = await helper.getLatestVersion();
  const version = (argv['sdk-version'] as string) || latest;
  log.info(`Latest version: [${latest}], testing: [${version}].`);

  const trial = !!argv['trial'];
  const connectivities = trial ? connectivity.trial : connectivity.official;
  const devices = trial ? device.trial : device.official;
  const database = trial ? sql.trial : sql.official;

  log.info('Startup Latency and Binary Size Test started ...');
  log.info(`TestRun [${testRun}], version [${version}], trial? [${trial}].`);

  const [
    networkLatencySamples,
    executionLatencySamples,
  ] = await latencyTester.run(sdks, version, devices, connectivities);
  const binarySizeSamples = await sizeTester.run(sdks, version);

  const aggregator = new TestResultsAggregator(testRun, version);
  const [netLatencies, execLatencies, binarySizes] = [
    aggregator.calcNetworkLatencies(networkLatencySamples),
    aggregator.calcExecutionLatencies(executionLatencySamples),
    aggregator.calcBinarySizes(binarySizeSamples),
  ];

  if (trial) {
    log.info('Network latency raw samples:', networkLatencySamples);
    log.info('Execution latency raw samples:', executionLatencySamples);
    log.info('Binary size raw samples:', binarySizeSamples);
    log.info('Network latency aggregated records:', netLatencies);
    log.info('Execution latency aggregated records:', execLatencies);
    log.info('Binary size aggregated records:', binarySizes);
  }

  const client = await new CloudSqlClient(database).initialize();
  await client.uploadMeasurements(netLatencies, execLatencies, binarySizes);
  await client.terminate();

  log.info('Startup Latency and Binary Size Test finished.');
}

async function launch(): Promise<void> {
  const now = Date.now();
  const testRun = Math.round(now / 1000);
  try {
    await run(testRun);
  } catch (error) {
    log.error(`Test failed: ${error}.`);
    process.exitCode = 1;
  } finally {
    log.info(`Test finished in ${(Date.now() - now) / 1000}s.`);
    // Unclosed web sockets created by firebase tools stop node from exiting.
    // See https://github.com/firebase/firebase-tools/issues/118.
    process.exit();
  }
}

launch().catch(error => {
  log.error(error);
});
