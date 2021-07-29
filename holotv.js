// Globals
const _serverURL = "https://fathomless-brushlands-18222.herokuapp.com"
const reloadTimeout = 600000

var startVideoId = ''
// player : YTPlayer singleton
var player
// channels : array of videoId(s)
var channels = []

function getChannelInfo(videoId) {
  fetch(`${_serverURL}/yt/${videoId}`)
    .then(resp => resp.json())
    .then(info => {
      document.getElementById('Title').innerText = info?.snippet?.title
    })
}

function play(videoId) {
  // let videoId = evt.target.getAttribute('id')
  console.log('play - ' + videoId)
  player.loadVideoById(videoId)
  getChannelInfo(videoId)
}

function channelItem(videoId) {
  let item = document.createElement('div')
  item.setAttribute('id', videoId)
  item.setAttribute('class', 'cover')
  item.setAttribute("style", `background: url('https://img.youtube.com/vi/${videoId}/0.jpg') no-repeat center center / cover;`)
  item.onclick = play.bind(this, videoId)
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
  console.log('updateChannels()')
  fetch(_serverURL + '/hololive')
    .then(resp => resp.json())
    .then(newchannels => {
      console.log('newchannels = ' + newchannels)
      console.log('channels = ' + channels)
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
  setTimeout(updateChannels, reloadTimeout)
}

function onPlayerReady() {
  if (startVideoId) play(startVideoId)
}

function onYouTubeIframeAPIReady() {
  updateChannels(true)
  // export to the global.
  console.log('yt api ready')
  player = new YT.Player('YTPlayer', {
    width: '640',
    height: '480',
    playerVars : {
      enablejsapi: 1,
      autoplay: 1,
      origin: 'https://rintaroutw.github.io'
    },
    events: {
      'onReady': onPlayerReady
    }
  })
}

