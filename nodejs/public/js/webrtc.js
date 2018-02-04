"use strict";

// Get our hostname

var myHostname = window.location.hostname;
console.log("Hostname: " + myHostname);

// WebSocket chat/signaling channel variables.

var connection = null;
var clientID = 0;

var mediaConstraints = {
  audio: true,            // We want an audio track
  video: true             // ...and we want a video track
};

var myUsername = null;
var targetUsername = null;      // To store username of other peer
var myPeerConnection = null;    // RTCPeerConnection

// To work both with and without addTrack() we need to note
// if it's available

var hasAddTrack = false;

// Output logging information to console.

function log(text) {
  var time = new Date();

  console.log("[" + time.toLocaleTimeString() + "] " + text);
}

function log_error(text) {
  var time = new Date();

  console.error("[" + time.toLocaleTimeString() + "] " + text);
}

function setUsername() {
  // myUsername = document.getElementById("name").value;

  sendwssSocket({
   // name: myUsername,
    date: Date.now(),
    id: clientID,
    type: "username"
  },'camerachat');
}

function startrecieved(){
 
 createPeerConnection();

}

function createPeerConnection() {
  log("Setting up a connection..."+kodydocoturn.username + " pass: "+ kodydocoturn.password);
  readyforcandidates = false;
  // Create an RTCPeerConnection which knows to use our chosen
  // STUN server.
  
  myPeerConnection = new RTCPeerConnection({
    iceServers: [     // Information about ICE servers - Use your own!
      {
        //urls: "turn:" + myHostname,  // A TURN server
        urls: "turn:" +'79.189.215.218',
        username: kodydocoturn.username,
        credential: kodydocoturn.password
      }
    ]
  });

/*  var iceServers = myPeerConnection.defaultIceServers;

   if (iceServers.length === 0) {
     // Deal with the lack of default ICE servers, possibly by using our own defaults
     console.log("iceServer = 0")
   } else {
    console.log(iceServers)
   }*/
  // Do we have addTrack()? If not, we will use streams instead.

  hasAddTrack = (myPeerConnection.addTrack !== undefined);

  // Set up event handlers for the ICE negotiation process.

  myPeerConnection.onicecandidate = handleICECandidateEvent;
  myPeerConnection.onnremovestream = handleRemoveStreamEvent;
  myPeerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
  myPeerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
  myPeerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
  myPeerConnection.onnegotiationneeded = handleNegotiationNeededEvent;

  myPeerConnection.ondatachannel = handleOnDataChannel;



  // Because the deprecation of addStream() and the addstream event is recent,
  // we need to use those if addTrack() and track aren't available.

  if (hasAddTrack) {
    myPeerConnection.ontrack = handleTrackEvent;
  } else {
    myPeerConnection.onaddstream = handleAddStreamEvent;
  }
}

function handleNegotiationNeededEvent() {
  console.log("*** Negotiation needed");

//  console.log("---> Creating offer");
/*  myPeerConnection.createOffer().then(function(offer) {
    console.log("---> Creating new description object to send to remote peer");
    return myPeerConnection.setLocalDescription(offer);
  })
  .then(function() {
    console.log("---> Sending offer to remote peer");
    sendwssSocket({
      name: myUsername,
      target: targetUsername,
      type: "video-offer",
      sdp: myPeerConnection.localDescription
    }, 'camerachat');
  })
  .catch(reportError);*/
}

// Called by the WebRTC layer when events occur on the media tracks
// on our WebRTC call. This includes when streams are added to and
// removed from the call.
//
// track events include the following fields:
//
// RTCRtpReceiver       receiver
// MediaStreamTrack     track
// MediaStream[]        streams
// RTCRtpTransceiver    transceiver

function handleTrackEvent(event) {
  log("*** Track event");
  document.getElementById("received_video").srcObject = event.streams[0];
  document.getElementById("hangup-button").disabled = false;
}

// Called by the WebRTC layer when a stream starts arriving from the
// remote peer. We use this to update our user interface, in this
// example.

function handleAddStreamEvent(event) {
  log("*** Stream added");
  document.getElementById("received_video").srcObject = event.stream;
  document.getElementById("hangup-button").disabled = false;
}

// An event handler which is called when the remote end of the connection
// removes its stream. We consider this the same as hanging up the call.
// It could just as well be treated as a "mute".
//
// Note that currently, the spec is hazy on exactly when this and other
// "connection failure" scenarios should occur, so sometimes they simply
// don't happen.

function handleRemoveStreamEvent(event) {
  log("*** Stream removed");
  closeVideoCall();
}

// Handles |icecandidate| events by forwarding the specified
// ICE candidate (created by our local ICE agent) to the other
// peer through the signaling server.

function handleICECandidateEvent(event) {
  if (event.candidate) {
    log("Outgoing ICE candidate: " + event.candidate.candidate);

    sendwssSocket({
      type: "new-ice-candidate",
      target: targetUsername,
      candidate: event.candidate
    }, 'camerachat');
  }
}

// Handle |iceconnectionstatechange| events. This will detect
// when the ICE connection is closed, failed, or disconnected.
//
// This is called when the state of the ICE agent changes.

function handleICEConnectionStateChangeEvent(event) {
  log("*** ICE connection state changed to " + myPeerConnection.iceConnectionState);
  console.log(event)
  switch(myPeerConnection.iceConnectionState) {
    case "closed":
    case "failed":
    case "disconnected":
      closeVideoCall();
      break;
  }
}

// Set up a |signalingstatechange| event handler. This will detect when
// the signaling connection is closed.
//
// NOTE: This will actually move to the new RTCPeerConnectionState enum
// returned in the property RTCPeerConnection.connectionState when
// browsers catch up with the latest version of the specification!

function handleSignalingStateChangeEvent(event) {
  console.log("*** WebRTC signaling state changed to: " + myPeerConnection.signalingState);
  switch(myPeerConnection.signalingState) {
    case "closed":
      closeVideoCall();
      break;
  }
}

// Handle the |icegatheringstatechange| event. This lets us know what the
// ICE engine is currently working on: "new" means no networking has happened
// yet, "gathering" means the ICE engine is currently gathering candidates,
// and "complete" means gathering is complete. Note that the engine can
// alternate between "gathering" and "complete" repeatedly as needs and
// circumstances change.
//
// We don't need to do anything when this happens, but we log it to the
// console so you can see what's going on when playing with the sample.

function handleICEGatheringStateChangeEvent(event) {
  log("*** ICE gathering state changed to: " + myPeerConnection.iceGatheringState);
}

// Given a message containing a list of usernames, this function
// populates the user list box with those names, making each item
// clickable to allow starting a video call.

function handleUserlistMsg(msg) {
  var i;

  var listElem = document.getElementById("userlistbox");

  // Remove all current list members. We could do this smarter,
  // by adding and updating users instead of rebuilding from
  // scratch but this will do for this sample.

  while (listElem.firstChild) {
    listElem.removeChild(listElem.firstChild);
  }

  // Add member names from the received list

  for (i=0; i < msg.users.length; i++) {
    var item = document.createElement("li");
    item.appendChild(document.createTextNode(msg.users[i]));
    item.addEventListener("click", invite, false);

    listElem.appendChild(item);
  }
}

// Close the RTCPeerConnection and reset variables so that the user can
// make or receive another call if they wish. This is called both
// when the user hangs up, the other user hangs up, or if a connection
// failure is detected.

function closeVideoCall() {
  var remoteVideo = document.getElementById("received_video");
  var localVideo = document.getElementById("local_video");

  log("Closing the call");

  // Close the RTCPeerConnection

  if (myPeerConnection) {
    log("--> Closing the peer connection");

    // Disconnect all our event listeners; we don't want stray events
    // to interfere with the hangup while it's ongoing.

    myPeerConnection.onaddstream = null;  // For older implementations
    myPeerConnection.ontrack = null;      // For newer ones
    myPeerConnection.onremovestream = null;
    myPeerConnection.onnicecandidate = null;
    myPeerConnection.oniceconnectionstatechange = null;
    myPeerConnection.onsignalingstatechange = null;
    myPeerConnection.onicegatheringstatechange = null;
    myPeerConnection.onnotificationneeded = null;

    // Stop the videos

    if (remoteVideo.srcObject) {
      remoteVideo.srcObject.getTracks().forEach(function(track) { track.stop()});
    }

    if (localVideo.srcObject) {
      localVideo.srcObject.getTracks().forEach(function(track) {track.stop()});
    }

    remoteVideo.src = null;
    localVideo.src = null;

    // Close the peer connection

    myPeerConnection.close();
    myPeerConnection = null;

    // wracamy do stanu początkowego
    createPeerConnection(); 

  }

  // Disable the hangup button

  document.getElementById("hangup-button").disabled = true;

  targetUsername = null;
}

// Handle the "hang-up" message, which is sent if the other peer
// has hung up the call or otherwise disconnected.

function handleHangUpMsg(msg) {
  log("*** Received hang up notification from other peer");

  closeVideoCall();
}

// Hang up the call by closing our end of the connection, then
// sending a "hang-up" message to the other peer (keep in mind that
// the signaling is done on a different connection). This notifies
// the other peer that the connection should be terminated and the UI
// returned to the "no call in progress" state.

function hangUpCall() {
  closeVideoCall();
  sendwssSocket({
    //name: myUsername,
    target: targetUsername,
    type: "hang-up"
  }, 'camerachat');
}

// Handle a click on an item in the user list by inviting the clicked
// user to video chat. Note that we don't actually send a message to
// the callee here -- calling RTCPeerConnection.addStream() issues
// a |notificationneeded| event, so we'll let our handler for that
// make the offer.

function invite(evt) {
  log("Starting to prepare an invitation");
  if (false) {
    alert("Nie możesz rozpocząć nowej rozmowy, ponieważ wcześniejsza nadal trwa !");
  } else {
    var clickedUsername = evt.target.textContent;

    // Don't allow users to call themselves, because weird.

    if (clickedUsername === myUsername) {
      alert("Mówienie do siebie wymaga wizyty u psychiatry. Umówić ?");
      return;
    }

    // Record the username being called for future reference

    targetUsername = clickedUsername;
    log("Inviting user " + targetUsername);

    // Call createPeerConnection() to create the RTCPeerConnection.

    log("Setting up connection to invite user: " + targetUsername);
    //createPeerConnection();

    // Now configure and create the local stream, attach it to the
    // "preview" box (id "local_video"), and add it to the
    // RTCPeerConnection.

    log("Requesting webcam access...");

    navigator.mediaDevices.getUserMedia(mediaConstraints)
    .then(function(localStream) {
      log("-- Local video stream obtained");
      //document.getElementById("local_video").src = window.URL.createObjectURL(localStream);
      document.getElementById("local_video").srcObject = localStream;

      if (hasAddTrack) {
        log("-- Adding tracks to the RTCPeerConnection");
        localStream.getTracks().forEach(function(track) {myPeerConnection.addTrack(track, localStream)});
      } else {
        log("-- Adding stream to the RTCPeerConnection");
        myPeerConnection.addStream(localStream);
      }
      return myPeerConnection.createOffer();
    }).then(function(offer){
        

        console.log("---> Creating new description object to send to remote peer");
        return myPeerConnection.setLocalDescription(offer);
  

    }).then(function() {
          console.log("---> Sending offer to remote peer");
          sendwssSocket({
            name: myUsername,
            target: targetUsername,
            type: "video-offer",
            sdp: myPeerConnection.localDescription
          }, 'camerachat');
    })
    .catch(handleGetUserMediaError);
  }
}

// Accept an offer to video chat. We configure our local settings,
// create our RTCPeerConnection, get and attach our local camera
// stream, then create and send an answer to the caller.

function handleVideoOfferMsg(msg) {
  var localStream = null;

  targetUsername = msg.name;

  // Call createPeerConnection() to create the RTCPeerConnection.

  log("Starting to accept invitation from " + targetUsername);
  //createPeerConnection();

  // We need to set the remote description to the received SDP offer
  // so that our local WebRTC layer knows how to talk to the caller.

  navigator.mediaDevices.getUserMedia(mediaConstraints)
  .then(function(stream) {
    console.log("-- Local video stream obtained");
    let localStream = stream;
   // document.getElementById("local_video").src = window.URL.createObjectURL(localStream);
    console.log("Setting up the local media stream...");
    document.getElementById("local_video").srcObject = localStream;

    if (hasAddTrack) {
      console.log("-- Adding tracks to the RTCPeerConnection");
      localStream.getTracks().forEach(function(track) {
            myPeerConnection.addTrack(track, localStream)
          });
    } else {
      console.log("-- Adding stream to the RTCPeerConnection");
      myPeerConnection.addStream(localStream);
    }
    
    var desc = new RTCSessionDescription(msg.sdp);
    return myPeerConnection.setRemoteDescription(desc);

  }).then(function () {
   
    console.log("------> Creating answer");
    // Now that we've successfully set the remote description, we need to
    // start our stream up locally then create an SDP answer. This SDP
    // data describes the local end of our call, including the codec
    // information, options agreed upon, and so forth.
    return myPeerConnection.createAnswer();
  })
  .then(function(answer) {
    console.log("------> Setting local description after creating answer");
    // We now have our answer, so establish that as the local description.
    // This actually configures our end of the call to match the settings
    // specified in the SDP.
    return myPeerConnection.setLocalDescription(answer);
  })
  .then(function() {
    var msg = {
   //   name: myUsername,
      target: targetUsername,
      type: "video-answer",
      sdp: myPeerConnection.localDescription
    };

    // We've configured our end of the call now. Time to send our
    // answer back to the caller so they know that we want to talk
    // and how to talk to us.
    readyforcandidates = true;
    candidates.forEach(function(item,index){
	  	myPeerConnection.addIceCandidate(item).catch(function(err){
	  		console.log('add ice cand2', err)
	  	})
    })
    console.log("Sending answer packet back to other peer");
    sendwssSocket(msg, 'camerachat');
  }).catch(function(err){

    console.log("local video error", err)
  })



}

// Responds to the "video-answer" message sent to the caller
// once the callee has decided to accept our request to talk.

function handleVideoAnswerMsg(msg) {
  log("Call recipient has accepted our call");

  // Configure the remote description, which is the SDP payload
  // in our "video-answer" message.
  readyforcandidates = true;
  candidates.forEach(function(item,index){
  	myPeerConnection.addIceCandidate(item).catch(function(err){
  		console.log('add ice cand1', err)
  	})
  })
  var desc = new RTCSessionDescription(msg.sdp);
  myPeerConnection.setRemoteDescription(desc).catch(reportError);
}

// A new ICE candidate has been received from the other peer. Call
// RTCPeerConnection.addIceCandidate() to send it along to the
// local ICE framework.

var candidates = []
var readyforcandidates = false;
function handleNewICECandidateMsg(msg) {
  var candidate = new RTCIceCandidate(msg.candidate);
  
  if(readyforcandidates) {
       console.log("Adding received ICE candidate: " + JSON.stringify(candidate));
       myPeerConnection.addIceCandidate(candidate)
       .catch(reportError);
     } else {

     	candidates.push(candidate)
     }
}

// Handle errors which occur when trying to access the local media
// hardware; that is, exceptions thrown by getUserMedia(). The two most
// likely scenarios are that the user has no camera and/or microphone
// or that they declined to share their equipment when prompted. If
// they simply opted not to share their media, that's not really an
// error, so we won't present a message in that situation.

function handleGetUserMediaError(e) {
  log(e);
  switch(e.name) {
    case "NotFoundError":
      alert("Unable to open your call because no camera and/or microphone" +
            "were found.");
      break;
    case "SecurityError":
    case "PermissionDeniedError":
      // Do nothing; this is the same as the user canceling the call.
      break;
    default:
      alert("Error opening your camera and/or microphone: " + e.message);
      break;
  }

  // Make sure we shut down our end of the RTCPeerConnection so we're
  // ready to try again.

  closeVideoCall();
}

// Handles reporting errors. Currently, we just dump stuff to console but
// in a real-world application, an appropriate (and user-friendly)
// error message should be displayed.

function reportError(errMessage) {
  log_error("Error " + errMessage.name + ": " + errMessage.message);
}


// Dodanie kanału danych do połączenia z aktualnie otwartm połączeniem
// dodajemy, jeśli RTCPeerConnection istnieje

var channel = null;

function openDataChannel(name){

  if(!myPeerConnection) return;
 	channel = myPeerConnection.createDataChannel(name);
 
 	channel.onopen = function(event) {
    		channel.send('Hi you!');
 	}
 	
 	channel.onmessage = function(event) {
   		console.log(event.data);
 	}

}


function handleOnDataChannel(event){

    let channel = event.channel;
﻿    channel.onopen = function(event) {
       channel.send('Hi back!');
    }
    channel.onmessage = function(event) {
      console.log(event.data);
    }
    

}
