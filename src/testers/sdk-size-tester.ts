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

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { BinarySizeSample } from '../types/measurement-sample';
import { Metric } from '../types/metric';
import { Sdk } from '../types/sdk';
import { mkdtemp } from '../utils/fs-promise';
import * as helper from '../utils/sdk-helper';
import * as log from '../utils/test-logger';

export async function run(
  sdks: Sdk[],
  version: string
): Promise<BinarySizeSample[]> {
  log.info('Start to measure sdk binary sizes ...');
  const dir = (await mkdtemp(path.join(os.tmpdir(), 'sdks-'), null)) as string;
  await Promise.all(sdks.map(x => helper.download(x, version, dir)));
  const promises = sdks.map(sdk => sample(sdk, dir));
  const samples = await Promise.all(promises);
  log.info('Sdk binary size measurements finished.');
  return samples;
}

async function sample(sdk: Sdk, dir: string): Promise<BinarySizeSample> {
  const size = await getFileSize(path.resolve(dir, sdk));
  return { sdk, metric_name: Metric.Size, metric_value: size };
}

async function getFileSize(path: string): Promise<number> {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats.size);
      }
    });
  });
}
