/* jslint node: true */
"use strict";

var engine = require('./subscription-engine');
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
const express = require('express');

const app = express();
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


app.post('/subscription', function(request, response) {
  let subscription = request.body;
  if ('id' in subscription.entities) {
    engine.addSubscription('id', subscription.entities.id, subscription);
  } else if ('model' in subscription.entities) {
    engine.addSubscription('model', subscription.entities.model, subscription);
  } else if ('type' in subscription.entities) {
    engine.addSubscription('type', subscription.entities.type, subscription);
  }
  response.send('Ok!');
});


app.listen(3500, function() {
  console.log('Subscription manager listening on port 3500');
  engine.init();
});

// function main() {
//     let subscription = {
//       'subject' : {
//         'entities': {
//           'id' : 'cafe'
//         },
//         'condition' : {
//           'attrs' : ['t.data'],
//           'expression' : {
//             'q' : 't.data>=50'
//           }
//         }
//       },
//       'notification': {
//         'topic' : 'subscription-xyz',
//         'attrs': ['t.data']
//       }
//     };
//     console.log('Creating subscription...');
//     addSubscription('id', 'cafe', subscription);
//     console.log('... subscription created.');
//     init();
//   }
//   main();