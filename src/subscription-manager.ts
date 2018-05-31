/* jslint node: true */
"use strict";

// import engine = require("./subscription-engine");

import {SubscriptionEngine, SubscriptionType} from "./subscription-engine";

import bodyParser = require("body-parser");
import express = require("express");
import util = require("util");
import { IAuthRequest, authEnforce, authParse} from "./api/authMiddleware";
import {TopicManagerBuilder} from "./topicManager";
import http = require("http");
import {SocketIOSingleton} from "./socketIo";
import config = require("./config")
import morgan = require("morgan");

const app = express();
app.use(authParse);
app.use(authEnforce);
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(morgan("short"));

const engine = new SubscriptionEngine();

const httpServer = http.createServer(app);
// make sure singleton is instantiated
SocketIOSingleton.getInstance(httpServer);

/*
 * Subscription management endpoints
 */
app.post("/subscription", function (request: IAuthRequest, response: express.Response) {
  console.log("Body: " + util.inspect(request.body, {depth: null}));
  let subscription = request.body;
  if ("id" in subscription.subject.entities) {
    engine.addSubscription(SubscriptionType.id, subscription.subject.entities.id, subscription);
  } else if ("model" in subscription.subject.entities) {
    engine.addSubscription(SubscriptionType.model, subscription.subject.entities.model, subscription);
  } else if ("type" in subscription.subject.entities) {
    engine.addSubscription(SubscriptionType.type, subscription.subject.entities.type, subscription);
  }
  response.send("Ok!");
});

/*
 * Topic registry endpoints
 */

app.get("/topic/:subject", function(req: IAuthRequest, response: express.Response) {
  let topics = TopicManagerBuilder.get(req.service);
  topics.getCreateTopic(req.params.subject, (error: any, data: any) => {
    if (error) {
      console.log("failed to retrieve topic", error);
      response.status(500);
      return response.send({"error": "failed to process topic"});
    }

    return response.status(200).send({"topic": data});
  })
});

app.get("/socketio", function(req: IAuthRequest, response: express.Response) {
  let token = SocketIOSingleton.getInstance().getToken(req.service);
  return response.status(200).send({"token": token});
});

httpServer.listen(80, function() {
  console.log("Subscription manager listening on port 80");
});
