'use strict'

var gTimerInterval
var gFinishTime = 0

function resetStats() {
    stopTimer()
    document.querySelector('.timer').innerText = '000'
    document.querySelector('.mark-count').innerText = '000'
    setSmily()
}

function updateMarkCounter() {
    // QUESTION: is it ok to use globals from another file?
    const count = gLevel.MINES - gGame.markedCount
    const countStr = `${count}`.padStart(3, 0)
    document.querySelector('.mark-count').innerText = countStr
}

function setSmily(isVictory = true) {
    const emoji = isVictory ? SMILE : SAD
    document.querySelector('.status-emoji').innerText = emoji
}

function StartTimer() {
    const startTs = Date.now()
    
    gTimerInterval = setInterval(() => {
        const currTs = Date.now()
        // gFinishTime = formatTime(currTs - startTs)
        gFinishTime = Math.floor(currTs / 1000) - Math.floor(startTs / 1000)
        document.querySelector('.timer').innerText = `${gFinishTime}`.padStart(3, 0)
    }, 1000)
}

function stopTimer() {
    clearInterval(gTimerInterval)
    gTimerInterval = null
}

function showModal(isVictory = false) {
    const elModal = document.querySelector('.modal')
    const elModalSpans = elModal.querySelectorAll('span')

    elModalSpans[0].innerText = isVictory ? 'You won!' : 'Game over :('
    elModalSpans[1].innerText = gFinishTime
    elModal.classList.remove('hidden')
}

function hideModal() {
    const elModal = document.querySelector('.modal')
    elModal.classList.add('hidden')
}