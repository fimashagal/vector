"use strict";

function Store(data = {}) {
    this._initialized = { status: false };
    this._ns = ["_reflects", "_rangedNumbers", "_workers", "_lockeds", "_", "_initialized"];
    this._preinitialize();
    return this.initialize(this._filterData(data));
}

Store.prototype.initialize = function (data) {
    if(this._initialized.status === true || !Object.values(data).length) return this;
    for(let [key, value] of Object.entries(data)){
        let valueType = this._typeOf(value);
        if(valueType === "string" && /^json\s>>\s|^worker\s>>\s/.test(value)){
            if(/^json\s>>\s/.test(value)){
                let url = value.replace(/json\s>>\s/, "");
                valueType = "object";
                value = {};
                this._loadJSON(key, url);
            }
            if(/^worker\s>>\s/.test(value)){
                let path = value.replace(/worker\s>>\s/, "");
                valueType = "object";
                value = {
                    result: null
                };
                this._createWorker({path, key});
            }
        }
        if(/object|array/.test(valueType)){
            value = this._proxify({ key, value });
        }
        this._[key] = {
            value: value,
            type: valueType
        };
        this._accessorify({ key, valueType });
    }
    this._initialized.status = true;
    this._initialized = Object.freeze(this._initialized);
    return this;
};

Store.prototype.is = function(...args){
    return this._isMarriage(args);
};

Store.prototype.isnt = function(...args){
    return !this._isMarriage(args);
};

Store.prototype.addReflect = function(key, fn){
    if(key in this && this._isFn(fn)) {
        this._reflects[key] = fn;
    }
    return this;
};

Store.prototype.removeReflect = function(key){
    delete this._reflects[key];
    return this;
};

Store.prototype.addRange = function(key, range, minReflect, maxReflect){
    if(this._typeOf(this[key]) !== "number"
        || !Array.isArray(range)
        || range.length !== 2
        || !range.every(item => this._isNum(item))) return;

    if(range[1] < range[0]) {
        range.reverse();
    }

    this._rangedNumbers[key] = { range: range };
    let rangeObject = this._rangedNumbers[key];
    if(this._isFn(minReflect)) {
        rangeObject.minReflect = minReflect;
    }
    if(this._isFn(maxReflect)) {
        rangeObject.maxReflect = maxReflect;
    }

    this._rangedNumbers[key] = Object.freeze(rangeObject);

    this[key] = this._holdInRange(key, this[key]);

    return this;
};

Store.prototype.removeRange = function(key){
    delete this._rangedNumbers[key];
    return this;
};

Store.prototype.isRanged = function(key = ""){
    return this._isFeatured('_rangedNumbers', key);
};

Store.prototype.addLock = function(key){
    if(!key in this && !key in this._lockeds) return;
    this._lockeds[key] = true;
    return this;
};

Store.prototype.removeLock = function(key){
    delete this._lockeds[key];
    return this;
};

Store.prototype.isLocked = function(key = ""){
    return this._isFeatured('_lockeds', key);
};

Store.prototype.playWorker = function (key) {
    if(this._workers[key] && this._typeOf(this._workers[key].path) !== "null" && this._workers[key].played !== true){
        this._workers[key].played = true;
        let path = this._workers[key].path;
        this._createWorker({ path, key });
    }
    return this;
};

Store.prototype.stopWorker = function (key) {
    if(this._workers[key] && this._workers[key].played === true){
        let { worker } = this._workers[key];
        this._workers[key].played = false;
        worker.terminate();
    }
    return this;
};

Store.prototype.removeWorker = function (key) {
    if(this._workers[key]){
        if(this._workers[key].played === true) {
            this.stopWorker(key);
        }
        delete this._workers[key];
    }
};

Store.prototype.exportData = function (...exportKeys) {
    let response = {};
    for(let [key, data] of Object.entries(this._)){
        const dataValue = data.value,
            dataType = data.type;
        if(/object|array/.test(data.type)){
            let keys = Object.keys(dataValue),
                values = Object.values(dataValue);
            response[key] = dataType === "object" ? {} : [];
            for(let i = 0, inObjectValue; i < keys.length; i++){
                inObjectValue = values[i];
                if(dataType === "object"){
                    response[key][keys[i]] = inObjectValue;
                } else {
                    response[key].push(inObjectValue);
                }
            }
        } else {
            response[key] = dataValue;
        }
    }
    if(exportKeys.length){
        for(let key of Object.keys(response)){
            if(!exportKeys.includes(key)){
                delete response[key];
            }
        }
    }

    return response;
};

Store.prototype._reflect = function (key, value) {
    let { _reflects } = this;
    if(key in _reflects && this._isFn(_reflects[key])) {
        _reflects[key](value);
    }
};

Store.prototype._typeOf = function (object) {
    return Object.prototype.toString
        .call(object)
        .replace(/^\[object (.+)\]$/, '$1')
        .toLowerCase();
};

Store.prototype._holdInRange = function(key, value){
    let rangeObject = this._rangedNumbers[key],
        [min, max] = rangeObject.range,
        {minReflect, maxReflect} = rangeObject;
    if(value < min) {
        this._isFn(minReflect) && minReflect(min);
        return min;
    }
    if(value > max){
        this._isFn(maxReflect) && maxReflect(max);
        return max;
    }
    return value;
};

Store.prototype._isFn = function(fn) {
    return this._typeOf(fn) === "function";
};

Store.prototype._isNum = function(num) {
    return this._typeOf(num) === "number" && !isNaN(num);
};

Store.prototype._isMarriage = function(array) {
    for(let key of array){
        if(!Boolean(this[key])) return false;
    }
    return true;
};

Store.prototype._isFeatured = function(groupName, key) {
    if(!groupName in this) {
        return false;
    }
    for(let item of Object.keys(this[groupName])){
        if(item === key) return true;
    }
    return false;
};

Store.prototype._preinitialize = function () {
    for(let key of this._ns){
        this[key] = {};
    }
    return this;
};

Store.prototype._filterData = function (object = {}) {
    for(let key of this._ns){
        if(object[key]) delete object[key];
    }
    return object;
};

Store.prototype._proxify = function (options = {}) {
    const self = this;
    let {key, value} = options;
    return new Proxy(value, {
        set(prxTarget, prxKey, prxValue){
            if(self.isLocked(key)) {
                return false;
            }
            prxTarget[prxKey] = prxValue;
            self._reflect(key, prxTarget);
            return true;
        },
        deleteProperty(prxTarget, prxKey) {
            if(self.isLocked(key)) {
                return false;
            }
            self._reflect(key, Object.create(null));
            delete prxTarget[prxKey];
            return true;
        }
    });
};

Store.prototype._accessorify = function (options = {}) {
    let {key, valueType} = options;
    const self = this;
    Object.defineProperties(this, {
        [key]: {
            get(){
                return self._[key].value;
            },
            set(value){
                let dataItem = self._[key];
                if(self._typeOf(value) === dataItem.type
                    && !self.isLocked(key) && !/object|array/.test(valueType)){
                    if(self._isNum(value) && self.isRanged(key)){
                        value = self._holdInRange(key, value);
                    }
                    if(value !== dataItem.value){
                        dataItem.value = value;
                        self._reflect(key, value);
                        return true;
                    }
                }
            }
        }
    });
};

Store.prototype._createWorker = function (options = {}) {
    let {path, key} = options;
    let worker = new Worker(path);
    let played = true;
    this._workers[key] = {
        worker,
        path,
        played
    };
    worker.onmessage = event => this[key].result = event.data;
    worker.onerror = () => {
        console.warn(`Worker error`);
        this.stopWorker(key);
    };
    return this;

};

Store.prototype._loadJSON = function (key, url) {
    fetch(url)
        .then(response => response.json())
        .then(response => {
            response.status !== 404 && Object.assign(this[key], response);
        });
};

define(function () {
    return Store;
});