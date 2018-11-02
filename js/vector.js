"use strict";
define(function (require) {

    const getGreatestLen = require("get.greatest.len"),
          getKeysByLen = require("get.keys.by.len"),
          arrangeArray = require("arrange.array"),
          Store = require("store"),
          Typo = ((Instance = require("typo")) => new Instance())();


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
            this.values = new Store({ size: 0, volume: 0, dimensions: {} });
            return Typo.isDef(dimensions) ? this.initialize(dimensions) : this;
        }

        Vector.prototype.initialize = function (dimensions) {
            const {states} = this;
            if(states.isnt("initialized")){
                this.applyDimensions(dimensions);
                states.initialized = true;
            }
            return this;
        };

        Vector.prototype.applyDimensions = function (dimensions) {
            const {values} = this;
            values.removeLock("size")
                  .removeLock("dimensions")
                  .removeLock("volume");
            values.volume = dimensions.length;
            let size = getGreatestLen(dimensions),
                keys = getKeysByLen(values.volume);
            if(size < 2) {
                size = 2;
            }

            for(let i = 0, key; i < values.volume; i++){
                key = keys[i];
                values.dimensions[key] = arrangeArray(dimensions[i], size);
            }
            values.size = size;
            values.addLock("size")
                  .addLock("dimensions")
                  .addLock("volume");
            return this;
        };

        Vector.prototype.sequence = function (fn = null, reverse = false, fromFrame = 0, toFrame = this.values.size){
            if(!Typo.isFn(fn)) return;
            let frame;
            let iterator = reverse ? -1 : 1;

            if(reverse){
                fromFrame += toFrame;
                toFrame = fromFrame - toFrame;
                fromFrame -= toFrame;
            }

            for(let i = fromFrame; reverse ? (i > toFrame) : (i < toFrame); i += iterator){
                frame = [];
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




