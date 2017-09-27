/* jshint node: true */

var config = {
  'kafka' : {
    'bootstrap' : 'localhost',
    'metadata_broker_list': 'localhost:9092',
    'batch_num_messages': 100,
    'producer': {
      'topic': 'all-devices',
      'partition': null,
      'key': null
    },
    'consumer': {
      'group_id' : 'iotagent-group',
      'topics': ['all-devices']
    }
  }
};


module.exports = config;