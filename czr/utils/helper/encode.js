const AbiCoder = require('./abi-coder/index');

// const compile = require('./compile/index')//compile.js
const compile = require('./compile/crc20')//compile.js

// console.log("encodejs start")
// parse({
//     from: "czr_4kYTyZTjRGQoEioCbT8JcKpDaqjJs2ekpxcucTC14SniuNABi6",
//     to: "",
//     amount: '0',
//     password: "12345678",
//     gas: 10000000000000000,
//     gas_price: "10000000",
//     functionName:"constructor",
//     args:["1000", "czr", "CZR"]
// })

// parse({
//     from: "czr_4kYTyZTjRGQoEioCbT8JcKpDaqjJs2ekpxcucTC14SniuNABi6",
//     to: "",
//     amount: '0',
//     password: "12345678",
//     gas: 10000000000000000,
//     gas_price: "10000000",
//     functionName:"transfer",
//     args:["czr_4kYTyZTjRGQoEioCbT8JcKpDaqjJs2ekpxcucTC14SniuNABi6", "1000"]
// })

function parse(Params, abiObj) {
    if(!abiObj){
        let functionName = Params.functionName;
        let abi = abiObj || compile.abi;
        let funABI = '';
        let args = Params.args ? Params.args : [];
        for (let i in abi) {
            let name;
            if (abi[i].name === undefined) {
                name = abi[i].type;
            } else {
                name = abi[i].name;
            }

            if (name === functionName) {
                funABI = abi[i];
                break
            }
        }
        Params.funABI = funABI
        let types = [];
        if (funABI.inputs && funABI.inputs.length) {
            for (var i = 0; i < funABI.inputs.length; i++) {
                var type = funABI.inputs[i].type;
                types.push(type);
                if (args.length < types.length) {
                    args.push('');
                }
            }
        }
        let abiCoder = new AbiCoder();
        let paramsEncode = abiCoder.encode(types, args);
        paramsEncode = paramsEncode.substr(0, 2) === "0x" ? paramsEncode.substr(2) : paramsEncode
        if (funABI.name === "constructor" || funABI.type === "constructor") {
            Params.data = compile.contractByteCode + paramsEncode;
        } else {
            let methodBytecode = compile.methodBytecode;
            // console.log(functionName);
            // console.log(methodBytecode)
            // console.log(methodBytecode[functionName])
            Params.data = methodBytecode[functionName] + paramsEncode;
        }
        return Params;
    }else{
        funABI=abiObj
        args=Params.funArgs
        var types = []
        if (funABI.inputs && funABI.inputs.length) {
            for (var i = 0; i < funABI.inputs.length; i++) {
                var type = funABI.inputs[i].type
                types.push(type.indexOf('tuple') === 0 ? makeFullTupleTypeDefinition(funABI.inputs[i]) : type)
                if (args.length < types.length) {
                    args.push('')
                }
            }
        }

        // NOTE: the caller will concatenate the bytecode and this
        //       it could be done here too for consistency
        let abiCoder = new AbiCoder();

        return abiCoder.encode(types, args)

        function makeFullTupleTypeDefinition (typeDef) {
            if (typeDef && typeDef.type.indexOf('tuple') === 0 && typeDef.components) {
                var innerTypes = typeDef.components.map((innerType) => innerType.type)
                return `tuple(${innerTypes.join(',')})${this.extractSize(typeDef.type)}`
            }
            return typeDef.type
        }
    }
}
module.exports = {
    parse: parse
}

