/*jslint node: true */
"use strict";
var Kafka = require("node-rdkafka"),
    config = require('./config');


function createKafkaConsumer() {
  // Didn't find a way to set the message delivery callback.
  return new Kafka.KafkaConsumer.createReadStream({
    'compression.codec' : 'snappy',
    'bootstrap.servers': '127.0.0.1',
    'metadata.broker.list': '127.0.0.1:9092',
    "batch.num.messages" : 100,
    "group.id" : "demo-group-2"
  }, {}, { 'topics' : ['all-devices-alt-2']});
}

function main() {
  // Quick explanation:
  // Kafka is build around four core entities:
  //  - Producers: almost self-explanatory, these are the elements that, well,
  //      generate messages to be published.
  //  - Consumers: the producer counterpart - these elements read messages
  //  - Streams processors: elements that transform messages between message
  //      streams, playing a consumer role at one end, doing something to
  //      those messages and then sending the results to another stream as a
  //      producer.
  //  - Connectors: Like "templates" - these elements are reusable producer/
  //      consumers that connects specific topics to applications.
  // Now, simply put: messages are published in topics, and they can be
  // retrieved individually or in chunks of timeslots.

  var kf_consumer = createKafkaConsumer();
  kf_consumer.on('data', function(message) {
      console.log("cons) Received a message");
      console.log("cons) Error value is ", message.err);
      if ((message.err != undefined) && (message.err != Kafka.CODES.ERRORS.ERR_NO_ERROR)) {
          return;
      }
      console.log("cons) Received message for topic: ", message.topic);
      console.log("cons) Message: ", message.value.toString());
  });
}

main();