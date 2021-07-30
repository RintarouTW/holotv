// Globals
const _serverURL = "https://fathomless-brushlands-18222.herokuapp.com"
const reloadTimeout = 600000

var reloadTimer
var startVideoId = ''
var player            // player : YTPlayer singleton
var channels = []     // channels : array of videoId(s)
var _keydownHandler

function getChannelInfo(videoId) {
  fetch(`${_serverURL}/yt/${videoId}`)
    .then(resp => resp.json())
    .then(info => {
      // console.log(info.snippet)
      document.getElementById('Title').innerText = info?.snippet?.title
    })
}

function play(videoId) {
  console.log('play - ' + videoId)
  player.loadVideoById(videoId)
  getChannelInfo(videoId)
  // save videoId to the cookie
  document.cookie = `${videoId}`
}

function playByClick(evt) {
  evt.preventDefault()
  let videoId = evt.target.getAttribute('id')
  if (videoId) play(videoId)
}

function channelItem(videoId) {
  let item = document.createElement('div')
  item.setAttribute('id', videoId)
  item.setAttribute('class', 'cover')
  item.setAttribute("style", `background: url('https://img.youtube.com/vi/${videoId}/0.jpg') no-repeat center center / cover;`)
  item.onclick = playByClick
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
    evt.preventDefault()
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
      channels = newchannels
      if (autoStart) {
        startVideoId = newchannels[0]
        let lastVideoId = document.cookie // get last video id from cookie
        startVideoId = channels.includes(lastVideoId) ? lastVideoId : ''
      }
    })
  if (reloadTimer) clearTimeout(reloadTimer)
  reloadTimer = setTimeout(updateChannels, reloadTimeout)
}

function onPlayerReady() {
  if (startVideoId) play(startVideoId)
}

function onYouTubeIframeAPIReady() {
  updateChannels(true)
  // console.log('yt api ready')
  player = new YT.Player('YTPlayer', {
    width: '640',
    height: '480',
    playerVars : {
      enablejsapi: 1,
      // controls: 0,
      // modestbranding: 1,
      autoplay: 1,
      origin: 'https://rintaroutw.github.io',
    },
    events: {
      'onReady': onPlayerReady
    }
  })
}

/* key binding */
if (_keydownHandler) document.removeEventListener('keydown', _keydownHandler)
_keydownHandler = evt => {
  // console.log(evt.code)
  switch(evt.code) {
    case 'KeyR':
      updateChannels()
      break
  }
}
document.addEventListener('keydown', _keydownHandler)
