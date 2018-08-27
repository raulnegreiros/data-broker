const kafka = {
  consumer: {
    autoCommit : true,
    fetchMaxBytes : 1048576,
    fetchMaxWaitMs : 1000,
    group : "subscription-engine",
    id : "consumer-1",
  },
  kafkaAddress: process.env.DATABROKER_KAFKA_ADDRESS || "kafka",
  kafkaPort: process.env.DATABROKER_KAFKA_PORT || 9092,
  zookeeper: process.env.DATABROKER_ZOOKEEPER_HOST || "zookeeper:2181",
};

const broker = {
  ingestion: ["device-data", "device_data"],
};

const cache = {
  redis : process.env.DATABROKER_CACHE_HOST || "data-broker-redis",
};

export { kafka, broker, cache};
