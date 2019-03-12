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

import * as dl from 'datalib';

import { Cdn } from '../types/cdn';
import { Connectivity } from '../types/connectivity';
import {
  BinarySizeSample,
  ExecutionLatencySample,
  MeasurementSample,
  NetworkLatencySample,
} from '../types/measurement-sample';
import {
  BinarySizeRecord,
  ExecutionLatencyRecord,
  NetworkLatencyRecord,
} from '../types/mesurement-record';
import { Metric } from '../types/metric';
import { Sdk } from '../types/sdk';
import * as log from './test-logger';

export class TestResultsAggregator {
  testRun: number;
  version: string;

  constructor(testRun: number, version: string) {
    this.testRun = testRun;
    this.version = version;
  }

  calcNetworkLatencies(
    samples: NetworkLatencySample[]
  ): NetworkLatencyRecord[] {
    log.info(`Aggregating [${samples.length}] network latency samples ...`);
    const records: NetworkLatencyRecord[] = [];
    const sdks: Sdk[] = dl.unique(samples, x => x.sdk);
    const devices: string[] = dl.unique(samples, x => x.device);
    const cdns: Cdn[] = dl.unique(samples, x => x.cdn);
    const connectivities: Connectivity[] = dl.unique(
      samples,
      x => x.connectivity
    );
    for (const sdk of sdks) {
      for (const device of devices) {
        for (const cdn of cdns) {
          for (const connectivity of connectivities) {
            const browserVersion = getBrowserVersion(samples, device);
            const ttfbMs = getMetricValue(samples, [
              x => x.sdk === sdk,
              x => x.cdn === cdn,
              x => x.connectivity === connectivity,
              x => x.device === device,
              x => x.metric_name === Metric.TimeToFirstByte,
            ]);
            const downloadMs = getMetricValue(samples, [
              x => x.sdk === sdk,
              x => x.cdn === cdn,
              x => x.connectivity === connectivity,
              x => x.device === device,
              x => x.metric_name === Metric.Download,
            ]);
            if (ttfbMs && downloadMs) {
              const record = {
                test_run: this.testRun,
                version: this.version,
                sdk,
                cdn,
                connectivity,
                device,
                browser_version: browserVersion,
                ttfb_ms: ttfbMs,
                download_ms: downloadMs,
              };
              records.push(record);
            }
          }
        }
      }
    }
    log.info('Network latency aggregation done.');
    return records;
  }

  calcExecutionLatencies(
    samples: ExecutionLatencySample[]
  ): ExecutionLatencyRecord[] {
    log.info(`Aggregating [${samples.length}] execution latency samples ...`);
    const records: ExecutionLatencyRecord[] = [];
    const sdks: Sdk[] = dl.unique(samples, x => x.sdk);
    const devices: string[] = dl.unique(samples, x => x.device);
    for (const sdk of sdks) {
      for (const device of devices) {
        const browserVersion = getBrowserVersion(samples, device);
        const parseMs = getMetricValue(samples, [
          x => x.sdk === sdk,
          x => x.device === device,
          x => x.metric_name === Metric.Parse,
        ]);
        const execMs = getMetricValue(samples, [
          x => x.sdk === sdk,
          x => x.device === device,
          x => x.metric_name === Metric.Execute,
        ]);
        if (parseMs && execMs) {
          const record: ExecutionLatencyRecord = {
            test_run: this.testRun,
            version: this.version,
            sdk,
            device,
            browser_version: browserVersion,
            parse_ms: parseMs,
            exec_ms: execMs,
          };
          records.push(record);
        }
      }
    }
    log.info('Execution latency samples aggregation done.');
    return records;
  }

  calcBinarySizes(samples: BinarySizeSample[]): BinarySizeRecord[] {
    log.info('Aggregating binary size samples ...');
    const records: BinarySizeRecord[] = [];
    const sdks: Sdk[] = dl.unique(samples, x => x.sdk);
    for (const sdk of sdks) {
      const sizeByte = getMetricValue(samples, [
        x => x.sdk === sdk,
        x => x.metric_name === Metric.Size,
      ]);
      if (sizeByte) {
        const record: BinarySizeRecord = {
          test_run: this.testRun,
          version: this.version,
          sdk,
          size_byte: sizeByte,
        };
        records.push(record);
      }
    }
    log.info('Aggregating binary size samples done.');
    return records;
  }
}

function getMetricValue<T extends MeasurementSample>(
  samples: T[],
  predicates: Array<(x: T) => boolean>
): number {
  const predicate = (x: T) => predicates.reduce((r, p) => r && p(x), true);
  const records = samples.filter(predicate);
  return dl.mean(records, (x: T) => x.metric_value);
}

function getBrowserVersion(
  samples: Array<NetworkLatencySample | ExecutionLatencySample>,
  device: string
): string {
  const records = samples.filter(x => x.device === device);
  return records[0].browser_version;
}
