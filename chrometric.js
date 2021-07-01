
// Get local and managed settings, merge them before returning
async function getSettings() {
  const localSettings = await getSettingsJson()
  const managedConfig = await readManagedSettings()
  const dataLoggerConfig = managedConfig.dataLoggerConfig || localSettings.dataLoggerConfig || {}
  const speedtestUrls = managedConfig.speedtestUrls || localSettings.speedtestUrls || {}
  const debug = localSettings.debug
  if (!dataLoggerConfig.token || !speedtestUrls) {
    throw new Error("Settings missing, aborting!")
  }
  return { dataLoggerConfig, speedtestUrls, debug }
}

// Read local settings (if they exist) and return them
async function getSettingsJson() {
  try {
    let dirEntry = await chrome.runtime.getPackageDirectoryEntry()
    return await readExtensionJson(dirEntry, "settings.json")
  } catch (err) {
    console.log(err)
    return {}
  }
}

// Grab managed settings and return it
async function readManagedSettings() {
  return await chrome.storage.managed.get()
}

// This is used to read json files from within the same directory as the extension
function readExtensionJson(dirEntry, fileName) {
  return new Promise((resolve, reject) => {
    function readFile(fileEntry) {
      fileEntry.file(file => {
        const reader = new FileReader()
        reader.addEventListener("load", function () {
          var manifest = JSON.parse(reader.result)
          resolve(manifest)
        })
        reader.readAsText(file)
      })
    }

    function onError(e) {
      reject(e)
    }

    dirEntry.getFile(fileName, undefined, readFile, onError)
  })
}

// Render a message in the extension's popup html
function renderStatus(statusText) {
  try {
    document.getElementById('status').textContent = statusText
  } catch (err) {
    console.log(statusText)
  }
}

// Runs the speedtest and returns the results
function getSpeedtestData(speedtestUrls, debug, type) {
  renderStatus("Running speedtest")
  return new Promise((resolve, reject) => {
    server = speedtestUrls[0]
    const speedtest = new Speedtest()
    speedtest.setParameter("telemetry_level", "2")
    speedtest.setParameter("xhr_ignoreErrors", "0") // Error out instead of retrying
    speedtest.setParameter("xhr_ul_blob_megabytes", "4") // Set to 4mB for ChromeOS

    // If manual, do the full test, otherwise only do Latency and Jitter
    if (type == "manual") {
      speedtest.setParameter("test_order", "IP_D_U") // Set to 4mB for ChromeOS
    } else {
      speedtest.setParameter("test_order", "IP") // Set to 4mB for ChromeOS
    }
    speedtest.addTestPoints(speedtestUrls)
    speedtest.setSelectedServer(server)

    // To debug, we can add a function here to look at data as the speedtest is running
    if (debug) {
      speedtest.onupdate = function (update) {
        console.log("onupdate function called")
        console.log(update)
      }
    }

    speedtest.onend = function speedTestEnd(aborted) {
      if (aborted) {
        // We are technically lying here, but if it can't get to the server, it hasn't been successful
        resolve(
          { "successful": false }
        )
      }
      speedtestData = speedtest._prevData
      speedtestResults = JSON.parse(speedtestData)
      speedtestResults.speedtest_timestamp = (new Date()).toISOString()
      speedtestResults.successful = true

      resolve(speedtestResults)
    }

    // Reject promise to prevent it from proceeding
    try {
      speedtest.start()
    } catch (e) {
      reject(e)
    }
  })
}

// Gets device name using enterprise API
function getGoogleDeviceID(debug) {
  return new Promise((resolve, reject) => {
    try {
      if (debug) {
        console.log("Getting device ID from chrome API");
      }
      chrome.enterprise.deviceAttributes.getDirectoryDeviceId(function (result) {
        resolve(result)
      })
    } catch {
      console.log("Failed to get Device ID from Enterprise API")
      resolve('Chrome OS Device')
    }
  })
}

// Need to wrap this in a promise because chrome-extension-async doesn't cover it for magic promisification
function getChromeDeviceSerial(debug) {
  return new Promise((resolve, reject) => {
    try {
      if (debug) {
        console.log("Getting serial number from chrome API");
      }
      chrome.enterprise.deviceAttributes.getDeviceSerialNumber(function (result) {
        resolve(result)
      })
    } catch {
      console.log("Failed to get serial from Enterprise API")
      resolve('ABC123')
    }
  })
}

// Need to wrap this in a promise because chrome-extension-async doesn't cover it for magic promisification
function getDeviceCPU(debug) {
  return new Promise((resolve, reject) => {
    try {
      if (debug) {
        console.log("Getting serial number from chrome API");
      }
      chrome.system.cpu.getInfo(function (result) {
        // Flatten the information
        var CpuInfo = {
          arch: result.archName,
          model: result.modelName,
          threads: result.numOfProcessors
        }
        resolve(CpuInfo)
      })
    } catch (err) {
      console.log("Failed to get CPU info from chrome API")
      console.log(err)
      resolve({})
    }
  })
}

// Need to wrap this in a promise because chrome-extension-async doesn't cover it for magic promisification
function getDeviceMemory(debug) {
  return new Promise((resolve, reject) => {
    try {
      if (debug) {
        console.log("Getting memory information from chrome API");
      }
      chrome.system.memory.getInfo(function (result) {
        // // Flatten the information
        // var MemoryInfo = {
        //   "capacity": result.capacity,
        //   "available": result.availableCapacity
        // }
        resolve(result)
      })
    } catch (err) {
      console.log("Failed to get memory info from chrome API")
      console.log(err)
      resolve({})
    }
  })
}

function getTabCount(debug) {
  return new Promise((resolve, reject) => {
    try {
      if (debug) {
        console.log("Getting count of open tabs from chrome API");
      }
      chrome.windows.getAll({ populate: true }, function (windows) {
        var tabCount = 0;
        windows.forEach(function (window) {
          window.tabs.forEach(function (tab) {
            tabCount++;
          });
        });
        console.log(tabCount);
        resolve(tabCount)
      });
    } catch (err) {
      console.log("Failed to get tab count from chrome API")
      console.log(err)
      resolve(0)
    }
  })
}

// Gets the device serial using a chrome API
async function getDeviceSerial(debug) {
  if (debug) {
    console.log("Getting device serial");
  }
  let chromePlatform = await chrome.runtime.getPlatformInfo()
  var defaultSerial = 'ABC123'
  // We are only going to run on a Chrome OS device
  if (!chromePlatform.os.toLowerCase().includes('cros')) {
    if (debug) {
      console.log("Not a chrome device! Returning default serial");
    }
    return defaultSerial
  } else {
    return await getChromeDeviceSerial(debug)
  }
}

// Gets the device's current OS version
async function getOsVersion(debug) {
  if (debug) {
    console.log("Getting OS version from agent string");
  }
  userAgentString = navigator.userAgent
  if (/Chrome/.test(userAgentString)) {
    return userAgentString.match('Chrome/([0-9]*\.[0-9]*\.[0-9]*\.[0-9]*)')[1]
  } else {
    return 'UNKNOWN'
  }
}

// Gets the currently logged on user
async function getConsoleUser(debug) {
  if (debug) {
    console.log("Getting console user from chrome API");
  }
  let info = await chrome.identity.getProfileUserInfo()
  return info.email
}

// Gets the version of the Chrometric extension which is actively running
async function getExtensionVersion(debug) {
  if (debug) {
    console.log("Getting extension version via chrome APIs and magic");
  }
  let dirEntry = await chrome.runtime.getPackageDirectoryEntry()
  let manifest = await readExtensionJson(dirEntry, "manifest.json")
  return manifest.version
}

// Gets the data logger function based on the name as a string
function getDataLoggerFunction(dataLoggerName) {
  if (typeof dataLoggerName !== 'string') {
    throw new Error("Data logger name must be a string")
  }
  var dataLogger = this[dataLoggerName];
  if (typeof dataLogger !== "function") {
    throw new Error("data logger shipit function not found");
  }
  return dataLogger;
}

// Stub function to get data logging function and use it
function logData(dataLoggerConfig, data, debug) {
  const dataLoggerFunction = getDataLoggerFunction(dataLoggerConfig.name);
  const dataLogger = new dataLoggerFunction();
  console.log("Shipping data!")
  dataLogger.shipIt(dataLoggerConfig, data, debug)
}

// Main entry point for the extension. Everything else is kicked off from here.
async function runEverything(type) {
  // Get required settings for running the speedtest and logging the data
  const { dataLoggerConfig, speedtestUrls, debug } = await getSettings()
  if (debug) {
    console.log("Succesfully got setings, continuing run");
  }
  // Grab all the data we need sequentially
  const data = {
    googleDeviceID: await getGoogleDeviceID(debug),
    serialNumber: await getDeviceSerial(debug),
    osVersion: await getOsVersion(debug),
    consoleUser: await getConsoleUser(debug),
    version: await getExtensionVersion(debug),
    cpu: await getDeviceCPU(debug),
    memory: await getDeviceMemory(debug),
    tabCount: await getTabCount(debug),
    runType: type,
    ...(await getSpeedtestData(speedtestUrls, debug, type))
  }

  if (debug) {
    console.log("Run complete, caching data from the run and logging it");
    console.log(data)
  }

  // Store run type and date in local storage so we can throttle runs
  const runData = {
    LAST_RUN_TIME: new Date().getTime(),
    LAST_RUN_TYPE: type
  }
  await chrome.storage.local.set({ 'SPEEDTEST_DATA': runData })
  // Send the data to the configured data logger
  logData(dataLoggerConfig, data, debug)
}
