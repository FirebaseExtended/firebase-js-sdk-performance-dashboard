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

import { Cdn } from './cdn';
import { Connectivity } from './connectivity';
import { Metric } from './metric';
import { Sdk } from './sdk';

export interface MeasurementSample {
  sdk: Sdk;
  metric_name: Metric;
  metric_value: number;
}

export interface NetworkLatencySample extends MeasurementSample {
  run_id: string;
  device: string;
  browser_version: string;
  cdn: Cdn;
  connectivity: Connectivity;
}

export interface ExecutionLatencySample extends MeasurementSample {
  run_id: string;
  device: string;
  browser_version: string;
}

export interface BinarySizeSample extends MeasurementSample {}
