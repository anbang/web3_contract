var interfaceFile = require('./interface.json');
const HDWalletProvider = require("truffle-hdwallet-provider");
let bytecode = '0x608060405234801561001057600080fd5b506102a9806100206000396000f3fe60806040526004361061008d576000357c0100000000000000000000000000000000000000000000000000000000900480631b56fda01161006b5780631b56fda0146101345780634f9d719e1461014957806364c7133b14610151578063b819499e1461017b5761008d565b80630dbe671f146100925780630f682008146100b9578063125d9d9014610102575b600080fd5b34801561009e57600080fd5b506100a7610190565b60408051918252519081900360200190f35b3480156100c557600080fd5b506100e9600480360360408110156100dc57600080fd5b5080359060200135610196565b6040805192835260208301919091528051918290030190f35b34801561010e57600080fd5b506101326004803603604081101561012557600080fd5b50803590602001356101d8565b005b34801561014057600080fd5b5061013261021c565b610132610223565b34801561015d57600080fd5b506100a76004803603602081101561017457600080fd5b5035610258565b34801561018757600080fd5b506100a7610277565b60005481565b6000806001848154811015156101a857fe5b90600052602060002001546001848154811015156101c257fe5b9060005260206000200154915091509250929050565b60018054808201825560008290527fb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf690810193909355805480820190915590910155565b6001600055565b6040805134815290517f260823607ceaa047acab9fe3a73ef2c00e2c41cb01186adc4252406a47d734469181900360200190a1565b600180548290811061026657fe5b600091825260209091200154905081565b6000549056fea165627a7a7230582081e0463af8dcbfeda13f7bbdbe11dc8e87e83639f3825782a0e7918a1fe26b980029';

let rinkebyUrl = 'https://rinkeby.infura.io/uIkf4qZgOSqDV0Ir5np1';
const mnemonic = "F9F8F1A056C8F00D176807CE4FF89BE34D95BD751795C1687FE5F14A86A5A146"; // 12 word mnemonic
let provider = new HDWalletProvider(mnemonic, rinkebyUrl);

// console.log(provider);
var Web3 = require('web3');
var web3 = new Web3(provider);
// var myContract = new web3.eth.Contract(interfaceFile);
var myContract = new web3.eth.Contract(interfaceFile);

// let Contract = require('web3-eth-contract');
// Contract.setProvider(rinkebyUrl);
// let myContract = new Contract(interfaceFile);

// console.log(myContract)

// 属性
console.log(myContract.options);
console.log(myContract.options.address);

// console.log(myContract.options.address)
// console.log(myContract.options.jsonInterface)

//方法
console.log("\n方法------------------------------ ");
let myContract2 = myContract.clone();
myContract2.options.address = '0x0223fc70574214F65813fE336D870Ac47E147fAe'
console.log(myContract.options.address);
console.log(myContract2.options.address);

web3.eth.getAccounts(console.log);

myContract.deploy({
    data: bytecode
})
    .send({
        from: '0x7386445b7C0022FB0c6B08466a8E6ae4A97A134b',
        gas: 3000000,
        gasPrice: '1000000000'
    }, function (error, transactionHash) {
        console.log("error ==> ", error)
        console.log("transactionHash ==> ", transactionHash)
    })
    .on('error', function (error) {
        console.log("------ error")
        console.log(error)
    })
    //交易hash
    .on('transactionHash', function (transactionHash) {
        console.log('------ transactionHash')
        console.log(transactionHash)
    })
    //收据
    .on('receipt', function (receipt) {
        console.log('------ receipt')
        console.log(receipt)
        console.log(receipt.contractAddress)
    })
    // 确认数
    .on('confirmation', function (confirmationNumber, receipt) {
        console.log('------ confirmation')
        console.log(confirmationNumber)
        console.log(receipt.status)
    })
    .then(function (newContractInstance) {
        console.log('------ newContractInstance')
        console.log(newContractInstance.options.address) // instance with the new contract address
    });