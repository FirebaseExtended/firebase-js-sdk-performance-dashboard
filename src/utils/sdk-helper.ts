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
import * as escape from 'js-string-escape';
import * as path from 'path';
import * as request from 'request';

import { Sdk } from '../types/sdk';
import { mkdir, readFile, writeFile } from './fs-promise';
import * as log from './test-logger';

const RELEASE_NOTE = 'https://www.gstatic.com/firebasejs/releases.json';
const INSTRUMENT_TEMPLATE = '../../configs/instrument-template.js';
const FIREBASE_NPM_REGISTRY = 'https://registry.npmjs.org/firebase';

export async function getLatestVersion(): Promise<string> {
  return new Promise((resolve, reject) => {
    request(RELEASE_NOTE, (err, res, body) => {
      if (err) {
        reject(err);
      } else {
        const obj = JSON.parse(body);
        const version = obj.current.version;
        log.info(`Latest version of JavaScript SDK: [${version}].`);
        resolve(version);
      }
    });
  });
}

export async function getInstrumentedSdks(
  sdks: Sdk[],
  version: string,
  targetDir: string
): Promise<void> {
  const originalDir = `${targetDir}/original`;
  await mkdir(originalDir, null);
  await Promise.all(sdks.map(x => download(x, version, originalDir)));
  await Promise.all(
    sdks.map(x =>
      instrument(
        path.resolve(__dirname, originalDir, x),
        path.resolve(__dirname, targetDir, x)
      )
    )
  );
}

export async function getVersionReleaseDate(version: string): Promise<Date> {
  return new Promise((resolve, reject) => {
    request(FIREBASE_NPM_REGISTRY, (err, res, body) => {
      if (err) {
        reject(err);
      } else {
        const obj = JSON.parse(body);
        const str = obj['time'][version];
        resolve(new Date(str));
      }
    });
  });
}

export async function download(
  sdk: Sdk,
  version: string,
  targetDir: string
): Promise<void> {
  const url = `https://www.gstatic.com/firebasejs/${version}/${sdk}`;
  log.info(`Downloading [${sdk}] from [${url}] ...`);
  const writeStream = fs.createWriteStream(
    path.resolve(__dirname, targetDir, sdk)
  );
  return new Promise((resolve, reject) => {
    request(url)
      .pipe(writeStream)
      .on('finish', resolve)
      .on('error', reject);
  });
}

export async function instrument(
  source: string,
  target: string
): Promise<void> {
  log.info(`Instrumenting sdk [${source}] to [${target}] ...`);
  const template = (await readFile(
    path.resolve(__dirname, INSTRUMENT_TEMPLATE),
    'utf-8'
  )) as string;
  const sdkname = path.basename(source);
  const script = escape(await readFile(source, 'utf-8'));
  const content = template
    .replace(/%script%/g, () => script)
    .replace(/%name%/g, sdkname);
  await writeFile(target, content, null);
}
