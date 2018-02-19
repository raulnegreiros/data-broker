export var kafka = {
  'zookeeper': 'zookeeper:2181',
  'kafka': 'kafka:9092',
  'consumer': {
    'autoCommit' : true,
    'fetchMaxWaitMs' : 1000,
    'fetchMaxBytes' : 1048576,
    'group' : 'subscription-engine',
    'id' : 'consumer-1'
  }
};

export var broker = {
  'ingestion': ['device-data', 'device_data']
}
