"use strict";
const abc = "abcdefghijklmnopqrstuvwxyz";

function getKeysByLen(len){
    return abc.substr(abc.length - len).split("");
}

define(function () {
    return getKeysByLen;
});