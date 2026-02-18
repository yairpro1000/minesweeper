'use strict'

var gTimerInterval
var gFinishTime = 0


function resetStats() {
    stopTimer()
    document.querySelector('.timer').innerText = '000'
    document.querySelector('.mark-count').innerText = '000'
    renderLivesCounter(gGame.lives)
    setSmily(SMILE)
    document.querySelector('.box').classList.remove(WARNING_CSS_CLASS)
}

function renderMarkCounter() {
    // QUESTION: is it ok to use globals from another file?
    const count = gLevel.mines - gGame.markedCount
    const countStr = `${count}`.padStart(3, 0)
    document.querySelector('.mark-count').innerText = countStr
}

function renderLivesCounter(numLives) {
    const lifeCounter = document.querySelector('.lives')
    if (numLives === -1) {
        lifeCounter.classList.add('hidden')
        return
    }

    lifeCounter.classList.remove('hidden', WARNING_CSS_CLASS)
    if (numLives === 1) {
        lifeCounter.innerText = LAST_LIFE
        lifeCounter.classList.add(WARNING_CSS_CLASS)
        setSmily(SCARED)
    }
    else if (numLives === 0) lifeCounter.innerText = SAVED_LIFE
    else lifeCounter.innerText = LIFE.repeat(numLives)


}

function setSmily(emoji) {
    document.querySelector('.status-emoji').innerText = emoji
}

function StartTimer() {
    const startTs = Date.now()

    gTimerInterval = setInterval(() => {
        const currTs = Date.now()
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
    const elBox = document.querySelector('.box')

    if (isVictory) {
        elModalSpans[0].innerText = 'You won!'
        elModal.classList.remove(WARNING_CSS_CLASS)
    }
    else {
        elModalSpans[0].innerText = 'Game over ' + LOSE
        elModal.classList.add(WARNING_CSS_CLASS)
        elBox.classList.add(WARNING_CSS_CLASS)
    }
    elModalSpans[1].innerText = gFinishTime
    elModal.classList.remove('hidden')
}

function hideModal() {
    const elModal = document.querySelector('.modal')
    elModal.classList.add('hidden')
}

// for debug
function revealBoard(board, isMinesOnly = false) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
            const cell = board[i][j]
            var txt
            if (cell.isMine) txt = MINE
            else if (isMinesOnly) continue
            else txt = cell.minesAroundCount
            renderCell(i, j, txt)
        }
    }
}

function renderCell(i, j, txt, _class = null) {
    const elCell = getElCell(i, j)
    elCell.innerText = txt
    if (_class) elCell.classList.toggle(_class)
}

function getElCell(i, j) {
    return document.querySelector(`.cell-${i}-${j}`)
}