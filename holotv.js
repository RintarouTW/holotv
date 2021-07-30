// Globals
const _serverURL = 'https://fathomless-brushlands-18222.herokuapp.com'
const _webOrigin = 'https://rintaroutw.github.io'
const _displayWidth = 720, _displayHeight = 405
const reloadTimeout = 600000

var reloadTimer
var startVideoId
var player            // player : YTPlayer singleton
var channels = []     // channels : array of videoId(s)

window.$ = selector => document.querySelector(selector)

function getChannelInfo(videoId) {
  fetch(`${_serverURL}/yt/${videoId}`)
    .then(resp => resp.json())
    .then(info => {
      // console.log(info.snippet)
      $('#Title').innerText = info?.snippet?.title
    })
}

function play(videoId) {
  console.log('play - ' + videoId)
  player.loadVideoById(videoId)
  getChannelInfo(videoId)
  // save videoId to the local storage
  window.localStorage.setItem('lastVideoId',videoId)
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
  let list = $('#Channels')
  let item = channelItem(videoId)
  list.appendChild(item)
}

function removeChannel(videoId) {
  console.log(`remove channel - ${videoId}`)
  let channel = $(`#${videoId}`)
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
        let lastVideoId = window.localStorage.getItem('lastVideoId')
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
  // console.log('yt api ready')
  updateChannels(true)
  player = new YT.Player('YTPlayer', {
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
  // console.log(evt.code)
  switch(evt.code) {
    case 'KeyR':
      animateCSS('#Channels', 'flash')
      updateChannels()
      break
  }
}
document.addEventListener('keydown', _keydownHandler)
