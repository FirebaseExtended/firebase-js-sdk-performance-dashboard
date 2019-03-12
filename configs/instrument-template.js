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

(function() {
  // starting timing
  performance.mark('%name%_start');
  // parse the sdk with new Function()
  const func = new Function('%script%');
  // end of the parsing
  performance.mark('%name%_parse');
  // execute the sdk script
  func();
  // end of the execution
  performance.mark('%name%_exec');
  // measure performance
  performance.measure('%name%___parse_ms', '%name%_start', '%name%_parse');
  performance.measure('%name%___exec_ms', '%name%_parse', '%name%_exec');

  console.log(performance.getEntriesByType('measure'));
})();
