/* jslint node: true */
var Kafka = require('node-rdkafka'),
  config = require('./config');

function createContext() {
  return new Kafka.Producer({
    'compression.codec': 'snappy',
    'bootstrap.servers': config.kafka.bootstrap,
    'metadata.broker.list': config.kafka.metadata_broker_list,
    'batch.num.messages': config.kafka.batch_num_messages,
    'dr_cb': true
  });
}

function sendMessage(kafkaProducer, message, topic, partition, key) {
  kafkaProducer.produce(
    topic,
    partition,
    new Buffer(message),
    key,
    Date.now()
  );
}

function init(kafkaProducer, initCb) {
  kafkaProducer.connect();
  kafkaProducer.on('ready', initCb);
}

exports.createContext = createContext;
exports.sendMessage = sendMessage;
exports.init = init;