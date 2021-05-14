// Variables
// Socket connection
const webSocket = new WebSocket("wss://13.233.204.111:3000")
var local_stream_video
var rtc_peer_connection
var room_input
var audio_disable = true
var video_disable = true

// -----------------------------------------------------------

webSocket.onmessage = (event) => {
    handleSignallingData(JSON.parse(event.data))
}

function handleSignallingData(data) {
    switch (data.type) {
        case "offer":
            rtc_peer_connection.setRemoteDescription(data.offer)
            offer_functionality()
            break
        case "candidate":
            rtc_peer_connection.addIceCandidate(data.candidate)
    }
}

// --------------------------------------------------------

// Common functions
function offer_functionality () {
    rtc_peer_connection.createAnswer((answer) => {
        rtc_peer_connection.setLocalDescription(answer)
        send_data_to_server({
            type: "send_answer",
            answer: answer,
            number: 1
        })
    }, error => {
        console.log(error)
    })
}

function send_data_to_server(data) {
    data.room_input = room_input
    webSocket.send(JSON.stringify(data))
}

// Audio and Video Settings
function muteAudio() {
    audio_disable = !audio_disable
    local_stream_video.getAudioTracks()[0].enabled = audio_disable
}

function muteVideo() {
    video_disable = !video_disable
    local_stream_video.getVideoTracks()[0].enabled = video_disable
}

// ----------------------------------------------------------

function joinCall() {
    // Geting room_input and display block
    room_input = document.getElementById("room_input").value

    document.getElementById("video-call-div")
    .style.display = "inline"

    // Get the media details
    navigator.getUserMedia({
        audio: true,
        video: true
    }, (stream) => {
        local_stream_video = stream
        document.getElementById("local-video").srcObject = local_stream_video

        let webrtc_config = {
            iceServers: [
                {
                    "urls": ["stun:stun.l.google.com:19302", 
                    "stun:stun1.l.google.com:19302", 
                    "stun:stun2.l.google.com:19302"]
                }
            ]
        }

        rtc_peer_connection = new RTCPeerConnection(webrtc_config)
        rtc_peer_connection.addStream(local_stream_video)

        rtc_peer_connection.onaddstream = (e) => {
            document.getElementById("remote-video")
            .srcObject = e.stream
        }

        rtc_peer_connection.onicecandidate = ((e) => {
            if (e.candidate == null)
                return
            
            send_data_to_server({
                type: "send_candidate",
                candidate: e.candidate
            })
        })

        send_data_to_server({
            type: "join_call"
        })

    }, (error) => {
        console.log(error)
    })
}