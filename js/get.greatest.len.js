"use strict";
function getGreatestLen(arrays){
    let response = 0;
    for(let array of arrays) {
        let diff = Math.floor(array[array.length - 1] - array[0]);
        if(diff > response) {
            response = diff;
        }
    }
    return response;
}

define(function () {
    return getGreatestLen;
});