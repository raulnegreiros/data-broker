var Kafka = require('node-rdkafka'),
  config = require('./config'),
  flattener = require('./json-flattener');

function createKafkaProducer() {
  return new Kafka.Producer({
    'compression.codec': 'snappy',
    'bootstrap.servers': config.kafka.bootstrap,
    'metadata.broker.list': config.kafka.metadata_broker_list,
    'batch.num.messages': config.kafka.batch_num_messages,
    'dr_cb': true
  });
}

function sendMessage(message, kafkaProducer) {
  kafkaProducer.produce(
    config.kafka.producer.topic,
    config.kafka.producer.partition,
    new Buffer(message),
    config.kafka.producer.key,
    Date.now()
  );
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

  var kafkaProducer = createKafkaProducer();

  // Connect to the broker manually
  kafkaProducer.connect();

  // Wait for the ready event before proceeding
  kafkaProducer.on('ready', function () {
    let obj = {
      'employee': {
        'name': 'Giovanni',
        'age': 33,
        'height': 1.74
      }
    };

    let input = JSON.stringify(flattener.flattenJson('', obj));
    console.log('prod) Sending message:', input);
    sendMessage(input, kafkaProducer);
  });
}

main();