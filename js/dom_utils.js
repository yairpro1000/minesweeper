'use strict'

var gTimerInterval
var gFinishTime = 0


function resetStats() {
    stopTimer()
    document.querySelector('.timer').innerText = '000'
    document.querySelector('.mark-count').innerText = '000'
    renderLivesCounter(gGame.lives)
    renderHintsCounter(gGame.hints)
    renderSafeClick(gGame.safeClicks)
    setSmily(SMILE)
    document.querySelector('.exterminator').classList.remove('hidden')
    updateMega(['hidden', 'yellow'], false)
    document.querySelector('.box').classList.remove(WARNING_CSS_CLASS)
}

function renderMarkCounter() {
    // QUESTION: is it ok to use globals from another file?
    const count = gLevel.mines - gGame.markedCount
    const countStr = `${count}`.padStart(3, 0)
    document.querySelector('.mark-count').innerText = countStr
}

function renderLivesCounter(numLives) {
    const elLifeCounter = document.querySelector('.lives')
    if (numLives === -1) {
        elLifeCounter.classList.add('hidden')
        return
    }

    elLifeCounter.classList.remove('hidden', WARNING_CSS_CLASS)
    if (numLives === 1) {
        elLifeCounter.innerText = LAST_LIFE
        elLifeCounter.classList.add(WARNING_CSS_CLASS)
        setSmily(SCARED)
    }
    else if (numLives === 0) elLifeCounter.innerText = SAVED_LIFE
    else elLifeCounter.innerText = LIFE.repeat(numLives)
}

function renderHintsCounter(numHints) {
    const elHintsCounter = document.querySelector('.hints')
    if (numHints === 0) {
        elHintsCounter.classList.add('hidden')
        return
    }
    elHintsCounter.innerText = HINT_BULB.repeat(numHints)
    elHintsCounter.classList.remove('yellow', 'hidden')
}

function renderSafeClick(numSafeClicks) {
    const elSafeClick = document.querySelector('.safe')
    if (numSafeClicks === 0) {
        elSafeClick.classList.add('hidden')
        return
    }
    elSafeClick.innerText = SAFE.repeat(numSafeClicks)
    elSafeClick.classList.remove('yellow', 'hidden')
}

function updateMega(_classes, isAdd=true) {
    const elMega = document.querySelector('.mega')
    if (isAdd) elMega.classList.add(..._classes)
    else elMega.classList.remove(..._classes)
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
    // elModal.style.opacity = 1
    elModal.classList.remove('modal-fade')

}

function hideModal() {
    const elModal = document.querySelector('.modal')
    // elModal.style.opacity = 0
    elModal.classList.add('modal-fade')
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

function revealNegs(board, isMinesOnly = false) {
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
    const cell = gBoard[i][j]
    const elCell = getElCell(i, j)

    elCell.innerText = txt

    if (cell.isRevealed) elCell.classList.add('revealed')
    else elCell.classList.remove('revealed')

    elCell.classList.remove('yellow')
    
    if (_class) elCell.classList.toggle(_class)
}

function getElCell(i, j) {
    return document.querySelector(`.cell-${i}-${j}`)
}