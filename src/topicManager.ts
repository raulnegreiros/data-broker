/* jslint node: true */
"use strict";

import redis = require("redis");
import {broker as config} from "./config";
import {KafkaProducer} from "./producer";
import {ClientWrapper, RedisManager} from "./redisManager";

var uuid = require("uuid/v4");


export type TopicCallback = (error?: any, topic?: string) => void;

class QueuedTopic {
  subject: string;
  topic: string;
  callback: TopicCallback | undefined;
}

// TODO this should also handle kafka ACL configuration
export class TopicManager {
  redis: ClientWrapper;
  service: string;
  get_set: string;
  producer: KafkaProducer;
  producerReady: boolean;
  topicQueue: QueuedTopic[];

  constructor(service: string) {
    if ((service === undefined) || service.length == 0) {
      throw new Error("a valid service id must be supplied");
    }

    this.service = service;
    this.redis = RedisManager.getClient(this.service);
    this.get_set = __dirname + "/lua/setGet.lua";
    this.producerReady = false;
    this.topicQueue= [];
    this.producer = new KafkaProducer(undefined, () => {
      this.producerReady = true;
      if (this.topicQueue.length) {
        for (let request of this.topicQueue) {
          this.handleRequest(request);
        }
      }
    });
  }

  assertTopic(topicid: string, message: string): void {
    if ((topicid === undefined) || topicid.length == 0) {
      throw new Error(message);
    }
  }

  parseKey(subject: string) {
    this.assertTopic(subject, "a valid subject must be provided");
    return "ti:" + this.service + ":" + subject;
  }

  handleRequest(request: QueuedTopic) {
    this.producer.createTopics([request.topic], () => {
      if (config.ingestion.find((i) => {return request.subject === i;})) {
        // Subject is used for data ingestion - initialize consumer
        console.log("will initialize ingestion handler: %s", request.subject, request.topic);
      }

      if (request.callback) {
        request.callback(undefined, request.topic);
      }
    })
  }

  getCreateTopic(subject: string, callback: TopicCallback | undefined): void {
    try {
      const key: string = this.parseKey(subject);
      const tid: string = uuid();
      this.redis.runScript(this.get_set, [key], [tid], (err: any, topic: string) => {
        if (err) {
          if (callback){
            callback(err);
          }
        }

        let request = {"topic": topic, "subject": subject, "callback": callback};
        if (this.producerReady){
          this.handleRequest(request);
        } else {
          this.topicQueue.push(request);
        }
      });
    } catch (error) {
      if (callback){
        callback(error);
      }
    }
  }

  destroy() {
    this.producer.close();
  }
}

class Builder {
  managers: {[key:string]: TopicManager}
  constructor() {
    this.managers = {}
  }

  get(service: string): TopicManager {
    if (!this.managers.hasOwnProperty(service)) {
      this.managers[service] = new TopicManager(service);
    }

    return this.managers[service];
  }
}

export let TopicManagerBuilder = new Builder();
