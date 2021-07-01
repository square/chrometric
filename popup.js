// Only add listener after the DOM has fully loaded
document.addEventListener('DOMContentLoaded', function () {
  var speedtestButton = document.getElementById('runSpeedtest')
  speedtestButton.addEventListener('click', function () {
    renderStatus("Test Started")
    // Send a message to background.js to tell it to run the speedtest
    chrome.runtime.sendMessage({ action: "runSpeedtest" }, function (response) {
      if (response.status != "started") {
        renderStatus("Failed")
      }
      console.log(response);
    });
  }, false);
}, false);
