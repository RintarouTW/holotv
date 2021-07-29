// Globals
const _serverURL = "https://fathomless-brushlands-18222.herokuapp.com"
var startVideoId = ''
// player : YTPlayer singleton
var player
// channels : array of videoId(s)
var channels = []

function play(evt) {
  let videoId = evt.target.getAttribute('id')
  player.loadVideoById(videoId)
}

function channelItem(videoId) {
  let item = document.createElement('div')
  item.setAttribute('id', videoId)
  item.setAttribute('class', 'cover')
  item.setAttribute("style", `background: url('https://img.youtube.com/vi/${videoId}/0.jpg') no-repeat center center / cover;`)
  item.onclick = play
  return item
}

function addChannel(videoId) {
  console.log(`add channel - ${videoId}`)
  let list = document.getElementById('Channels')
  let item = channelItem(videoId)
  list.appendChild(item)
}

function removeChannel(videoId) {
  console.log(`remove channel - ${videoId}`)
  let channel = document.getElementById(videoId)
  channel?.addEventListener('animationend', evt => {
    evt.target.remove()
    // channels = [] // for test
  })
  channel?.setAttribute('class', 'coverFadeOut')
}

function updateChannels(autoStart) {
  console.log('updateChannels')
  fetch(_serverURL + '/hololive')
    .then(resp => resp.json())
    .then(newchannels => {
      console.log(newchannels, channels)
      // remove the outdated channels
      channels.forEach(videoId => {
        if (!newchannels.includes(videoId)) removeChannel(videoId)
      })

      // add the new channels
      newchannels.forEach(videoId => {
        if (!channels.includes(videoId)) addChannel(videoId)
      })
      if (autoStart) startVideoId = newchannels[0]
      channels = newchannels
    })
  setTimeout(updateChannels, 600000)
}

function onPlayerReady() {
  player.loadVideoById(startVideoId)
}

function onYouTubeIframeAPIReady() {
  updateChannels(true)
  // export to the global.
  console.log('api ready')
  player = new YT.Player('YTPlayer', {
    width: '640',
    height: '480',
    playerVars : {
      enablejsapi: 1,
    },
    events: {
      'onReady': onPlayerReady
    }
  })
}

