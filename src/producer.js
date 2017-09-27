/*jslint node: true */
"use strict";
var kafka = require("node-rdkafka"),
    flattener = require('./json-flattener'),
    config = require('./config'),
    util = require('util');

function createKafkaProducer() {
    // Didn't find a way to set the message delivery callback.
    return new kafka.Producer.createWriteStream({
        'compression.codec' : 'snappy',
        'bootstrap.servers': config.kafka.bootstrap,
        'metadata.broker.list': config.kafka.metadata_broker_list,
        "batch.num.messages" : config.kafka.batch_num_messages
    }, {}, {'topic' : config.kafka.topic});
}

function sendMessage(message, kf_prod_stream) {
    // // Writes a message to the stream
    // var ret = kf_prod_stream.write(new Buffer(message));

    // if (ret) {
    //     console.log('We queued our message!');
    //     console.log('Return value is ', ret);
    // } else {
    //     // Note that this only tells us if the stream's queue is full,
    //     // it does NOT tell us if the message got to Kafka!  See below...
    //     console.log('Too many messages in our queue already');
    // }

    // kf_prod_stream.on('error', function (err) {
    //     // Here's where we'll know if something went wrong sending to Kafka
    //     console.error('Error in our kafka stream');
    //     console.error(err);
    // })



    console.log('Creating producer...');
    var producer = new kafka.Producer({
      'metadata.broker.list': '172.17.0.2:9092',
      'dr_cb': true
    });

    console.log('Producer created.');

    // Connect to the broker manually
    console.log('Connecting...');
    producer.connect();
    console.log('... connected');

    // Wait for the ready event before proceeding
    producer.on('ready', function() {
      try {
        console.log('Sending message...');
        producer.produce(
          // Topic to send the message to
          'supertest',
          // optionally we can manually specify a partition for the message
          // this defaults to -1 - which will use librdkafka's default partitioner (consistent random for keyed messages, random for unkeyed messages)
          0,
          // Message to send. Must be a buffer
          new Buffer('Awesome message'),
          // for keyed messages, we also specify the key - note that this field is optional
          null,
          // you can send a timestamp here. If your broker version supports it,
          // it will get added. Otherwise, we default to 0
          Date.now()
          // you can send an opaque token here, which gets passed along
          // to your delivery reports
        );
        console.log('... message sent');
      } catch (err) {
        console.error('A problem occurred when sending our message');
        console.error(err);
      }
    });

    // Any errors we encounter, including connection errors
    producer.on('event.error', function(err) {
      console.error('Error from producer');
      console.error(err);
    });
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
  var kf_producer = createKafkaProducer();
  //
  // We are almost ready to send a message.
  // Now we need to create the actual message and select a partition
  //
  let obj = {
    'employee' : {
      'name' : 'Giovanni',
      'age' : 33,
      'weight' : 74.5
    }
  };

  // function prepareAndSend() {
    obj.employee.age += 1;
    let result = JSON.stringify(flattener.flattenJson('', obj));
    console.log('Sending object: ' + result);
    let ret = sendMessage('teste - object', kf_producer);
    if (ret === '-1') {
        process.exit();
    }
  //   setTimeout(prepareAndSend, 1000);
  // }

  // prepareAndSend();
}

main();