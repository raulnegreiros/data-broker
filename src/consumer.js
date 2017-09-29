/* jslint node: true */
'use strict';

var kafka = require('kafka-node'),
    config = require('./config');


function createContext(clientId) {
  return new kafka.Client(config.kafka.address, clientId);
}

function init(context, topics, initCb) {
  let consumer = new kafka.HighLevelConsumer(context, topics, config.kafka.consumer);

  // Register callbacks
  consumer.on('message', function (message) {
    initCb(message);
  });

  consumer.on('error', function (err) {
    console.log('error', err);
  });
}

function createTopics(context, topics) {
  context.createTopics(topics, function (err, data) {
  });
}

exports.init = init;
exports.createContext = createContext;
exports.createTopics = createTopics;