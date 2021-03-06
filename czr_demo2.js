const HDWalletProvider = require("truffle-hdwallet-provider");
let bytecode = '0x608060405234801561001057600080fd5b506102a9806100206000396000f3fe60806040526004361061008d576000357c0100000000000000000000000000000000000000000000000000000000900480631b56fda01161006b5780631b56fda0146101345780634f9d719e1461014957806364c7133b14610151578063b819499e1461017b5761008d565b80630dbe671f146100925780630f682008146100b9578063125d9d9014610102575b600080fd5b34801561009e57600080fd5b506100a7610190565b60408051918252519081900360200190f35b3480156100c557600080fd5b506100e9600480360360408110156100dc57600080fd5b5080359060200135610196565b6040805192835260208301919091528051918290030190f35b34801561010e57600080fd5b506101326004803603604081101561012557600080fd5b50803590602001356101d8565b005b34801561014057600080fd5b5061013261021c565b610132610223565b34801561015d57600080fd5b506100a76004803603602081101561017457600080fd5b5035610258565b34801561018757600080fd5b506100a7610277565b60005481565b6000806001848154811015156101a857fe5b90600052602060002001546001848154811015156101c257fe5b9060005260206000200154915091509250929050565b60018054808201825560008290527fb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf690810193909355805480820190915590910155565b6001600055565b6040805134815290517f260823607ceaa047acab9fe3a73ef2c00e2c41cb01186adc4252406a47d734469181900360200190a1565b600180548290811061026657fe5b600091825260209091200154905081565b6000549056fea165627a7a7230582081e0463af8dcbfeda13f7bbdbe11dc8e87e83639f3825782a0e7918a1fe26b980029';
var interfaceFile = require('./sources/interface.json');//和约的接口

// solc
const path = require('path');
const fs = require('fs');
const solc = require('czr-solc');
const srcpath = path.resolve(__dirname, 'sources', 'test.sol');
const source = fs.readFileSync(srcpath, 'utf-8');
let input = {
    "language": 'Solidity',
    "sources": {
        'test1.sol': {
            "content": source
        }
    },
    "settings": {
        "optimizer": {
            "enabled": true,
            "runs": 200
        },
        "outputSelection": {
            '*': {
                '': ['legacyAST'],
                '*': ['abi', 'metadata', 'devdoc', 'userdoc', 'evm.legacyAssembly', 'evm.bytecode', 'evm.deployedBytecode', 'evm.methodIdentifiers', 'evm.gasEstimates']
            }
        }
    }
}
let output = JSON.parse(solc.compile(JSON.stringify(input)));

let contractByteCode = output.contracts['test1.sol']['Web3Test'].evm.bytecode.object
let abi = output.contracts['test1.sol']['Web3Test']['abi']

bytecode = contractByteCode;
interfaceFile = abi;

// console.log("contractByteCode :", contractByteCode)
// console.log("methodIdentifiers :", methodIdentifiers)
// console.log("abi :", abi)
//End

// let Contract = require('web3-eth-contract');
let Contract = require('./czr/contract');

let rinkebyUrl = 'https://rinkeby.infura.io/uIkf4qZgOSqDV0Ir5np1';
let ganacheUrl = 'http://127.0.0.1:8545/';
let czrUrl = 'http://127.0.0.1:8765/';
let curAccount = '';

let myContract = {}
let config = {
    rinkeby: function () {
        curAccount = '0x4b983d2cb24ac3953aa2ae1a0ceba4e5f1e1a5da';
        const mnemonic = "F9F8F1A056C8F00D176807CE4FF89BE34D95BD751795C1687FE5F14A86A5A146"; // 12 word mnemonic
        let provider = new HDWalletProvider(mnemonic, rinkebyUrl);
        // Contract.setProvider(rinkebyUrl);
        Contract.setProvider(provider);
        myContract = new Contract(interfaceFile, curAccount, {
            gasPrice: '10000000000'
        });
    },
    gannche: function () {
        curAccount = '0x57BbD9A3bD36AA4D5C93CF218088E0661502f337';
        Contract.setProvider(ganacheUrl);
        myContract = new Contract(interfaceFile, curAccount, {
            gasPrice: '2000000000000'
        });
    },
    czr: function () {
        curAccount = 'czr_3DG8FjYSAqkBNubcSVAAjAtSQ9Q2tWVNwPS8VHQ55XwWG4DsTS';//czr_3D75PTzmnfe6eopvWR5291qkMs3i1xFL8niQKowPd9bv1DEVAW
        Contract.setProvider(czrUrl);
        myContract = new Contract(interfaceFile, curAccount, {
            from: 'czr_33EuccjKjcZgwbHYp8eLhoFiaKGARVigZojeHzySD9fQ1ysd7u',
            gas: 2000000,
            gas_price: '1000000000'
        });
    }
}
config.czr();


let utility = {
    init() {
        // utility.prop();

        // utility.clone();

        //第零步
        // utility.allMethods();

        //第一步
        // utility.testSend1();

        //第二步
        // utility.testCall1();

        //第三部
        // utility.testSend2();

        //第四部
        // utility.testCall2()

        //send
        // utility.onlyDeploy();

        // utility.deploy1();

        // utility.testEvent();

        // utility.EventTest();
    },
    prop() {
        console.log('------属性-----')
        console.log(`myContract.options`, myContract.options);
        console.log(`初始地址: ${myContract.options.account}`);
        console.log(`JSON接口:`, myContract.options.jsonInterface.length);//计算hash


        //注释
        // myContract.options.account = '0xc608d3853748c8E178A0803Bc6061C466B2F3c57'
        // console.log(`改变地址: ${myContract.options.account}`);
        // utility.clone();
    },

    //abi
    allMethods() {
        console.log("----- allMethods -----");
        console.log(myContract.methods);
        console.log("----- allMethods -----");

        console.log('\n\n\n')
        console.log('------encodeABI-----')
        console.log(`testCall1: ${myContract.methods.testCall1().encodeABI()}`);
        let encodeABIData = myContract.methods.testSend2(200, 201).encodeABI();
        console.log(`testSend2: ${encodeABIData}`);
        console.log('------encodeABI-----')
    },

    //call
    testCall1() {
        console.log('------testCall1-----')
        myContract.methods.testCall1().call(function (error, result) {
            console.log("Call1 start------ ");
            console.log(error)
            console.log(result)
            console.log("Call1 end------ ");
        }).then(data => {
            console.log('Call1 data', data)
            console.log('------testCall1-----')
        }).catch(function (error) {
            console.log('Call1 catch error', error)
        });
    },
    testCall2() {
        console.log('------testCall2-----')
        myContract.methods.testCall2(0, 1).call(function (error, result) {
            console.log("Call2 start------ ");
            console.log(error)
            console.log(result)
            console.log("Call2 start------ ");
        }).then(data => {
            console.log('Call2 data', data);
            console.log('------testCall2-----');
        }).catch(function (error) {
            console.log('Call2 catch error', error)
        });
    },
    //************************************* */
    onlyDeploy() {
        try {
            let cccc = myContract.deploy({ data: bytecode })
            console.log("cccc")
            console.log(cccc)
        } catch (error) {
            console.log("catch error")
            console.log(error)
        }
    },
    deploy1() {
        myContract.deploy({
            data: bytecode
        })
            .sendBlock({
                password: '12345678',
                amount: "0"
            }, function (error, transactionHash) {
                console.log("deploy回调")
                console.log("error ==> ", error)
                console.log("transactionHash ==> ", transactionHash)
            })
            .then(function (res) {
                console.log(res)
            })
            .catch(function (error) {
                console.log('catch', error)
            });
    },
    testSend1() {
        console.log("----- testSend1 -----")
        myContract.methods.testSend1()
            .sendBlock({
                amount: "0",
                password: '12345678',
            }, function (error, transactionHash) {
                console.log("回调")
                console.log("error ==> ", error)
                console.log("transactionHash ==> ", transactionHash)
            })
            .then(function (newContractInstance) {
                console.log('新合约实例')
                console.log(newContractInstance) // instance with the new contract account
                console.log("----- testSend1 -----")
            }).catch(error => {
                console.log("catch")
                console.log(error)
            })

    },
    testSend2() {
        console.log("----- testSend2 -----")
        myContract.methods.testSend2(110, 119)
            .sendBlock(
                {
                    amount: "0",
                    password: '12345678',
                },
                function (error, transactionHash) {
                    console.log("回调")
                    console.log("error ==> ", error)
                    console.log("transactionHash ==> ", transactionHash)
                }
            )
            .then(data => {
                console.log('testSend2 data', data)
                console.log("----- testSend2 -----")
            }).catch(function (error) {
                console.log('testSend2 error', error)
            });
    },
    testEvent() {
        console.log("----- testEvent -----")
        myContract.methods.testEvent()
            .sendBlock(
                {
                    amount: "0",
                    password: '12345678',
                }
            )
            .then(data => {
                console.log('testEvent data', data)
                console.log("----- testEvent -----")
            }).catch(function (error) {
                console.log('testEvent error', error)
            });
    },
    clone() {
        console.log("\n 准备使用clone方法------------------------------ ");
        let myContract2 = myContract.clone();
        myContract2.options.account = '0xXXXXXXXXXXXXXXXXXXXXXX'
        console.log(`初始地址：${myContract.options.account}`);
        console.log(`克隆地址：${myContract2.options.account}`);
    },

    //Event
    EventTest() {
        console.log("----- EventTest -----")
        myContract.getPastEvents('EventTest', {
            from_stable_block_index: 0
        })
            .then(function (events) {
                console.log("收到啦")
                console.log(events) // same results as the optional callback above
                console.log("----- EventTest -----")
            });

    }
};
utility.init();