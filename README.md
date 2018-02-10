# cryptowebrtc
webrtc crypto currency
The simple test of web currency.

The First Step:

Use webgl to calculate hashes for cryptocurrency

I use old code for bitcoin and webgl with a little innovation.

File clientclass.js use websocket for receive informations for start cacluation of hash for bitcoin block header ( by webgl ) - it is very slow method but in a few next steps you will know that is enough. Websocket will be changed for webrtc to send data between nodes.

At this moment you need have any stratum proxy ( I use https://github.com/Stratehm/stratum-proxy ) and change ports and accounts in app.js

So if you use stratum proxy to connect to bitcoin pool ( like p2pool.org ), start nodejs with app.js ( which open only websocket for distribution getwork ) and open in Firefox clientclass.html you can see working machinery for bitcoin creation ( of course only for test and no chance for mine any block !!! ), but this is only start for this project !!!

We will try use webrtc for connect users. See more about webrtc at https://webrtc.org/start/

Our file webrtc.js in nodejs/public/js is under construction ! Don't use !

Look https://github.com/coturn/coturn/wiki/turnserver we need turnserver for better working webrtc

At webrtcbitcoind.js I add connection for websocket and bitcoin protocol for bitcoind.

At bitcoind catalogue you will find bitcoin.conf ( partial ) to set connection with nodejs.
