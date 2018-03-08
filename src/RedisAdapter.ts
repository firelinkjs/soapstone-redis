import redis from 'redis';
import { EventEmitter } from 'events';
import createDebugger from 'debug';
import { defaults } from 'lodash';
import { ClientOptions, Client, Adapter } from '@firelink/soapstone';

const debug = createDebugger('@firelink/soapstone:redis');

/**
 * The **Redis** `Adapter`.
 *
 * @class
 */
export class RedisAdapter extends EventEmitter implements Adapter {

  public client: Client;
  public options: ClientOptions & { redis?: any };
  public pubClient: any;
  public subClient: any;

  public clients: EventEmitter;

  constructor(client: Client) {
    super();
    this.client = client;
    this.options = client.options;
  }

  public connect(done?) {
    this.pubClient = redis.createClient(
      this.options.port,
      this.options.hostname,
      this.options.redis
    );

    this.subClient = redis.createClient(
      this.options.port,
      this.options.hostname,
      this.options.redis
    );

    let connacks = 0;
    this.clients = new EventEmitter();

    this.subClient.once('connect', onConnect.bind(this));
    this.pubClient.once('connect', onConnect.bind(this));
    this.pubClient.on('error', this.clients.emit.bind(this.clients, 'error'));
    this.subClient.on('error', this.clients.emit.bind(this.clients, 'error'));

    function onConnect() {
      connacks++;
      if (connacks === 2) {
        this.clients.emit('connect');
      }
    }

    const promise = new Promise((resolve, reject) => {
      this.clients.once('connect', () => {
        this.clients.removeListener('error', reject);
        resolve();
      });

      this.clients.once('error', reject);
    });

    this.subClient.on('message', (topic, message, opts) => {
      this.client.emit('message', topic, message, opts);
    });

    if (done) {
      return promise
        .then(() => done())
        .catch((err) => done(err));
    } else {
      return promise;
    }
  }

  public end(done?) {
    this.pubClient.end();
    this.subClient.end();
    return done ? done() : Promise.resolve();
  }

  /**
   * Publish a `message` to the specified `topic`.
   *
   * @param {String} topic The topic to publish to.
   * @param {String|Buffer} message The message to publish to the topic.
   * @param {Object} [options] Additional options that are not required for publishing a message.
   * @param {Number} [options.qos] **default: `0`** The **MQTT** QoS (Quality of Service) setting.
   *
   * **Supported Values**
   *
   *   - `0` - Just as reliable as TCP. Adapter will not get any missed messages (while it was disconnected).
   *   - `1` - Adapter receives missed messages at least once and sometimes more than once.
   *   - `2` - Adapter receives missed messages only once.
   *
   * @callback {Function} callback Called once the adapter has successfully finished publishing the message.
   * @param {Error} err An error object is included if an error was supplied by the adapter.
   */
  public publish(topic, message, options?, done?) {
    const promise = new Promise((resolve) => {
      this.pubClient.publish(topic, message, resolve);
    });

    if (done) {
      return promise
        .then(() => done())
        .catch((err) => done(err));
    }

    return promise;
  }

  /**
   * Subscribe to the specified `topic` or **topic pattern**.
   *
   * @param {String} topic The topic to subscribe to.
   * @param {Object} options The MQTT specific options.
   * @param {Object} options.qos See `publish()` for `options.qos`.
   *
   * @callback {Function} callback Called once the adapter has finished subscribing.
   * @param {Error} err An error object is included if an error was supplied by the adapter.
   * @param {Object[]} granted An array of topics granted formatted as an object `{topic: 't', qos: n}`.
   * @param {String} granted[n].topic The topic granted
   * @param {String} granted[n].qos The qos for the topic
   */

  public subscribe(topic, options?, done?) {
    const promise = new Promise((resolve) => {
      this.subClient.subscribe(topic, resolve);
    });

    if (done) {
      return promise
        .then(() => done())
        .catch((err) => done(err));
    }

    return promise;
  }

  /**
   * Unsubscribe from the specified `topic` or **topic pattern**.
   *
   * @param {String} topic The topic or **topic pattern** to unsubscribe.
   * @callback {Function} callback Called once the adapter has finished unsubscribing.
   * @param {Error} err An error object is included if an error was supplied by the adapter.
   */

  public unsubscribe(topic, done?) {
    const promise = new Promise((resolve) => {
      this.subClient.unsubscribe(topic, resolve);
    });

    if (done) {
      return promise
        .then(() => done())
        .catch((err) => done(err));
    }

    return promise;
  }
}
