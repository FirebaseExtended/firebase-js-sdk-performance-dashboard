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

export const enum Sdk {
  App = 'firebase-app.js',
  Auth = 'firebase-auth.js',
  Database = 'firebase-database.js',
  Firestore = 'firebase-firestore.js',
  Functions = 'firebase-functions.js',
  Messaging = 'firebase-messaging.js',
  Performance = 'firebase-performance.js',
  Storage = 'firebase-storage.js',
}

export const sdks = [
  Sdk.App,
  Sdk.Auth,
  Sdk.Database,
  Sdk.Firestore,
  Sdk.Functions,
  Sdk.Messaging,
  Sdk.Performance,
  Sdk.Storage,
];

export function deserialize(name: string): Sdk {
  for (const sdk of sdks) {
    if (sdk === name) {
      return sdk;
    }
  }
  return null;
}
