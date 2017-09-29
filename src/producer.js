/* jslint node: true */
var kafka = require('kafka-node'),
    config = require('./config');


function createContext() {
  let client = new kafka.Client(config.kafka.zookeeper);
  return new kafka.HighLevelProducer(client, { requireAcks: 1 });
}

function init(context, initCb) {
  context.on('ready', function () {
    initCb();
  });

  context.on('error', function (err) {
    console.log('error', err);
  });
}

function sendMessage(context, message, topic, partition, key) {
  let msgPayload;
  if (key != null) {
    msgPayload = new kafka.KeyedMessage(key, message);
  } else {
    msgPayload = message;
  }

  let contextMessage = {
    'topic': topic,
    'messages': [msgPayload]
  };

  context.send([contextMessage], function (err, result) {
    console.log(err || result);
  });
}

function createTopics(context, topics) {
  context.createTopics(topics, function (err, data) {
  });
}

exports.createContext = createContext;
exports.sendMessage = sendMessage;
exports.createTopics = createTopics;
exports.init = init;