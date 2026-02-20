'use strict'

const MINE = '💣'
const FLAG = '🚩'
const SMILE = '😊'
const LOSE = '🤦🏻'
const SCARED = '😳'
const WIN = '😎'
const LIFE = '👼🏻'
const SAVED_LIFE = '🫠'
const HINT_BULB = '📖'
const SAFE = '💡'

const WARNING_CSS_CLASS = 'red'

const MAX_LIVES = 3 // set to -1 to avoid feature
const MAX_HINTS = 3
const MAX_SAFE_CLICKS = 3
const MAX_UNDO = 6

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
var gMegaPoss
var gStates = []

// Game flow functions:

function onInit(userLevel) {
    if (!userLevel && !gUserLevel) gUserLevel = 1 // Default beginner
    else if (userLevel) gUserLevel = userLevel // User clicked a specific level
    // else: there is already a gUserLevel from previous choice, so no need to update it

    gLevel = Object.assign({}, LEVELS[gUserLevel])

    gMines = []
    gStates = []

    gGame = {
        isOn: false,
        revealedCount: 0,
        markedCount: 0,
        secsPassed: 0,
        lives: MAX_LIVES,
        hints: MAX_HINTS,
        isHintOn: false,
        safeClicks: MAX_SAFE_CLICKS,
        isMegaOn: false,
        isManualOn: false,
    }

    hideModal()
    renderLevelButtons()
    resetStats()
    preventContextMenu()
    buildBoard()


}

function onHintClicked(elHintsCounter) {
    if (!gGame.isOn) return
    if (elHintsCounter.classList.contains('disabled')) return

    gGame.isHintOn = !gGame.isHintOn
    
    if (gGame.isHintOn) {
        elHintsCounter.classList.add('yellow')
        elHintsCounter.classList.remove('light', 'dark')
    }
    else {
        elHintsCounter.classList.remove('yellow')
        elHintsCounter.classList.add('light')
    }
}

function OnSafeClicked(elSafe) {
    if (!gGame.isOn) return
    if (elSafe.classList.contains('disabled')) return

    if (!gGame.isOn || gGame.revealedCount + gLevel.mines === gLevel.size ** 2) {
        alert('No more safe cells to reveal')
        return
    }

    var safePos
    for (var i = 0; i <= gMines.length; i++) {
        const row = getRandomInt(0, gBoard.length)
        const col = getRandomInt(0, gBoard[row].length)

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

function onExterminatorClicked(elExterminator) {
    if (!gGame.isOn) return
    if (elExterminator.classList.contains('disabled')) return

    elExterminator.classList.add('hidden')
    const numIter = Math.min(3, gLevel.mines)
    for (var i = 0; i < numIter; i++) {
        const idx = getRandomInt(0, gMines.length)
        const minePos = gMines[idx]
        gBoard[minePos.row][minePos.col].isMine = false
        gLevel.mines--
        renderMarkCounter()
        gMines.splice(idx, 1)

    }
    setMinesNegsCount(gBoard)
    updateBoard(gBoard)
    gStates.push(copyState())
}

function OnMegaClicked(elMega) {
    if (!gGame.isOn) return
    if (elMega.classList.contains('disabled')) return

    gMegaPoss = []
    gGame.isMegaOn = true
    elMega.classList.add('yellow')
}

function OnManualClicked(elManual) {
    if (gMines.length > 0) return // There are already some mines
    if (elManual.classList.contains('disabled')) return

    gMines = []
    gGame.isManualOn = true
    renderManualMines()
    elManual.classList.add('yellow')
}

function onUndoClicked(elUndo) {
    if (!gGame.isOn || gStates.length <= 1) return
    if (elUndo.classList.contains('disabled')) return

    gStates.pop()
    const preState = structuredClone(gStates[gStates.length - 1])
    gGame = preState.game
    gLevel = preState.level
    gBoard = preState.board
    gMines = preState.mines
    updateBoard(gBoard)
    renderMarkCounter()
}

function onCellClicked(elCell, i, j) {
    if (gGame.isManualOn) {
        if (gBoard[i][j].isMine) return // cell already has a mine
        gBoard[i][j].isMine = true
        gMines.push({ row: i, col: j })
        elCell.innerText = MINE
        renderManualMines()
        if (gMines.length === gLevel.mines) {
            gGame.isManualOn = false
            updateClasses('.manual', ['hidden'])
            updateBoard(gBoard)
        }
        return
    }

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

    if (gGame.isMegaOn) {
        gMegaPoss.push({ i, j })
        elCell.classList.add('yellow')

        if (gMegaPoss.length === 2) {
            gGame.isMegaOn = false
            revealArea(gBoard, ...gMegaPoss)
            updateClasses('.mega', ['hidden'])
        }
        return
    }

    if (gGame.revealedCount === 0) { // Set mines after the user clickes their first cell
        setMines(i, j)
        setMinesNegsCount(gBoard)
        renderMarkCounter()
        // revealBoard(gBoard, false) // JUST FOR DEBUG
    }

    const cell = gBoard[i][j]
    if (cell.isMine) { // Clicked a mine
        if (gGame.lives <= 1) {// -1 means lives feature off 
            gameOver(false)
            return
        }

        gGame.lives--
        renderLivesCounter(gGame.lives)
        renderCell(cell, i, j, MINE, WARNING_CSS_CLASS)
        setTimeout(() => { renderCell(cell, i, j, '', WARNING_CSS_CLASS) }, 500)

    }

    expandReveal(gBoard, i, j)

    if (gStates.length === MAX_UNDO) gStates = gStates.slice(1)

    gStates.push(copyState())

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

    gStates.push(copyState())

    checkVictory()
}

function startGame() {
    gGame.isOn = true
    StartTimer()
    updateClasses('.manual', ['hidden'])
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
    if (!isVictory) {
        setSmily(LOSE)
        return
    }
    setSmily(WIN)
    if (!localStorage.getItem('bestScore')) localStorage.setItem('bestScore', gFinishTime)
    else if (+gFinishTime < +localStorage.getItem('bestScore')) {
        localStorage.setItem('bestScore', gFinishTime)
    }
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

function copyBoard(orBoard) {
    var board = []
    for (var i = 0; i < orBoard.length; i++) {
        board[i] = []
        for (var j = 0; j < orBoard[i].length; j++) {
            board[i][j] = Object.assign({}, gBoard[i][j])
        }
    }
    return board
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
}

function updateBoard(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            const cell = board[i][j]
            var txt = ''
            if (cell.isRevealed && cell.minesAroundCount > 0) txt = cell.minesAroundCount
            else if (cell.isMarked) txt = FLAG
            renderCell(cell, i, j, txt)
        }
    }
}

function setMines(i, j) {
    if (gMines.length > 0) return // already manually set

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

function revealArea(board, posStart, posEnd) {
    for (var i = posStart.i; i <= posEnd.i; i++) {
        for (var j = posStart.j; j <= posEnd.j; j++) {
            revealCell(board, i, j, true)
        }
    }
    setTimeout(() => { updateBoard(gBoard) }, 2000)
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

function copyState() {
    return {
        game: structuredClone(gGame),
        level: structuredClone(gLevel),
        board: structuredClone(gBoard),
        mines: structuredClone(gMines),
    }
}
