# Firebase JavaScript SDK Performance Dashboard

This project measures the startup latency and binary size of Firebase JavaScript
SDKs.

## Measurement

The measurement process involves:

- hosting webpages on Firebase which downloads and executes SDKs to be tested
- run WebPageTest against above webpages to obtain measurement numbers
- download SDK files to local file system and calculate the file sizes
- aggregate raw samples and store results into database (Google Cloud Sql)

See [Firebase Hosting](https://firebase.google.com/docs/hosting/),
[WebPageTest](https://www.webpagetest.org) and
[Google Cloud Sql](https://cloud.google.com/sql/) for more
information.

## Dashboarding

The above aggregated results are then pulled from data storage and presented
in a Google Data Studio [dashboard](https://datastudio.google.com/c/u/0/reporting/1PoyaQIWappLs29cY-haBk8-kwa2KYeR_/page/1iUY).

See [Google Data Studio](https://datastudio.google.com/overview) for more
information.

## How to run test

### Premise

The test requires a Firebase project (which is also a GCP project) for hosting
webpages and providing a sql database instance.

It also requires a few environment variables:

- WPT_API_KEY: The api key used to submit request to WebPageTest
- FIREBASE_TOKEN: The authentication token used for webpages deployment (via
  [Firebase CLI](https://firebase.google.com/docs/cli/))
- CLOUD_SQL_HOST: The host of Cloud Sql database instance
- CLOUD_SQL_USER: The username used to login to database
- CLOUD_SQL_PASSWORD: The password used to login to database

### Trial run

`yarn test` will trigger a trial run of the test, which is conducting the test
against a small combination of devices/browsers, network conditions and CDNs.
`--version` can be supplied to test against a specific version of SDK, otherwise
the test will always run against the latest release version.

See `package.json` for details.

### Formal run

Formal run is to test against a comprehensive list of devices/browsers, network
conditions and CDNs. It is scheduled to run daily and always against the latest
released version.

## Contributing

To contribute a change, check out the [contributing guide](CONTRIBUTING.md).

## License

The contents of this repository is licensed under the
[Apache License, version 2.0](http://www.apache.org/licenses/LICENSE-2.0).
