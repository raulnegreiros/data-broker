/* jslint node: true */
"use strict";
var Kafka = require("node-rdkafka"),
    config = require('./config');


function createContext() {
  // Didn't find a way to set the message delivery callback.
  return new Kafka.KafkaConsumer({
    'compression.codec' : 'snappy',
    'bootstrap.servers': config.kafka.bootstrap,
    'metadata.broker.list': config.kafka.metadata_broker_list,
    "batch.num.messages" : config.kafka.batch_num_messages,
    'group.id': config.kafka.consumer.group_id
  }, {});
}

function init(kafkaConsumer, topics, initCb) {
  kafkaConsumer.connect();
  kafkaConsumer.on('ready', function() {
    kafkaConsumer.subscribe(topics);
    kafkaConsumer.consume();
  })
  .on('data', function(data) {
    initCb(data);
  });
}

exports.init = init;
exports.createContext = createContext;