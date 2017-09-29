/* jslint node: true */
"use strict";

var tools = require('./simple-tools'),
    config = require('./config');

var kafkaConsumer = require('./consumer'),
    kafkaProducer = require('./producer');


var registeredSubscriptions = {
  // Key: SubscriptionID, value: subscription data (all subscriptions)
  'flat' : { },

  // Subscriptions based on device ID
  'id' : {},

  // Subscriptions based on device model
  'model' : {},

  // Subscriptions based on device type
  'type' : {}
};

var producerContext;

var operators = ['==', '!=', '>=', '<=', '~=', '>', '<' ];

function evaluateLogicCondition(condition, data) {
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
            ret &= (data[logicTokens[0]].value == logicTokens[1]);
            found = true;
            break;
          case '!=':
            ret &= (data[logicTokens[0]].value != logicTokens[1]);
            found = true;
            break;
          case '>':
            ret &= (data[logicTokens[0]].value > parseFloat(logicTokens[1]));
            found = true;
            break;
          case '>=':
            ret &= (data[logicTokens[0]].value >= parseFloat(logicTokens[1]));
            found = true;
            break;
          case '<':
            ret &= (data[logicTokens[0]].value < parseFloat(logicTokens[1]));
            found = true;
            break;
          case '<=':
            ret &= (data[logicTokens[0]].value <= parseFloat(logicTokens[1]));
            found = true;
            break;
          case '~=':
            ret &= (logicTokens[1].exec(data[logicTokens[0]].value).length != 0);
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

function evaluateMetaCondition(condition, data) {
  let ret = true;
  // TODO
  return ret;
}

function evaluateGeoCondition(georel, geometry, coords, data) {
  let ret = true;
  // TODO
  return ret;
}

function evaluateCondition(condition, data) {
  let ret = true;

  if ('q' in condition) {
    ret &= evaluateLogicCondition(condition.q, data);
  }

  if ('mq' in condition) {
    ret &= evaluateMetaCondition(condition.mq, data);
  }

  if ('georel' in condition) {
    ret &= evaluateGeoCondition(condition.georel, condition.geometry, condition.coords, data);
  }

  return ret;
}

function addSubscription(type, key, subscription) {
  registeredSubscriptions.flat[subscription.id] = subscription;
  if (!(key in registeredSubscriptions[type])) {
    registeredSubscriptions[type][key] = [];
  }
  registeredSubscriptions[type][key].push(subscription);
}

function generateOutputData(obj, notification) {
  let ret = {
    'topic' : notification.topic,
    'data' : {}
  };

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


function checkSubscriptions(obj, subscriptions) {
  let actions = [];

  for (let i = 0; i < subscriptions.length; i++) {
    if ('condition' in subscriptions[i].subject) {
      if ('attrs' in subscriptions[i].subject.condition) {
        // This subscription has some associated attributes, let's check them
        let subscAttrs = subscriptions[i].subject.condition.attrs;
        for (let j = 0; j < subscAttrs.length; j++) {
          if (subscriptions[i].subject.condition.attrs[j] in obj.attrs) {
            // This subscription should be evaluated;
            if ('expression' in subscriptions[i].subject.condition) {
              // TODO Gather all data from the device - the condition might use a few
              // variables that were not registered with this subscription
              if (evaluateCondition(subscriptions[i].subject.condition.expression, obj.attrs)) {
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

function processNotification(obj) {
  let subscriptions;
  let actions = [];

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
    kafkaProducer.sendMessage(producerContext, JSON.stringify(actions[i].data), actions[i].topic, null, null);
  }
}

function init() {
  console.log('Initializing subscription engine...');
  console.log('Creating consumer and producer contexts...');
  let consumerContext = kafkaConsumer.createContext();
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
      console.log('New data arrived!');
      let data = JSON.parse(kafkaObj.value.toString());
      processNotification(data);
    }
  });
  console.log('... consumer context was initialized.');

  console.log('... subscription engine initialized.');
}

exports.init = init;
exports.addSubscription = addSubscription;