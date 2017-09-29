import mqtt = require('./mqtt-binding');
mqtt.start(function (error: Error) {
  console.log('There was an error');
});