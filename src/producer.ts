import kafka = require('kafka-node');
import config = require('./config');

export class KafkaProducer {
  producer: kafka.HighLevelProducer;

  constructor(host?: string) {
    let kafkaHost = host ? host : config.kafka.kafka;
    let client = new kafka.Client(kafkaHost);
    this.producer = new kafka.HighLevelProducer(client, {requireAcks: 1});
  }

  init(initCb: () => void) {
    this.producer.on('ready', function () {
      initCb();
    });
  }

  send(message: string, topic: string, key?: string){
    let msgPayload;
    if (key) {
      msgPayload = new kafka.KeyedMessage(key, message);
    } else {
      msgPayload = message;
    }

    let contextMessage = {
      'topic': topic,
      'messages': [msgPayload]
    };

    this.producer.send([contextMessage], function (err, result) {
      console.log(err || result);
    });
  }

  createTopics(topics: string[], callback?: (err:any, data:any) => void) {
    if (callback === undefined) {
      this.producer.createTopics(topics, callback!);
    } else {
      this.producer.createTopics(topics, () => {});
    }
  }
}
