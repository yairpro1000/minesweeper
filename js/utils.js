'use strict'

function getRandomInt(min, max) {
    var minCeiled = Math.ceil(min)
    var maxFloored = Math.floor(max)
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled)
}