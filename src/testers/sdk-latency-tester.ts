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

import { projectId } from '../settings/test-project';
import { apiKey, server } from '../settings/web-page-test';
import { Cdn } from '../types/cdn';
import { Connectivity } from '../types/connectivity';
import { Device } from '../types/device';
import {
  ExecutionLatencySample,
  NetworkLatencySample,
} from '../types/measurement-sample';
import { deserialize as deserializeMetric, Metric } from '../types/metric';
import { deserialize as deserializeSdk, Sdk } from '../types/sdk';
import {
  ExecutionLatencyTestPage,
  NetworkLatencyTestPage,
} from '../types/web-page-test';
import * as log from '../utils/test-logger';
import * as deployer from '../utils/test-pages-deployer';
import { WebPageTestClient } from '../utils/web-page-test-client';

const client = new WebPageTestClient(server, apiKey, 60000);

export async function run(
  sdks: Sdk[],
  version: string,
  devices: Device[],
  connectivities: Connectivity[]
): Promise<[NetworkLatencySample[], ExecutionLatencySample[]]> {
  log.info('Start to measure sdk startup latencies ...');
  const pages = await deployer.deployTestPages(sdks, version);
  const [networkLatencyPages, executionLatencyPages] = pages;
  const [networkLatencySamples, executionLatencySamples] = await Promise.all([
    testNetworkLatencyPages(networkLatencyPages, devices, connectivities),
    testExecutionLatencyPages(executionLatencyPages, devices),
  ]);
  log.info('Sdk startup latency measurements finished.');
  return [networkLatencySamples, executionLatencySamples];
}

async function testNetworkLatencyPages(
  pages: NetworkLatencyTestPage[],
  devices: Device[],
  connectivities: Connectivity[]
): Promise<NetworkLatencySample[]> {
  const promises: Array<Promise<NetworkLatencySample[]>> = [];
  for (const page of pages) {
    for (const device of devices) {
      for (const connectivity of connectivities) {
        const url = `https://${projectId}.firebaseapp.com/${page.path}`;
        promises.push(
          testNetworkLatencyPage(url, page.cdn, device, connectivity)
        );
      }
    }
  }
  const samples = await Promise.all(promises);
  return [].concat(...samples);
}

async function testNetworkLatencyPage(
  url: string,
  cdn: Cdn,
  device: Device,
  connectivity: Connectivity
): Promise<NetworkLatencySample[]> {
  try {
    const result = await client.submitTest(url, device, connectivity);
    return parseNetworkLatencyResult(url, device, cdn, connectivity, result);
  } catch (error) {
    log.warn(
      `Network latency test for [${url}] on [${device.id}] with ` +
        `[${connectivity}] errored: [${JSON.stringify(error)}]. Test skipped.`
    );
    return [];
  }
}

async function parseNetworkLatencyResult(
  url: string,
  device: Device,
  cdn: Cdn,
  connectivity: Connectivity,
  // tslint:disable-next-line:no-any
  result: any
): Promise<NetworkLatencySample[]> {
  function url2filename(url: string): string {
    return url.substring(url.lastIndexOf('/') + 1);
  }
  const samples: NetworkLatencySample[] = [];
  for (const run of Object.keys(result.data.runs)) {
    try {
      const firstView = result.data.runs[run].firstView;
      const browserVersion = firstView.browserVersion;
      const requests = firstView.requests;
      for (const request of requests) {
        const filename = url2filename(request.url);
        const sdk = deserializeSdk(filename);
        if (sdk) {
          const base = {
            run_id: run,
            sdk,
            device: device.id,
            browser_version: browserVersion,
            cdn,
            connectivity,
          };
          samples.push(
            Object.assign({}, base, {
              metric_name: Metric.TimeToFirstByte,
              metric_value: request.ttfb_ms,
            })
          );
          samples.push(
            Object.assign({}, base, {
              metric_name: Metric.Download,
              metric_value: request.download_ms,
            })
          );
        }
      }
    } catch (error) {
      log.warn(
        `Failed to extract [${run}-th] run data for [${url}] on ` +
          `[${device.id}] with [${connectivity}]: [${error}]. Skipping the run.`
      );
    }
  }
  return samples;
}

async function testExecutionLatencyPages(
  pages: ExecutionLatencyTestPage[],
  devices: Device[]
): Promise<ExecutionLatencySample[]> {
  const promises: Array<Promise<ExecutionLatencySample[]>> = [];
  for (const page of pages) {
    for (const device of devices) {
      const url = `https://${projectId}.firebaseapp.com/${page.path}`;
      promises.push(testExecutionLatencyPage(url, device));
    }
  }
  const samples = await Promise.all(promises);
  return [].concat(...samples);
}

async function testExecutionLatencyPage(
  url: string,
  device: Device
): Promise<ExecutionLatencySample[]> {
  try {
    const result = await client.submitTest(url, device, Connectivity.Cable);
    return parseExecutionLatencyResult(url, device, result);
  } catch (error) {
    log.warn(
      `Execution latency test for [${url}] on [${device.id}] with ` +
        `errored: [${JSON.stringify(error)}]. Test skipped.`
    );
    return [];
  }
}

async function parseExecutionLatencyResult(
  url: string,
  device: Device,
  // tslint:disable-next-line:no-any
  result: any
): Promise<ExecutionLatencySample[]> {
  const samples: ExecutionLatencySample[] = [];
  for (const run of Object.keys(result.data.runs)) {
    try {
      const firstView = result.data.runs[run].firstView;
      const browserVersion = firstView.browserVersion;
      const userTimingMeasures = firstView.userTimingMeasures;
      // tslint:disable-next-line:no-any
      for (const measure of Object.values(userTimingMeasures) as any) {
        const [fileName, metricName] = measure.name.split('___');
        const sdk = deserializeSdk(fileName);
        const metric = deserializeMetric(metricName);
        if (sdk && metric) {
          samples.push({
            run_id: run,
            sdk,
            device: device.id,
            browser_version: browserVersion,
            metric_name: metric,
            metric_value: measure.duration,
          });
        }
      }
    } catch (error) {
      const message =
        `Failed to extract [${run}-th] run data for [${url}] ` +
        `on [${device.id}]: [${error}]. Skipping this run.`;
      log.warn(message);
    }
  }
  return samples;
}
