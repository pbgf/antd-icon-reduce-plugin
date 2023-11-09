const fs = require('fs');
const path = require('path');
const iconDist = require('@ant-design/icons/lib/dist');
const HarmonyImportDependencyParserPlugin = require("webpack/lib/dependencies/HarmonyImportDependencyParserPlugin.js");
var initIcons = [];
var addIconArr = [];
var validTypeArr = ['Literal', 'StringLiteral'];
var tempFilePath = '';
// antd message用到的icon
var messageIcons = [
  { type: 'info-circle', theme: 'filled' },
  { type: 'check-circle', theme: 'filled' },
  { type: 'close-circle', theme: 'filled' },
  { type: 'exclamation-circle', theme: 'filled' },
  { type: 'loading', theme: 'outlined' },
];
// antd notification用到的icon
var notificationIcons = ['check-circle', 'info-circle', 'close-circle', 'exclamation-circle'];
var typographyIcons = ['copy', 'edit', 'check'];
const antdIconReduceSpecifierTag = Symbol("antd-icon-reduce");

function isArray(arrLike) {
  return Object.prototype.toString.call(arrLike) === '[object Array]';
}
function isCreateIcon(astParam) {
  return isEleType(astParam, '_icon');
}
function isButton(astParam) {
  return isEleType(astParam, '_button');
}
function isEleType(astParam, evarype) {
  if (Object.hasOwnProperty.call(astParam, 'name')
      && astParam.name.toLowerCase() === evarype) {
      return true;
  }
  if (Object.hasOwnProperty.call(astParam, 'object')
      && astParam.object.name
      && astParam.object.name.toLowerCase() === evarype) {
      return true;
  }
  return false;
}
function getIconProps(astParam) {
  return getEleProps(astParam, ['type', 'theme'], true);
}
function getBtnProps(astParam) {
  return getEleProps(astParam, ['icon', 'loading']);
}
function isValidIconType(node) {
  return validTypeArr.indexOf(node.type) >= 0;
}
function getEleProps(astParam, propKeys = [], isIcon = false) {
  var result = {};
  if (isArray(astParam)) {
      for (var i = 0; i < astParam.length; i++) {
          var keyName = astParam[i].key && astParam[i].key.name;
          if (isIcon && keyName === 'type') { // Icon组件的type属性
              if (astParam[i].value.type === 'ConditionalExpression') { // type: condition ? 'eye' : 'eye-invisible',
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
          } else if (!isIcon && keyName === 'icon') {
              if (isValidIconType(astParam[i].value)) {
                  result[keyName] = astParam[i].value.value;
              }
          } else if (!isIcon && keyName === 'loading') {
              result.loading = true;
          } else if (propKeys.indexOf(keyName) >= 0 && astParam[i].value.value) {
              result[keyName] = astParam[i].value.value;
          }
      }
  }
  return result;
}
function searchIcons(icons = []) {
  icons.forEach(function(iconItem) {
      if (typeof iconItem === 'object') {
          searchIconByName(iconItem.type, iconItem.theme);
      } else {
          searchIconByName(iconItem);
      }
  });
}
function searchIconByName(name, theme = 'outline') {
  if (!name) {
      return;
  }
  var themeLowercase = (theme === 'filled' ? 'fill' : theme).toLowerCase();
  var iconExportKey = Object.keys(iconDist).find((key) => {
      return iconDist[key].name.toLowerCase() === name && iconDist[key].theme === themeLowercase;
  });
  if (iconExportKey && addIconArr.indexOf(iconExportKey) < 0) {
      var iconObj = iconDist[iconExportKey];
      var content = `export {
default as ${iconExportKey}
} from '@ant-design/icons/lib/${iconObj.theme}/${iconExportKey}';
`;
      writeTempFile(content, iconExportKey);
      addIconArr.push(iconExportKey);
  }
}
function writeTempFile(content, iconExportName) {
  if (!tempFilePath) {
      return;
  }
  if (!fs.existsSync(tempFilePath)) {
      fs.writeFileSync(tempFilePath, '');
  }
  var iconFileContent = fs.readFileSync(tempFilePath).toString();
  if (iconFileContent.indexOf(iconExportName) < 0) {
      fs.appendFileSync(tempFilePath, content);
  }
}
class AntdIconReducePlugin {
  constructor(options = {}) {
    // 在应用默认选项前，先应用用户指定选项
    // 合并后的选项暴露给插件方法
    // 记得在这里校验所有选项
    // this.options = { ...options };
    tempFilePath = options.filePath;
    searchIcons(messageIcons);
    searchIcons(notificationIcons);
    searchIcons(typographyIcons);
  }
  apply(compiler) {
    const { alias } = compiler.options.resolve;
    if (alias) {
      alias['@ant-design/icons/lib/dist$'] = tempFilePath;
    } else {
      compiler.options.resolve.alias = {
        '@ant-design/icons/lib/dist$': tempFilePath,
      }
    }
    compiler.hooks.normalModuleFactory.tap('antd-icon-reduce', (factory) => {
      factory.hooks.parser
        .for('javascript/auto')
        .tap('antd-icon-reduce', (parser, options) => {
          parser.hooks.callMemberChain.for(HarmonyImportDependencyParserPlugin.harmonySpecifierTag).tap('antd-icon-reduce', (expression, properties) => {
            var { object, property } = expression.callee;
            var [ Identifier, ObjectExpression ] = expression.arguments;
            var isReactCreateFn = object && object.name === 'React' && property && property.name === 'createElement';
            if (isReactCreateFn && ObjectExpression && Array.isArray(ObjectExpression.properties)) {
              if (isCreateIcon(Identifier)) {
                  var iconProps = getIconProps(ObjectExpression.properties);
                  if (Object.keys(iconProps).length > 0) {
                      var type = iconProps.type;
                      var theme = iconProps.theme || 'outline';
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
                      searchIconByName(k === 'loading' ? k : btnProps[k]);
                  });
              }
            }
          });
        });
    });
  }
}

module.exports = AntdIconReducePlugin;
