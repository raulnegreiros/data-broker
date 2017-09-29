/* jshint node: true */
"use strict";


var kafkaConsumer = require('./consumer'),
    util = require('util');


let consumerContext = kafkaConsumer.createContext();


kafkaConsumer.init(consumerContext, [{ 'topic' : 'subscription-xyz', 'partition': 0}], function(data) {
  console.log('Received data for:');
  console.log(util.inspect(data, {depth: null}));
  console.log('Payload: ');
  console.log(data.value.toString());
});