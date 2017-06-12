var Kafka = require("node-rdkafka"),
    readline = require('readline');

function createKafkaProducer() {
    // Didn't find a way to set the message delivery callback.
    return new Kafka.Producer.createWriteStream({
        'compression.codec' : 'snappy',
        'bootstrap.servers': '127.0.0.1',
        'metadata.broker.list': '127.0.0.1:9092',
        "batch.num.messages" : 100
    }, {}, {'topic' : 'demo-default-topic.xis'});
}

function createKafkaConsumer() {
    // Didn't find a way to set the message delivery callback.
    return new Kafka.KafkaConsumer.createReadStream({
        'compression.codec' : 'snappy',
        'bootstrap.servers': '127.0.0.1',
        'metadata.broker.list': '127.0.0.1:9092',
        "batch.num.messages" : 100,
        "group.id" : "demo-group"
    }, {}, { 'topics' : ['^demo-default-topic.*']});
}


function sendMessage(message, kf_prod_stream) {
    // Writes a message to the stream
    var ret = kf_prod_stream.write(new Buffer(message));

    if (ret) {
        console.log('We queued our message!');
    } else {
        // Note that this only tells us if the stream's queue is full,
        // it does NOT tell us if the message got to Kafka!  See below...
        console.log('Too many messages in our queue already');
    }

    kf_prod_stream.on('error', function (err) {
        // Here's where we'll know if something went wrong sending to Kafka
        console.error('Error in our kafka stream');
        console.error(err);
    })
}

function main() {
    // Quick explanation:
    // Kafka is build around four core entities:
    //  - Producers: almost self-explanatory, these are the elements that, well,
    //      generate messages to be published.
    //  - Consumers: the producer counterpart - these elements read messages
    //  - Streams processors: elements that transform messages between message
    //      streams, playing a consumer role at one end, doing something to
    //      those messages and then sending the results to another stream as a
    //      producer.
    //  - Connectors: Like "templates" - these elements are reusable producer/
    //      consumers that connects specific topics to applications.
    // Now, simply put: messages are published in topics, and they can be
    // retrieved individually or in chunks of timeslots.

    var kf_producer = createKafkaProducer();
    var kf_consumer = createKafkaConsumer();
    kf_consumer.on('data', function(message) {
        console.log('Got message');
        console.log(message.value.toString());


        console.log("cons) Received a message");
        if (message.err != RD_KAFKA_RESP_ERR_NO_ERROR) {
            return;
        }
        console.log("cons) Received message for topic: " << message.topic);
        console.log("cons) Message: " << message.value.toString());
    });

    //
    // We are almost ready to send a message.
    // Now we need to create the actual message and select a partition
    //
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('line', (input) => {
        console.log('prod) Sending message:', input);
        var ret = sendMessage(input, kf_producer);
        if (input === '-1') {
            process.exit();
        }
    });
}

main();
