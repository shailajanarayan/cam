var config = {
	apiKey: "AIzaSyDaTqqzh4xRyFlc3-HMF76kyamjsUg3j-k",
	authDomain: "rat-web-app.firebaseapp.com",
	databaseURL: "https://rat-web-app.firebaseio.com",
	projectId: "rat-web-app",
	storageBucket: "",
	messagingSenderId: "109217895567"
};
firebase.initializeApp(config);

var database = firebase.database().ref();
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");
var yourId = Math.floor(Math.random()*1000000000);
var servers = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};
var pc = new RTCPeerConnection(servers);
pc.onicecandidate = (event => event.candidate?sendMessage(yourId, JSON.stringify({'ice': event.candidate})):console.log("Sent All Ice") );
pc.onaddstream = (event => remoteVideo.srcObject = event.stream);

function sendMessage(senderId, data) {
	var msg = database.push({ sender: senderId, message: data });
	msg.remove();
}

function readMessage(data) {
	var msg = JSON.parse(data.val().message);
	var sender = data.val().sender;
	if (sender != yourId) {
	if (msg.ice != undefined)
	pc.addIceCandidate(new RTCIceCandidate(msg.ice));
	else if (msg.sdp.type == "offer")
	pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
	.then(() => pc.createAnswer())
	.then(answer => pc.setLocalDescription(answer))
	.then(() => sendMessage(yourId, JSON.stringify({'sdp': pc.localDescription})));
	else if (msg.sdp.type == "answer")
	pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
	}
};

database.on('child_added', readMessage);

function showLocalVideo() {
	navigator.mediaDevices.getUserMedia({audio:true, video:true})
	.then(stream => localVideo.srcObject = stream)
	.then(stream => pc.addStream(stream));
}

function showRemoteVideo() {
	pc.createOffer()
	.then(offer => pc.setLocalDescription(offer) )
	.then(() => sendMessage(yourId, JSON.stringify({'sdp': pc.localDescription})) );
}