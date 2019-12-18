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

/* tslint:disable */

import * as fs from 'fs';

export async function readFile(path, options) {
  return new Promise((res, rej) => {
    fs.readFile(path, options, (err, data) => {
      if (err) rej(err);
      res(data);
    });
  });
}

export async function writeFile(file, data, options) {
  return new Promise((res, rej) => {
    fs.writeFile(file, data, options, err => {
      if (err) rej(err);
      res(undefined);
    });
  });
}

export async function copyFile(src, dest, flags) {
  return new Promise((res, rej) => {
    fs.copyFile(src, dest, flags, err => {
      if (err) rej(err);
      res(undefined);
    });
  });
}

export async function mkdtemp(prefix, options) {
  return new Promise((res, rej) => {
    fs.mkdtemp(prefix, options, (err, folder) => {
      if (err) rej(err);
      res(folder);
    });
  });
}

export async function mkdir(path, mode) {
  return new Promise((res, rej) => {
    fs.mkdir(path, mode, err => {
      if (err) rej(err);
      res(undefined);
    });
  });
}

export async function chmod(path, mode) {
  return new Promise((res, rej) => {
    fs.chmod(path, mode, err => {
      if (err) rej(err);
      res(undefined);
    });
  });
}
