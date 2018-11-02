"use strict";
define(function (require) {

    const Vector = require("./vector");

    const vectorA = new Vector([0, 10], [0, 15], [0, 30]);

    vectorA.sequence(console.log);

});