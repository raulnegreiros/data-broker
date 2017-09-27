/* jslint node: true */
'use strict';

var mqtt = require('mqtt'),
    fs = require('fs'),
    config = require('./config'),
    async = require('async'),
    kafkaProducer = require('./producer'),
    flattener = require('./json-flattener'),
    util = require('util'),
    mqttClient,
    producerContext;


/**
 * Handles an incoming MQTT message, extracting the API Key, device Id and attribute to update (in the case of single
 * measures) from the MQTT topic.
 *
 * @param {String} topic        Topic of the form: '/<APIKey>/deviceId/attrs[/<attributeName>]'.
 * @param {Object} message      MQTT message body (Object or Buffer, depending on the value).
 */
function mqttMessageHandler(topic, message) {
  console.log('Got new MQTT message');
  console.log('Topic: ' + topic);
  console.log('Content:' + message);

  let obj = JSON.parse(message);
  // This is just a sample - the device ID should be retrieved elsewhere.
  let flatObj = {
    attrs: flattener.flattenJson('', obj),
    metadata: { 'topic': topic, 'protocol' : 'mqtt-json', 'payload' : 'json', 'deviceid' : obj.deviceid, 'type' : 'model-1'}
  };
  let flatMessage = JSON.stringify(flatObj);

  console.log('Sending message ' + flatMessage);
  kafkaProducer.sendMessage(producerContext, flatMessage);
  console.log('... message sent');
}

function stop(callback) {
  async.series([
    function () {
      mqttClient.subscribe(['#'], null, function (error) {
        console.log('Could not subscribe to "#" topic: ' + error);
        callback(error);
      });
    },
    mqttClient.end.bind(mqttClient, true)
  ], callback);
}

function buildMqttConfig() {
  var options = {
    keepalive: 0,
    connectTimeout: 60 * 60 * 1000
  };

  if (config.mqtt.username && config.mqtt.password) {
    options.username = config.getConfig().mqtt.username;
    options.password = config.getConfig().mqtt.password;
  }

  let protocol = '';
  if ((config.mqtt.secure != undefined) && (config.mqtt.secure == true)) {
    // Read TLS configuration
    options.key = fs.readFileSync(config.getConfig().mqtt.tls.key, 'utf8');
    options.cert = fs.readFileSync(config.getConfig().mqtt.tls.cert, 'utf8');
    options.ca = [];
    for (var i = 0; i < config.getConfig().mqtt.tls.ca.length; i++) {
      options.ca.push(fs.readFileSync(config.getConfig().mqtt.tls.ca[i], 'utf8'));
    }
    // This should be removed from here ASAP
    options.passphrase = 'cpqdiot2017';
    options.secureProtocol = config.getConfig().mqtt.tls.version;
    options.port = config.getConfig().mqtt.port;
    options.protocol = 'mqtts';
    options.protocolId = config.getConfig().mqtt.protocolId;
    options.protocolVersion = config.getConfig().mqtt.protocolVersion;

    protocol = 'mqtts://';
  } else {
    protocol = 'mqtt://';
  }
  return {'options': options, 'url': protocol + config.mqtt.host + ':' + config.mqtt.port};
}

/**
 * Start the binding.
 */
function start(callback) {
  console.log('Creating kafka producer context...');
  producerContext = kafkaProducer.createContext();
  console.log('... kafka producer context created.');

  console.log('Initializing kafka producer...');
  kafkaProducer.init(producerContext, function() {
    console.log('... kafka producer initialized');
    console.log('Configuring MQTT connection...');
    let mqttConfig = buildMqttConfig();
    let mqttClient = mqtt.connect(mqttConfig.url, mqttConfig.options);

    console.log('Adding callbacks...');
    mqttClient.on('message', mqttMessageHandler);
    mqttClient.on('connect', function () {
      console.log('Subscribing to topic "#"...');
      mqttClient.subscribe(['#'], null, function (error) {
        if (error) {
          console.log('Could not subscribe to "#" topic: ' + error);
          callback(error);
        }
        console.log('... subscription created.');
      });
    });
    console.log('... callbacks added.');
    console.log('... MQTT connection configured.');
  });
}


exports.start = start;
exports.stop = stop;
