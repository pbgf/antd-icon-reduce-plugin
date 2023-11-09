function _array_like_to_array(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes(arr) {
    if (Array.isArray(arr)) return arr;
}
function _class_call_check(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}
function _defineProperties(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
}
function _iterable_to_array_limit(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _s, _e;
    try {
        for(_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true){
            _arr.push(_s.value);
            if (i && _arr.length === i) break;
        }
    } catch (err) {
        _d = true;
        _e = err;
    } finally{
        try {
            if (!_n && _i["return"] != null) _i["return"]();
        } finally{
            if (_d) throw _e;
        }
    }
    return _arr;
}
function _non_iterable_rest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _sliced_to_array(arr, i) {
    return _array_with_holes(arr) || _iterable_to_array_limit(arr, i) || _unsupported_iterable_to_array(arr, i) || _non_iterable_rest();
}
function _unsupported_iterable_to_array(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array(o, minLen);
}
var fs = require("fs");
var path = require("path");
var iconDist = require("@ant-design/icons/lib/dist");
var HarmonyImportDependencyParserPlugin = require("webpack/lib/dependencies/HarmonyImportDependencyParserPlugin.js");
var initIcons = [];
var addIconArr = [];
var validTypeArr = [
    "Literal",
    "StringLiteral"
];
var tempFilePath = "";
// antd message用到的icon
var messageIcons = [
    {
        type: "info-circle",
        theme: "filled"
    },
    {
        type: "check-circle",
        theme: "filled"
    },
    {
        type: "close-circle",
        theme: "filled"
    },
    {
        type: "exclamation-circle",
        theme: "filled"
    },
    {
        type: "loading",
        theme: "outlined"
    }
];
// antd notification用到的icon
var notificationIcons = [
    "check-circle",
    "info-circle",
    "close-circle",
    "exclamation-circle"
];
var typographyIcons = [
    "copy",
    "edit",
    "check"
];
var antdIconReduceSpecifierTag = Symbol("antd-icon-reduce");
function isArray(arrLike) {
    return Object.prototype.toString.call(arrLike) === "[object Array]";
}
function isCreateIcon(astParam) {
    return isEleType(astParam, "_icon");
}
function isButton(astParam) {
    return isEleType(astParam, "_button");
}
function isEleType(astParam, evarype) {
    if (Object.hasOwnProperty.call(astParam, "name") && astParam.name.toLowerCase() === evarype) {
        return true;
    }
    if (Object.hasOwnProperty.call(astParam, "object") && astParam.object.name && astParam.object.name.toLowerCase() === evarype) {
        return true;
    }
    return false;
}
function getIconProps(astParam) {
    return getEleProps(astParam, [
        "type",
        "theme"
    ], true);
}
function getBtnProps(astParam) {
    return getEleProps(astParam, [
        "icon",
        "loading"
    ]);
}
function isValidIconType(node) {
    return validTypeArr.indexOf(node.type) >= 0;
}
function getEleProps(astParam) {
    var propKeys = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : [], isIcon = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
    var result = {};
    if (isArray(astParam)) {
        for(var i = 0; i < astParam.length; i++){
            var keyName = astParam[i].key && astParam[i].key.name;
            if (isIcon && keyName === "type") {
                if (astParam[i].value.type === "ConditionalExpression") {
                    result[keyName] = [];
                    if (isValidIconType(astParam[i].value.consequent)) {
                        result[keyName].push(astParam[i].value.consequent.value);
                    }
                    if (isValidIconType(astParam[i].value.alternate)) {
                        result[keyName].push(astParam[i].value.alternate.value);
                    }
                } else if (isValidIconType(astParam[i].value)) {
                    result[keyName] = astParam[i].value.value;
                }
            } else if (!isIcon && keyName === "icon") {
                if (isValidIconType(astParam[i].value)) {
                    result[keyName] = astParam[i].value.value;
                }
            } else if (!isIcon && keyName === "loading") {
                result.loading = true;
            } else if (propKeys.indexOf(keyName) >= 0 && astParam[i].value.value) {
                result[keyName] = astParam[i].value.value;
            }
        }
    }
    return result;
}
function searchIcons() {
    var icons = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
    icons.forEach(function(iconItem) {
        if (typeof iconItem === "object") {
            searchIconByName(iconItem.type, iconItem.theme);
        } else {
            searchIconByName(iconItem);
        }
    });
}
function searchIconByName(name) {
    var theme = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "outline";
    if (!name) {
        return;
    }
    var themeLowercase = (theme === "filled" ? "fill" : theme).toLowerCase();
    var iconExportKey = Object.keys(iconDist).find(function(key) {
        return iconDist[key].name.toLowerCase() === name && iconDist[key].theme === themeLowercase;
    });
    if (iconExportKey && addIconArr.indexOf(iconExportKey) < 0) {
        var iconObj = iconDist[iconExportKey];
        var content = "export {\ndefault as ".concat(iconExportKey, "\n} from '@ant-design/icons/lib/").concat(iconObj.theme, "/").concat(iconExportKey, "';\n");
        writeTempFile(content, iconExportKey);
        addIconArr.push(iconExportKey);
    }
}
function writeTempFile(content, iconExportName) {
    if (!tempFilePath) {
        return;
    }
    if (!fs.existsSync(tempFilePath)) {
        fs.writeFileSync(tempFilePath, "");
    }
    var iconFileContent = fs.readFileSync(tempFilePath).toString();
    if (iconFileContent.indexOf(iconExportName) < 0) {
        fs.appendFileSync(tempFilePath, content);
    }
}
var AntdIconReducePlugin = /*#__PURE__*/ function() {
    "use strict";
    function AntdIconReducePlugin() {
        var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        _class_call_check(this, AntdIconReducePlugin);
        // 在应用默认选项前，先应用用户指定选项
        // 合并后的选项暴露给插件方法
        // 记得在这里校验所有选项
        // this.options = { ...options };
        tempFilePath = options.filePath;
        searchIcons(messageIcons);
        searchIcons(notificationIcons);
        searchIcons(typographyIcons);
    }
    _create_class(AntdIconReducePlugin, [
        {
            key: "apply",
            value: function apply(compiler) {
                var alias = compiler.options.resolve.alias;
                if (alias) {
                    alias["@ant-design/icons/lib/dist$"] = tempFilePath;
                } else {
                    compiler.options.resolve.alias = {
                        "@ant-design/icons/lib/dist$": tempFilePath
                    };
                }
                compiler.hooks.normalModuleFactory.tap("antd-icon-reduce", function(factory) {
                    factory.hooks.parser.for("javascript/auto").tap("antd-icon-reduce", function(parser, options) {
                        parser.hooks.callMemberChain.for(HarmonyImportDependencyParserPlugin.harmonySpecifierTag).tap("antd-icon-reduce", function(expression, properties) {
                            var _expression_callee = expression.callee, object = _expression_callee.object, property = _expression_callee.property;
                            var _expression_arguments = _sliced_to_array(expression.arguments, 2), Identifier = _expression_arguments[0], ObjectExpression = _expression_arguments[1];
                            var isReactCreateFn = object && object.name === "React" && property && property.name === "createElement";
                            if (isReactCreateFn && ObjectExpression && Array.isArray(ObjectExpression.properties)) {
                                if (isCreateIcon(Identifier)) {
                                    var iconProps = getIconProps(ObjectExpression.properties);
                                    if (Object.keys(iconProps).length > 0) {
                                        var type = iconProps.type;
                                        var theme = iconProps.theme || "outline";
                                        if (isArray(type)) {
                                            type.forEach(function(item) {
                                                searchIconByName(item, theme);
                                            });
                                        } else {
                                            searchIconByName(type, theme);
                                        }
                                    }
                                } else if (isButton(Identifier)) {
                                    var btnProps = getBtnProps(ObjectExpression.properties);
                                    Object.keys(btnProps).forEach(function(k) {
                                        searchIconByName(k === "loading" ? k : btnProps[k]);
                                    });
                                }
                            }
                        });
                    });
                });
            }
        }
    ]);
    return AntdIconReducePlugin;
}();
module.exports = AntdIconReducePlugin;

