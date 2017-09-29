/* jshint node: true */
"use strict";


var kafkaConsumer = require('./consumer'),
    util = require('util');

console.log('Creating consumer context...');
let consumerContext = kafkaConsumer.createContext();
console.log('... consumer context created.');

console.log('Creating topics...');
kafkaConsumer.createTopics(consumerContext, ['subscription-xyz']);
console.log('... topics were created.');

kafkaConsumer.init(consumerContext, [{ 'topic' : 'subscription-xyz', 'partition': 0}], function(data) {
  console.log('Received data for:');
  console.log(util.inspect(data, {depth: null}));
  console.log('Payload: ');
  console.log(data.value.toString());
});