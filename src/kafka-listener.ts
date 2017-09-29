import kafkaConsumer = require('./consumer');
import util = require('util');

console.log('Creating consumer context...');
let consumerContext = kafkaConsumer.createContext('sample-kafka-listener');
console.log('... consumer context created.');

kafkaConsumer.init(consumerContext, [{ 'topic' : 'subscription-xyz'}], function(data) {
  console.log('Received data for:');
  console.log(util.inspect(data, {depth: null}));
  console.log('Payload: ');
  console.log(data.value.toString());
});