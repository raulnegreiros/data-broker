import kafka = require("kafka-node");
import config = require("./config");

export class KafkaProducer {
  producer: kafka.HighLevelProducer;

  constructor(host?: string, init?: () => void) {
    let kafkaHost = host ? host : config.kafka.zookeeper;
    let client = new kafka.Client(kafkaHost);
    this.producer = new kafka.HighLevelProducer(client, {requireAcks: 1});
    this.producer.on("ready", () => {
      if (init) {
        init();
      }
    })
  }

  send(message: string, topic: string, key?: string) {
    let msgPayload;
    if (key) {
      msgPayload = new kafka.KeyedMessage(key, message);
    } else {
      msgPayload = message;
    }

    let contextMessage = {
      "topic": topic,
      "messages": [msgPayload]
    };

    this.producer.send([contextMessage], function (err, result) {
      console.log(err || result);
    });
  }

  createTopics(topics: string[], callback?: (err:any, data:any) => void) {
    if (callback) {
      this.producer.createTopics(topics, callback);
    } else {
      this.producer.createTopics(topics, () => {});
    }
  }

  close() {
    this.producer.close();
  }
}
