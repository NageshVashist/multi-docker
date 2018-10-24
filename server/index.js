const keys = require('./keys');

//express setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());





//postgres setup

const { Pool } = require('pg');

console.log('==================================================');
// console.log('pgUser:'+keys.pgUser);
// console.log('pgPort:'+keys.pgPort);
// console.log('pgDatabase:'+keys.pgDatabase);
// console.log('pgHost:'+keys.pgHost);
// console.log('redisHost:'+keys.redisHost);
// console.log('redisPort:'+keys.redisPort);
console.log(JSON.stringify(keys));
//console.log(JSON.stringify(process.env));

console.log('==================================================');

const pgClient = new Pool({
    user: keys.pgUser,
    port: keys.pgPort,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    host: keys.pgHost
});

pgClient.on('error', () => {
    console.log('==================================================');
    console.log('Lost database connection');
    console.log('==================================================');
}
);

pgClient.query('CREATE TABLE IF NOT EXISTS values (number int)').catch(err => {
    console.log('==================================================')
    console.log(err)
    console.log('==================================================')
}
);


// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();


//express rout handler

app.get('/', (req, res) => {
    res.send('Hi, There');
});

app.get('/values/all', async (req, res) => {
    const values = await pgClient.query('select * from values');

    res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
    redisClient.hgetall('values', (err, values) => {
        res.send(values);
      });
});

app.post('/values', (req, res) => {
    const index = req.body.index;
    if (parseInt(index) > 40) {
        res.status(422).send('Index is too high');
    }
    redisClient.hset('values', index, 'Nothing yet');
    redisPublisher.publish('insert', index);
    pgClient.query('INSERT INTO values (number) VALUES($1)', [index]);

    res.send({ working: true });
});

app.listen(5000, () => {
    console.log('Listening at port 5000');
})