import kafka = require('kafka-node');
import config = require('./config');

class Context {
  producer: kafka.HighLevelProducer;

  constructor(obj: kafka.HighLevelProducer) {
    this.producer = obj;
  }
}

function createContext() : Context {
  let client = new kafka.Client(config.kafka.zookeeper);
  let highLevelProducer = new kafka.HighLevelProducer(client, { requireAcks: 1 });
  return new Context(highLevelProducer);
}

function init(context: Context, initCb: () => void) {
  context.producer.on('ready', function () {
    initCb();
  });

  context.producer.on('error', function (err) {
    console.log('error', err);
  });
}

function sendMessage(context: Context, message: string, topic: string, partition: number, key: string) {
  let msgPayload;
  if (key != '') {
    msgPayload = new kafka.KeyedMessage(key, message);
  } else {
    msgPayload = message;
  }

  let contextMessage = {
    'topic': topic,
    'messages': [msgPayload]
  };

  console.log('Sending message:');
  console.log(msgPayload);
  console.log('To topic: ' + topic);


  context.producer.send([contextMessage], function (err, result) {
    console.log(err || result);
  });
}

function createTopics(context: Context, topics: string[]) {
  context.producer.createTopics(topics, function (err, data) {
  });
}

export {createContext};
export {sendMessage};
export {createTopics};
export {init};
export {Context};