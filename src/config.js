/* jshint node: true */

var config = {
  'kafka' : {
    'topic': 'supertest',
    'bootstrap' : 'localhost',
    'metadata_broker_list': 'localhost:9092',
    'batch_num_messages': 100
  }
};


module.exports = config;