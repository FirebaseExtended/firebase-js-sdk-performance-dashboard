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

import * as cheerio from 'cheerio';
import * as path from 'path';
import * as log from './test-logger';

import { Cdn } from '../types/cdn';
import { Sdk } from '../types/sdk';
import {
  ExecutionLatencyTestPage,
  NetworkLatencyTestPage,
} from '../types/web-page-test';
import { writeFile } from './fs-promise';

export async function buildTestPages(
  sdks: Sdk[],
  version: string,
  dir: string,
  sdksDir: string
): Promise<[NetworkLatencyTestPage[], ExecutionLatencyTestPage[]]> {
  return Promise.all([
    Promise.all([
      createFastlyCdnTestPage(sdks, version, dir),
      createGoogleCdnTestPage(sdks, version, dir),
    ]),
    Promise.all([createInstrumentedSdkTestPage(sdks, dir, sdksDir)]),
  ]);
}

async function createFastlyCdnTestPage(
  sdks: Sdk[],
  version: string,
  dir: string
): Promise<NetworkLatencyTestPage> {
  const prefix = '/__/firebase';
  const scriptTags = sdks.map(
    sdk => `<script src="${prefix}/${version}/${sdk}"></script>`
  );
  const testPagePath = `${dir}/fastly-cdn.html`;
  await createTestPage(scriptTags, testPagePath);
  return {
    path: 'fastly-cdn.html',
    cdn: Cdn.Fastly,
  };
}

async function createGoogleCdnTestPage(
  sdks: Sdk[],
  version: string,
  dir: string
): Promise<NetworkLatencyTestPage> {
  const prefix = 'https://www.gstatic.com/firebasejs';
  const scriptTags = sdks.map(
    sdk => `<script src="${prefix}/${version}/${sdk}"></script>`
  );
  const testPagePath = `${dir}/google-cdn.html`;
  await createTestPage(scriptTags, testPagePath);
  return {
    path: 'google-cdn.html',
    cdn: Cdn.Google,
  };
}

async function createInstrumentedSdkTestPage(
  sdks: Sdk[],
  dir: string,
  sdksDir: string
): Promise<ExecutionLatencyTestPage> {
  const relative = path.relative(dir, sdksDir);
  const scriptTags = sdks.map(
    sdk => `<script src="${relative}/${sdk}"></script>`
  );
  const testPagePath = `${dir}/index.html`;
  await createTestPage(scriptTags, testPagePath);
  return { path: 'index.html' };
}

async function createTestPage(
  scriptTags: string[],
  testPagePath: string
): Promise<void> {
  const $ = cheerio.load('<!DOCTYPE html>');
  scriptTags.forEach(tag => {
    $('head').append(tag);
  });
  log.info(`Creating test page [${testPagePath}] ...`);
  await writeFile(testPagePath, $.html(), null);
}
