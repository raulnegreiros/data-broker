/*jslint node: true */
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
  kf_consumer.connect();
  kf_consumer.on('ready', function() {
    kf_consumer.subscribe(config.kafka.consumer.topics);
    kf_consumer.consume();
  })
  .on('data', function(data) {
    // Output the actual message contents
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