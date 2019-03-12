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

export const enum Metric {
  TimeToFirstByte = 'ttfb_ms',
  Download = 'download_ms',
  Parse = 'parse_ms',
  Execute = 'exec_ms',
  Size = 'size_byte',
}

export const metrics = [
  Metric.TimeToFirstByte,
  Metric.Download,
  Metric.Parse,
  Metric.Execute,
  Metric.Size,
];

export function deserialize(name: string): Metric {
  for (const metric of metrics) {
    if (metric === name) {
      return metric;
    }
  }
  return null;
}
