

function formatTime(timeMs) {
    var secs = Math.floor(timeMs / 1000) + ''
    var milliSecs = timeMs % 1000 + ''

    return `${secs.padStart(2, 0)}:${milliSecs.padStart(3, 0)}`
}

function getRandomInt(min, max) {
    var minCeiled = Math.ceil(min)
    var maxFloored = Math.floor(max)
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled)
}