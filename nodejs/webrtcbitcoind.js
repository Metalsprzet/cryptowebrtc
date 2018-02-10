const net = require('net');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
const wss2 = new WebSocket.Server({ port: 9090 });

var servers = [] 

for(let i=0; i<8; i++){
	
	servers.push( net.createServer((c) => {
	  // 'connection' listener
	  console.log('client connected');
	  c.on('end', () => {
	    console.log('client disconnected');
	    if(c.ws) { 
	    	c.ws.free = true
	    	c.ws.c = null
	        c.ws.close()
	    }
	  });
	  //c.write('hello\r\n');
	  //c.pipe(c);
      wss.clients.forEach(function each(client) {
	      if (client.readyState === WebSocket.OPEN && client.free) {
	        client.free = false
	        client.c = c
	        //client.send(data);
	        c.ws = client
	      }
      })

      c.on('data', (data) =>{
      	  if(c.ws)  c.ws.send(data);
      })

	}) );

	servers[i].on('error', (err) => {
	  throw err
	});

	servers[i].listen(8124+i, () => {
	  console.log('server bound')
	});

}


wss.on('connection', (ws) => {
  
  ws.free = true;

  ws.on('message', (message) => {

    console.log('received: %s', message);
    if(ws.c) ws.c.send(message)
  });

  // ws.send('something');

})


wss2.on('connection', (ws) => {
  
  ws.c = net.createConnection({ port: 8333, host:localhost }, () => {
  //'connect' listener
    console.log('connected to server!')
   
  });

  ws.c.on('data', (data)=>{

  	 ws.send(data)
  })

  ws.c.on('end', () => {
    console.log('disconnected from server')
    ws.close()
  });

  ws.on('message', (message) => {

    console.log('received: %s', message)
    if(ws.c) ws.c.write(message);
  });

  // ws.send('something');

})