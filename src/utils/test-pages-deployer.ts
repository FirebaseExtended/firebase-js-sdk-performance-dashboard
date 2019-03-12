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

import * as client from 'firebase-tools';
import * as os from 'os';
import * as path from 'path';

import { projectId } from '../settings/test-project';
import { Sdk } from '../types/sdk';
import {
  ExecutionLatencyTestPage,
  NetworkLatencyTestPage,
} from '../types/web-page-test';
import { copyFile, mkdir, mkdtemp } from './fs-promise';
import * as helper from './sdk-helper';
import * as log from './test-logger';
import * as builder from './test-pages-builder';
const HOSTING_CONFIG = '../../configs/firebase.json';

export async function deployTestPages(
  sdks: Sdk[],
  version: string
): Promise<[NetworkLatencyTestPage[], ExecutionLatencyTestPage[]]> {
  const { dir, sdksDir } = await createTestTempDir();
  await helper.getInstrumentedSdks(sdks, version, sdksDir);
  const pages = await builder.buildTestPages(sdks, version, dir, sdksDir);
  await addHostingConfig(dir);
  await fireDeployment(dir);
  return pages;
}

async function createTestTempDir(): Promise<{ dir: string; sdksDir: string }> {
  const testPageDir = path.join(os.tmpdir(), 'test-pages-');
  const dir = (await mkdtemp(testPageDir, null)) as string;
  log.info(`Temp diretory created at [${dir}].`);
  const sdksDir = `${dir}/scripts`;
  await mkdir(sdksDir, null);
  return { dir, sdksDir };
}

async function addHostingConfig(testPageDir: string): Promise<void> {
  log.info(`Copying hosting config file to [${testPageDir}] ...`);
  await copyFile(
    path.resolve(__dirname, HOSTING_CONFIG),
    `${testPageDir}/firebase.json`,
    null
  );
}

async function fireDeployment(testPageDir: string): Promise<void> {
  log.info(`Deploying pages to [${projectId}.firebaseapp.com] ...`);
  await client.deploy({
    project: projectId,
    token: process.env.FIREBASE_TOKEN,
    cwd: testPageDir,
  });
}
