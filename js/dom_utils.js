'use strict'

var gTimerInterval
var gFinishTime = 0
var gIsLightMode = false


function resetStats() {
    renderTooltips()
    stopTimer()
    renderBestScore()
    document.querySelector('.timer').innerText = '000'
    document.querySelector('.mark-count').innerText = gLevel.mines + FLAG
    renderLivesCounter(gGame.lives)
    renderHintsCounter(gGame.hints)
    renderSafeClick(gGame.safeClicks)
    setSmily(SMILE)
    document.querySelector('.exterminator').classList.remove('hidden')
    updateClasses('.mega', ['hidden', 'yellow'], false)
    updateClasses('.manual', ['hidden', 'yellow'], false)
    document.querySelector('.manual').innerText = '📍💣'
    document.querySelector('.box').classList.remove(WARNING_CSS_CLASS)
}

function renderBestScore() {
    const bestScore = +localStorage.getItem('bestScore')
    if (!bestScore) {
        updateClasses('.best-score', ['hidden'])
        return
    }
    document.querySelector('.best-score span').innerText = `${bestScore}`.padStart(3, 0)
    updateClasses('.best-score', ['hidden'], false)
}

function renderMarkCounter() {
    // QUESTION: is it ok to use globals from another file?
    const count = gLevel.mines - gGame.markedCount
    const countStr = count + FLAG
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
    if (gIsLightMode) elHintsCounter.classList.add('light')

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

function renderManualMines() {
    const elManu = document.querySelector('.manual')
    elManu.innerText = (gLevel.mines - gMines.length) + MINE
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

function lightMode(elBtn) {
    gIsLightMode = !gIsLightMode
    elBtn.classList.toggle('dark')
    elBtn.innerText = gIsLightMode? 'Dark Mode' : 'Light Mode'
    
    const classes = ['box', 'board', 'stats', 'button', 'non-button', 'status', 'explanation']
    for (var i = 0; i < classes.length; i++) {
        var selector = '.' + classes[i]
        const els = document.querySelectorAll(selector)
        for (var j = 0; j < els.length; j++) {
            if (gIsLightMode) els[j].classList.add('light')
            else els[j].classList.remove('light')
        }
    }
    renderBoard()
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
            renderCell(cell, i, j, txt)
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
            renderCell(cell, i, j, txt)
        }
    }
}

function renderCell(cell, i, j, txt, _class = null) {
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

function updateClasses(selector, _classes, isAdd = true) {
    const el = document.querySelector(selector)
    if (isAdd) el.classList.add(..._classes)
    else el.classList.remove(..._classes)
}

function renderTooltips() {
    const TOOLTIPS = {
        'status-emoji': 'Click any cell in the grid to start playing. Click me to restart.',
        'mark-count': 'Flags remaining. Right-click a cell to flag it if you believe a mine is hiding there,\nor to unflag it if you change your mind.',
        'lives': 'Lives. Chances to hit a mine before game over',
        'best-score': 'Best time ever',
        'mega': 'One time per game, click a top-left cell, then a bottom-right, to sneak a peak into the area',
        'safe': 'Click me to highlight a safe cell...',
        'hints': 'Click me, then click a cell to sneak a peak on its neighbors',
        'exterminator': 'Once a game, get rid of 3 mines',
        'manual': 'Place your own mines before you start playing',
        'undo': 'Undo up to 5 moves'
    }
    for (var cls in TOOLTIPS) {
        const el = document.querySelector('.' + cls)
        el.setAttribute('data-title', TOOLTIPS[cls])
    }
}

function preventContextMenu() {
    // document.querySelector('table').addEventListener("contextmenu", (e) => { e.preventDefault() })
    const elDivs = document.querySelectorAll('div')
    for (var i = 0; i<elDivs.length; i++) {
        elDivs[i].addEventListener("contextmenu", (e) => { e.preventDefault() })
    }

    const statButtons = document.querySelectorAll('.stats.button')
    for (var i = 0; i<statButtons.length; i++) {
        console.log(statButtons[i])
        statButtons[i].setAttribute('oncontextmenu', 'disable(this)')
    }

}

function disable(el) {
    el.classList.toggle('disabled')
}