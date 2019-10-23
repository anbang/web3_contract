/**
 * @file contract.js
 *
 * To initialize a contract use:
 *
 *  var Contract = require('web3-eth-contract');
 *  Contract.setProvider('ws://localhost:8546');
 *  var contract = new Contract(abi, address, ...);
 *
 * @author Fabian Vogelsteller <fabian@ethereum.org>
 * @date 2017
 */


"use strict";
console.log("********** czr.js **********")
var _ = require('underscore');

//TODO 需要判断有没有
let HttpRequest = require('../httprequest');
let request = new HttpRequest();// Send= > generateOfflineBlock sendOfflineBlock

//TODO 暂时不去掉...敏感信息相关的
var promiEvent = require('./help/web3-core-promievent');    //TODO 后面去掉，转为Hrequest使用

// **************
let utils = require("../utils/")
let abi = require("../abi/")

/**
 * 使用下面方法
 * utils._jsonInterfaceMethodToString   //添加到CZR util
 * utils._fireError                     //添加到CZR util
 * utils.isAccount(args.options.from)   //添加到CZR util
 * 
 * 使用下面方法
 * abi.encodeFunctionSignature(funcName);
 * abi.encodeEventSignature(funcName);
 * abi.encodeParameters(inputs, args)
 * abi.decodeLog(event.inputs, data.data, argTopics);
 * abi.decodeParameters(outputs, returnValues);
 */


/**
 * 使用时候需要创建实例
 *
 * @method Contract
 * @constructor
 * @param {Array} jsonInterface
 * @param {String} address
 * @param {Object} options
 */
var Contract = function Contract(jsonInterface, address, options) {
    var _this = this,
        args = Array.prototype.slice.call(arguments);
    console.log("2开始new了")
    //判断原型是不是在Contract
    if (!(this instanceof Contract)) {
        throw new Error('Please use the "new" keyword to instantiate a contract object!');
    }

    // sets _requestmanager
    // console.log("this.constructor.currentProvider",this.constructor.currentProvider)

    //判断jsonInterface
    if (!jsonInterface || !(Array.isArray(jsonInterface))) {
        throw new Error('You must provide the json interface of the contract when instantiating a contract object.');
    }

    // create the options object
    this.options = {};
    this.methods = {};

    //处理赋参数；options 和 address
    var lastArg = args[args.length - 1];
    if (_.isObject(lastArg) && !_.isArray(lastArg)) {
        options = lastArg;
        this.options = _.extend(this.options, this._getOrSetDefaultOptions(options));
        if (_.isObject(address)) {
            address = null;
        }
    }


    this._address = null;
    this._jsonInterface = [];
    // get default account from the Class
    var defaultAccount = this.constructor.defaultAccount;
    var defaultMci = this.constructor.defaultMci || 'latest';

    // 在 this.options 上设置 address
    Object.defineProperty(this.options, 'address', {
        set: function (value) {
            if (value) {
                //地址格式化校验
                _this._address = value;
            }
        },
        get: function () {
            return _this._address;
        },
        enumerable: true
    });

    // 在 this.options 上设置 jsonInterface
    Object.defineProperty(this.options, 'jsonInterface', {
        set: function (value) {
            _this.methods = {};//所有的methods
            _this._jsonInterface = value.map(function (method) {
                var func,//函数名
                    funcName;//方法名

                // make constant and payable backwards compatible
                //判断是否可变
                //是否可以付钱
                method.constant = (method.stateMutability === "view" || method.stateMutability === "pure" || method.constant);
                method.payable = (method.stateMutability === "payable" || method.payable);

                //方法名
                if (method.name) {
                    funcName = utils._jsonInterfaceMethodToString(method);//带类型的函数 testCall2(uint256,uint256)
                    // console.log("--- _jsonInterfaceMethodToString ---")
                    // console.log(method);
                    // console.log("funcName",funcName);
                }

                // function
                if (method.type === 'function') {
                    method.signature = abi.encodeFunctionSignature(funcName);//a()
                    // console.log(method.signature, method.name);

                    func = _this._createTxObject.bind({
                        method: method,
                        parent: _this
                    });//用来赋值给XXX

                    // add method only if not one already exists
                    if (!_this.methods[method.name]) {
                        _this.methods[method.name] = func;
                    } else {
                        //有相同的 method.name,支持相同method.name不同参数的设置
                        var cascadeFunc = _this._createTxObject.bind({
                            method: method,
                            parent: _this,
                            nextMethod: _this.methods[method.name]
                        });
                        _this.methods[method.name] = cascadeFunc;
                    }

                    _this.methods[method.signature] = func;
                    _this.methods[funcName] = func;
                    // event
                } else if (method.type === 'event') {
                    method.signature = abi.encodeEventSignature(funcName);
                }
                return method;
            });
            return _this._jsonInterface;
        },
        get: function () {
            return _this._jsonInterface;
        },
        enumerable: true
    });

    // 在 this 上设置 jsonInterface
    Object.defineProperty(this, 'defaultAccount', {
        get: function () {
            return defaultAccount;
        },
        set: function (val) {
            if (val) {
                defaultAccount = val;
            }

            return val;
        },
        enumerable: true
    });

    // 在 this 上设置 jsonInterface
    Object.defineProperty(this, 'defaultMci', {
        get: function () {
            return defaultMci;
        },
        set: function (val) {
            if (val) {
                defaultMci = val;
            }
            return val;
        },
        enumerable: true
    });

    // set getter/setter properties
    this.options.address = address;
    this.options.jsonInterface = jsonInterface;
};


/**
 * clone
 *
 * @method clone
 * @return {Object} the event subscription
 */
Contract.prototype.clone = function () {
    return new this.constructor(this.options.jsonInterface, this.options.address, this.options);
};

/**
 * 根据其状态：transactionHash，receipt来部署合同和触发事件
 * 一旦触发了最后一个可能的事件（“错误”或“收据”），将删除所有事件侦听器
 * 
 * @method deploy
 * @param {Object} options
 * @param {Function} callback
 * @return {Object} EventEmitter possible events are "error", "transactionHash" and "receipt"
 */
Contract.prototype.deploy = function (options, callback) {
    options = options || {};
    options.arguments = options.arguments || [];
    options = this._getOrSetDefaultOptions(options);


    //如果未指定“数据”，则返回错误
    if (!options.data) {
        return utils._fireError(new Error('No "data" specified in neither the given options, nor the default options.'), null, null, callback);
    }

    //查找constructor，如果没有则为{}
    var constructor = _.find(this.options.jsonInterface, function (method) {
        return (method.type === 'constructor');
    }) || {};
    constructor.signature = 'constructor';

    console.log(" -------- deploy -------- ")
    console.log("constructor", constructor)
    console.log('options.data ==> ', options.data)
    console.log('this.constructor._czrAccounts ==> ', this.constructor._czrAccounts)
    console.log('options.arguments ==> ', options.arguments)
    console.log(" -------- deploy --------  \n");
    return this._createTxObject.apply({
        method: constructor,
        parent: this,
        deployData: options.data,
        _czrAccounts: this.constructor._czrAccounts
    }, options.arguments);

};





//----------------------------------------------------------------------------- */

/**
 * 返回一个带有 call sendBlock encodeABI functions 的对象
 * @method createTxObject
 * @returns {Object} an object with functions to call the methods
 */
Contract.prototype._createTxObject = function () {
    var args = Array.prototype.slice.call(arguments);//转为数组
    var txObject = {
        'tag': "Canonchain"
    };

    //encode
    txObject.encodeABI = this.parent._encodeMethodABI.bind(txObject);//转出bytecode

    if (this.method.type === 'function') {
        txObject.call = this.parent._getRpc.bind(txObject, 'call');
        txObject.call.request = this.parent._getRpc.bind(txObject, 'call', true); // to make batch requests
    }
    txObject.sendBlock = this.parent._getRpc.bind(txObject, 'send');//CZR sendBlock的方法
    txObject.sendBlock.request = this.parent._getRpc.bind(txObject, 'send', true); // to make batch requests


    if (args && this.method.inputs && args.length !== this.method.inputs.length) {
        if (this.nextMethod) {
            return this.nextMethod.apply(null, args);
        }
        var errorMsg = {
            args_length: args.length,
            method_inputs_length: this.method.inputs.length,
            method_name: this.method.name
        }

        throw errorMsg
    }

    txObject.arguments = args || [];
    txObject._method = this.method;
    txObject._parent = this.parent;
    txObject._czrAccounts = this.parent.constructor._czrAccounts || this._czrAccounts;

    if (this.deployData) {
        txObject._deployData = this.deployData;
    }
    return txObject;
};

/**
 * 为方法编码ABI，包括签名或方法。或者当构造函数仅编码构造函数参数时。
 * 基于ABI来做bytycode[OK]
 * 
 * @method encodeMethodABI
 * @param {Mixed} args the arguments to encode
 * @param {String} the encoded ABI
 */
Contract.prototype._encodeMethodABI = function _encodeMethodABI() {
    // this有 call send _deployData
    console.log("为方法编码ABI，包括签名或方法+++++++++++++++")
    // console.log(this)
    var methodSignature = this._method.signature,
        args = this.arguments || [];//传的参数 [ 0, 1 ]
    // console.log('00000', this._method.signature, args);

    var signature = false;

    var paramsABI = this._parent.options.jsonInterface.filter(function (json) {
        return ((methodSignature === 'constructor' && json.type === methodSignature) ||
            ((json.signature === methodSignature || json.signature === methodSignature.replace('0x', '') || json.name === methodSignature) && json.type === 'function'));
    }).map(function (json) {
        // console.log("json", json)
        var inputLength = (_.isArray(json.inputs)) ? json.inputs.length : 0;
        if (inputLength !== args.length) {
            throw new Error('The number of arguments is not matching the methods required number. You need to pass ' + inputLength + ' arguments.');
        }
        if (json.type === 'function') {
            signature = json.signature;
        }
        return _.isArray(json.inputs) ? json.inputs : [];
    }).map(function (inputs) {
        return abi.encodeParameters(inputs, args).replace('0x', '');
    })[0] || '';//方法和参数转成16进制

    // console.log("paramsABI", paramsABI, "---", methodSignature)
    // return constructor
    if (methodSignature === 'constructor') {
        //部署的时候
        if (!this._deployData) {
            throw new Error('The contract has no contract data option set. This is necessary to append the constructor parameters.');
        }
        return this._deployData + paramsABI;
    } else {
        var returnValue = (signature) ? signature + paramsABI : paramsABI;
        if (!returnValue) {
            throw new Error('Couldn\'t find a matching contract method named "' + this._method.name + '".');
        } else {
            return returnValue;
        }
    }

};

/**
 * Use default values, if options are not available
 * 格式化数据组装(需要上链的参数)[OK]
 * 
 * @method getOrSetDefaultOptions
 * @param {Object} options the options gived by the user
 * @return {Object} the options with gaps filled by defaults
 */
Contract.prototype._getOrSetDefaultOptions = function (options) {
    // var from = options.from
    //     ? utils.toChecksumAddress(formatters.inputAddressFormatter(options.from))
    //     : null;
    // console.log("getOrSetDefaultOptions ===> ", this.options);
    options.from = (options.from ? options.from : null) || this.options.from;
    options.gas_price = (options.gas_price ? String(options.gas_price) : null) || this.options.gas_price;
    options.data = options.data || this.options.data;
    options.gas = options.gas || options.gasLimit || this.options.gas;

    // TODO replace with only gasLimit?
    delete options.gasLimit;
    return options;
};

Contract.setProvider = function (provider, accounts) {
    // Contract.currentProvider = provider;//改为在core.packageInit中设置了
    //TODO 把RPC的请求地址写一下 provider,地址可以一起改
    console.log("1先设置提供者", accounts)
    this._czrAccounts = accounts;
};

//-------------------------------------------------------------------------------------------

/**
 * Executes a call, transact or estimateGas on a contract function
 * 在合同函数上执行调用，交易或估计加权
 * 
 * @method getRpc
 * @param {String} type the type this execute function should execute
 * @param {Boolean} makeRequest if true, it simply returns the request parameters, rather than executing it
 */
Contract.prototype._getRpc = function () {
    //初始化需要调用RPC的参数
    var args = this._parent._setRpcOpt.call(this, Array.prototype.slice.call(arguments));
    // var defer = promiEvent((args.type !== 'send'));//这里没有用了
    console.log("_getRpc：是否需要请求节点", arguments)
    console.log("需要的RPC交互", args)
    let argsOpts = args.options;
    switch (args.type) {
        case 'call':
            let callOpts = {
                from: argsOpts.from || '',
                to: argsOpts.to,
                data: argsOpts.data || '',
                mci: argsOpts.mci || ''
            }
            return request.call(callOpts);
        case 'send':
            let sendOpts = {
                "from": argsOpts.from,
                "to": argsOpts.to || "",
                "amount": argsOpts.amount,
                "password": argsOpts.password,
                "gas": argsOpts.gas,
                "gas_price": argsOpts.gas_price,
                "data": argsOpts.data || '',
                "gen_next_work": argsOpts.gen_next_work || '',
                "id": argsOpts.id || '',
                "previous": argsOpts.previous || ''
            }
            return request.sendBlock(sendOpts);
    }
};


/**
 * 生成执行调用的选项   1
 * @method setRpcOpt
 * @param {Array} args
 * @param {Promise} defer
 */
Contract.prototype._setRpcOpt = function (args, defer) {
    var processedArgs = {};
    // console.log(`-----args1,${args}`)
    processedArgs.type = args.shift();
    // console.log(`-----args2,${args}, ${processedArgs.type}`)
    // get the callback
    processedArgs.callback = this._parent._getCallback(args);

    // get block number to use for call
    if (
        processedArgs.type === 'call' &&
        args[args.length - 1] !== true &&
        (
            _.isString(args[args.length - 1]) ||
            isFinite(args[args.length - 1])
        )
    ) {
        processedArgs.defaultMci = args.pop();
    }


    // get the options
    processedArgs.options = (_.isObject(args[args.length - 1])) ? args.pop() : {};
    processedArgs.options = this._parent._getOrSetDefaultOptions(processedArgs.options);
    processedArgs.options.data = this.encodeABI();


    // add contract address
    if (!this._deployData && !utils.isAccount(this._parent.options.address)) {
        throw new Error('This contract object doesn\'t have address set yet, please set an address first.');
    }

    //如果没有部署的合约，就传入的ads当做一个需要调用的合约来使用
    if (!this._deployData) {
        processedArgs.options.to = this._parent.options.address;
    }

    // 如果未指定“数据”，则返回错误
    if (!processedArgs.options.data) {
        return utils._fireError(new Error('Couldn\'t find a matching contract method, or the number of parameters is wrong.'), defer.eventEmitter, defer.reject, processedArgs.callback);
    }
    return processedArgs;
};


/**
 * Get the callback and modiufy the array if necessary
 * 如有必要，获取回调并修改数组 1
 * 
 * @method getCallback
 * @param {Array} args
 * @return {Function} the callback
 */
Contract.prototype._getCallback = function (args) {
    if (args && _.isFunction(args[args.length - 1])) {
        return args.pop(); // modify the args array!
    }
};

//******************************************************************************************* */
module.exports = Contract;