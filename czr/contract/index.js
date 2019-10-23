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
//TODO需要判断有没有
let HttpRequest = require('../httprequest');
let request = new HttpRequest();// Send= > generateOfflineBlock sendOfflineBlock


//TODO 暂时不去掉...敏感信息相关的
var core = require('./help/web3-core/index');               //TODO 后面去掉，转为Hrequest使用
var formatters = require('./help/web3-core-helpers').formatters;//TODO 后面去掉，转为Hrequest使用
var Method = require('./help/web3-core-method');            //TODO 后面去掉，转为Hrequest使用
var promiEvent = require('./help/web3-core-promievent');    //TODO 后面去掉，转为Hrequest使用

let utils = require("../utils/")
console.log(utils.isAccount)
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
    core.packageInit(this, [this.constructor.currentProvider]);

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
    var defaultBlock = this.constructor.defaultBlock || 'latest';

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
                    // console.log(funcName);
                }

                // function
                if (method.type === 'function') {
                    method.signature = abi.encodeFunctionSignature(funcName);
                    // console.log(funcName, method.signature, method.name);

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
    Object.defineProperty(this, 'defaultBlock', {
        get: function () {
            return defaultBlock;
        },
        set: function (val) {
            if (val) {
                defaultBlock = val;
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

    console.log(constructor)
    console.log('this.constructor._ethAccounts ==> ', this.constructor._ethAccounts)
    console.log('options.arguments ==> ', options.arguments)
    console.log("开始运行核心代码********* \n");
    return this._createTxObject.apply({
        method: constructor,
        parent: this,
        deployData: options.data,
        _ethAccounts: this.constructor._ethAccounts
    }, options.arguments);

};





//----------------------------------------------------------------------------- */

/**
 * 返回一个带有 call send encodeABI estimateGas functions 的对象
 * @method _createTxObject
 * @returns {Object} an object with functions to call the methods
 */
Contract.prototype._createTxObject = function _createTxObject() {
    var args = Array.prototype.slice.call(arguments);
    // console.log("arguments", arguments)
    // console.log(args)
    var txObject = {
        'tag': "Canonchain"
    };

    //encode
    txObject.encodeABI = this.parent._encodeMethodABI.bind(txObject);//call send

    if (this.method.type === 'function') {
        txObject.call = this.parent._getRpc.bind(txObject, 'call');
        txObject.call.request = this.parent._getRpc.bind(txObject, 'call', true); // to make batch requests
    }

    txObject.send = this.parent._getRpc.bind(txObject, 'send');
    txObject.send.request = this.parent._getRpc.bind(txObject, 'send', true); // to make batch requests


    if (args && this.method.inputs && args.length !== this.method.inputs.length) {
        if (this.nextMethod) {
            return this.nextMethod.apply(null, args);
        }
        throw {
            args_length: args.length,
            method_inputs_length: this.method.inputs.length,
            method_name: this.method.name
        }
    }

    txObject.arguments = args || [];
    txObject._method = this.method;
    txObject._parent = this.parent;
    txObject._ethAccounts = this.parent.constructor._ethAccounts || this._ethAccounts;

    if (this.deployData) {
        txObject._deployData = this.deployData;
    }
    return txObject;
};

/**
 * 为方法编码ABI，包括签名或方法。或者当构造函数仅编码构造函数参数时。
 * 基于ABI来做bytycode[OK]
 * 
 * @method _encodeMethodABI
 * @param {Mixed} args the arguments to encode
 * @param {String} the encoded ABI
 */
Contract.prototype._encodeMethodABI = function _encodeMethodABI() {
    // this有 call send _deployData
    console.log("_encodeMethodABI:为方法编码ABI，包括签名或方法+++++++++++++++")
    var methodSignature = this._method.signature,
        args = this.arguments || [];//传的参数 [ 0, 1 ]
    // console.log('00000', this._method.signature, args);

    var signature = false,
        paramsABI = this._parent.options.jsonInterface.filter(function (json) {
            return ((methodSignature === 'constructor' && json.type === methodSignature) ||
                ((json.signature === methodSignature || json.signature === methodSignature.replace('0x', '') || json.name === methodSignature) && json.type === 'function'));
        }).map(function (json) {
            // console.log('找到对应的JSON')//找到对应的JSON
            // console.log(json)//找到对应的JSON
            var inputLength = (_.isArray(json.inputs)) ? json.inputs.length : 0;

            //检查参数
            if (inputLength !== args.length) {
                throw new Error('The number of arguments is not matching the methods required number. You need to pass ' + inputLength + ' arguments.');
            }

            if (json.type === 'function') {
                signature = json.signature;
            }
            return _.isArray(json.inputs) ? json.inputs : [];
        }).map(function (inputs) {
            return abi.encodeParameters(inputs, args).replace('0x', '');
        })[0] || '';

    console.log("paramsABI", paramsABI)
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
 * @method _getOrSetDefaultOptions
 * @param {Object} options the options gived by the user
 * @return {Object} the options with gaps filled by defaults
 */
Contract.prototype._getOrSetDefaultOptions = function getOrSetDefaultOptions(options) {
    // var from = options.from
    //     ? utils.toChecksumAddress(formatters.inputAddressFormatter(options.from))
    //     : null;
    // console.log("_getOrSetDefaultOptions ===> ", options);
    // console.log("_getOrSetDefaultOptions ===> ", this.options);
    options.from = (options.from ? options.from : null) || this.options.from;
    options.gasPrice = (options.gasPrice ? String(options.gasPrice) : null) || this.options.gasPrice;
    options.data = options.data || this.options.data;
    options.gas = options.gas || options.gasLimit || this.options.gas;

    // TODO replace with only gasLimit?
    delete options.gasLimit;
    return options;
};

//******************************************************************************************************* */
//******************************************************************************************************* */
//******************************************************************************************************* */
//******************************************************************************************************* */
//******************************************************************************************************* */
//******************************************************************************************************* */
//******************************************************************************************************* */
//******************************************************************************************************* */
//******************************************************************************************************* */
//******************************************************************************************************* */

// 设置Provider，可以去掉，直接初始配置
Contract.setProvider = function (provider, accounts) {
    // Contract.currentProvider = provider;//改为在core.packageInit中设置了
    console.log("1先设置提供者", accounts)
    core.packageInit(this, [provider]);
    this._ethAccounts = accounts;
};

/**
 * Executes a call, transact or estimateGas on a contract function
 * 在合同函数上执行调用，交易或估计加权
 * 
 * @method _getRpc
 * @param {String} type the type this execute function should execute
 * @param {Boolean} makeRequest if true, it simply returns the request parameters, rather than executing it
 */
//TODO 这个方法可以删除掉，用RPC请求代替
Contract.prototype._getRpc = function _getRpc() {
    var _this = this,
        args = this._parent._setRpcOpt.call(this, Array.prototype.slice.call(arguments), defer),
        defer = promiEvent((args.type !== 'send')),
        ethAccounts = _this.constructor._ethAccounts || _this._ethAccounts;

    // simple return request for batch requests
    //是否需要请求节点
    console.log("args.generateRequest", args.generateRequest, arguments, defer)

    if (args.generateRequest) {
        console.log("NONONO需要的RPC交互")
        var payload = {
            params: [formatters.inputCallFormatter.call(this._parent, args.options)],
            callback: args.callback
        };

        if (args.type === 'call') {
            payload.params.push(formatters.inputDefaultBlockNumberFormatter.call(this._parent, args.defaultBlock));
            payload.method = 'eth_call';
            payload.format = this._parent._decodeMethodReturn.bind(null, this._method.outputs);
        } else {
            payload.method = 'eth_sendTransaction';
        }

        return payload;

    } else {
        console.log("需要的RPC交互", args.type)
        switch (args.type) {
            case 'call':

                //立刻执行一个新的消息调用，无需在区块链上创建交易。
                var call = (new Method({
                    name: 'call',
                    call: 'eth_call',
                    params: 2,
                    inputFormatter: [formatters.inputCallFormatter, formatters.inputDefaultBlockNumberFormatter],
                    // add output formatter for decoding
                    outputFormatter: function (result) {
                        return _this._parent._decodeMethodReturn(_this._method.outputs, result);
                    },
                    requestManager: _this._parent._requestManager,
                    accounts: ethAccounts, // is eth.accounts (necessary for wallet signing)
                    defaultAccount: _this._parent.defaultAccount,
                    defaultBlock: _this._parent.defaultBlock
                })).createFunction();

                return call(args.options, args.defaultBlock, args.callback);
            // case 'send':
            //     //czr send
            //     request

            case 'send':

                // return error, if no "from" is specified
                if (!utils.isAccount(args.options.from)) {
                    return utils._fireError(new Error('No "from" address specified in neither the given options, nor the default options.'), defer.eventEmitter, defer.reject, args.callback);
                }

                if (_.isBoolean(this._method.payable) && !this._method.payable && args.options.value && args.options.value > 0) {
                    return utils._fireError(new Error('Can not send value to non-payable contract method or constructor'), defer.eventEmitter, defer.reject, args.callback);
                }


                // make sure receipt logs are decoded
                var extraFormatters = {
                    receiptFormatter: function (receipt) {
                        if (_.isArray(receipt.logs)) {

                            // decode logs
                            var events = _.map(receipt.logs, function (log) {
                                return _this._parent._decodeEventABI.call({
                                    name: 'ALLEVENTS',
                                    jsonInterface: _this._parent.options.jsonInterface
                                }, log);
                            });

                            // make log names keys
                            receipt.events = {};
                            var count = 0;
                            events.forEach(function (ev) {
                                if (ev.event) {
                                    // if > 1 of the same event, don't overwrite any existing events
                                    if (receipt.events[ev.event]) {
                                        if (Array.isArray(receipt.events[ev.event])) {
                                            receipt.events[ev.event].push(ev);
                                        } else {
                                            receipt.events[ev.event] = [receipt.events[ev.event], ev];
                                        }
                                    } else {
                                        receipt.events[ev.event] = ev;
                                    }
                                } else {
                                    receipt.events[count] = ev;
                                    count++;
                                }
                            });

                            delete receipt.logs;
                        }
                        return receipt;
                    },
                    contractDeployFormatter: function (receipt) {
                        var newContract = _this._parent.clone();
                        newContract.options.address = receipt.contractAddress;
                        return newContract;
                    }
                };

                //创建一个新的消息调用交易，如果数据字段中包含代码，则创建一个合约。
                var sendTransaction = (new Method({
                    name: 'sendTransaction',
                    call: 'eth_sendTransaction',
                    params: 1,
                    inputFormatter: [formatters.inputTransactionFormatter],
                    requestManager: _this._parent._requestManager,
                    accounts: _this.constructor._ethAccounts || _this._ethAccounts, // is eth.accounts (necessary for wallet signing)
                    defaultAccount: _this._parent.defaultAccount,
                    defaultBlock: _this._parent.defaultBlock,
                    extraFormatters: extraFormatters
                })).createFunction();

                return sendTransaction(args.options, args.callback);

        }

    }

};

/**
 * Generates the options for the execute call
 * 生成执行调用的选项   1
 * @method _setRpcOpt
 * @param {Array} args
 * @param {Promise} defer
 */
//TODO 这个方法可以删除掉，用RPC请求代替
Contract.prototype._setRpcOpt = function _setRpcOpt(args, defer) {
    var processedArgs = {};

    processedArgs.type = args.shift();

    // get the callback
    processedArgs.callback = this._parent._getCallback(args);

    // get block number to use for call
    if (processedArgs.type === 'call' && args[args.length - 1] !== true && (_.isString(args[args.length - 1]) || isFinite(args[args.length - 1])))
        processedArgs.defaultBlock = args.pop();

    // get the options
    processedArgs.options = (_.isObject(args[args.length - 1])) ? args.pop() : {};

    // get the generateRequest argument for batch requests
    processedArgs.generateRequest = (args[args.length - 1] === true) ? args.pop() : false;

    processedArgs.options = this._parent._getOrSetDefaultOptions(processedArgs.options);
    processedArgs.options.data = this.encodeABI();

    // add contract address
    if (!this._deployData && !utils.isAccount(this._parent.options.address))
        throw new Error('This contract object doesn\'t have address set yet, please set an address first.');

    if (!this._deployData)
        processedArgs.options.to = this._parent.options.address;

    // return error, if no "data" is specified
    if (!processedArgs.options.data)
        return utils._fireError(new Error('Couldn\'t find a matching contract method, or the number of parameters is wrong.'), defer.eventEmitter, defer.reject, processedArgs.callback);

    return processedArgs;
};

/**
 * Get the callback and modiufy the array if necessary
 * 如有必要，获取回调并修改数组 1
 * 
 * @method _getCallback
 * @param {Array} args
 * @return {Function} the callback
 */
//TODO 这个方法可以删除掉，用RPC请求代替
Contract.prototype._getCallback = function getCallback(args) {
    if (args && _.isFunction(args[args.length - 1])) {
        return args.pop(); // modify the args array!
    }
};

/**
 * Should be used to decode indexed params and options
 * 用于解码索引的参数和选项 1
 * 
 * @method _decodeEventABI
 * @param {Object} data
 * @return {Object} result object with decoded indexed && not indexed params
 */
//TODO 这个方法可以删除掉，用RPC请求代替
Contract.prototype._decodeEventABI = function (data) {
    var event = this;

    console.log("用于解码索引的参数和选项++++++++++++++++++")
    console.log(event)
    console.log(data)
    data.data = data.data || '';
    data.topics = data.topics || [];
    console.log(data)
    var result = formatters.outputLogFormatter(data);
    console.log(result)

    // if allEvents get the right event
    if (event.name === 'ALLEVENTS') {
        event = event.jsonInterface.find(function (intf) {
            return (intf.signature === data.topics[0]);
        }) || { anonymous: true };
    }

    // create empty inputs if none are present (e.g. anonymous events on allEvents)
    event.inputs = event.inputs || [];


    var argTopics = event.anonymous ? data.topics : data.topics.slice(1);

    result.returnValues = abi.decodeLog(event.inputs, data.data, argTopics);
    delete result.returnValues.__length__;

    // add name
    result.event = event.name;

    // add signature
    result.signature = (event.anonymous || !data.topics[0]) ? null : data.topics[0];

    // move the data and topics to "raw"
    result.raw = {
        data: result.data,
        topics: result.topics
    };
    delete result.data;
    delete result.topics;


    return result;
};

/**
 * Decode method return values
 * 解码method的返回值（拿到data通过abi解析对应的格式）[OK]
 * 
 * @method _decodeMethodReturn
 * @param {Array} outputs
 * @param {String} returnValues
 * @return {Object} 解码输出返回值
 */
//TODO 这个方法可以删除掉，用RPC请求代替
Contract.prototype._decodeMethodReturn = function (outputs, returnValues) {
    // console.log("_decodeMethodReturn ==> ", outputs)// [ { name: '', type: 'uint256' }, { name: '', type: 'uint256' } ]
    // console.log("_decodeMethodReturn ==> ", returnValues)//0x000000000000000000000000000000000000000000000000000000000000006e0000000000000000000000000000000000000000000000000000000000000077
    if (!returnValues) {
        return null;
    }

    returnValues = returnValues.length >= 2 ? returnValues.slice(2) : returnValues;
    var result = abi.decodeParameters(outputs, returnValues);
    // console.log("_decodeMethodReturn ==> ", result);
    if (result.__length__ === 1) {
        return result[0];
    } else {
        delete result.__length__;
        return result;
    }
};
//******************************************************************************************* */
module.exports = Contract;