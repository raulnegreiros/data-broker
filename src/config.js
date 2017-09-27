/* jshint node: true */

var config = {
  'kafka' : {
    'topic': 'supertest',
    'bootstrap' : '172.17.0.2',
    'metadata_broker_list': '172.17.0.2:9092',
    'batch_num_messages': 1
  }
};


module.exports = config;