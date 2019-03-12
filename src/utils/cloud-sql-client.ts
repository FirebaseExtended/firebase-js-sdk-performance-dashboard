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

import * as mysql from 'mysql';

import { options } from '../settings/cloud-sql';
import {
  BinarySizeRecord,
  ExecutionLatencyRecord,
  MeasurementRecord,
  NetworkLatencyRecord,
} from '../types/mesurement-record';
import { Table } from '../types/table';
import * as log from './test-logger';

export class CloudSqlClient {
  readonly database: string;
  readonly connection: mysql.Connection;

  constructor(database: string) {
    this.database = database;
    this.connection = mysql.createConnection(options);
    log.info(`Connected to sql [${options.host}] as [${options.user}].`);
  }

  async initialize(): Promise<this> {
    await createTablesIfAbsent(this.database, this.connection);
    return this;
  }

  async terminate(): Promise<void> {
    return new Promise((resolve, reject) => {
      log.info('Shutting down connection to Cloud Sql ...');
      this.connection.end(err => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  async query(query: string, data: MeasurementRecord): Promise<{}> {
    return new Promise((resolve, reject) => {
      this.connection.query(query, data, (error, results, fields) => {
        if (error) reject(error);
        resolve({ results, fields });
      });
    });
  }

  async insert(table: Table, entry: MeasurementRecord): Promise<{}> {
    const query = `INSERT INTO \`${table}\` SET ?`;
    return this.query(query, entry);
  }

  async uploadNetworkLatencies(entries: NetworkLatencyRecord[]): Promise<void> {
    log.info(`Uploading [${entries.length}] network latency entries ...`);
    await Promise.all(entries.map(x => this.insert(Table.NetworLatency, x)));
    log.info(`[${entries.length}] network latency entries uploaded.`);
  }

  async uploadExecutionLatencies(
    entries: ExecutionLatencyRecord[]
  ): Promise<void> {
    log.info(`Uploading [${entries.length}] execution latency entries ...`);
    await Promise.all(entries.map(x => this.insert(Table.ExecutionLatency, x)));
    log.info(`[${entries.length}] execution latency entries uploaded.`);
  }

  async uploadBinarySizes(entries: BinarySizeRecord[]): Promise<void> {
    log.info(`Uploading [${entries.length}] binary size entries ...`);
    await Promise.all(entries.map(x => this.insert(Table.BinarySize, x)));
    log.info(`[${entries.length}] binary size entries uploaded.`);
  }

  async uploadMeasurements(
    networkLatencies: NetworkLatencyRecord[],
    execLatencies: ExecutionLatencyRecord[],
    binarySizes: BinarySizeRecord[]
  ): Promise<void> {
    await Promise.all([
      this.uploadNetworkLatencies(networkLatencies),
      this.uploadExecutionLatencies(execLatencies),
      this.uploadBinarySizes(binarySizes),
    ]);
  }
}

async function createTablesIfAbsent(
  database: string,
  connection: mysql.Connection
): Promise<void> {
  return new Promise((resolve, reject) => {
    connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\`;
      USE \`${database}\`;
      CREATE TABLE IF NOT EXISTS \`${Table.NetworLatency}\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`test_run\` BIGINT NOT NULL,
        \`sdk\` VARCHAR(255) NOT NULL,
        \`version\` VARCHAR(255) NULL,
        \`cdn\` VARCHAR(255) NOT NULL,
        \`connectivity\` VARCHAR(255) NOT NULL,
        \`device\` VARCHAR(255) NOT NULL,
        \`browser_version\` VARCHAR(255),
        \`ttfb_ms\` DECIMAL(10,3),
        \`download_ms\` DECIMAL(10,3),
        PRIMARY KEY (\`id\`)
      );
      CREATE TABLE IF NOT EXISTS \`${Table.ExecutionLatency}\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`test_run\` BIGINT NOT NULL,
        \`sdk\` VARCHAR(255) NOT NULL,
        \`version\` VARCHAR(255) NOT NULL,
        \`device\` VARCHAR(255) NOT NULL,
        \`browser_version\` VARCHAR(255),
        \`parse_ms\` DECIMAL(10,3),
        \`exec_ms\` DECIMAL(10,3),
        PRIMARY KEY (\`id\`)
      );
      CREATE TABLE IF NOT EXISTS \`${Table.BinarySize}\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`test_run\` BIGINT NOT NULL,
        \`sdk\` VARCHAR(255) NOT NULL,
        \`version\` VARCHAR(255) NOT NULL,
        \`size_byte\` INT,
        PRIMARY KEY(\`id\`)
      );`,
      err => {
        if (err) reject(err);
        resolve();
      }
    );
  });
}
