/* jslint node: true */
"use strict";
var Kafka = require("node-rdkafka"),
    config = require('./config');


function createKafkaConsumer() {
  // Didn't find a way to set the message delivery callback.
  return new Kafka.KafkaConsumer({
    'compression.codec' : 'snappy',
    'bootstrap.servers': config.kafka.bootstrap,
    'metadata.broker.list': config.kafka.metadata_broker_list,
    "batch.num.messages" : config.kafka.batch_num_messages,
    'group.id': config.kafka.consumer.group_id
  }, {});
}

function main() {
  var kf_consumer = createKafkaConsumer();
  kf_consumer.connect();
  kf_consumer.on('ready', function() {
    kf_consumer.subscribe(config.kafka.consumer.topics);
    kf_consumer.consume();
  })
  .on('data', function(data) {
    console.log("cons) -----------------");
    console.log("cons) Received a message");
    console.log("cons) Value: ", data.value.toString());
    console.log("cons) Size: ", data.size);
    console.log("cons) Topic: ", data.topic);
    console.log("cons) Offset: ", data.offset);
    console.log("cons) Partition: ", data.partition);
    console.log("cons) Key: ", data.key);
  });
}

main();