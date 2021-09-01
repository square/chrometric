Chrometric
==========

This extension gathers metrics on ChromeOS devices and ships the data back to an ingestion endpoint.

For this extension to be useful, a LibreSpeed speedtest endpoint must be hosted on the infrastructure to be tested against. The [Go version of librespeedtest](https://github.com/librespeed/speedtest-go) is perhaps the easiest way to stand this up, with other options being available on the [LibreSpeed repo](https://github.com/librespeed).

Configuration
---
To configure the extension, one must apply a policy for it within Google Admin. After adding Chrometric to the console, a policy similar the one below must be added under **Policy for extensions**.

Here is an example policy:

```json
{
  "dataLoggerConfig": {
    "Value": {
      "name": "humio",
      "token": "TOKEN_GOES_HERE"
    }
  },
  "speedtestUrls": {
    "Value": [
      {
        "name": "Librespeed Server",
        "server": "https://some.speedtestserver.here",
        "dlURL": "garbage.php",
        "ulURL": "empty.php",
        "pingURL": "empty.php",
        "getIpURL": "getIP.php"
      }
    ]
  }
}
```

Manual Chrome Web Store Deployment
---

Releases are provided on the Github releases page, however if a manual release is desired, the following directions will generate a release which can be manually uploaded to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

In order to publish this extension to a private Chrome Web Store, a zip file will need to be created. Use the following process to do so:

```
zip -r ../chrometric-x.x.x.zip ./* -x ".git*"
```

Be sure to change `x.x.x` to the actual version being zipped, which can be found in `manifest.json`

#### ToDo
* Add directions for customizing the bundle with a data logger before creating the zip


Thanks
---
Many thanks to the [LibreSpeed Project](https://github.com/librespeed), without which this idea would not have worked as well as it has. Also thanks to [Mark Gewurz](https://github.com/markgewurz) for the inspiration and [Graham Gilbert](https://github.com/grahamgilbert) for his work on [chromesal](https://github.com/salopensource/chromesal), which was very instructive on using ChromeOS APIs.

License
-------

    Copyright 2020 Square, Inc.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
