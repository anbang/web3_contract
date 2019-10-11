let options = {};

let _address = "hangzhou";
let _name = 'anbang';
let _age = 10;

Object.defineProperty(options, 'name', {
    set: function (value) {
        if (value) {
            _name = value;
        }
    },
    get: function () {
        return _name;
    },
    enumerable: true
});

Object.defineProperty(options, 'age', {
    set: function (value) {
        if (value) {
            _age = value;
        }
    },
    get: function () {
        return Number(_age);
    },
    enumerable: true
});

Object.defineProperty(options, 'address', {
    set: function (value) {
        if (value) {
            _address = value;
        }
    },
    get: function () {
        return _address;
    },
    enumerable: false
});
options.zzz = 123

console.log(options)

for (item in options) {
    console.log(`\n${item}:${options[item]}`);
    switch (item) {
        case 'name':
            console.log("switch name", options[item])
            break;
        case 'age':
            console.log("switch age", options[item])
            break;
        default:
            console.log("switch default", options[item])
    }
}