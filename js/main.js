'use strict'

const MINE = '💣'
const FLAG = '🚩'
const SMILE = '😊'
const LOSE = '🤦🏻'
const SCARED = '😳'
const WIN = '😎'
const LIFE = '👼🏻'
const LAST_LIFE = '☠️'
const SAVED_LIFE = '🫠'
const HINT_BULB = '📖' // '💡'
const SAFE = '🛟'

const WARNING_CSS_CLASS = 'red'

const MAX_LIVES = 3 // set to -1 to avoid feature
const MAX_HINTS = 3
const MAX_SAFE_CLICKS = 3

const LEVELS = {
    1: {
        name: 'Beginner',
        size: 4,
        mines: 2
    },
    2: {
        name: 'Medium',
        size: 8,
        mines: 14
    },
    3: {
        name: 'Expert',
        size: 12,
        mines: 32
    },
}

var gUserLevel
var gLevel

var gGame
var gBoard
var gMines
var gSafeCells



// Game flow functions:

function onInit(userLevel) {
    if (!userLevel && !gUserLevel) gUserLevel = 1 // Default beginner
    else if (userLevel) gUserLevel = userLevel // User clicked a specific level
    // else: there is already a gUserLevel from previous choice, so no need to update it
    gLevel = LEVELS[gUserLevel]

    gGame = {
        isOn: false,
        revealedCount: 0,
        markedCount: 0,
        secsPassed: 0,
        lives: MAX_LIVES,
        hints: MAX_HINTS,
        isHintOn: false,
        safeClicks: MAX_SAFE_CLICKS
    }

    hideModal()
    renderLevelButtons()
    resetStats()
    buildBoard()


}

function onHintClicked() {
    if (!gGame.isOn) return

    gGame.isHintOn = !gGame.isHintOn
    const hintsCounter = document.querySelector('.hints')
    hintsCounter.classList.toggle('yellow')
}

function OnSafeClicked(elSafeClick) {
    if (!gGame.isOn) return

    if (!gGame.isOn || gGame.revealedCount + gLevel.mines === gLevel.size ** 2) {
        alert('No more safe cells to reveal')
        return
    }

    var safePos
    for (var i = 0; i <= gMines.length; i++) {
        const row = getRandomInt(0, gBoard.length)
        const col = getRandomInt(0, gBoard[row].length)
        console.log(row, col)

        if (!gBoard[row][col].isMine && !gBoard[row][col].isRevealed) {
            gGame.safeClicks--
            renderSafeClick(gGame.safeClicks)

            const elCell = getElCell(row, col)
            elCell.classList.add('yellow')
            setTimeout(() => { elCell.classList.remove('yellow') }, 1500)
            return
        }
        else i--
    }
}

function onCellClicked(elCell, i, j) {
    if (!gGame.isOn) {
        if (gGame.revealedCount === 0) startGame()
        else return // Game over status. Clicking the board is blocked.
    }

    if (gGame.isHintOn) {
        gGame.hints--
        gGame.isHintOn = false

        renderHintsCounter(gGame.hints)
        expandReveal(gBoard, i, j, false, true)
        setTimeout(() => { restoreNegs(gBoard, i, j) }, 1500)
        return
    }

    if (gGame.revealedCount === 0) { // Set mines after the user clickes their first cell
        setMines(i, j)
        setMinesNegsCount(gBoard)
        // revealBoard(gBoard, true) // JUST FOR DEBUG
    }


    const cell = gBoard[i][j]
    if (cell.isMine) { // Clicked a mine
        if (gGame.lives <= 1) {// -1 means lives feature off 
            gameOver(false)
            return
        }

        gGame.lives--
        renderLivesCounter(gGame.lives)
        renderCell(i, j, MINE, WARNING_CSS_CLASS)
        setTimeout(() => { renderCell(i, j, '', WARNING_CSS_CLASS) }, 500)

    }

    expandReveal(gBoard, i, j)
    checkVictory()

}

function onCellMarked(elCell, i, j) {
    if (!gGame.isOn) return

    const cell = gBoard[i][j]
    // Don't flag revealed cells
    if (cell.isRevealed) return

    // If flagged, then right-click will undo the flagging
    if (cell.isMarked) {
        updateMark(cell, elCell, false)
        return
    }

    if (gGame.markedCount === gLevel.mines) return

    updateMark(cell, elCell, true)

    checkVictory()
}

function startGame() {
    gGame.isOn = true
    StartTimer()
}

function checkVictory() {
    if (gGame.markedCount + gGame.revealedCount === gLevel.size ** 2) gameOver(true)
}

function gameOver(isVictory) {
    gGame.isOn = false
    stopTimer()
    revealMines()
    showModal(isVictory)

    if (isVictory && gGame.lives === 1) renderLivesCounter(0)
    if (isVictory) setSmily(WIN)
    else setSmily(LOSE)

}


// Board functions

function renderLevelButtons() {
    const elDiv = document.querySelector('.levels')

    var strHTML = ''
    for (var level in LEVELS) {
        strHTML += `<span class="stats button" onclick="onInit(${level})">${LEVELS[level].name}</span>\n`
    }

    elDiv.innerHTML = strHTML
}

function buildBoard() {
    createCells()
    renderBoard()
}

function createCells() {
    gBoard = []
    for (var i = 0; i < gLevel.size; i++) {
        gBoard[i] = []
        for (var j = 0; j < gLevel.size; j++) {
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

function renderBoard() {
    const elTable = document.querySelector('.board table')

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
}

function setMines(i, j) {
    gMines = []
    for (var m = 0; m < gLevel.mines; m++) {
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

    renderMarkCounter()
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


function expandReveal(board, i, j, isRecursive = true, isTemporary = false) {
    for (var row = i - 1; row <= i + 1; row++) {
        if (row < 0 || row === board.length) continue

        for (var col = j - 1; col <= j + 1; col++) {
            if (col < 0 || col === board[row].length) continue

            const cell = board[row][col]
            // Don't reveal mines unless temporary
            if (cell.isMine && !isTemporary) continue
            // No need to work on already revealed cells
            if (cell.isRevealed) continue

            // remove flag
            const currElCell = getElCell(i, j)
            if (cell.isMarked && !isTemporary) updateMark(cell, currElCell, false)

            revealCell(board, row, col, isTemporary)

            if (cell.minesAroundCount === 0 && isRecursive) expandReveal(board, row, col)
        }
    }
}

function restoreNegs(board, i, j) {
    for (var row = i - 1; row <= i + 1; row++) {
        if (row < 0 || row === board.length) continue

        for (var col = j - 1; col <= j + 1; col++) {
            if (col < 0 || col === board[row].length) continue

            const cell = board[row][col]
            if (cell.isRevealed) revealCell(board, row, col, true)
            else unRevealCell(board, row, col)
        }
    }
}

function revealCell(board, i, j, isTemporary = false) {
    const cell = board[i][j]
    const currElCell = getElCell(i, j)

    if (!isTemporary) {
        cell.isRevealed = true
        gGame.revealedCount++
    }

    currElCell.classList.add('revealed')
    currElCell.innerText = cell.isMine ? MINE : cell.minesAroundCount > 0 ? cell.minesAroundCount : ''
}

function unRevealCell(board, i, j) {
    const cell = board[i][j]
    const currElCell = getElCell(i, j)

    currElCell.classList.remove('revealed')
    currElCell.innerText = cell.isMarked ? FLAG : ''
}

function revealMines(board) {
    for (var i = 0; i < gMines.length; i++) {
        const pos = gMines[i]
        const elCell = document.querySelector(`.cell-${pos.row}-${pos.col}`)
        elCell.innerText = MINE
    }
}

// Stats calculations and update
function updateMark(cell, elCell, isMark) {
    cell.isMarked = isMark
    gGame.markedCount += isMark ? 1 : -1
    elCell.innerText = isMark ? FLAG : ''
    renderMarkCounter()
}



// function isMineCell(i, j) {
//     for (var m=0; m<gMines.length; m++) {
//         const pos = gMines[m]
//         if (pos.row === i && )
//     }
// }