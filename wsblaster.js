#!/usr/bin/env node
'use strict';

process.on('unhandledRejection', (reason, _p) => {
  console.log(reason); // necessary for full stack trace
});
process.on('uncaughtException', (err) => {
  let stack = err.stack;
  delete err.__cached_trace__;
  delete err.__previous__;
  delete err.domain;
  cnsole.log(JSON.stringify({
    event: 'error',
    error: err.name,
    stack: stack
  }));
});

const Client = require('./client');
const MAX_CLIENTS = 1000;

const timeout = ms => new Promise(res => setTimeout(res, ms));

class WSBlaster {
  constructor() {
    this.clients = [];
  }

  async open(url) {
    for (let i=0; i < MAX_CLIENTS; i++) {
      console.log(`creating client #${i+1}`);
      this.clients.push(new Client());
    }
    for (let client of this.clients) {
      await client.open(url);
    }
    return;
  }

  getRandomIndex(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  send(msg) {
    let i = this.getRandomIndex(0, this.clients.length - 1);
    this.clients[i].sendMessage(msg);
  }

  close() {
    for (let client of this.clients) {
      client.close();
    }
  }

  getRandomMessage() {
    let messagePool = [
      '{"to":"hydra-router:[GET]/v1/router/version","from":"client:/","body":{}}',
      '{"to":"hydra-router:[GET]/v1/router/health","from":"client:/","body":{}}',
      '{"to":"hydra-router:/","frm":"@client:/","mid":"11ae9682-f295-4ff7-92d1-b1242cd349bf","ts":"2018-03-01T03:14:40.249Z","ver":"UMF/1.4.6","typ":"ping","bdy":{}}',
      '{"to":"hydra-router:/","frm":"26c8cad75w1@client:/","mid":"11ae9682-f295-4ff7-92d1-b1242cd349bf","ts":"2018-03-01T03:14:40.249Z","ver":"UMF/1.4.6","fwd":"v0xwqbnjcz@client:/","bdy":{"text":"Hey there buddy!"}}'
    ];
    return messagePool[this.getRandomIndex(0, messagePool.length-1)];
  }

  async run() {
    const DURATION = 60 ; // in seconds
    const MAX_MESSAGES = 100;
    let range = [...Array(DURATION).keys()];

    await this.open('ws://localhost:5353');

    console.log('Dispatching messages...');

    for (let r of range) {
      for (let i = 0; i < MAX_CLIENTS; i++) {
        for (let j = 0; j < this.getRandomIndex(1, MAX_MESSAGES); j++) {
          this.send(this.getRandomMessage());
        }
      }
      await timeout(1000);
      console.log('seconds:', r+1);
    }

    console.log('Closing websockets');
    this.close();
  }
}

new WSBlaster().run();

