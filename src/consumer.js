/*jslint node: true */
"use strict";
var kafka = require("node-rdkafka"),
    config = require('./config');


function createKafkaConsumer() {
  // Didn't find a way to set the message delivery callback.
  return new kafka.KafkaConsumer.createReadStream({
      'compression.codec' : 'snappy',
      'bootstrap.servers': config.kafka.bootstrap,
      'metadata.broker.list': config.kafka.metadata_broker_list,
      "batch.num.messages" : config.kafka.batch_num_messages,
      "group.id" : "device-group-2"
  }, {}, { 'topics' : ['^all-devic*']});
}

function main() {
  // Quick explanation:
  // kafka is build around four core entities:
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


  console.log('Creating Kafka consumer...');
  var kf_consumer = createKafkaConsumer();
  console.log('Consumer created.');
  kf_consumer.on('data', function(message) {
      console.log("cons) Received a message");
      console.log("cons) Error value is ", message.err);
      if ((message.err != undefined) && (message.err != kafka.CODES.ERRORS.ERR_NO_ERROR)) {
          return;
      }
      console.log("cons) Received message for topic: ", message.topic);
      console.log("cons) Message: ", message.value.toString());
  });
}

main();