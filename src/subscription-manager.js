/* jslint node: true */
"use strict";

var kafkaConsumer = require('./consumer');


var idSubscriptions = {};
var typeSubscriptions = {};


function evaluateCondition(condition, data) {
  switch (condition.operator) {
    case '==':
    // This test should also be more complete
      if (data[condition.variable].value === condition.value) {
        return true;
      }
    break;
  }

  return false;
}

function init() {
  let consumerContext = kafkaConsumer.createContext();
  let subscriptions;
  kafkaConsumer.init(consumerContext, function (kafkaObj) {
    let data = JSON.parse(kafkaObj.value.toString());
    if (data.metadata.deviceid in idSubscriptions) {
      subscriptions = idSubscriptions[data.metadata.deviceid];
      for (let i = 0; i < subscriptions.length; i++) {
        // This test should be more complete - a condition might have more than one
        // variable
        if (subscriptions[i].condition.variable in data.attrs) {
          if (evaluateCondition(subscriptions[i].condition, data.attrs)) {
            console.log('I should send something to ' + subscriptions[i].destination);
          }
        }
      }
    }

    if (data.metadata.devicetype in typeSubscriptions) {
      subscriptions = typeSubscriptions[data.metadata.devicetype];
      for (let i = 0; i < subscriptions.length; i++) {
        // This test should be more complete - a condition might have more than one
        // variable
        if (subscriptions[i].condition.variable in data) {
          if (evaluateCondition(subscriptions[i].condition, data)) {
            console.log('I should send something to ' + subscriptions[i].destination);
          }
        }
      }
    }
  });
}

function parseCondition(condition) {
  return { variable: 'data.device', operator: '==', value: 'termometro' };
}

function createSubscription(condition, deviceid, devicetype, destination) {

  let parsedCondition = parseCondition(condition);

  let newSubscription = {
    'condition': parsedCondition,
    'deviceid': deviceid,
    'devicetype': devicetype,
    'destination': destination
  };

  if (deviceid != null) {
    if (!(deviceid in idSubscriptions)) {
      idSubscriptions[deviceid] = [];
    }
    idSubscriptions[deviceid].push(newSubscription);
  } else if (devicetype != null) {
    if (!(devicetype in typeSubscriptions)) {
      typeSubscriptions[devicetype] = [];
    }
    typeSubscriptions[devicetype].push(newSubscription);
  }
}

// exports.createSubscription = createSubscription;
// exports.init = init;

createSubscription('lala', 'cafe', null, 'http://172.18.0.1:8081/dev/cafe');
createSubscription('lala', 'coisa', null, 'http://172.18.0.1:8081/dev/coisa');
init();
