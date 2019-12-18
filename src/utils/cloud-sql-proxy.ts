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

import * as child_process from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as request from 'request';

import { SERVICE_ACCOUNT } from '../settings/cloud-sql';
import * as log from './test-logger';
import { mkdtemp, chmod } from '../utils/fs-promise';

const PROXY_URL = 'https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64';

export async function wget(url: string, path: string) {
  const ws: fs.WriteStream = fs.createWriteStream(path);
  return new Promise<void>((resolve, reject) => {
    request(url)
      .pipe(ws)
      .on('finish', resolve)
      .on('error', reject);
  });
}

export class CloudSqlProxy {
  private proxyFilePath: string = null;
  private proxyProcess: child_process.ChildProcess = null;

  constructor(private instance: string, private port: number) {}

  public toString(): String {
    return `CloudSqlProxy:${this.proxyProcess.pid}`;
  }

  private async download(): Promise<void> {
    log.info(`Downloading proxy binary from [${PROXY_URL}] ...`);
    const proxyFolderPrefix = path.join(os.tmpdir(), 'cloud-sql-proxy-');
    const proxyFolder = (await mkdtemp(proxyFolderPrefix, null)) as string;
    const filepath: string = path.resolve(proxyFolder, 'cloud_sql_proxy');

    await wget(PROXY_URL, filepath);
    log.info(`Proxy binary downloaded at [${filepath}] ...`);
    await chmod(filepath, 0o755);
    log.info(`Changed proxy binary permissions to 'rwxr-xr-x'.`);

    this.proxyFilePath = filepath;
  }

  public async start(): Promise<child_process.ChildProcess> {
    if (!this.proxyFilePath) {
      await this.download();
    }

    return new Promise((resolve, reject) => {
      const subprocess = child_process.spawn(this.proxyFilePath, [
        `-instances=${this.instance}=tcp:${this.port}`,
        `-credential_file=${SERVICE_ACCOUNT}`,
      ]);
      this.proxyProcess = subprocess;
      log.info(`Started a Cloud Sql Proxy at pid [${subprocess.pid}] ...`);

      const callback = data => {
        for (const line of data.toString().split('\n')) {
          log.info(`[subprocess:${subprocess.pid}]: ${line}`);
        }
        if (data.includes('Ready for new connections')) {
          resolve(subprocess);
        }
      };
      subprocess.stdout.on('data', callback);
      subprocess.stderr.on('data', callback);
      subprocess.on('error', err => {
        reject(err);
      });
    });
  }

  public async stop() {
    if (this.proxyProcess) {
      this.proxyProcess.kill();
      log.info(`The cloud sql proxy [${this}] has shut down.`);
    }
  }
}
