// Globals
const _serverURL = 'https://fathomless-brushlands-18222.herokuapp.com'
const _webOrigin = 'https://rintaroutw.github.io'
const _displayWidth = 720, _displayHeight = 405
const reloadTimeout = 600000

var reloadTimer
var startVideoId
var ytplayer            // player : YTPlayer singleton
var channels = []       // channels : array of live video snippets
var channelIds = []     // channelIds : array of videoId(s)

window.$ = selector => document.querySelector(selector)

function setChannelInfo(videoId) {
  channels.forEach( snippet => {
    if (snippet.videoId == videoId) {
      $('#Title').innerText = snippet.title
      return
    }
  })
}

function play(videoId) {
  console.log('play - ' + videoId)
  ytplayer.loadVideoById(videoId)
  setChannelInfo(videoId)
  // save videoId to the local storage
  window.localStorage.setItem('lastVideoId',videoId)
}

function playByClick(evt) {
  evt.preventDefault()
  let videoId = evt.target.getAttribute('id').substr(4)
  if (videoId) play(videoId)
}

function channelItem(videoId) {
  let item = document.createElement('div')
  item.setAttribute('id', `vid-${videoId}`)
  item.setAttribute('class', 'cover')
  item.setAttribute("style", `background: url('https://img.youtube.com/vi/${videoId}/0.jpg') no-repeat center center / cover;`)
  item.onclick = playByClick
  return item
}

function addChannel(videoId) {
  console.log(`add channel - ${videoId}`)
  let list = $('#Channels')
  let item = channelItem(videoId)
  list.appendChild(item)
}

function removeChannel(videoId) {
  console.log(`remove channel - ${videoId}`)
  let channel = $(`#vid-${videoId}`)
  channel?.addEventListener('animationend', evt => {
    evt.preventDefault()
    evt.stopPropagation()
    evt.target.remove()
  }, {once: true})
  channel?.setAttribute('class', 'coverFadeOut')
}

function updateChannels(autoStart) {
  console.log('updateChannels()')
  fetch(_serverURL + '/hololive')
    .then(resp => resp.json())
    .then(newchannels => {
      console.log('newchannels = ' + newchannels)
      console.log('channels = ' + channels)
      const newchannelIds = newchannels.map(snippet => snippet.videoId)
      // remove the outdated channels
      channels.forEach(snippet => {
        const videoId = snippet.videoId
        if (!newchannelIds.includes(videoId)) removeChannel(videoId)
      })

      // add the new channels
      newchannels.forEach(snippet => {
        const videoId = snippet.videoId
        if (!channelIds.includes(videoId)) addChannel(videoId)
      })
      channels = newchannels
      channelIds = newchannelIds
      if (autoStart) {
        let lastVideoId = window.localStorage.getItem('lastVideoId')
        console.log('get last video id from local storage - ' + lastVideoId)
        startVideoId = channelIds.includes(lastVideoId) ? lastVideoId : ''
        // play the video if ytplayer was loaded faster than the channel info
        try {
          const state = ytplayer.getPlayerState()
          console.log('player state = ' + state)
          if (state == -1 /* unstarted */ || state == 5 /* cued */) play(startVideoId)
        } catch (err) {
          console.log('player is not ready yet')
        }
      }
    })
  if (reloadTimer) clearTimeout(reloadTimer)
  reloadTimer = setTimeout(updateChannels, reloadTimeout)
}

function onPlayerReady() {
  if (startVideoId) play(startVideoId)
}

function onYouTubeIframeAPIReady() {
  // console.log('yt api ready')
  updateChannels(true)
  ytplayer = new YT.Player('YTPlayer', {
    width: _displayWidth,
    height: _displayHeight,
    playerVars : {
      enablejsapi: 1,
      // controls: 0,
      // modestbranding: 1,
      autoplay: 1,
      origin: _webOrigin,
    },
    events: {
      'onReady': onPlayerReady
    }
  })
}

// simple css animation helper
const animateCSS = (element, animation) => 
  new Promise((resolve, reject) => {
    const node = $(element)
    node.classList.add(animation)

    function handleAnimationEnd(evt) {
      evt.preventDefault()
      evt.stopPropagation()
      node.classList.remove(animation)
      resolve()
    }

    node.addEventListener('animationend', handleAnimationEnd, {once: true})
  })

// key binding
const _keydownHandler = evt => {
  console.log(evt.code)
  switch(evt.code) {
    case 'KeyR':
      animateCSS('#Channels', 'flash')
      updateChannels()
      break
    case 'Space':
      const state = ytplayer.getPlayerState()
      if (state == YT.PlayerState.PLAYING) ytplayer.pauseVideo()
      else if (state == YT.PlayerState.PAUSED) ytplayer.playVideo()
      break
    case 'KeyM':
      if (ytplayer) {
        if (ytplayer.isMuted()) ytplayer.unMute()
        else ytplayer.mute()
      }
      break
  }
}
document.addEventListener('keydown', _keydownHandler)
