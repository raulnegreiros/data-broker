import kafka = require("kafka-node");
import config = require("./config");
const dojot_libs = require('dojot-libs');

/**
 * Class for producing data to be sent through Kafka
 */
class KafkaProducer {

  /** The producer object used by Kafka library */
  private producer: kafka.HighLevelProducer;

  /**
   * Constructor.
   * @param host The host used to send messages. If not set it will be retrieved from configuration object.
   * @param init Callback executed when the producer indicates that it is ready to use.
   */
  constructor(host?: string, init?: () => void) {
    dojot_libs.logger.debug("Creating new Kafka producer...", {filename: "producer"});
    const kafkaHost = host ? host : config.kafka.zookeeper;
    dojot_libs.logger.debug("Creating Kafka client...", {filename: "producer"});
    const client = new kafka.Client(kafkaHost);
    dojot_libs.logger.debug("... Kafka client was created.", {filename: "producer"});
    dojot_libs.logger.debug("Creating Kafka HighLevenProducer...", {filename: "producer"});
    this.producer = new kafka.HighLevelProducer(client, {requireAcks: 1});
    dojot_libs.logger.debug("... HighLevelProducer was created.", {filename: "producer"});
    this.producer.on("ready", () => {
      if (init) {
        init();
      }
    });

    dojot_libs.logger.debug("... Kafka producer was created.", {filename: "producer"});
  }

  /**
   * Send a message to Kafka through a topic.
   *
   * @param message The message to be sent
   * @param topic Topic through which the message will be sent
   * @param key If defined, it sends a keyed message. Check Kafka docs for more information on that.
   */
  public send(message: string, topic: string, key?: string) {
    dojot_libs.logger.debug("Sending message through Kafka...", {filename: "producer"});
    let msgPayload;
    if (key) {
      dojot_libs.logger.debug("Sending a keyed message.", {filename: "producer"});
      msgPayload = new kafka.KeyedMessage(key, message);
    } else {
      dojot_libs.logger.debug("Sending a plain message.", {filename: "producer"});
      msgPayload = message;
    }

    const contextMessage = {
      messages: [msgPayload],
      topic,
    };

    dojot_libs.logger.debug("Invoking message transmission...", {filename: "producer"});
    this.producer.send([contextMessage], (err, result) => {
      if (err !== undefined) {
        dojot_libs.logger.debug(`Message transmission failed: ${err}`, {filename: "producer"});
      } else {
        dojot_libs.logger.debug("Message transmission succeeded.", {filename: "producer"});
      }
      if (result !== undefined) {
        dojot_libs.logger.debug(`Result is: ${result}`, {filename: "producer"});
      }
    });
    dojot_libs.logger.debug("... message transmission was requested.", {filename: "producer"});
  }

  /**
   * Create a list of topics.
   * @param topics The topics to be created.
   * @param callback The callback that will be invoked when the topics are created.
   */
  public createTopics(topics: string[], callback?: (err: any, data: any) => void) {
    dojot_libs.logger.debug("Creating topics...", {filename: "producer"});
    if (callback) {
      this.producer.createTopics(topics, callback);
    } else {
      this.producer.createTopics(topics, () => {
        dojot_libs.logger.debug("No callback defined for topic creation.", {filename: "producer"});
      });
    }

    dojot_libs.logger.debug("... topics creation was requested.", {filename: "producer"});
  }

  /**
   * Close this producer.
   * No more messages will be sent by it.
   */
  public close() {
    dojot_libs.logger.debug("Closing producer...", {filename: "producer"});
    this.producer.close();
    dojot_libs.logger.debug("... producer was closed.", {filename: "producer"});
  }
}

export { KafkaProducer };
