'use strict'

const MINE = '💣'
const FLAG = '🚩'
const SMILE = '😊'
const SAD = '😒'


const gLevel = {
    SIZE: 4,
    MINES: 4
}

var gGame
var gBoard
var gMines

var gTimerInterval
var gFinishTime = 0


function onInit() {
    hideModal()
    resetStats()
    buildBoard()

    gGame = {
        isOn: false,
        revealedCount: 0,
        markedCount: 0,
        secsPassed: 0
    }
}

function buildBoard() {
    createCells()
    renderBoard()
}

function renderBoard() {

    const elTable = document.querySelector('table')

    var strHTML = ''
    for (var i = 0; i < gBoard.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < gBoard[i].length; j++) {
            strHTML += `<td>
            <button class="cell-${i}-${j} button" 
            onclick="onCellClicked(this, ${i}, ${j})" oncontextmenu="onCellMarked(this, ${i}, ${j})">
            </button>
            </td>`
        }
        strHTML += '</tr>'
    }
    elTable.innerHTML = strHTML
    elTable.addEventListener("contextmenu", (e) => { e.preventDefault() })

    // document.querySelector('h3 span').innerText = 1
}

function createCells() {
    gBoard = []
    for (var i = 0; i < gLevel.SIZE; i++) {
        gBoard[i] = []
        for (var j = 0; j < gLevel.SIZE; j++) {
            gBoard[i].push(createCell())
        }
    }
}

function createCell() {
    return {
        minesAroundCount: 0,
        isRevealed: false,
        isMine: false,
        isMarked: false
    }
}

function onCellClicked(elCell, i, j) {
    if (!gGame.isOn) {
        if (gGame.revealedCount === 0) startGame()
        else return
    }

    if (gGame.revealedCount === 0) {
        setMines(i, j)
        setMinesNegsCount(gBoard)
    }

    if (gBoard[i][j].isMine) {
        gameOver(false)
        return
    }

    elCell.classList.add('revealed')
    gGame.revealedCount++
    gBoard[i][j].isRevealed = true
    expandReveal_recur(gBoard, i, j)

    checkVictory()
}

function startGame() {
    gGame.isOn = true

    StartTimer()
}

function setMines(i, j) {
    gMines = []
    for (var m = 0; m < gLevel.MINES; m++) {
        const row = getRandomInt(0, gBoard.length)
        const col = getRandomInt(0, gBoard[row].length)

        // Avoid setting a mine in clicked cell or where there is already a mine
        if (gBoard[row][col].isMine || (row === i && col === j)) {
            m--
            continue
        }
        gBoard[row][col].isMine = true
        gMines.push({ row, col })
    }

    updateMarkCounter(gLevel.MINES)
}

function updateMarkCounter(count) {
    const countStr = `${count}`.padStart(3, 0)
    document.querySelector('.mark-count').innerText = countStr
}

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            const cell = board[i][j]
            if (cell.isMine) continue
            cell.minesAroundCount = countNegs(board, i, j)
        }
    }
}

function countNegs(board, i, j) {
    var count = 0

    for (var row = i - 1; row <= i + 1; row++) {
        if (row < 0 || row === board.length) continue

        for (var col = j - 1; col <= j + 1; col++) {
            if (col < 0 || col === board[row].length) continue
            if (row === i && col === j) continue
            if (board[row][col].isMine) count++
        }
    }

    return count
}

function expandReveal(board, i, j) {
    for (var row = i - 1; row <= i + 1; row++) {
        if (row < 0 || row === board.length) continue

        for (var col = j - 1; col <= j + 1; col++) {
            if (col < 0 || col === board[row].length) continue
            if (row === i && col === j) continue

            const cell = board[row][col]
            // Don't reveal mines
            if (cell.isMine) continue

            cell.isMarked = true
            const currElCell = document.querySelector(`.cell-${row}-${col}`)
            currElCell.classList.add('mark')
            currElCell.innerText = cell.minesAroundCount === 0 ? '' : cell.minesAroundCount

        }
    }
}

function expandReveal_recur(board, i, j) {
    for (var row = i - 1; row <= i + 1; row++) {
        if (row < 0 || row === board.length) continue

        for (var col = j - 1; col <= j + 1; col++) {
            if (col < 0 || col === board[row].length) continue
            if (row === i && col === j) continue

            const cell = board[row][col]
            // No need to work on already revealed cells
            if (cell.isRevealed) continue
            // Don't reveal mines
            if (cell.isMine) continue

            cell.isRevealed = true
            gGame.revealedCount++
            const currElCell = document.querySelector(`.cell-${row}-${col}`)
            currElCell.classList.add('revealed')

            if (cell.minesAroundCount > 0) currElCell.innerText = cell.minesAroundCount
            else {
                currElCell.innerText = ''
                expandReveal_recur(board, row, col)
            }
        }
    }
}


function onCellMarked(elCell, i, j) {
    if (!gGame.isOn) return
    
    const cell = gBoard[i][j]
    // Don't flag revealed cells
    if (cell.isRevealed) return

    // If flagged, then right-click will undo the flagging
    if (cell.isMarked) {
        cell.isMarked = false
        gGame.markedCount--
        elCell.innerText = ''
        updateMarkCounter(gLevel.MINES - gGame.markedCount)
        return
    }

    if (gGame.markedCount === gLevel.MINES) return

    cell.isMarked = true
    gGame.markedCount++
    elCell.innerText = FLAG
    updateMarkCounter(gLevel.MINES - gGame.markedCount)
    checkVictory()
}

function checkVictory() {
    console.log(gGame)
    if (gGame.markedCount + gGame.revealedCount === gLevel.SIZE ** 2) gameOver(true)

}

function gameOver(isVictory) {
    gGame.isOn = false
    stopTimer()
    revealMines()
    showModal(isVictory)
    setSmily(isVictory)
}

function revealMines(board) {
    for (var i = 0; i < gMines.length; i++) {
        const pos = gMines[i]
        const elCell = document.querySelector(`.cell-${pos.row}-${pos.col}`)
        elCell.innerText = MINE
    }
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

function setSmily(isVictory = true) {
    const emoji = isVictory ? SMILE : SAD
    document.querySelector('.status-emoji').innerText = emoji
}

function resetStats() {
    stopTimer()
    document.querySelector('.timer').innerText = '000'
    document.querySelector('.mark-count').innerText = '000'
    setSmily()
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
    console.log(elModal)
    elModal.classList.add('hidden')
}
