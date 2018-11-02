"use strict";
define(function (require) {
    const Vector = require("./vector");

    const vectorA = new Vector([0, 1], [0, 10], [0, 100]);

    vectorA.sequence(console.log, false, 9, 12);

});