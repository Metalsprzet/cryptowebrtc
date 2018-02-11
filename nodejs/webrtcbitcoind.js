const net = require('net')
const WebSocket = require('ws')
const uuidv4 = require('uuid/v4')
// for bitcoind out
const wss = new WebSocket.Server({ port: 8080 })
// for bitcoind in
const wss2 = new WebSocket.Server({ port: 9090 })
// for webrtc
const wss3 = new WebSocket.Server({ port: 10010})

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
	  let jest = false;
      wss.clients.forEach(function each(client) {
	      if (client.readyState === WebSocket.OPEN && client.free) {
	        client.free = false
	        client.c = c
	        //client.send(data);
	        c.ws = client
	        jest = true;
	      }
      })

      c.on('data', (data) =>{
      	  //console.log("c data:", data)
      	  if(c.ws && c.ws.readyState === WebSocket.OPEN)  c.ws.send(data);
      })

      if(!jest) c.end();



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

    //console.log('received: %s', message);
    if(ws.c) ws.c.write(message)
  });

  // ws.send('something');

})


// 91.209.51.131:8333
// 5.135.189.124:8333
// 104.199.229.186:8333
// 163.172.167.144:8333
wss2.on('connection', (ws) => {
  
  ws.c =  net.createConnection({ port: 8333, host:'91.209.51.131' }, () => {
  //'connect' listener
    console.log('connected to bitcoin server!')
   
  })

  ws.c.on('data', (data)=>{
  	 console.log(new Date().toLocaleString()+" wss2 c data")
     //console.log(data)
  	 ws.send(data)
  })

  ws.c.on('end', () => {
    console.log('wss2 disconnected from server')
    ws.close()
  });



  ws.on('message', (message) => {

    //console.log('received:', message)
    if(ws.c) ws.c.write(message);
  });

  // ws.send('something');

})

wss3.on('connection', (ws) => {

	ws.clientID = uuidv4()

	ws.on('message', (message) => {

    
    	let odp = JSON.parse(message)
        
        switch(odp.type) {
           
           case 'username': break;
           case 'video-offer': break;
           case 'video-answer': break;
           case 'new-ice-candidat': break;
           case 'hang-up': break;

        }

    })



})
