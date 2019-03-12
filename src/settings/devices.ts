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

import { Device } from '../types/device';

export const trial: Device[] = [
  {
    id: 'Desktop - Chrome',
    location: 'Dulles',
    browser: 'Chrome',
  },
];
export const official: Device[] = [
  {
    id: 'Desktop - Chrome',
    location: 'Dulles',
    browser: 'Chrome',
  },
  {
    id: 'Desktop - Firefox',
    location: 'Dulles',
    browser: 'Firefox',
  },
  {
    id: 'Desktop - Edge',
    location: 'Dulles_Edge',
    browser: 'Microsoft Edge',
  },
  {
    id: 'Desktop - IE11',
    location: 'Dulles_IE11',
    browser: 'IE 11',
  },
  {
    id: 'Moto G4 - Chrome',
    location: 'Dulles_MotoG4',
    browser: 'Moto G4 - Chrome',
  },
  {
    id: 'Moto G - Chrome',
    location: 'Dulles_MotoG',
    browser: 'Moto G - Chrome',
  },
  {
    id: 'Nexus 5 - Chrome',
    location: 'Dulles_Nexus5',
    browser: 'Nexus 5 - Chrome',
  },
  {
    id: 'iPhone6 - Safari',
    location: 'Dulles_iPhone6',
    browser: 'iPhone 6 iOS 12',
  },
  {
    id: 'Galaxy S7 - Chrome',
    location: 'Dulles_GalaxyS7',
    browser: 'Galaxy S7 - Chrome',
  },
];
