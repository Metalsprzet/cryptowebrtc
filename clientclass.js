

function MinersPower(divname)  {

	let wssSocket = {readyState:10000};

	let wssReconnectTimer;  

	let dataLoc;
	let hash1Loc;
	let midstateLoc;
	let targetLoc;
	let nonceLoc;

	let maxNonce = 0xFFFFFFFF;
	let maxCnt = 0;
	let reportPeriod = 5000;
	let useTimeout = true;
	let TotalHashes = 0;
	let gl;
	let canvas;
	let debug = false;
	let buf;

	let width;
	let height;

	let worker = null;
	let init = false;
	let start = null;
	let identifier = 0;
	let startnonce = 0;
	let stopnonce = 0;
	let currentnonce = 0;
	let cid = 0;
	let wsid = -1;

	let totalHashesAAA = 0;
	let hashesPerSecond = 0;

	let vShaderQuellcode ;

	let fShaderQuellcode ;

	window.onload = function() { 



	  //vShaderQuellcode = document.getElementById("vertex-shader").text;
	  //fShaderQuellcode = document.getElementById("fragment-shader").text;
	  connectWss()

	}

	function connectWss(){
	 //console.dir('wss', wssSocket)
	 
	 if( wssSocket.readyState>1 ) {
	  wssSocket = new WebSocket("ws://localhost:8080")
	 // starter = false;
	  console.log("Startuje")
	  wssSocket.onopen = function (event) {
       
        let card = getCardName()
	    wssSocket.send(JSON.stringify({
	    open:true,
	    card:card[0],
	    vectors:card[1],
	    startnonce:startnonce,
	    stopnonce:stopnonce,
	    currentnonce:currentnonce,
	    identifier:identifier,
	    browser:BrowserDetection(),
	    cid:cid}));
	          


	  }
	   

	  wssSocket.onerror = function (error) {

	     console.log('wssonerror', error)
	  } 

	  wssSocket.onclose = function(event) {

	      console.log('wssonclose', event)
	      clearInterval(wssReconnectTimer);
	      wssReconnectTimer = setInterval(function(){connectWss()}, 5000 )
	  }

	   wssSocket.onmessage = function (event) {
	      //console.log(event.data);
	      msg = JSON.parse(event.data)

	      switch(msg.typ) {
	        
	       
	        case "init": wsInit(msg); break;
	        default: wsDefault(msg);



	      }

	   }

	 }

	}

	let compiled = false;


	function BrowserDetection() {
	    //Check if browser is IE
	    if (navigator.userAgent.search("MSIE") >= 0) {
	        // insert conditional IE code here
	        return "MSIE"
	    }
	    //Check if browser is Chrome
	    else if (navigator.userAgent.search("Chrome") >= 0) {
	        // insert conditional Chrome code here
	        return "Chrome"
	    }
	    //Check if browser is Firefox 
	    else if (navigator.userAgent.search("Firefox") >= 0) {
	        // insert conditional Firefox Code here
	        return "Firefox"
	    }
	    //Check if browser is Safari
	    else if (navigator.userAgent.search("Safari") >= 0 && navigator.userAgent.search("Chrome") < 0) {
	        // insert conditional Safari code here
	        return "Safari"
	    }
	    //Check if browser is Opera
	    else if (navigator.userAgent.search("Opera") >= 0) {
	        // insert conditional Opera code here
	        return "Opera"
	    }
    }

	let derMiner = {};

	derMiner.Util = {
	  hex_to_uint32_array: function(hex) {
	    let arr = [];
	    for (let i = 0, l = hex.length; i < l; i += 8) {
	        arr.push((parseInt(hex.substring(i, i+8), 16)));
	    }
	    return arr;
	  },
	  hex_to_uint16_array: function(hex) {
	    let arr = [];
	    for (let i = 0, l = hex.length; i < l; i += 4) {
	        arr.push((parseInt(hex.substring(i, i+4), 16)));
	    }
	    return arr;
	  },
	  uint32_array_to_hex: function(arr) {
	    let hex = '';
	    for (let i = 0; i < arr.length; i++) {
	      hex += derMiner.Util.byte_to_hex(arr[i] >>> 24);
	      hex += derMiner.Util.byte_to_hex(arr[i] >>> 16);
	      hex += derMiner.Util.byte_to_hex(arr[i] >>>  8);
	      hex += derMiner.Util.byte_to_hex(arr[i]       );
	    }
	    return hex;
	  },
	  uint16_array_to_hex: function(arr) {
	    let hex = '';
	    for (let i = 0; i < arr.length; i++) {
	      hex += derMiner.Util.byte_to_hex(arr[i] >>>  8);
	      hex += derMiner.Util.byte_to_hex(arr[i]       );
	    }
	    return hex;
	  },
	  to_uint16_array: function(w) {
	        return [(w & 0xffff0000) >> 16, (w & 0x0000ffff) ];
	  },
	  byte_to_hex: function(b) {
	    let tab = '0123456789abcdef';
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
	    let reversed = [];
	    for(let i = 0; i < words.length; i++)
	      reversed.push(derMiner.Util.reverseBytesInWord(words[i]));
	    return reversed;
	  },
	  reverseBytesInInts: function(words) {
	    let reversed = [];
	    for(let i = 0; i < words.length-1; i+=2) {
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


	start = (new Date()).getTime();


	function wsInit(odp){

	     //  let ppp4 = new Promise(function(resolve,reject){
	             
	            vShaderQuellcode = odp.odp.vertexshader;
	            fShaderQuellcode = odp.odp.fragmentshader; 
	            let th = odp.odp.threads;
	            if (!init) meinWebGLStart(th);
	     //      resolve(true)
	     //  })

	     //  ppp4.then(function(answer){
	         //console.log('ppp4 made')
	           wssSocket.send(JSON.stringify({
	              open:false,
	              golden_ticket:false,
	              next:true,
	              startnonce:startnonce,
	              stopnonce:stopnonce,
	              currentnonce:currentnonce,
	              identifier:identifier,
	              cid:cid,
	              wsid:wsid,
	              totalHashes:totalHashesAAA,
	              hashesPerSecond:hashesPerSecond}));

	     //  })

	}

	function wsDefault(odp){
	    
	        wsid = odp.wsid
	        let job = odp.job
	        startnonce = odp.startnonce
	        stopnonce = odp.stopnonce
	        //console.log(stopnonce)
	        if (worker) {
	            try {
	                worker.postMessage( { run: false } );
	                // worker.terminate();
	            } catch (e) {

	              console.log(e)
	            }
	        }
	    
	        let postMessage = function(m) {
	            onWorkerMessage({ data: m });
	        }
	    
	        
	        maxNonce = odp.stopnonce;
	    
	        if(compiled) {
	                worker = { postMessage : function(m) { worker.intMessage( { data: m} ) },
	                   intMessage : glminer(job, postMessage) };
	                init = true;
	        }

	}

	function getCardName(){
	  
	        let canvastest = document.createElement('canvas');
	        try {
	         // let ctx = canvastest.getContext('webgl2');
	         // console.log('webgl2', ctx)
	        } catch (e){

	        }

	        let namestest = [ "webgl", "experimental-webgl", "moz-webgl", "webkit-3d" ];
	        let gltest;
	        for (let i=0; i<namestest.length; i++) {
	            try {
	                gltest = canvastest.getContext(namestest[i]);
	                if (gltest) { break; }
	            } catch (e) { }
	        }
	        
	        if(!gltest) {
	            
	            return ['Bad card',0]
	        }
	        
	        let ext = gltest.getExtension("WEBGL_debug_renderer_info");
	        if (!ext) {
	           return ["Unknow",0];
	         }
	        //console.log(gltest.getParameter(ext.UNMASKED_RENDERER_WEBGL))
	        console.log(gltest.getParameter(gltest.MAX_VARYING_VECTORS))
	        return [gltest.getParameter(ext.UNMASKED_RENDERER_WEBGL),gltest.getParameter(gltest.MAX_VARYING_VECTORS)];
	}

	function throwOnGLError(err, funcName, args) {
	    throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to" + funcName;
	};

	function logGLCall(functionName, args) {
	   console.log("gl." + functionName + "(" +
	      WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");
	}
	function validateNoneOfTheArgsAreUndefined(functionName, args) {
	  for (var ii = 0; ii < args.length; ++ii) {
	    if (args[ii] === undefined) {
	      console.error("undefined passed to gl." + functionName + "(" +
	                    WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");
	    }
	  }
	}

	function ContextRestore(element, threads) {
        
        //element.parentNode.removeChild(element);
		meinWebGLStart(threads)
	}

	function meinWebGLStart(threads) {
	        canvas = document.createElement('canvas');
	        canvas.title="You pay by your gpu power for looking this page. Click to read about this technology."
	        canvas.onclick  = function(){window.open('http://pinsert.pl','_blank');};
	        canvas.style.width=500;
	        canvas.style.height=5;      

	        canvas.height = 1;
	        canvas.width = threads;
	        document.getElementById(divname).appendChild(canvas)
	        canvas.addEventListener("webglcontextlost", function(event) {
                event.preventDefault();
            }, false);

            //canvas.addEventListener(
            //  "webglcontextrestored", ContextRestore(canvas, threads), false);    
	        
	        let names = [ "webgl", "experimental-webgl", "moz-webgl", "webkit-3d" ];
	        for (let i=0; i<names.length; i++) {
	            try {
	                gl = canvas.getContext(names[i]);
	                if (gl) { console.log(names[i]); break; }
	            } catch (e) { }
	        }

	        if(!gl) {
	            //alert("No webgl");
	            compiled = false;
	            return false;
	        }
	             
	        //var wrappedGLContext = WebGLDebugUtils.makeDebugContext(gl, throwOnGLError);     

	        let program = gl.createProgram();


	        vShader = gl.createShader(gl.VERTEX_SHADER);
	        gl.shaderSource(vShader,vShaderQuellcode);
	        gl.compileShader(vShader);
	        if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
	            console.log(gl.getShaderInfoLog(vShader));
	            compiled = false;
	            return false;
	        }

	        gl.attachShader(program,vShader);

	        fShader = gl.createShader(gl.FRAGMENT_SHADER);
	        gl.shaderSource(fShader,fShaderQuellcode);
	        gl.compileShader(fShader);
	        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
	            compiled = false;
	            console.log(gl.getShaderInfoLog(fShader));
	            return false;
	        }
	        gl.attachShader(program,fShader);

	        gl.linkProgram(program);
	        gl.validateProgram(program);
	        
	        if ( !gl.getProgramParameter( program, gl.VALIDATE_STATUS) ) {
	             let info = gl.getProgramInfoLog(program);
	             console.log('Could not compile WebGL program. \n\n' + info);
	             compiled = false;
	             return false;
	        }

	        gl.useProgram(program);

	        gl.clearColor ( 1.0, 1.0, 1.0, 1.0 );
	        gl.clear ( gl.COLOR_BUFFER_BIT );

	        let posAtrLoc = gl.getAttribLocation(program, "vPos");
	        gl.enableVertexAttribArray( posAtrLoc );

	        let h =  [0x6a09, 0xe667, 0xbb67, 0xae85,
	                  0x3c6e, 0xf372, 0xa54f, 0xf53a,
	                  0x510e, 0x527f, 0x9b05, 0x688c,
	                  0x1f83, 0xd9ab, 0x5be0, 0xcd19];

	        let k =  [0x428a, 0x2f98, 0x7137, 0x4491,
	                  0xb5c0, 0xfbcf, 0xe9b5, 0xdba5,
	                  0x3956, 0xc25b, 0x59f1, 0x11f1,
	                  0x923f, 0x82a4, 0xab1c, 0x5ed5,
	                  0xd807, 0xaa98, 0x1283, 0x5b01,
	                  0x2431, 0x85be, 0x550c, 0x7dc3,
	                  0x72be, 0x5d74, 0x80de, 0xb1fe,
	                  0x9bdc, 0x06a7, 0xc19b, 0xf174,
	                  0xe49b, 0x69c1, 0xefbe, 0x4786,
	                  0x0fc1, 0x9dc6, 0x240c, 0xa1cc,
	                  0x2de9, 0x2c6f, 0x4a74, 0x84aa,
	                  0x5cb0, 0xa9dc, 0x76f9, 0x88da,
	                  0x983e, 0x5152, 0xa831, 0xc66d,
	                  0xb003, 0x27c8, 0xbf59, 0x7fc7,
	                  0xc6e0, 0x0bf3, 0xd5a7, 0x9147,
	                  0x06ca, 0x6351, 0x1429, 0x2967,
	                  0x27b7, 0x0a85, 0x2e1b, 0x2138,
	                  0x4d2c, 0x6dfc, 0x5338, 0x0d13,
	                  0x650a, 0x7354, 0x766a, 0x0abb,
	                  0x81c2, 0xc92e, 0x9272, 0x2c85,
	                  0xa2bf, 0xe8a1, 0xa81a, 0x664b,
	                  0xc24b, 0x8b70, 0xc76c, 0x51a3,
	                  0xd192, 0xe819, 0xd699, 0x0624,
	                  0xf40e, 0x3585, 0x106a, 0xa070,
	                  0x19a4, 0xc116, 0x1e37, 0x6c08,
	                  0x2748, 0x774c, 0x34b0, 0xbcb5,
	                  0x391c, 0x0cb3, 0x4ed8, 0xaa4a,
	                  0x5b9c, 0xca4f, 0x682e, 0x6ff3,
	                  0x748f, 0x82ee, 0x78a5, 0x636f,
	                  0x84c8, 0x7814, 0x8cc7, 0x0208,
	                  0x90be, 0xfffa, 0xa450, 0x6ceb,
	                  0xbef9, 0xa3f7, 0xc671, 0x78f2];

	        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
	        let vertices = new Float32Array([1, 1,-1, 1,
	                                         1,-1,-1,-1]);
	        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	        gl.vertexAttribPointer(posAtrLoc, 2, gl.FLOAT, false, 0, 0);

	        dataLoc = gl.getUniformLocation(program, "data");
	        hash1Loc = gl.getUniformLocation(program, "hash1");
	        midstateLoc = gl.getUniformLocation(program, "midstate");
	        targetLoc = gl.getUniformLocation(program, "target");
	        nonceLoc = gl.getUniformLocation(program, "nonce_base");

	        let hLoc = gl.getUniformLocation(program, "H");
	        let kLoc = gl.getUniformLocation(program, "K");

	        gl.uniform2fv(hLoc, h);
	        gl.uniform2fv(kLoc, k);
	        console.log('Compiled')
	        compiled = true;

	        

	}


	function glminer(job, callback) {
	    let run = true;

	    let next_run = function(job, callback) {
	        let nonces_per_pixel = 1;
	        let t = job.t === undefined ? 0 : job.t;
	        let nonce = job.nonce === undefined ? 0 : job.nonce;
	        let threads = width * nonces_per_pixel;
	        let curCnt = 0;
	        let x = 0;
	        let y = 0;
	        let n;

	        let submit_nonce = function() {

	         //   let ppp1 = new Promise(function(resolve, reject){
	               
	               n = derMiner.Util.to_uint16_array(job.nonce);
	               //console.log(n)

	              job.data[6] = n[0];
	              job.data[7] = n[1];

	              let r = [];
	              for (let j = 0; j < job.half.length; j++)
	                  r.push(job.half[j]);
	              for (let j = 0; j < job.data.length; j++)
	                  r.push(job.data[j]);

	               let ret = derMiner.Util.toPoolString(r, true);

	              job.golden_ticket = ret;



	              callback(job);
	          //    resolve(true)

	          //  })

	          //  ppp1.then(function(answer){

	          //  })
	            
	        }

	        let ppp2= new Promise(function(resolve, reject){



	            while(run) {
	                n = derMiner.Util.to_uint16_array(nonce);
	                gl.uniform2fv(nonceLoc,  n);
	                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	                if (debug) console.log("w:" + width + " h:" + height);

	                gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, buf);
	                
	                //console.log(buf.length)

	                for (let i=0; i<buf.length; i+=4) {
	                    if (debug) {
	                        let out = [];
	                        out.push(derMiner.Util.byte_to_hex(buf[i]));
	                        out.push(derMiner.Util.byte_to_hex(buf[i+1]));
	                        out.push(derMiner.Util.byte_to_hex(buf[i+2]));
	                        out.push(derMiner.Util.byte_to_hex(buf[i+3]));
	                        console.log("rgba("+(i/4)+"): " + JSON.stringify(out));
	                    }

	                    if (nonces_per_pixel == 1) {
	                        if (buf[i] == 0 &&
	                            buf[i+1] == 0 &&
	                            buf[i+2] == 0 &&
	                            buf[i+3] == 0) {

	                            job.nonce = nonce + i * (nonces_per_pixel / 4);
	                            submit_nonce();
	                        }
	                    } else {
	                        if (buf[i] != 0 ||
	                            buf[i+1] != 0 ||
	                            buf[i+2] != 0 ||
	                            buf[i+3] != 0) {
	                            for (let e = 0; e < 4; e++) {
	                                for (let r = 7; r >= 0; r--) {
	                                    if (buf[i + e] & 1 << r) {
	                                        let b = (3 - e) * (nonces_per_pixel / 4) + r;
	                                        job.nonce = nonce + i * (nonces_per_pixel / 4) + b;
	                                        submit_nonce();
	                                    }
	                                }
	                            }

	                            job.golden_ticket = null;
	                        }
	                    }
	                }
	                
	                
	                //console.log('nonce:', nonce, ' threads:', threads, ' maxNonce', maxNonce)

	                if (nonce >= maxNonce) {
	                    cb(nonce);
	                    run = false;
	                  //  console.log('maxNonce: ', maxNonce, '  nonce', nonce)
	                    break;

	                }

	                
	                nonce+= threads;
	                TotalHashes += threads;


	                

	                if (t < (new Date()).getTime()) {
	                    t = (new Date()).getTime() + reportPeriod;
	                    job.total_hashes = TotalHashes;
	                    
	                    callback(job);
	                    TotalHashes = 0;
	                }

	                if (useTimeout && ++curCnt > maxCnt) {
	                    curCnt = 0;
	                    job.nonce = nonce;
	                   
	                    job.t = t;
	                    let c = function() {
	                        next_run(job, callback);
	                    }
	                    window.setTimeout(c, 1);
	                    return;
	                }
	            }
	            
	            resolve(true)

	         })

	        ppp2.then(function(answer){
	              
	           // console.log(answer)
	        })
	    }
	    let intMessage = function(event) {
	        if (!event.data || !event.data.run) {
	            run = false;
	            //console.log("worker: forced quit!", event.data);
	            return;
	        }
	    };

	    let mine = function(job, callback) {

	        gl.uniform2fv(dataLoc, job.data);
	        gl.uniform2fv(hash1Loc, job.hash1);
	        gl.uniform2fv(midstateLoc, job.midstate);
	        gl.uniform2fv(targetLoc, job.target);

	        width = canvas.width;
	        height = canvas.height;

	        buf = new Uint8Array(width * height * 4);

	        next_run(job, callback);
	        return intMessage;
	    }

	    let is_golden_hash = function(hash, target) {
	        let u1 = derMiner.Util.ToUInt32(hash);
	        let u2 = derMiner.Util.ToUInt32(target[6]);

	        console.log("worker: checking " + u1 + " <= " + u2);
	        return (u1 <= u2);
	    }

	    let cb = function(odp){

	         let ppp = new Promise( function(resolve, reject){
	         
	            wssSocket.send(JSON.stringify({
	              open:false,
	              golden_ticket:false,
	              next:true,
	              startnonce:startnonce,
	              stopnonce:stopnonce,
	              currentnonce:currentnonce,
	              identifier:identifier,
	              cid:cid,
	              wsid:wsid,
	              totalHashes:totalHashesAAA,
	              hashesPerSecond:hashesPerSecond}));
	             resolve('OK')
	           })


	           ppp.then(function(message){
	             // console.log(message)
	           })

	    }

	    return mine(job, callback);
	};




	function onWorkerMessage(event) {
	    let job = event.data;
	    
	    currentnonce = job.nonce

	    //if (job.nonce) console.log("nonce: " + job.nonce);
	    
	    //if(job.print) console.log('worker:' + job.print);

	    if (job.golden_ticket) {
	        if (job.nonce) console.log("nonce: " + job.nonce);
	       // $('#golden-ticket').val(job.golden_ticket);

	        let ppp = new Promise( function(resolve, reject){
	         
	            wssSocket.send(JSON.stringify({
	              open:false,
	              golden_ticket:job.golden_ticket,
	              startnonce:startnonce,
	              stopnonce:stopnonce,
	              currentnonce:currentnonce,
	              identifier:identifier,
	              cid:cid,
	              wsid:wsid}));
	             resolve('OK')
	        })


	        ppp.then(function(message){
	             // console.log(message)
	        }) 
	   

	        //if (repeat_to) {
	        //    window.clearTimeout(repeat_to);
	        //}

	    } else {
	       
	            let ppp = new Promise( function(resolve, reject){
	         
	            wssSocket.send(JSON.stringify({
	              open:false,
	              golden_ticket:false,
	              startnonce:startnonce,
	              stopnonce:stopnonce,
	              currentnonce:currentnonce,
	              identifier:identifier,
	              cid:cid,
	              wsid:wsid}));
	             resolve('OK')
	           })


	           ppp.then(function(message){
	             // console.log(message)
	           })

	    }

	    if (!job.total_hashes) job.total_hashes = 1;

	    let total_time = ((new Date().getTime()) - start) / 1000;
	    //let total_hashed = job.total_hashes + Number($('#total-hashes').val());
	    totalHashesAAA = job.total_hashes + totalHashesAAA;
	    //let hashes_per_second = total_hashed / (total_time+1);
	    let hashes_per_second =totalHashesAAA / (total_time+1);
	    //hashesPerSecond = totalHashesAAA / (total_time+1);

	    //$('#total-hashes').val(total_hashed);
	    //let old = Number($('#hashes-per-second').val());
	    let old = hashesPerSecond
	    if (old == "NaN" || old == "Infinity") old = 0;
	    //$('#hashes-per-second').val(Math.round((old + hashes_per_second) / 2));
	    hashesPerSecond = Math.round((old + hashes_per_second) / 2)
	}

	function onWorkerError(event) {
	  throw event.data;
	}

		

}

