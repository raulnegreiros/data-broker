/* jshint node: true */

var config = {
  'kafka': {
    'bootstrap': 'localhost',
    'metadata_broker_list': 'localhost:9092',
    'batch_num_messages': 100,
    'producer': {
      'topic': 'all-devices',
      'partition': null,
      'key': null
    },
    'consumer': {
      'group_id': 'iotagent-group',
      'topics': ['all-devices']
    }
  },
  'mqtt': {
    host: 'localhost',
    port: 1883,
    protocolId: 'MQIsdp',
    protocolVersion: 3,
    secure: false,
    tls: {
      key: 'client-key.pem',
      cert: 'client-cert.pem',
      ca: ['server-cert.pem'],
      version: 'TLSv1_2_method' // If empty, TLS version is automatic
    }
  }
};


module.exports = config;