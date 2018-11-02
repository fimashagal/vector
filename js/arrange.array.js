"use strict";
function arrangeArray(array, len) {
    let response = [],
        [min, max] = array;

    for (let i = 0, local; i < len; i++) {
        local = min + i * (max - min) / (len - 1);
        response.push(+local.toFixed(2));
    }

    response[0] = min;
    response[response.length - 1] = max;

    return response;
}

define(function () {
    return arrangeArray;
});