const keys= require('./keys');

const redis= require('redis');

const reditClient= redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: 1000
});

const sub= reditClient.duplicate();

function fib(index){
    if(index<2)return 1;
    return fib(index-1)+fib(index-2);
}

sub.on('message',(channel,message)=>{
    console.log('calculating value for :'+ message);
    reditClient.hset('values',message,fib(message));
    console.log('calculation done' );
});

sub.subscribe('insert');
