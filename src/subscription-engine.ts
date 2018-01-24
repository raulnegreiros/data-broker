/* jslint node: true */
"use strict";

import tools = require('./simple-tools');
import config = require('./config');
import util = require('util');

import kafkaConsumer = require('./consumer');
import kafkaProducer = require('./producer');


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

type Action = {
  'topic' : string;
  'data' : any;
};

type RegisteredSubscriptions = {
  // Key: SubscriptionID, value: subscription data (all subscriptions)
  'flat': {
    [key: string]: any
  },

  // Subscriptions based on device ID
  'id': {
    [key: string]: any
  },

  // Subscriptions based on device model
  'model': {
    [key: string]: any
  },

  // Subscriptions based on device type
  'type': {
    [key: string]: any
  },
}


var registeredSubscriptions: RegisteredSubscriptions = {
  // Key: SubscriptionID, value: subscription data (all subscriptions)
  'flat' : {},

  // Subscriptions based on device ID
  'id' : {},

  // Subscriptions based on device model
  'model' : {},

  // Subscriptions based on device type
  'type' : {}
};

var producerContext: kafkaProducer.Context;

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

function addSubscription(type: 'model' | 'type' | 'id', key: string, subscription: Subscription) {
  registeredSubscriptions.flat[subscription.id] = subscription;
  if (!(key in registeredSubscriptions[type])) {
    registeredSubscriptions[type][key] = [];
  }
  registeredSubscriptions[type][key].push(subscription);
  if (subscription.notification != null) {
    kafkaProducer.createTopics(producerContext, [subscription.notification.topic]);
  }
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

function processEvent(obj: Event) {
  let subscriptions;
  let actions: Action[] = [];

  // Check whether there's any subscriptions to this device id
  if (obj.metadata.deviceid in registeredSubscriptions.id) {
    // There are subscriptions for this device ID
    subscriptions = registeredSubscriptions.id[obj.metadata.deviceid];
    actions = actions.concat(checkSubscriptions(obj, subscriptions));
  }

  // Check whether there's any subscriptions to this model
  if (obj.metadata.model in registeredSubscriptions.model) {
    // There are subscriptions for this device ID
    subscriptions = registeredSubscriptions.model[obj.metadata.model];
    actions = actions.concat(checkSubscriptions(obj, subscriptions));
  }

  // Check whether there's any subscriptions to this device type
  if (obj.metadata.type in registeredSubscriptions.type) {
    // There are subscriptions for this device ID
    subscriptions = registeredSubscriptions.type[obj.metadata.type];
    actions = actions.concat(checkSubscriptions(obj, subscriptions));
  }

  // Execute all actions
  for (let i = 0; i < actions.length; i++) {
    kafkaProducer.sendMessage(producerContext, JSON.stringify(actions[i].data), actions[i].topic, -1, '');
  }
}

function init() {
  console.log('Initializing subscription engine...');
  console.log('Creating consumer and producer contexts...');
  let consumerContext = kafkaConsumer.createContext('subscription-engine');
  producerContext = kafkaProducer.createContext();
  console.log('... both context were created.');

  let isReady = false;
  console.log('Initializing producer context... ');
  kafkaProducer.init(producerContext, function() {
    isReady = true;
  });
  console.log('... producer context was initialized.');

  console.log('Initializing consumer context... ');
  kafkaConsumer.init(consumerContext, config.kafka.consumerTopics, function (kafkaObj) {
    if (isReady === true) {
      let data = "";
      // console.log('New data arrived!');
      try {
        data = JSON.parse(kafkaObj.value.toString());
        console.log('Data: ' + util.inspect(data, {depth: null}));
        processEvent(new Event(data));
      } catch (err){
        if (err instanceof TypeError) {
          console.error('Received data is not a valid event: %s', kafkaObj.value.toString());
        }

        if (err instanceof SyntaxError) {
          console.error('Failed to parse event as JSON: %s', kafkaObj.value.toString());
        }
        return;
      }

    }
  });
  console.log('... consumer context was initialized.');

  console.log('... subscription engine initialized.');
}

export {init};
export {addSubscription};
