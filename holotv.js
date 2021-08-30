// Globals
const _serverURL = 'https://fathomless-brushlands-18222.herokuapp.com'
const _webOrigin = 'https://rintaroutw.github.io'
const _displayWidth = 720, _displayHeight = 405
const reloadTimeout = 150000
const isWebKit = /WebKit/.test(navigator.userAgent)

var reloadTimer
var startVideoId
var ytplayer            // player : YTPlayer singleton
var isYTPlayerReady = false
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
  console.debug('play - ' + videoId)
  ytplayer.loadVideoById(videoId)
  setChannelInfo(videoId)
  // save videoId to the local storage
  window.localStorage.setItem('lastVideoId',videoId)
}

function channelItem(videoId) {
  let item = document.createElement('div')
  item.setAttribute('id', `vid-${videoId}`)
  item.setAttribute('class', 'cover')
  item.setAttribute("style", `background: url('https://img.youtube.com/vi/${videoId}/mqdefault.jpg') no-repeat center center / cover;`)
  item.onclick = evt => {
    evt.preventDefault()
    let videoId = evt.target.getAttribute('id').substr(4)
    if (videoId) play(videoId)
  }
  return item
}

function addChannel(videoId) {
  console.debug(`add channel - ${videoId}`)
  let list = $('#Channels')
  let item = channelItem(videoId)
  list.appendChild(item)
}

function removeChannel(videoId) {
  console.debug(`remove channel - ${videoId}`)
  let channel = $(`#vid-${videoId}`)
  channel?.addEventListener('animationend', evt => {
    evt.preventDefault()
    evt.stopPropagation()
    evt.target.remove()
  }, {once: true})
  channel?.setAttribute('class', 'coverFadeOut')
}

function updateChannels(autoStart) {
  console.debug('updateChannels()')
  fetch(_serverURL + '/hololive')
    .then(resp => resp.json())
    .then(newchannels => {
      console.debug('newchannels = ' + newchannels)
      console.debug('channels = ' + channels)
      const newchannelIds = newchannels.map(snippet => snippet.videoId)
      // remove the outdated channels
      channels.forEach(snippet => {
        const videoId = snippet.videoId
        if (!newchannelIds.includes(videoId)) removeChannel(videoId)
      })

      // if no live channel, show the banner
      if (newchannels.length == 0) {
        if ($('#no-live-item')) return
        let item = document.createElement('div')
        item.setAttribute('id', `no-live-item`)
        item.setAttribute('class', 'cover')
        item.innerText = 'No Live Channel now'
        $('#Channels').appendChild(item)
        return
      }
      // remove the no live channel banner if exists
      $('#no-live-item')?.remove()

      // add the new channels
      newchannels.forEach(snippet => {
        const videoId = snippet.videoId
        if (!channelIds.includes(videoId)) addChannel(videoId)
      })
      channels = newchannels
      channelIds = newchannelIds
      if (autoStart) {
        let lastVideoId = window.localStorage.getItem('lastVideoId')
        console.debug('get last video id from local storage - ' + lastVideoId)
        startVideoId = channelIds.includes(lastVideoId) ? lastVideoId : ''
        // play the video if ytplayer was loaded faster than the channel info
        try {
          const state = ytplayer.getPlayerState()
          console.debug('player state = ' + state)
          if (state == -1 /* unstarted */ || state == 5 /* cued */) play(startVideoId)
        } catch (err) {
          console.debug('player is not ready yet')
        }
      }
    })
  if (reloadTimer) clearTimeout(reloadTimer)
  reloadTimer = setTimeout(updateChannels, reloadTimeout)
}

function onPlayerReady() {
  isYTPlayerReady = true
  $('#Title').innerText = ''
  if (startVideoId) play(startVideoId)
}

function onYouTubeIframeAPIReady() {
  // console.debug('yt api ready')
  updateChannels(true)
  ytplayer = new YT.Player('YTPlayer', {
    width: _displayWidth,
    height: _displayHeight,
    playerVars : {
      enablejsapi: 1,
      // controls: 0,
      fs: 0,
      modestbranding: 1,
      color: 'black',
      iv_load_policy: 3,
      cc_load_policy: 0,
      rel: 0,
      disablekb: 1,
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
  if(!isYTPlayerReady) return
  console.debug(evt.code)
  switch(evt.code) {
    case 'KeyR':
      if (evt.metaKey) return
      animateCSS('#Channels', 'flash')
      updateChannels()
      break
    case 'Enter':
      if (isWebKit)
        ytplayer.getIframe()?.webkitRequestFullscreen()
      else
        ytplayer.getIframe()?.requestFullscreen()
      break
    case 'Space':
      const state = ytplayer.getPlayerState()
      if (state == YT.PlayerState.PLAYING) ytplayer.pauseVideo()
      else if (state == YT.PlayerState.PAUSED) ytplayer.playVideo()
      break
    case 'KeyM':
      if (ytplayer.isMuted()) ytplayer.unMute()
      else ytplayer.mute()
      break
  }
}
document.addEventListener('keydown', _keydownHandler)

function parseVideoId(link) {
  let videoId = link
  let id = link.match(/(watch\?|&)v=(\w|-)*/)
  if (id) videoId = id[0].split('=')[1]
  id = link.match(/(?<=^https:\/\/youtu.be\/)(\w|-)*/)
  if(id) videoId = id[0]
  if (/^http(s)?:/.test(videoId)) return undefined
  return videoId
}

document.addEventListener('paste', evt => {
  evt.stopPropagation()
  evt.preventDefault()
  let clipboardData = evt.clipboardData || window.clipboardData;
  let pastedData = clipboardData.getData('Text');
  let videoId = parseVideoId(pastedData)
  if (videoId) play(videoId) 
})
