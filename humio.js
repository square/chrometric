// Ship data to humio using the provided ingest token

function humio() {
    this.shipIt = function (dataLoggerConfig, data, debug) {
        // This is the correct humio URL as their documentation was Europe specific.
        var url = "https://cloud.us.humio.com/api/v1/ingest/humio-structured"
        var request = [
            {
                "tags": {
                    "type": "chrometric"
                },
                "events": [
                    {
                        "timestamp": (new Date()).toISOString(),
                        "attributes": data,
                    }
                ]
            }
        ]
        if (debug) {
            console.log("HTTP request:");
            console.log(request);
        }
        fetch(url, {
            method: 'POST',
            body: JSON.stringify(request),
            headers: new Headers({
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + dataLoggerConfig.token
            })
        }).catch(error => console.log('error:', error))
    }
}
