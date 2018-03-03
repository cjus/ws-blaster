const WebSocket = require('ws');

/**
* @name Client
* @summary Message Client
*/
class Client {
  /**
  * @name constructor
  * @summary class constructor
  * @return {undefined}
  */
  constructor() {
    this.ws = null;
    this.url = '';
    this.clientID = 0;
  }

  /**
   * @name open
   * @param {string} url - hydra-router server url
   * @return {undefined}
   */
  open(url) {
    return new Promise((resolve, _reject) => {
      this.url = url;
      this.ws = new WebSocket(this.url);

      this.ws.on('open', () => {
        resolve();
      });

      this.ws.on('message', (message) => {
        let msg = JSON.parse(message);
        if (msg.typ === 'connection') {
          this.clientID = msg.bdy.id;
        }
      });

      this.ws.on('close', () => {
      });

      this.ws.on('error', (error) => {
        try {
          console.log(`error detected from client ${this.clientID}`);
        } catch (e) {
          console.log(e, error);
        }
      });
    });
  }

  /**
   * @name close
   * @return {undefined}
  */
  close() {
    if (this.ws) {
      this.ws.close();
    }
  }

  /**
   * @name sendMessage
   * @param {string} msg - message craeted with createMessage
   * @return {undefined}
   */
  async sendMessage(msg) {
    if (this.ws && this.ws.readyState === this.ws.OPEN) {
      this.ws.send(msg);
    } else {
      await this.open(this.url);
      console.log('reopening socket');
      this.sendMessage(msg);
    }
  }
}

module.exports = Client;
