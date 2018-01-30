/* jslint node: true */
"use strict";

import tools = require('./simple-tools');
import config = require('./config');
import util = require('util');

import kafka = require('kafka-node');
import {KafkaConsumer} from './consumer';
import {KafkaProducer} from './producer';

class Condition {
  attrs: string[];
  expression: {
    q: string | null;
    mq: string | null;
    georel: 'convered-by' | 'intersects' | null;
    geometry: 'point' | 'polygon' | null;
    coords: string[] | null;
  }
}

class Notification {
  topic: string;
  attrs: string[];
}

class Subscription {
  id: string;
  subject: {
    entities: {
      id: string;
      idPattern: string;
      model: string;
      modelPattern: string;
      type: string;
      typePattern: string;
    };
    condition: Condition | null;
  };
  notification: Notification;


  constructor() {
    this.id = '';
    this.subject = {
      entities: {
        id: '',
        idPattern: '',
        model: '',
        modelPattern: '',
        type: '',
        typePattern: '',
      },
      condition: null
    };
    this.notification = new Notification();
  }
}

class Event {
  // Metadata might be 'any' as well.
  metadata: {
    topic: string | null;
    protocol: string;
    payload: string;
    deviceid: string;
    type: string;
    model: string;
  };
  attrs: any;

  constructor(data: any) {
    this.metadata = {
      topic: data.metadata.topic,
      protocol: data.metadata.protocol,
      payload: data.metadata.payload,
      deviceid: data.metadata.deviceid,
      type: data.metadata.type,
      model: data.metadata.model
    };
    this.attrs = data.attrs;
  };
};

interface Action {
  'topic' : string;
  'data' : any;
};

// Now this is awful, but
export enum SubscriptionType {model = 'model', type = 'type', id = 'id', flat = 'flat'};

type SubscriptionMap = {[key: string]: any};

interface RegisteredSubscriptions {
  // This will allow "invalid" types on indirect access to attributes, but we need it for
  // the compiler to allow indirect (e.g. var[valuePointer] ) attribute reading/writing
  [k:string]: SubscriptionMap,

  'flat' : SubscriptionMap,
  'id' : SubscriptionMap,
  'model' : SubscriptionMap,
  'type' : SubscriptionMap
}

var producer: KafkaProducer;

var operators = ['==', '!=', '>=', '<=', '~=', '>', '<' ];

function evaluateLogicCondition(condition: string, data: any) {
  let ret = true;

  let logicTests = tools.tokenize(condition, ';');

  for (let i = 0; i < logicTests.length; i++) {
    for (let j = 0; j < operators.length; j++) {
      let found = false;
      let logicTokens = tools.tokenize(logicTests[i], operators[j]);
      if (logicTokens.length > 1) {
        // There's something here
        switch (operators[j]) {
          case '==':
            ret = ret && (data[logicTokens[0]].value == logicTokens[1]);
            found = true;
            break;
          case '!=':
            ret = ret && (data[logicTokens[0]].value != logicTokens[1]);
            found = true;
            break;
          case '>':
            ret = ret && (data[logicTokens[0]].value > parseFloat(logicTokens[1]));
            found = true;
            break;
          case '>=':
            ret = ret && (data[logicTokens[0]].value >= parseFloat(logicTokens[1]));
            found = true;
            break;
          case '<':
            ret = ret && (data[logicTokens[0]].value < parseFloat(logicTokens[1]));
            found = true;
            break;
          case '<=':
            ret = ret && (data[logicTokens[0]].value <= parseFloat(logicTokens[1]));
            found = true;
            break;
          case '~=':
            // ret = ret && (logicTokens[1].exec(data[logicTokens[0]].value).length != 0);
            found = true;
            break;
        }
      }
      if ((found === true) || (ret === false)) {
        break;
      }
    }
    if (ret === false) {
      break;
    }
  }

  return ret;
}

function evaluateMetaCondition(condition: string, data: any) {
  let ret = true;
  // TODO
  return ret;
}

function evaluateGeoCondition(georel: string, geometry: string, coords: string, data: any) {
  let ret = true;
  // TODO
  return ret;
}

function evaluateCondition(condition: any, data: any) {
  let ret = true;

  if ('q' in condition) {
    ret = ret && evaluateLogicCondition(condition.q, data);
  }

  if ('mq' in condition) {
    ret = ret && evaluateMetaCondition(condition.mq, data);
  }

  if ('georel' in condition) {
    ret = ret && evaluateGeoCondition(condition.georel, condition.geometry, condition.coords, data);
  }

  return ret;
}

function generateOutputData(obj: Event, notification: Notification) : Action{
  let ret: Action = { 'topic': notification.topic, data: {}};

  // notification.attrs contains all the attributes that must be
  // forwarded to output.
  // obj.attrs contains all the data retrieved from the device
  for (let i = 0; i < notification.attrs.length; i++) {
    if (notification.attrs[i] in obj.attrs) {
      let attrName = notification.attrs[i];
      ret.data[attrName] = obj.attrs[attrName].value;
    }
  }

  return ret;
}

function checkSubscriptions(obj: Event, subscriptions: Subscription[]) : Action[] {
  let actions: Action[] = [];

  for (let i = 0; i < subscriptions.length; i++) {
    if (subscriptions[i].subject.condition != null) {
      if (subscriptions[i].subject.condition!.attrs != null) {
        // This subscription has some associated attributes, let's check them
        let subscAttrs = subscriptions[i].subject.condition!.attrs;
        for (let j = 0; j < subscAttrs.length; j++) {
          if (subscriptions[i].subject.condition!.attrs[j] in obj.attrs) {
            // This subscription should be evaluated;
            if (subscriptions[i].subject.condition!.expression != null) {
              // TODO Gather all data from the device - the condition might use a few
              // variables that were not registered with this subscription
              if (evaluateCondition(subscriptions[i].subject.condition!.expression, obj.attrs)) {
                console.log('I should send something to ' + subscriptions[i].notification.topic);
                actions.push(generateOutputData(obj, subscriptions[i].notification));
              }
            } else {
              // There is no condition to this subscription - it should be triggered
              console.log('I should send something to ' + subscriptions[i].notification.topic);
              actions.push(generateOutputData(obj, subscriptions[i].notification));
            }
            break;
          }
        }
      } else {
        // All attributes should evaluate this subscription
        console.log('I should send something to ' + subscriptions[i].notification.topic);
        actions.push(generateOutputData(obj, subscriptions[i].notification));
      }
    } else {
      // This subscription will be triggered whenever a message is sent by this device
      console.log('I should send something to ' + subscriptions[i].notification.topic);
      actions.push(generateOutputData(obj, subscriptions[i].notification));
    }
  }

  return actions;
}

export class SubscriptionEngine {
  private producer: KafkaProducer;
  private producerReady: boolean;

  private subscriber: KafkaConsumer;

  registeredSubscriptions: RegisteredSubscriptions;

  constructor() {
    console.log('Initializing subscription engine...');
    this.producerReady = false;
    this.producer = new KafkaProducer(undefined, () => {
      this.producerReady = true;
    });

    this.subscriber = new KafkaConsumer();

    this.handleEvent.bind(this);
  }

  processEvent(obj: Event) {
    let subscriptions;
    let actions: Action[] = [];

    // Check whether there's any subscriptions to this device id
    if (obj.metadata.deviceid in this.registeredSubscriptions.id) {
      // There are subscriptions for this device ID
      subscriptions = this.registeredSubscriptions.id[obj.metadata.deviceid];
      actions = actions.concat(checkSubscriptions(obj, subscriptions));
    }

    // Check whether there's any subscriptions to this model
    if (obj.metadata.model in this.registeredSubscriptions.model) {
      // There are subscriptions for this device ID
      subscriptions = this.registeredSubscriptions.model[obj.metadata.model];
      actions = actions.concat(checkSubscriptions(obj, subscriptions));
    }

    // Check whether there's any subscriptions to this device type
    if (obj.metadata.type in this.registeredSubscriptions.type) {
      // There are subscriptions for this device ID
      subscriptions = this.registeredSubscriptions.type[obj.metadata.type];
      actions = actions.concat(checkSubscriptions(obj, subscriptions));
    }

    // Execute all actions
    for (let i = 0; i < actions.length; i++) {
      producer.send(JSON.stringify(actions[i].data), actions[i].topic);
    }
  }

  handleEvent(err: any, message: kafka.Message){
    if (err) {
      console.error('Subscriber reported error', err);
      return;
    }

    if (this.producerReady == false) {
      console.error('Got event before being ready to handle it, ignoring');
      return;
    }

    let data: string;
    console.log('New data arrived!');
    try {
      data = JSON.parse(message.value);
      console.log('Data: ' + util.inspect(data, {depth: null}));
      this.processEvent(new Event(data));
    } catch (err){
      if (err instanceof TypeError) {
        console.error('Received data is not a valid event: %s', message.value);
      } else if (err instanceof SyntaxError) {
        console.error('Failed to parse event as JSON: %s', message.value);
      }
    }
  }

  addIngestionChannel(topic: string[]) {
    let kafkaTopics: kafka.Topic[] = [];
    for (let i in topic) {
      kafkaTopics.push({'topic': i});
    }
    this.subscriber.subscribe(kafkaTopics, this.handleEvent);
  }

  addSubscription(type: SubscriptionType, key: string, subscription: Subscription) {
    this.registeredSubscriptions.flat[subscription.id] = subscription;
    if (!(key in this.registeredSubscriptions[type])) {
      this.registeredSubscriptions[type][key] = [];
    }
    this.registeredSubscriptions[type][key].push(subscription);
    if (subscription.notification != null) {
      this.producer.createTopics([subscription.notification.topic]);
    }
  }
}
