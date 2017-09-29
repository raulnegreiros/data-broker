import mqtt = require('mqtt');
import fs = require('fs');
import config = require('./config');
import async = require('async');
import * as producer from './producer';
import flattener = require('./json-flattener');

let mqttClient: mqtt.Client;
let producerContext: producer.Context;


function mqttMessageHandler(topic: string, message: string) {
  console.log('Got new MQTT message');
  console.log('Topic: ' + topic);
  console.log('Content:' + message);

  let obj = JSON.parse(message);
  // This is just a sample - the device ID should be retrieved elsewhere.
  let flatObj = {
    attrs: flattener.flattenJson('', obj, null),
    metadata: { 'topic': topic, 'protocol' : 'mqtt-json', 'payload' : 'json', 'deviceid' : obj.deviceid, 'type' : 'device', 'model': 'texas-instruments-2000'}
  };
  let flatMessage = JSON.stringify(flatObj);

  console.log('Sending message ' + flatMessage);
  producer.sendMessage(producerContext, flatMessage, config.kafka.producer.topic, config.kafka.producer.partition, config.kafka.producer.key);
  console.log('... message sent');
}

function stop(callback: (error: Error) => void) {
  async.series([
    function () {
      mqttClient.subscribe(['#'], function (error: Error) {
        console.log('Could not subscribe to "#" topic: ' + error);
        callback(error);
      });
    },
    mqttClient.end.bind(mqttClient, true)
  ], callback);
}

class MqttConfig {
  options: {
    keepalive: number;
    connectTimeout: number;
    username: string;
    password: string;
    key: string
    cert: string
    ca: string[];
    passphrase: string;
    secureProtocol: string;
    port: number;
    protocol: 'mqtts' | 'mqtt';
    protocolId: string;
    protocolVersion: number;
  };
  url: string;
  constructor() {
  }
}

function buildMqttConfig() : MqttConfig {
  let ret = new MqttConfig();

  if (config.mqtt.username && config.mqtt.password) {
    ret.options.username = config.mqtt.username;
    ret.options.password = config.mqtt.password;
  }

  let protocol = '';
  if ((config.mqtt.secure != undefined) && (config.mqtt.secure == true)) {
    // Read TLS configuration
    ret.options.key = fs.readFileSync(config.mqtt.tls.key, 'utf8');
    ret.options.cert = fs.readFileSync(config.mqtt.tls.cert, 'utf8');
    ret.options.ca = [];
    for (var i = 0; i < config.mqtt.tls.ca.length; i++) {
      ret.options.ca.push(fs.readFileSync(config.mqtt.tls.ca[i], 'utf8'));
    }
    // This should be removed from here ASAP
    ret.options.passphrase = 'cpqdiot2017';
    ret.options.secureProtocol = config.mqtt.tls.version;
    ret.options.port = config.mqtt.port;
    ret.options.protocol = 'mqtts';
    ret.options.protocolId = config.mqtt.protocolId;
    ret.options.protocolVersion = config.mqtt.protocolVersion;

    protocol = 'mqtts://';
  } else {
    protocol = 'mqtt://';
  }

  ret.url = protocol + config.mqtt.host + ':' + config.mqtt.port;

  return ret;
}

/**
 * Start the binding.
 */
function start(callback: (error: Error) => void) {
  console.log('Creating kafka producer context...');
  producerContext = producer.createContext();
  console.log('... kafka producer context created.');

  console.log('Initializing kafka producer...');
  producer.init(producerContext, function() {
    console.log('... kafka producer initialized');
    console.log('Creating kafka topics...');
    let topics = [];
    for (let i = 0; i < config.kafka.consumerTopics.length; i++) {
      topics.push(config.kafka.consumerTopics[i].topic);
    }
    producer.createTopics(producerContext, topics);
    console.log('... kafka topics were created.');

    console.log('Configuring MQTT connection...');
    let mqttConfig = buildMqttConfig();
    let mqttClient = mqtt.connect(mqttConfig.url, mqttConfig.options);

    console.log('Adding callbacks...');
    mqttClient.on('message', mqttMessageHandler);
    mqttClient.on('connect', function () {
      console.log('Subscribing to topic "#"...');
      mqttClient.subscribe(['#'], function (error) {
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


export {start};
export {stop};
