const utils = require('../utils');
//utils.judge(value) === 'object'
var contractAbi = require('../utils/lib/abi-coder').AbiCoder;
var abiCoder = new contractAbi(function (type, value) {
    if (type.match(/^u?int/) && !utils.judge(value) === 'array' &&
        (!utils.judge(value) === 'object' || value.constructor.name !== 'BN')) {
        return value.toString();
    }
    return value;
});
// result method
function Result() {
}

/**
 * 使用下面方法
 * abi.encodeFunctionSignature(funcName);
 * abi.encodeEventSignature(funcName);
 * abi.encodeParameters(inputs, args)
 * abi.decodeLog(event.inputs, data.data, argTopics);
 * abi.decodeParameters(outputs, returnValues);
 */

var ABICoder = function () {
};

//编码函数名字
ABICoder.prototype.encodeFunctionSignature = function (functionName) {
    if (utils.judge(functionName) === 'object') {
        functionName = utils._jsonInterfaceMethodToString(functionName);
    }
    return utils.sha3(functionName).slice(0, 10);
};

ABICoder.prototype.encodeEventSignature = function (functionName) {
    if (utils.judge(functionName) === 'object') {
        functionName = utils._jsonInterfaceMethodToString(functionName);
    }
    return utils.sha3(functionName);
};

ABICoder.prototype.encodeParameters = function (types, params) {
    return abiCoder.encode(this.mapTypes(types), params);
};

//使用简化格式的Map类型
ABICoder.prototype.mapTypes = function (types) {
    var self = this;
    var mappedTypes = [];
    types.forEach(function (type) {
        if (self.isSimplifiedStructFormat(type)) {
            var structName = Object.keys(type)[0];
            mappedTypes.push(
                Object.assign(
                    self.mapStructNameAndType(structName),
                    {
                        components: self.mapStructToCoderFormat(type[structName])
                    }
                )
            );

            return;
        }
        mappedTypes.push(type);
    });
    return mappedTypes;
};

//检查类型是否为简化的Struct结构格式
ABICoder.prototype.isSimplifiedStructFormat = function (type) {
    return typeof type === 'object' && typeof type.components === 'undefined' && typeof type.name === 'undefined';
};

//当使用encode / decodeParameter中的简化格式时，映射正确的元组类型和名称
ABICoder.prototype.mapStructNameAndType = function (structName) {
    var type = 'tuple';
    if (structName.indexOf('[]') > -1) {
        type = 'tuple[]';
        structName = structName.slice(0, -2);
    }

    return { type: type, name: structName };
};

//将简化的格式映射到ABICoder的预期格式
ABICoder.prototype.mapStructToCoderFormat = function (struct) {
    var self = this;
    var components = [];
    Object.keys(struct).forEach(function (key) {
        if (typeof struct[key] === 'object') {
            components.push(
                Object.assign(
                    self.mapStructNameAndType(key),
                    {
                        components: self.mapStructToCoderFormat(struct[key])
                    }
                )
            );

            return;
        }

        components.push({
            name: key,
            type: struct[key]
        });
    });

    return components;
};

ABICoder.prototype.decodeParameter = function (type, bytes) {
    return this.decodeParameters([type], bytes)[0];
};
ABICoder.prototype.decodeParameters = function (outputs, bytes) {
    if (outputs.length > 0 && (!bytes || bytes === '0x' || bytes === '0X')) {
        throw new Error('Returned values aren\'t valid, did it run Out of Gas?');
    }

    var res = abiCoder.decode(this.mapTypes(outputs), '0x' + bytes.replace(/0x/i, ''));
    var returnValue = new Result();
    returnValue.__length__ = 0;

    outputs.forEach(function (output, i) {
        var decodedValue = res[returnValue.__length__];
        decodedValue = (decodedValue === '0x') ? null : decodedValue;

        returnValue[i] = decodedValue;

        if (utils.judge(output) === 'object' && output.name) {
            returnValue[output.name] = decodedValue;
        }

        returnValue.__length__++;
    });

    return returnValue;
};

ABICoder.prototype.decodeLog = function (inputs, data, topics) {
    var _this = this;
    topics = utils.judge(topics) === 'array' ? topics : [topics];

    data = data || '';

    var notIndexedInputs = [];
    var indexedParams = [];
    var topicCount = 0;

    // TODO check for anonymous logs?

    inputs.forEach(function (input, i) {
        if (input.indexed) {
            indexedParams[i] = (['bool', 'int', 'uint', 'address', 'fixed', 'ufixed'].find(function (staticType) {
                return input.type.indexOf(staticType) !== -1;
            })) ? _this.decodeParameter(input.type, topics[topicCount]) : topics[topicCount];
            topicCount++;
        } else {
            notIndexedInputs[i] = input;
        }
    });


    var nonIndexedData = data;
    var notIndexedParams = (nonIndexedData) ? this.decodeParameters(notIndexedInputs, nonIndexedData) : [];

    var returnValue = new Result();
    returnValue.__length__ = 0;


    inputs.forEach(function (res, i) {
        returnValue[i] = (res.type === 'string') ? '' : null;

        if (typeof notIndexedParams[i] !== 'undefined') {
            returnValue[i] = notIndexedParams[i];
        }
        if (typeof indexedParams[i] !== 'undefined') {
            returnValue[i] = indexedParams[i];
        }

        if (res.name) {
            returnValue[res.name] = returnValue[i];
        }

        returnValue.__length__++;
    });

    return returnValue;
};

var coder = new ABICoder();

module.exports = coder;