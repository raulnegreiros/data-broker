/* jslint node: true */
"use strict";

import sio = require('socket.io');
import kafka = require('kafka-node');
var uuid = require('uuid/v4');

import redis = require('redis');
import {RedisManager} from './redisManager';

import {KafkaConsumer} from './consumer';
import {TopicManager} from './topicManager';

function getKey(token:string): string {
  return 'si:' + token;
}

class SocketIOHandler {
  ioServer: SocketIO.Server;
  consumers: {[key:string]: KafkaConsumer};

  constructor(httpServer:any) {
    this.consumers = {};
    this.ioServer = sio(httpServer);

    this.handleMessage.bind(this);
    this.checkSocket.bind(this);

    this.ioServer.use(this.checkSocket);

    this.ioServer.on('connection', (socket) => {
      console.log('Got new socketio connection');
      let redis = RedisManager.getClient('');
      const givenToken = socket.handshake.query.token;

      redis.runScript(__dirname + '/lua/setDel.lua', [getKey(givenToken)],[], (error: any, tenant) => {
        if (error || (!tenant)) {
          console.error('Failed to find suitable context for socket', socket.id);
          socket.disconnect();
          return;
        }

        console.log('will assign client [%s] to namespace: (%s)', givenToken, tenant, socket.id);
        socket.join(tenant);
      })
    });
  }

  private checkSocket(socket:SocketIO.Socket, next:(error?: Error) => void) {
    const givenToken = socket.handshake.query.token;
    const namespace = socket.nsp;
    if (givenToken) {
      // console.log('got token', givenToken);
      const key = 'si:' + givenToken;
      let redis = RedisManager.getClient('');
      redis.client.get(getKey(givenToken), (error, value) => {
        if (error) {
          return next(new Error("Failed to verify token"));
        }
        if (value) {
          return next();
        } else {
          return next(new Error("Authentication error: unknown token"))
        }
      })
    } else {
      return next(new Error('Authentication error: missing token'));
    }
  }

  private handleMessage(nsp:string, error?:any, message?:kafka.Message) {

    if (error || (message === undefined)) {
      console.error('Invalid event received. Ignoring', error);
      return;
    }

    let data:any;
    try {
      data = JSON.parse(message.value);
    } catch (err){
      if (err instanceof TypeError) {
        console.error('Received data is not a valid event: %s', message.value);
      } else if (err instanceof SyntaxError) {
        console.error('Failed to parse event as JSON: %s', message.value);
      }
      return;
    }

    console.log('will publish event [%s] %s', nsp, message.value);
    this.ioServer.to(nsp).emit(data.metadata.deviceid, data);
    this.ioServer.to(nsp).emit('all', data);
  }

  private subscribeTopic(topic:string, tenant:string) {
    if (this.consumers.hasOwnProperty(topic)) {
      return this.consumers[topic];
    }

    console.log('Will subscribe to topic [%s]', topic)
    let subscriber = new KafkaConsumer();
    this.consumers[topic] = subscriber;
    subscriber.subscribe([{topic: topic}], (error?:any, message?:kafka.Message) => {
      this.handleMessage(tenant, error, message);
    });

    return subscriber;
  }

  getToken(tenant:string) {
    let topicManager = new TopicManager(tenant);
    topicManager.getCreateTopic('device-data', (error?:any, topic?:string) => {
      if (error || !topic) {
        console.error('Failed to find appropriate topic for tenant: ',
                      error ? error : "Unknown topic");
        return;
      }

      this.subscribeTopic(topic, tenant);
    })

    const token = uuid();
    let redis = RedisManager.getClient(tenant);
    redis.client.setex(getKey(token), 60, tenant);
    return token;

  }
}

class SocketIOSingletonImpl {
  private handler: SocketIOHandler

  getInstance(httpServer?:any) {
    if (this.handler) {
      return this.handler;
    }

    if (httpServer) {
      this.handler = new SocketIOHandler(httpServer);
      return this.handler;
    }

    throw new Error('Failed to instantiate socketio server');
  }
}

export var SocketIOSingleton = new SocketIOSingletonImpl();
