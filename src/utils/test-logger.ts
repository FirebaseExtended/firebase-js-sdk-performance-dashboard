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

import { Logger, LogLevel } from '@firebase/logger';

import { name } from '../../package.json';

const logger = new Logger(name);
logger.logLevel = LogLevel.DEBUG;

export function getLogLevel(): LogLevel {
  return logger.logLevel;
}

export function setLogLevel(val: LogLevel): void {
  logger.logLevel = val;
}

// tslint:disable-next-line:no-any
export function info(message: string, ...args: any[]): void {
  logger.info(`info: ${message}`, ...args);
}

// tslint:disable-next-line:no-any
export function warn(message: string, ...args: any[]): void {
  logger.info(`warn: ${message}`, ...args);
}

// tslint:disable-next-line:no-any
export function error(message: string, ...args: any[]): void {
  logger.info(`error: ${message}`, ...args);
}
