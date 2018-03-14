export var kafka = {
  'zookeeper': process.env.DATABROKER_ZOOKEEPER_HOST || 'zookeeper:2181',
  'kafka': process.env.DATABROKER_KAFKA_HOST || 'kafka:9092',
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

export var cache = {
  'redis' : process.env.DATABROKER_CACHE_HOST || 'data-broker-redis'
}
