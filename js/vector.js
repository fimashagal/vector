"use strict";
define(function (require) {

    const getGreatestLen = require("get.greatest.len");
    const getKeysByLen = require("get.keys.by.len");
    const arrangeArray = require("arrange.array");
    const Store = require("store");
    const Typo = ((Instance = require("typo")) => new Instance())();


    function Vector(...dims){

        dims = dims.filter(item => {
            if(Array.isArray(item) && item.length >= 2 && item.every(item => Typo.isNumber(item))){
                return item;
            }
        });

        if(dims.length < 1) {
            throw new Error("at least one dimension is required to create a vector");
        }

        function Vector (dimensions) {
            this.states = new Store({ initialized: false });
            this.values = new Store({ size: 0, dimensions: {} });
            return Typo.isDef(dimensions) ? this.initialize(dimensions) : this;
        }

        Vector.prototype.initialize = function (dimensions) {
            if(this.states.isnt("initialized")){
                this.applyDimensions(dimensions);
                this.states.initialized = true;
            }
            return this;
        };

        Vector.prototype.applyDimensions = function (dimensions) {
            let size = getGreatestLen(dimensions),
                keys = getKeysByLen(dimensions.length);
            if(size < 2) {
                size = 2;
            }
            this.values.removeLock("size")
                        .removeLock("dimensions");
            for(let i = 0, key; i < dimensions.length; i++){
                key = keys[i];
                this.values.dimensions[key] = arrangeArray(dimensions[i], size);
            }
            this.values.size = size;
            this.values.addLock("size")
                        .addLock("dimensions");
            return this;
        };

        Vector.prototype.sequence = function (fn = null, reverse = false, fromFrame = 0, toFrame = this.values.size){
            if(!Typo.isFn(fn)) return;
            const isReversed = reverse === true;
            let iterator = isReversed ? -1 : 1;

            if(isReversed){
                fromFrame += toFrame;
                toFrame = fromFrame - toFrame;
                fromFrame -= toFrame;
            }

            for(let i = fromFrame, frame = []; isReversed ? (i > toFrame) : (i < toFrame); i += iterator){
                for(let array of Object.values(this.values.dimensions)){
                    frame.push(array[i]);
                }
                frame.every(item => Typo.isDef(item)) && fn(frame);
            }
        };

        return new Vector(dims);

    }

    return Vector;

});




