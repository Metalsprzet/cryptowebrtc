var rpc = require('node-json-rpc');
var jayson = require('jayson');


var derMiner = {};

derMiner.Util = {
  hex_to_uint32_array: function(hex) {
    var arr = [];
    for (var i = 0, l = hex.length; i < l; i += 8) {
        arr.push((parseInt(hex.substring(i, i+8), 16)));
    }
    return arr;
  },
  hex_to_uint16_array: function(hex) {
    var arr = [];
    for (var i = 0, l = hex.length; i < l; i += 4) {
        arr.push((parseInt(hex.substring(i, i+4), 16)));
    }
    return arr;
  },
  uint32_array_to_hex: function(arr) {
    var hex = '';
    for (var i = 0; i < arr.length; i++) {
      hex += derMiner.Util.byte_to_hex(arr[i] >>> 24);
      hex += derMiner.Util.byte_to_hex(arr[i] >>> 16);
      hex += derMiner.Util.byte_to_hex(arr[i] >>>  8);
      hex += derMiner.Util.byte_to_hex(arr[i]       );
    }
    return hex;
  },
  uint16_array_to_hex: function(arr) {
    var hex = '';
    for (var i = 0; i < arr.length; i++) {
      hex += derMiner.Util.byte_to_hex(arr[i] >>>  8);
      hex += derMiner.Util.byte_to_hex(arr[i]       );
    }
    return hex;
  },
  to_uint16_array: function(w) {
        return [(w & 0xffff0000) >> 16, (w & 0x0000ffff) ];
  },
  byte_to_hex: function(b) {
    var tab = '0123456789abcdef';
    b = b & 0xff;
    return tab.charAt(b / 16) +
           tab.charAt(b % 16);
  },
  reverseBytesInWord: function(w) {
    return ((w <<  24) & 0xff000000) |
           ((w <<   8) & 0x00ff0000) |
           ((w >>>  8) & 0x0000ff00) |
           ((w >>> 24) & 0x000000ff);
  },
  reverseBytesInInt: function(w) {
    return ((w << 8) & 0x0000ff00 |
            (w >> 8) & 0x000000ff);
  },
  reverseBytesInWords: function(words) {
    var reversed = [];
    for(var i = 0; i < words.length; i++)
      reversed.push(derMiner.Util.reverseBytesInWord(words[i]));
    return reversed;
  },
  reverseBytesInInts: function(words) {
    var reversed = [];
    for(var i = 0; i < words.length-1; i+=2) {
        reversed.push(derMiner.Util.reverseBytesInInt(words[i+1]));
        reversed.push(derMiner.Util.reverseBytesInInt(words[i]));
    }
    return reversed;
  },
  fromPoolString: function(hex, gl) {
    return gl
           ? derMiner.Util.reverseBytesInInts(derMiner.Util.hex_to_uint16_array(hex))
           : derMiner.Util.reverseBytesInWords(derMiner.Util.hex_to_uint32_array(hex));
  },
  toPoolString: function(data, gl) {
    return gl
           ? derMiner.Util.uint16_array_to_hex(derMiner.Util.reverseBytesInInts(data))
           : derMiner.Util.uint32_array_to_hex(derMiner.Util.reverseBytesInWords(data));
  },
  ToUInt32: function (x) {
    return x >>> 0;
  }
};


var options = {

  port: 8332,
  // string domain name or ip of rpc server, default '127.0.0.1' 
  host:'localhost',
  // string with default path, default '/' 
  path: '/',
  // boolean false to turn rpc checks off, default true 
  strict: true,
  user: '1KM6mSzT6HeRvMRGVGnwrzwHxLNN9o4D9N',
  password: 'password'
};


// create a client
var clientjayson = jayson.client.http({

  port: 8332,
  host: 'localhost',
  path: '/',
  user: '1KM6mSzT6HeRvMRGVGnwrzwHxLNN9o4D9N',
  password: 'password'
});


var authClient = jayson.client.http({

  port: 8332,
  host: 'localhost',
  path: '/',

  headers: {
                 //'x-request-key': httpResponse.headers['x-response-key']
                 'Authorization': 'Basic '+ new Buffer("1KM6mSzT6HeRvMRGVGnwrzwHxLNN9o4D9N:x").toString('base64'),
                 //'X-Mining-Hashrate': 1500,
                 //'X-Mining-Extensions': 'longpoll noncerange'
                 'X-Mining-Extensions': 'longpoll' 
              }
});

var authClientgolden = jayson.client.http({

  port: 8332,
  host: 'localhost',
  path: '/',

  headers: {
                 //'x-request-key': httpResponse.headers['x-response-key']
                 'Authorization': 'Basic '+ new Buffer("1KM6mSzT6HeRvMRGVGnwrzwHxLNN9o4D9N:x").toString('base64'),
                 //'X-Mining-Hashrate': 1500,
                 //'X-Mining-Extensions': 'longpoll noncerange'
                 'X-Mining-Extensions': 'longpoll' 
              }
});




var httpResponse = null;

authClientgolden.on('http response', function(res) {
  // res is an instance of require('http').IncomingMessage
  let httpResponse = null; 
  httpResponse = res;
  console.log(httpResponse.headers)
});

authClient.on('http response', function(res) {
  // res is an instance of require('http').IncomingMessage
  httpResponse = res;
  console.log(httpResponse.headers)
});

var timer ;

authClient.request('getwork', [],/* [] */ function(err, error, response) { 
     
  authClient = jayson.client.http({

    port: 8332,
    host: 'localhost',
    path: '/getwork/longpolling',

    headers: {
                 //'x-request-key': httpResponse.headers['x-response-key']
                 'Authorization': 'Basic '+ new Buffer("1KM6mSzT6HeRvMRGVGnwrzwHxLNN9o4D9N:x").toString('base64'),
                 //'X-Mining-Hashrate': 1500,
                 //'X-Mining-Extensions': 'longpoll noncerange' 
                 'X-Mining-Extensions': 'longpoll' 
              }
  });

  authClient.on('http response', function(res) {
    // res is an instance of require('http').IncomingMessage
    httpResponse = res;
    console.log(httpResponse.headers)
  });
  
  //testing target
                       if(response) {
                         
                         console.log(response)
                          worki[0] = response;
                          
                          worki[0].current = derMiner.Util.fromPoolString("00000000")[0] // ???????

                          console.log(worki[0])
                        }

  timer = setTimeout(assk,55000)



})



function assk() {
  
  clearTimeout(timer);
  timer = setTimeout(assk,120000)  
  
  authClient.request('getwork', [],/* [] */ function(err, error, response) { 

   if(err) { console.log(err) } else {
                        

                        if(response) {
                          worki[0] = response;
                          worki[0].current = derMiner.Util.fromPoolString("00000000")[0] // ???????
                         
                          console.log(worki[0])
                        }

   }
   assk() 
  });

}


var worker = null;
var testmode = true;
var repeat_to = null;
var use_to = 0; // 5;
var no_cache = false;
var init = false;
var start = null;
var id = 1;





const express = require('express')
const app = express()

app.get('/', (req, res) => res.send('Hello World!'))

app.listen(3000, () => console.log('Example app listening on port 3000!'))

app.use(express.static('public'))

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// Broadcast to all.
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data,function ack(error) {
      // If error is not defined, the send has been completed, otherwise the error
      // object will indicate what failed.
      });
    }
  });
};

var wsid = 0;

wss.on('connection', function connection(ws) {
  
  ws.wsid = wsid
  wsid = wsid + 1;

  ws.on('error', (data)=>{

    console.log('rozlaczenie')
  }) 
   
  ws.on('message', function incoming(data) {
    // Broadcast to everyone else.
   
    
   // wss.clients.forEach(function each(client) {
   //   if (client !== ws && client.readyState === WebSocket.OPEN) {
   //     client.send(data);
   //   }
   // });
    
   //console.log(data)
   let odp = JSON.parse(data)

   if(odp.open && odp.card!='Bad card') {
     
     checkbrowser(ws, odp.browser)
     checkcard(ws, odp.card)
     

   }//test(ws,0);

   if(odp.golden_ticket) { 
   	   console.log('Golden Ticket: ',odp.golden_ticket)

        authClientgolden.request('getwork', [odp.golden_ticket],/* [] */ function(err, error, response) {
          
      

          if(err) { console.log(err) } else {

            console.log(response)
          }
        });
     
   }

   if(odp.next) {
     console.log(odp.totalHashes,'  ', odp.hashesPerSecond)
   	 onSuccess(ws, { })
   }



  });
});

// Create a server object with options 
var client = new rpc.Client(options);

function test(ws, id){

 client.call(
  {"jsonrpc": "2.0", "method": "getwork", "params": [], "id": id},
  function (err, res) {
    // Did it all work ? 
    if (err) { console.log(err); 


      
    }
    else { 
    	console.log(res); 

        // onSuccess(res)

         var dd = '{"midstate":"eae773ad01907880889ac5629af0c35438376e8c4ae77906301c65fa89c2779c","data":"0000000109a78d37203813d08b45854d51470fcdb588d6dfabbe946e92ad207e0000000038a8ae02f7471575aa120d0c85a10c886a1398ad821fadf5124c37200cb677854e0603871d07fff800000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000080020000","hash1":"00000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000010000","target":"0000000000000000000000000000000000000000000000000000f8ff07000000", "sol" : "31952e35"}';
        
         onSuccess(ws, { result: JSON.parse(dd)})

    }
  }
);
}






 var worki = [{current:derMiner.Util.fromPoolString("204e2e35")[0],"midstate":"eae773ad01907880889ac5629af0c35438376e8c4ae77906301c65fa89c2779c","data":"0000000109a78d37203813d08b45854d51470fcdb588d6dfabbe946e92ad207e0000000038a8ae02f7471575aa120d0c85a10c886a1398ad821fadf5124c37200cb677854e0603871d07fff800000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000080020000","hash1":"00000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000010000","target":"0000000000000000000000000000000000000000000000000000f8ff07000000", "sol" : "31952e35"}]

// wielokrotnosc threads na stronie
var step = 4096


onSuccess = (ws, jsonresp)=>{

    id = Number(jsonresp.id) + 1;
    //var response = jsonresp.result;
    //var data = JSON.stringify(response);
    var response = worki[0];
    var data = worki[0]

    var job = {};
    var gl = true; // ??????????

    //job.run = true;
    //job.work = data;

    job.midstate = derMiner.Util.fromPoolString(response.midstate, gl);
    job.half = derMiner.Util.fromPoolString(response.data.substr(0, 128), gl);
    job.data = derMiner.Util.fromPoolString(response.data.substr(128, 256), gl);
    job.hash1 = derMiner.Util.fromPoolString(response.hash1, gl);
    job.target = derMiner.Util.fromPoolString(response.target, gl);

    if (testmode) {
       // job.nonce = derMiner.Util.fromPoolString("204e2e35")[0];
       // job.nonce = derMiner.Util.fromPoolString("204e2e35")[0];
       // console.log(job.nonce, '  ', worki[0].current)
       job.nonce =  worki[0].current;
       worki[0].current = worki[0].current + step;
    } else {
        job.nonce = Math.floor ( Math.random() * 0xFFFFFFFF );
    }

    //job.hexdata = response.data;

   // wss.clients.forEach(function each(client) {
   //   if (client !== ws && client.readyState === WebSocket.OPEN) {
         //   ws.send(JSON.stringify({job:job, startnonce:  job.nonce, stopnonce: Math.floor (0x352E9532)}));

           console.log(ws.wsid,': ',job.nonce, '  ', job.nonce+step, ' ')
           ws.send(JSON.stringify({job:job, startnonce:  job.nonce, stopnonce: job.nonce+step, wsid:ws.wsid}), function ack(error) {
             // If error is not defined, the send has been completed, otherwise the error
               // object will indicate what failed.
         });
   //   }
   // });

}


checkbrowser = (ws,browser)=>{
  
  ws.browser = browser;
  console.log(ws.browser)
}

const vertexshader = `attribute vec2 vPos;
void main(void) {
    gl_Position = vec4(vPos, 0., 1.);
}`

checkcard = (ws,card)=>{

   // tutaj trzeba dobierać ile threads do karty
   console.log(ws.browser)
   if(card && ws.browser==='Firefox') ws.send(JSON.stringify({typ:'init', odp:{threads: 256, vertexshader:vertexshader, fragmentshader:fragmentshader}}))

}

const fragmentshader = `  /*#ifdef GL_ES*/
  precision highp float;
/*#endif*/

uniform vec2 data[16];    
uniform vec2 hash1[16];  
uniform vec2 midstate[8];
uniform vec2 target[8];
uniform vec2 nonce_base;
uniform vec2 H[8];
uniform vec2 K[64];

uniform float N;

#define Ox10000 65536.0
#define Ox8000  32768.0

vec4 toRGBA(vec2 arg) {
      float V = float(arg.x);
      float R = floor(V / pow(2.0, 8.0));
      V -= R * pow(2.0, 8.0);
      float G = V;
      V = float(arg.y);
      float B = floor(V / pow(2.0, 8.0));
      V -= B * pow(2.0, 8.0);
      float A = V;
      return vec4(R/255., G/255., B/255., A/255.);
}

vec4 toRGBA(float V) {
      float R = V / pow(2.0, 24.0);
      V -= floor(R) *  pow(2.0, 24.0);
      float G = V / pow(2.0, 16.0);
      V -= floor(G) *  pow(2.0, 16.0);
      float B = V / pow(2.0, 8.0);
      V -= floor(B) * pow(2.0, 8.0);;
      float A = V;
      return vec4(R/255., G/255., B/255., A/255.);
}

vec2 safe_add (vec2 a, vec2 b)
{
      vec2 ret;
      ret.x = a.x + b.x;
      ret.y = a.y + b.y;
      if (ret.y >= float(Ox10000)) {
          ret.y -= float(Ox10000);
          ret.x += 1.0;
      }
      if (ret.x >= float(Ox10000)) {
          ret.x -= float(Ox10000);
      }
      return ret;
}

vec2 sftr (vec2 a, float shift)
{
      vec2 ret = a / shift;
      ret = vec2 (floor (ret.x), floor (ret.y) + fract (ret.x) * float (Ox10000));
      return ret;
}

vec2 rotr (vec2 a, float shift)
{
      vec2 ret = a / shift;
      ret = floor (ret) + fract (ret.yx) * float (Ox10000);
      return ret;
}

float axor16 (float a, float b)
{
  float ret = float(0);
        float fact = float (Ox8000);
        const int maxi = 16;
        float v1, v2;
        
  for (int i= maxi; i!=-1; i--)
  {
            v1 = step(fact, a);
            v2 = step(fact, b);
            ret += (v1*(1.-v2) + v2*(1.-v1)) * fact;
            if (v1 == 1.) a -= fact;
            if (v2 == 1.) b -= fact;
      fact /= 2.0;
  }
  return ret;
}

float aand16 (float a, float b)
{
  float ret = float(0);
  float fact = float (Ox8000);
        const int maxi = 16;
        float v1, v2;

  for (int i= maxi; i!=-1; i--)
  {
            v1 = step(fact, a);
            v2 = step(fact, b);
            ret += (v1*v2) * fact;
            if (v1 == 1.) a -= fact;
            if (v2 == 1.) b -= fact;
      fact /= 2.0;
  }
  return ret;
}

float xor16 (float a, float b)
{
  float ret = float(0);
        float fact = float (Ox8000);
        const int maxi = 16;

  for (int i= maxi;i!=-1; i--)
  {
            if ((max(a,b) >= fact) && (min(a,b) < fact))
    ret += fact;

      if (a >= fact)
    a -= fact;
      if (b >= fact)
    b -= fact;

      fact /= 2.0;
  }
  return ret;
}

vec2 xor (vec2 a, vec2 b)
{
  return vec2 (xor16 (a.x, b.x), xor16 (a.y, b.y));
}

float and16 (float a, float b)
{
  float ret = float(0);
  float fact = float (Ox8000);
        const int maxi = 16;

  for (int i= maxi; i!=-1; i--)
  {
            if (min(a, b) >= fact)
                ret += fact;

            if (a >= fact)
    a -= fact;
            if (b >= fact)
    b -= fact;

            fact /= 2.0;
  }
  return ret;
}

vec2 and (vec2 a, vec2 b)
{
      return vec2 (and16 (a.x, b.x), and16 (a.y, b.y));
}


vec2 cpl (vec2 a)
{
      return vec2 (float (Ox10000), float (Ox10000)) - a - vec2(1.0, 1.0);
}
#define POW_2_01 2.0
#define POW_2_02 4.0
#define POW_2_03 8.0
#define POW_2_06 64.0
#define POW_2_07 128.0
#define POW_2_09 512.0
#define POW_2_10 1024.0
#define POW_2_11 2048.0
#define POW_2_13 8192.0

vec2 blend (vec2 m16, vec2 m15, vec2 m07, vec2 m02)
{
      vec2 s0 = xor (rotr (m15   , POW_2_07), xor (rotr (m15.yx, POW_2_02), sftr (m15, POW_2_03)));
      vec2 s1 = xor (rotr (m02.yx, POW_2_01), xor (rotr (m02.yx, POW_2_03), sftr (m02, POW_2_10)));
      return safe_add (safe_add (m16, s0), safe_add (m07, s1));
}

vec2 e0 (vec2 a)
{
  return xor (rotr (a, POW_2_02), xor (rotr (a, POW_2_13), rotr (a.yx, POW_2_06)));
}

vec2 e1 (vec2 a)
{
  return xor (rotr (a, POW_2_06), xor (rotr (a, POW_2_11), rotr (a.yx, POW_2_09)));
}

vec2 ch (vec2 a, vec2 b, vec2 c)
{
  return xor (and (a, b), and (cpl (a), c));
}

vec2 maj (vec2 a, vec2 b, vec2 c)
{
  return xor (xor (and (a, b), and (a, c)), and (b, c));
}

void main ()
{
    const int nonces_per_pixel = 1;

    vec2 ret = vec2 (0., 0.);
    vec2 nonce;
    vec2 w[64];
    vec2 hash[16];
    vec2 tmp[8]; //state
    vec2 udata[16];
    float carry;

    vec2 a, b, c, d, e, f, g, h;
    vec2 t1, t2;
    vec2 _s0,_maj,_t2,_s1,_ch, _t1;
    float x_off = floor(float(gl_FragCoord.x));
    float nonce_off = x_off * float(nonces_per_pixel);

    for (int i=16; i!=-1; i--) {
        udata[i] = data[i];
    }

    for (int n =  nonces_per_pixel; n!=-1; n--) {
        nonce = safe_add(vec2 (0., nonce_off + float(n)), nonce_base);

        udata[3] = nonce;

                tmp[0] = H[0];
                tmp[1] = H[1];
                tmp[2] = H[2];
                tmp[3] = H[3];
                tmp[4] = H[4];
                tmp[5] = H[5];
                tmp[6] = H[6];
                tmp[7] = H[7];

                tmp[0] = midstate[0];
                tmp[1] = midstate[1];
                tmp[2] = midstate[2];
                tmp[3] = midstate[3];
                tmp[4] = midstate[4];
                tmp[5] = midstate[5];
                tmp[6] = midstate[6];
                tmp[7] = midstate[7];

                w[0] = udata[0];
                w[1] = udata[1];
                w[2] = udata[2];
                w[3] = udata[3];
                w[4] = udata[4];
                w[5] = udata[5];
                w[6] = udata[6];
                w[7] = udata[7];
                w[8] = udata[8];
                w[9] = udata[9];
                w[10] = udata[10];
                w[11] = udata[11];
                w[12] = udata[12];
                w[13] = udata[13];
                w[14] = udata[14];
                w[15] = udata[15];


            for (int i = 16; i < 64; ++i) {
              w[i] = blend(w[i-16], w[i-15], w[i-7], w[i-2]);
            }

        a = tmp[0];
        b = tmp[1];
        c = tmp[2];
        d = tmp[3];
        e = tmp[4];
        f = tmp[5];
        g = tmp[6];
        h = tmp[7];

        for (int i = 0; i < 64; i++) {
            _s0 = e0(a);
            _maj = maj(a,b,c);
            _t2 = safe_add(_s0, _maj);
            _s1 = e1(e);
            _ch = ch(e, f, g);
            _t1 = safe_add(safe_add(safe_add(safe_add(h, _s1), _ch), K[i]), w[i]);

            h = g; g = f; f = e;
            e = safe_add(d, _t1);
            d = c; c = b; b = a;
            a = safe_add(_t1, _t2);
        }

        tmp[0] = safe_add(a, tmp[0]);
        tmp[1] = safe_add(b, tmp[1]);
        tmp[2] = safe_add(c, tmp[2]);
        tmp[3] = safe_add(d, tmp[3]);
        tmp[4] = safe_add(e, tmp[4]);
        tmp[5] = safe_add(f, tmp[5]);
        tmp[6] = safe_add(g, tmp[6]);
        tmp[7] = safe_add(h, tmp[7]);

            hash[0] = tmp[0];
            hash[1] = tmp[1];
            hash[2] = tmp[2];
            hash[3] = tmp[3];
            hash[4] = tmp[4];
            hash[5] = tmp[5];
            hash[6] = tmp[6];
            hash[7] = tmp[7];
            
            hash[8] = hash1[8];
            hash[9] = hash1[9];
            hash[10] = hash1[10];
            hash[11] = hash1[11];
            hash[12] = hash1[12];
            hash[13] = hash1[13];
            hash[14] = hash1[14];
            hash[15] = hash1[15];
            

                tmp[0] = H[0];
                tmp[1] = H[1];
                tmp[2] = H[2];
                tmp[3] = H[3];
                tmp[4] = H[4];
                tmp[5] = H[5];
                tmp[6] = H[6];
                tmp[7] = H[7];



                w[0] = hash[0];
                w[1] = hash[1];
                w[2] = hash[2];
                w[3] = hash[3];
                w[4] = hash[4];
                w[5] = hash[5];
                w[6] = hash[6];
                w[7] = hash[7];
                w[8] = hash[8];
                w[9] = hash[9];
                w[10] = hash[10];
                w[11] = hash[11];
                w[12] = hash[12];
                w[13] = hash[13];
                w[14] = hash[14];
                w[15] = hash[15];

            for (int i = 16; i < 64; ++i) {
              w[i] = blend(w[i-16], w[i-15], w[i-7], w[i-2]);
            }

        // var s = this.state;
        a = tmp[0];
        b = tmp[1];
        c = tmp[2];
        d = tmp[3];
        e = tmp[4];
        f = tmp[5];
        g = tmp[6];
        h = tmp[7];

        for (int i = 0; i < 64; i++) {
            _s0 = e0(a);
            _maj = maj(a,b,c);
            _t2 = safe_add(_s0, _maj);
            _s1 = e1(e);
            _ch = ch(e, f, g);
            _t1 = safe_add(safe_add(safe_add(safe_add(h, _s1), _ch), K[i]), w[i]);

            h = g; g = f; f = e;
            e = safe_add(d, _t1);
            d = c; c = b; b = a;
            a = safe_add(_t1, _t2);
         }


        tmp[7] = safe_add(h, tmp[7]);

        if (nonces_per_pixel != 1 && tmp[7].x == 0. && tmp[7].y == 0.) {
            if (n <= 15) {
                ret = safe_add(ret, vec2(0., pow(2.0, float(n))));
            } else {
                ret = safe_add(ret, vec2(pow(2.0, float(n - 16)), 0.));
            }

        }


    }
    if (nonces_per_pixel == 1) {
        gl_FragColor = toRGBA( tmp[7]);
    } else {
        gl_FragColor = toRGBA(ret);
    }
}`
