// New latency/jitter only interval
var interval = 10;
var splay = 5;
var alarmPeriod = Math.floor(Math.random() * Math.floor(splay)) + +interval;

chrome.alarms.create('telemetryAlarm', {
  delayInMinutes: 1,
  periodInMinutes: alarmPeriod
});

// Run the speedtest periodically based on the variables above
// Automatic runs only do latency and jitter to reduce load on the client
chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name === 'telemetryAlarm') {
    console.log("Gathering network telemetry data")
    runEverything("auto");
  }
});

// Listen for the Run Test button to request a speedtest run
// Manual runs are always full Download/Upload/Latency/Jitter tests
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.action == "runSpeedtest") {
      runEverything("manual");
      sendResponse({ status: "started" });
    }
  });
