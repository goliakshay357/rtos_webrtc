// Variables
// URL with Socket
const webSocket = new WebSocket("wss://13.233.204.111:3000")
var room_input;
var local_stream_video;
var rtc_peer_connection
var audio_diable = true
var video_disable = true
// ----------------------------------------------------------

// When got a message from the central server
webSocket.onmessage = (event) => {
  handleSignallingData(JSON.parse(event.data))
}

function handleSignallingData(data) {
  switch (data.type) {
      case "answer":
          rtc_peer_connection.setRemoteDescription(data.answer)
          break
      case "candidate":
          rtc_peer_connection.addIceCandidate(data.candidate)
  }
}
// ----------------------------------------------------------

// Comman Functions
function send_data_to_server(data) {
    data.room_input = room_input
    webSocket.send(JSON.stringify(data))
  }

// Offer Function
  function offer_functionality() {
    rtc_peer_connection.createOffer((offer) => {
        send_data_to_server({
            type: "store_offer",
            offer: offer
        })

        rtc_peer_connection.setLocalDescription(offer)
    }, (error) => {
        console.log(error)
    })
}

// Audio and Video Settings
function muteAudio() {
    audio_diable = !audio_diable
    local_stream_video.getAudioTracks()[0].enabled = audio_diable
}

function muteVideo() {
    video_disable = !video_disable
    local_stream_video.getVideoTracks()[0].enabled = video_disable
}
// ----------------------------------------------------------

// Send room_input and server will store it
function sendRoomDetails() {
    let temp = document.getElementById("room_input").value
    room_input = temp;
    send_data_to_server({
        type: "store_user",
        number: 0
    })
}

// ----------------------------------------------------------
// 
function start_video_call() {
  // SHow the video to inline box  
  let styling = document.getElementById("video-call-div")
  styling.style.display = "inline"

  // Setup the web media constraints details with custom options
  /*
    Change the details to true for default
    Setting Width and Height:
    More at: https://www.rtcmulticonnection.org/docs/mediaConstraints/ 
  */
    navigator.getUserMedia({
        audio: true,
        video: true
    }, (stream) => {
        let video = document.getElementById("local-video");
        video.srcObject = stream;
        local_stream_video = stream;

        // Details of STUN and TURN Servers
        // Multiple servers uses the better one among given. 
        let webrtc_config = {
            iceServers: [
                {
                    "urls": ["stun:stun.l.google.com:19302", 
                    "stun:stun1.l.google.com:19302", 
                    "stun:stun2.l.google.com:19302"]
                }
            ]
        }
        
        // Starting a WebRTC Connection
        rtc_peer_connection = new RTCPeerConnection(webrtc_config)
        // Sending my stream
        rtc_peer_connection.addStream(local_stream_video)
        // When sent to someone, a callback is called, show the remote video by attaching it.
        rtc_peer_connection.onaddstream = (e) => {
            let remote = document.getElementById("remote-video")
            remote.srcObject = e.stream
        }

        // Sending the ICE Candidates
        rtc_peer_connection.onicecandidate = ((event) => {
            if (event.candidate == null){
                return
            }
            send_data_to_server({
                type: "store_candidate",
                candidate: event.candidate
            })
        })
        offer_functionality()
    }, (error) => {
        console.log(error)
    })
}
