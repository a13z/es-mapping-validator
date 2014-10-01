var es = require('elasticsearch'),
    Host = require('elasticsearch/src/lib/host'),
    HttpConnector = require('elasticsearch/src/lib/connectors/http'),
    argv = require('optimist')
        .boolean(['r', 'f', 'm'])
        .default('r', true)
        .alias('f', 'fullpath')
        .alias('m', 'mismatches')
        .alias('r', 'tree')
        .alias('h', 'host')
        .alias('i', 'index')
        .alias('t', 'type')
        .alias('d', 'id')
        .alias('a', 'auth')
        .argv;

var host = argv.h;
var index = argv.i;
var type = argv.t;
var id = argv.d;
var offset = 0;
var maxRecursion = 1000;
var treeOutput = argv.t;
var printFullFieldPath = argv.f;
var onlyMismatches = argv.m;
var auth = argv.a;
if (onlyMismatches) {
    printFullFieldPath = true;
    treeOutput = false;
}

HttpConnector.prototype.originalMakeReqParams = HttpConnector.prototype.makeReqParams;
HttpConnector.prototype.makeReqParams = function() {
    var request = HttpConnector.prototype.originalMakeReqParams.apply(this, arguments);
    request.auth = auth;
    return request;
};

var client = new es.Client({
    host: host
});

var mapping;
var document;

var tools = {
    repeat: function(text, count) {
        return new Array(count + 1).join(text);
    }
};

client.get({
    index: index,
    type: type,
    id: id
}, function(error, response) {
    if (!error) {
        document = response._source;

        client.indices.getMapping({
            index: index,
            type: type
        }, function(error, response) {
            if (error) {
                console.log(error);
                process.exit(0);
            }
            console.log('Output format is: <Document Field> [<Mapping Type> - <Document Type>]');
            console.log();
            mapping = response[index].mappings[type].properties;

            for (var fieldKey in document) {
                var fieldValue = document[fieldKey];
                var fieldMapping = getMapping(mapping, fieldKey);
                complexAnalyzeField(fieldKey, fieldValue, fieldMapping, 0, [fieldKey]);
            }
            process.exit(0);
        })
    } else {
        console.log(error);
        process.exit(0);
    }
});

function getValueType(fieldValue) {
    if (fieldValue === null) {
        return 'null';
    } if (fieldValue instanceof Array) {
        if (fieldValue.length > 0) {
            return getValueType(fieldValue[0]);
        } else {
            return 'unknown type of array\'s child';
        }
    } else if (typeof(fieldValue) == 'number') {
        return 'number';
    } else if (typeof(fieldValue) == 'boolean') {
        return 'boolean';
    } else if (typeof(fieldValue) == 'string') {
        return 'string';
    } else if (typeof(fieldValue) == 'object') {
        return 'object';
    } else {
        return 'unknown';
    }
}

function getMappingType(fieldMapping) {
    if (!fieldMapping) {
        return 'undefined';
    } else if (fieldMapping.type) {
        return fieldMapping.type;
    } else if (fieldMapping.properties) {
        return 'object';
    } else {
        throw 'unknown (' + fieldMapping + ')';
    }
}

function getMapping(fieldMapping, fieldKey) {
    if (!fieldMapping) {
        return undefined;
    }
    if (fieldMapping.properties) {
        return fieldMapping.properties[fieldKey];
    }
    return fieldMapping[fieldKey];
}

function isMismatch(mappingType, valueType) {
    if (['integer', 'long', 'float', 'double'].indexOf(mappingType) != -1 && valueType == 'number') {
        return false;
    } else if (['date', 'string'].indexOf(mappingType) != -1 && valueType == 'string') {
        return false;
    } else if (valueType == 'unknown type of array\'s child' || valueType == 'null') {
        return false;
    } else {
        return mappingType != valueType;
    }
}

function complexAnalyzeField(fieldKey, fieldValue, fieldMapping, recursion, fieldStack) {
    var tab = treeOutput ? tools.repeat(' ', offset) : '';
    var fieldValueType = getValueType(fieldValue);
    var mappingType = getMappingType(fieldMapping);

    if (!onlyMismatches || isMismatch(mappingType, fieldValueType)) {
        var printableKey = printFullFieldPath ? fieldStack.join('.') : fieldKey;
        console.log(tab + printableKey + ': [' + mappingType + ' - ' + fieldValueType + ']');
    }

    if (recursion >= maxRecursion) {
        console.log('Max recursion value has exceeded.');
        return;
    }

    if (fieldValue && fieldValue instanceof Array) {
        for (var i = 0; i < fieldValue.length; i++) {
            offset += 4;
            fieldStack.push(fieldKey + '[' + i + ']');
            complexAnalyzeField(fieldKey + '[' + i + ']', fieldValue[i], fieldMapping, recursion + 1, fieldStack);
            fieldStack.pop();
            offset -= 4;
        }
    } else if (fieldValue && typeof(fieldValue) == 'object') {
        for (var key in fieldValue) {
            offset += 4;
            fieldStack.push(key);
            var mapping = getMapping(fieldMapping, key);
            complexAnalyzeField(key, fieldValue[key], mapping, recursion + 1, fieldStack);
            fieldStack.pop();
            offset -= 4;
        }
    } else {
        // Do nothing because it's plain value.
    }
}