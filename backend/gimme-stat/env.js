let convict = require('convict');
let configFile = require('./default-config');

convict.addFormat({
    name: 'Dictionary',
    validate: function (val) {
        return true;
    },
    coerce: function (val) {
        return val
    }
});

let config = convict({
    barSize: {
        format: 'int',
        default: 100,
        arg: 'barsize'
    },
    daily: {
        format: Boolean,
        default: true,
        arg: 'daily'
    },
    since: {
        format: 'String',
        default: '1.months',
        arg: 'since',
    },
    table: {
        format: 'Boolean',
        default: false,
        arg: 'table',
    },
    init: {
        format: 'Boolean',
        default: false,
        arg: 'init',
    },
    prepull: {
        format: 'Boolean',
        default: false,
        arg: 'prepull',
    },
    lmargin: {
        format: 'nat',
        default: 12,
        arg: 'lmargin',
    },
    cwd: {
        format: 'Array',
        default: '',
        arg: 'cwd',
    },
    appendToMd: {
        format: '*',
        default: false,
        arg: 'appendtomd'
    },
    until: {
        format: 'String',
        default: "",
        arg: 'until',
    },
    userAliases: {
        format: "Array",
        default: "",
        arg: 'useraliases'
    },
    users: {
        format: "Array",
        default: "",
        arg: 'users'
    },
    ignoreUsers: {
        format: Array,
        default: []
    },
    statIgnore: {
        format: Array,
        default: []
    },
    statExtensions: {
        format: Array,
        default: []
    },


});

config.load(configFile);



config.validate({ allowed: 'strict' });

let result = config.getProperties();

let values = result.userAliases;
let obj = {};
for (let keyValue of values) {
    let kv = keyValue.split('>');
    obj[kv[0]] = kv[1];
}
result.userAliases = obj;

module.exports = result;