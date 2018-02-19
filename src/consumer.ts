import kafka = require('kafka-node');
import config = require('./config');
var uuid = require('uuid/v4');

export class KafkaConsumer {
  host: string
  id: string | undefined
  info: kafka.ConsumerOptions
  consumer: kafka.HighLevelConsumer

  constructor(clientid?: string, host?: string, info?: kafka.ConsumerOptions) {
    this.host = host ? host : config.kafka.kafka;
    this.info = info ? info : config.kafka.consumer;
    this.id = clientid;
  }

  subscribe(topics: kafka.Topic[], onMessage?: (error?: any, data?: kafka.Message) => void): void {
    const consumerOpt = {
      'kafkaHost': 'kafka:9092',
      'sessionTimeout': 15000,
      'groupId': 'databroker-' + uuid()
    }

    this.consumer = new kafka.ConsumerGroup(consumerOpt, topics[0].topic)
    // let client = new kafka.Client(this.host, this.id);
    // this.consumer = new kafka.HighLevelConsumer(client, topics, this.info);
    this.consumer.on('message', (data: kafka.Message) => {
      if (onMessage) {
        onMessage(undefined, data);
      }
    });

    this.consumer.on('error', (error: any) => {
      console.error('Consumer [%s] has errored', this.info.groupId, error);
      if (onMessage) {
        onMessage(error);
      }
    })
  }
}
