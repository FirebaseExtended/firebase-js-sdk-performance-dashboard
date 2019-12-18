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

export const official = 'measurement';
export const trial = 'test';

export const SERVICE_ACCOUNT = process.env.GOOGLE_APPLICATION_CREDENTIALS;

export const instance = process.env.CLOUD_SQL_INSTANCE;
export const port = 3306;
export const options = {
  host: '127.0.0.1',
  user: process.env.CLOUD_SQL_USER,
  password: process.env.CLOUD_SQL_PASSWORD,
  multipleStatements: true,
};
