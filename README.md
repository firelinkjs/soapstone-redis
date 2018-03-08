# @firelink/soapstone-redis

**[Redis](http://redis.io/) `Adapter` for @firelink/soapstone**

## Installation

```
$ npm install @firelink/soapstone-redis
```

## Use

```ts
import { PubSubClient, RedisAdapter } from '@firelink/soapstone-redis';

var client = new PubSubClient({host: 'http://my.message-broker.com', port: 3000}, RedisAdapter);

client.publish('my topic', 'my message');
```
