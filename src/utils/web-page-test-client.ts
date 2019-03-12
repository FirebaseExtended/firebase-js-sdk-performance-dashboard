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

import * as WebPageTest from 'webpagetest';

import { options as base } from '../settings/web-page-test';
import { Connectivity } from '../types/connectivity';
import { Device } from '../types/device';
import { TestRecord, TestStatus } from '../types/web-page-test';
import * as log from './test-logger';

export class WebPageTestClient {
  server: string;
  key: string;
  interval: number;
  instance: WebPageTest;
  registry: Map<string, TestRecord>;
  timerId: NodeJS.Timeout;

  constructor(server: string, key: string, interval: number) {
    this.server = server;
    this.key = key;
    this.interval = interval;
    this.instance = new WebPageTest(server, key);
    this.registry = new Map();
    this.timerId = setInterval(this.displayStatus.bind(this), interval);
  }

  displayStatus(): void {
    if (this.registry.size) {
      const successes = Array.from(this.registry.values()).filter(
        x => x.status === TestStatus.Succeeded
      );
      const failures = Array.from(this.registry.values()).filter(
        x => x.status === TestStatus.Failed
      );
      const pendings = Array.from(this.registry.values()).filter(
        x => x.status === TestStatus.Pending
      );
      const pendingTestsString = constructPendingTestsString(pendings);
      const message =
        `WebPageTest progress update:\n` +
        `============================================================ ` +
        `[${this.registry.size}] tests submitted, ` +
        `[${successes.length}] succeeded, [${failures.length}] failed, ` +
        `[${pendings.length}] pending. ` +
        `============================================================\n` +
        `${pendingTestsString}` +
        `============================================================` +
        `============================================================` +
        `============================================================`;
      log.info(message);
    }
  }

  clearTimer(): void {
    clearInterval(this.timerId);
    this.timerId = null;
  }

  async submitTest(
    url: string,
    device: Device,
    connectivity: Connectivity
    // tslint:disable-next-line:no-any
  ): Promise<any> {
    const location = `${device.location}:${device.browser}.${connectivity}`;
    const options = Object.assign({}, base, { location });

    return new Promise((resolve, reject) => {
      const id = `##${url}##${device.id}##${connectivity}`;
      const now = Date.now();
      this.registry.set(id, {
        status: TestStatus.Pending,
        url,
        device: device.id,
        connectivity,
        runs: options.runs,
        start: now,
        timeout: now + options.timeout * 1000,
      });
      log.info(
        `Submitting WebpageTest for [${url}] on [${device.id}] with ` +
          `[${connectivity}] for [${options.runs}] total runs ...`
      );
      this.instance.runTest(url, options, (error, result) => {
        if (error) {
          this.registry.get(id).status = TestStatus.Failed;
          log.warn(
            `WebpageTest for [${url}] on [${device.id}] with ` +
              `[${connectivity}] failed: ${JSON.stringify(error)}.`
          );
          reject(error);
        } else {
          this.registry.get(id).status = TestStatus.Succeeded;
          log.info(
            `Received WebpageTest result [${result.data.id}] for [${url}] ` +
              `on [${device.id}] with [${connectivity}].`
          );
          resolve(result);
        }
      });
    });
  }
}

function constructPendingTestsString(pendings: TestRecord[]): string {
  let str = '';
  if (pendings.length) {
    const now = Date.now();
    str = '>> Pending tests:\n';
    for (let i = 1; i <= pendings.length; i++) {
      const p = pendings[i - 1];
      str += `>> [${i}/${pendings.length}]: {url: ${p.url}, `;
      str += `device: ${p.device}, connectivity: ${p.connectivity}, `;
      str += `runs: ${p.runs}}, submitted [${(now - p.start) / 1000}s] `;
      str += `ago, timeouts in [${(p.timeout - now) / 1000}s].\n`;
    }
  }
  return str;
}
