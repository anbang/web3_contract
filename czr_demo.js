const HDWalletProvider = require("truffle-hdwallet-provider");
let bytecode = '0x608060405234801561001057600080fd5b506102a9806100206000396000f3fe60806040526004361061008d576000357c0100000000000000000000000000000000000000000000000000000000900480631b56fda01161006b5780631b56fda0146101345780634f9d719e1461014957806364c7133b14610151578063b819499e1461017b5761008d565b80630dbe671f146100925780630f682008146100b9578063125d9d9014610102575b600080fd5b34801561009e57600080fd5b506100a7610190565b60408051918252519081900360200190f35b3480156100c557600080fd5b506100e9600480360360408110156100dc57600080fd5b5080359060200135610196565b6040805192835260208301919091528051918290030190f35b34801561010e57600080fd5b506101326004803603604081101561012557600080fd5b50803590602001356101d8565b005b34801561014057600080fd5b5061013261021c565b610132610223565b34801561015d57600080fd5b506100a76004803603602081101561017457600080fd5b5035610258565b34801561018757600080fd5b506100a7610277565b60005481565b6000806001848154811015156101a857fe5b90600052602060002001546001848154811015156101c257fe5b9060005260206000200154915091509250929050565b60018054808201825560008290527fb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf690810193909355805480820190915590910155565b6001600055565b6040805134815290517f260823607ceaa047acab9fe3a73ef2c00e2c41cb01186adc4252406a47d734469181900360200190a1565b600180548290811061026657fe5b600091825260209091200154905081565b6000549056fea165627a7a7230582081e0463af8dcbfeda13f7bbdbe11dc8e87e83639f3825782a0e7918a1fe26b980029';
var interfaceFile = require('./interface.json');//和约的接口
// let Contract = require('web3-eth-contract');
let Contract = require('./czr/contract');
let rinkebyUrl = 'https://rinkeby.infura.io/uIkf4qZgOSqDV0Ir5np1';
let ganacheUrl = 'http://127.0.0.1:8545/';
let account = '';

let myContract = {}
let config = {
    rinkeby: function () {
        account = '0x4b983d2cb24ac3953aa2ae1a0ceba4e5f1e1a5da';
        const mnemonic = "F9F8F1A056C8F00D176807CE4FF89BE34D95BD751795C1687FE5F14A86A5A146"; // 12 word mnemonic
        let provider = new HDWalletProvider(mnemonic, rinkebyUrl);
        // Contract.setProvider(rinkebyUrl);
        Contract.setProvider(provider);
        myContract = new Contract(interfaceFile, account, {
            gasPrice: '10000000000'
        });
    },
    gannche: function () {
        account = '0x57BbD9A3bD36AA4D5C93CF218088E0661502f337';
        Contract.setProvider(ganacheUrl);
        myContract = new Contract(interfaceFile, account, {
            gasPrice: '2000000000000'
        });
    }
}
config.rinkeby();
// config.gannche();

// console.log(myContract)
// console.log(
//     'provider in web3 eth: ' + JSON.stringify(web3.currentProvider),
// );

let utility = {
    init() {
        // utility.prop();
        // utility.methodsCall();
        utility.onlyDeploy();

        // console.log(`JSON接口`, myContract.options.jsonInterface);
        // utility.deploy1();
        // utility.methods();
    },
    prop() {
        console.log('------属性-----')
        console.log(`myContract.options`, myContract.options);
        console.log(`初始地址: ${myContract.options.address}`);
        myContract.options.address = '0xc608d3853748c8E178A0803Bc6061C466B2F3c57'
        console.log(`改变地址: ${myContract.options.address}`);
        console.log(`JSON接口`, myContract.options.jsonInterface.length);//计算hash
        utility.clone();
    },
    clone() {
        console.log("\n 准备使用clone方法------------------------------ ");
        let myContract2 = myContract.clone();
        myContract.options.address = '0x4b983d2cb24ac3953aa2ae1a0ceba4e5f1e1a5da'
        console.log(`初始地址：${myContract.options.address}`);
        console.log(`克隆地址：${myContract2.options.address}`);
    },

    methodsCall() {
        console.log("\n");

        myContract.methods.testCall2(0, 1).call().then(data => {
            console.log('005 testCall2 data', data)
        });

        // let encodeABIData = myContract.methods.testSend1().encodeABI();
        // console.log(`000 encodeABIData:${encodeABIData}`)


        // myContract.methods.testSend2(200, 201).estimateGas({ from: "0x7386445b7C0022FB0c6B08466a8E6ae4A97A134b", gas: 8 })
        //     .then(data => {
        //         console.log('001 estimateGas data', data)
        //     }).catch(function (error) {
        //         console.log('001 estimateGas error', error)
        //     });

        // myContract.methods.testCall1().call(function (error, result) {
        //     console.log("\n002 start------------------------------ ");
        //     console.log(error)
        //     console.log(result)
        //     console.log("002 end------------------------------ ");
        // }).then(data => {
        //     console.log('003 testCall1 data', data)
        // }).catch(function (error) {
        //     console.log('003 catch error', error)
        // });

        // myContract.methods.testCall1().call().then(data => {
        //     console.log('004 testCall1 data', data)
        // }).catch(function (error) {
        //     console.log('004 error', error)
        // });

    },
    onlyDeploy() {

        try {
            let cccc = myContract.deploy({ data: bytecode },function(data){
                console.log("callback",data)

            });
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
            .send({
                from: '0x7386445b7C0022FB0c6B08466a8E6ae4A97A134b',
                gas: 300000,
                gasPrice: '1000000000'
            }, function (error, transactionHash) {
                console.log("回调开始")
                console.log("error ==> ", error)
                console.log("transactionHash ==> ", transactionHash)
                console.log("回调结束")
            })
            .on('error', function (error) {
                console.log("EVENT:出错啦---要去掉")
                console.log(error)
            })
            //交易hash
            .on('transactionHash', function (transactionHash) {
                console.log('EVENT:交易Hash---要去掉')
                console.log(transactionHash)
            })
            //收据
            .on('receipt', function (receipt) {
                console.log('EVENT:收据---要去掉')
                console.log(receipt)
                console.log(receipt.contractAddress)
            })
            // 确认数
            .on('confirmation', function (confirmationNumber, receipt) {
                console.log('EVENT:确认数---要去掉')
                console.log(confirmationNumber)
                console.log(receipt.status)
            })
            .then(function (newContractInstance) {
                console.log('新合约实例')
                console.log(newContractInstance.options.address) // instance with the new contract address
            })
            .catch(function (error) {
                console.log('catch error', error)
            });
    },

    methods() {
        myContract.methods.testSend1()
            .send({
                from: '0x7386445b7C0022FB0c6B08466a8E6ae4A97A134b',
                gas: 300000,
                gasPrice: '1000000000'
            }, function (error, transactionHash) {
                console.log("回调")
                console.log("error ==> ", error)
                console.log("transactionHash ==> ", transactionHash)
            })
            .on('error', function (error) {
                console.log("EVENT:出错啦")
                console.log(error)
            })
            //交易hash
            .on('transactionHash', function (transactionHash) {
                console.log('EVENT:交易Hash', transactionHash)
            })
            //收据
            .on('receipt', function (receipt) {
                console.log('EVENT:收据')
                console.log(receipt.transactionHash)
            })
            // 确认数
            .on('confirmation', function (confirmationNumber, receipt) {
                console.log('EVENT:确认数')
                console.log(confirmationNumber)
                // console.log(receipt)
            })
            .then(function (newContractInstance) {
                console.log('新合约实例')
                console.log(newContractInstance) // instance with the new contract address
            })


        // myContract.methods.testSend2(200, 201)
        //     .send(
        //         { from: "0x7386445b7C0022FB0c6B08466a8E6ae4A97A134b", gas: 300000, gasPrice: '1000000000' }
        //     )
        //     .then(data => {
        //         console.log('testSend2 data', data)
        //     }).catch(function (error) {
        //         console.log('testSend2 error', error)
        //     });
    }
};
utility.init();