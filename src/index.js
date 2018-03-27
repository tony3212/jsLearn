var formulaObj = formulaObj || {};

function $log(text, style) {
    var styleStr = "", template;
    if ($.isPlainObject(style)) {
        $.each(style, function (key, value) {
            styleStr += key + ":" + value + ";"
        });
    }

    template = '<li style="<%= style%>"><%= content%></li>'

    $("#main").append(_.template(template, {style: styleStr, content: text}));
}

function $warn(text) {
    $log(text, {color: "red"});
}

/**
 * @typedef {object} FormulaNode 公式节点
 * @property {string} type 节点类型
 * @property {string} formula 公式
 * @property {object} formulaObject 公式对应的对象
 * @property {?(null | [FormulaNode])} children 孩子节点
 *
 * @typedef {object} Symbol 公式元素
 * @property {string} STARTER 起始符
 * @property {string} TERMINATOR 结束符
 */

$.extend(formulaObj, {
    /**
     * 创建文本节点
     * @param text 普通文本
     * @returns {{FormulaNode}}
     * @private
     */
    _createTextFormulaNode: function (text) {
        return {
            type: "TEXT",
            formula: text,
            formulaObject: text,
            children: null
        };
    },

    /**
     * 创建一个空的
     * @returns {{FormulaNode}}
     * @private
     */
    _createEmptyFormulaNode: function () {
        return {
            type: null,
            formula: null,
            formulaObject: null,
            children: null
        };
    },

    /**
     * 创建操作符节点
     * @returns {{FormulaNode}}
     * @private
     */
    _createOperatorFormulaNode: function (operator) {
        return {
            type: "OPERATOR",
            formula: null,
            formulaObject: null,
            children: null
        };
    },

    /**
     * TODO
     * @param formulaTree
     * @returns {*}
     * @private
     */
    _getParentFormulaNode: function (formulaTree) {
        return formulaTree[formulaTree.length - 1];
    },

    /**
     * TODO
     * @param formulaTree
     * @returns {*}
     * @private
     */
    _getLastFormulaNode: function (formulaTree) {
        return formulaTree[formulaTree.length - 1];
    },

    /**
     * 增加一个孩子节点
     * @param {FormulaNode} formulaNode
     * @private
     */
    _addFormulaChild: function (formulaNode) {
        formulaNode.children || (formulaNode.children = []);
        formulaNode.children.push(formulaNode);
    }
});

$.extend(formulaObj, {
    /** 初始化是否完成 */
    initialComplete: false,

    /** 操作符 */
    OPERATOR: {
        ADD: "+",
        SUBTRACT: "-",
        MULTIPLY: "*",
        DIVIDE: "/"
    },

    SYMBOL: {
        // 【会计科目】起始、结束符
        SUBJECT: {
            STARTER: "[K",
            TERMINATOR: "]"
        },

        // 【表间取值】起始、结束符
        M_SHEET: {
            STARTER: "{",
            TERMINATOR: "}"
        },

        // 【常用字】（其它）起始、结束符
        COMMON_WORD: {
            STARTER: "#",
            TERMINATOR: "#"
        },

        // 【单元格】起始、结束符
        SHEET: {
            STARTER: "<",
            TERMINATOR: ">"
        },

        // 【求和】起始、结束符
        SUM: {
            STARTER: "SUM(",
            TERMINATOR: ")"
        },

        // 【求和】起始、结束符
        IF: {
            STARTER: "IF#",
            TERMINATOR: "#IF"
        },

        // 【求和】起始、结束符
        GROUP: {
            STARTER: "(",
            TERMINATOR: ")"
        }
    },

    CONST_LIST: {
        STARTER: [],
        TERMINATOR: [],
        OPERATOR: [],
    },

    /** 是否为操作符 */
    _isOperator: function (text) {
        return _.contains(this.CONST_LIST.OPERATOR, text);
    },

    /** 是否为起始符 */
    _isStarter: function (text) {
        return _.contains(this.CONST_LIST.STARTER, text);
    },

    /** 是否为结束符 */
    _isTerminator: function (text) {
        return _.contains(this.CONST_LIST.TERMINATOR, text);

    },

    /**
     * 遍历公式元素
     * @param {function} callback 回调函数
     * @private
     */
    _forEachSymbol: function (callback) {
        $.each(this.SYMBOL, callback);
    },

    /**
     * 在给定的文件中查找启起符结果
     *
     * @param matchingText
     * @typedef {object} SearchMapping
     * @property {Symbol} symbol
     * @property {string} beforeContext
     *
     * @returns {(null | SearchMapping)}
     *
     * @example
     * _findStarter('abc+')
     * =>
     * {"symbol":{"ADD":"+"},"beforeContext":"abc"}
     *
     * @private
     */
    _findOperator: function (matchingText) {
        var self = this, result = null;

        $.each(self.OPERATOR, function (key, operator) {
            var index = String(matchingText).indexOf(operator);

            if (index >= 0) {
                result = {
                    symbol: $.extend(true, {}, _.object([key], [operator])),
                    beforeContext: String(matchingText).substring(0, index)
                };
                return false;
            }
        });
        return result;
    },

    /**
     * 在给定的文件中查找启起符结果
     *
     * @param matchingText
     * @typedef {object} SearchMapping
     * @property {Symbol} symbol
     * @property {string} beforeContext
     *
     * @returns {(null | SearchMapping)}
     *
     * @example
     * _findStarter('abc3#corpName#')
     * =>
     * {"symbol":{"COMMON_WORD":{"STARTER":"#","TERMINATOR":"#"}},"beforeContext":" abc3"}
     *
     * @private
     */
    _findStarter: function (matchingText) {
        var result = null;

        this._forEachSymbol(function (key, mark) {
            var index = String(matchingText).indexOf(mark.STARTER);

            if (index >= 0) {
                result = {
                    symbol: $.extend(true, {}, _.object([key], [mark])),
                    beforeContext: String(matchingText).substring(0, index)
                };
                return false;
            }
        });
        return result;
    },

    /**
     * 在给定的文件中查找启起符结果
     *
     * @param matchingText
     * @typedef {object} SearchMapping
     * @property {Symbol} symbol
     * @property {string} beforeContext
     *
     * @returns {(null | SearchMapping)}
     *
     * @example
     * _findTerminator('a13>')
     * =>
     * {"symbol":{"SHEET":{"STARTER":"<","TERMINATOR":">"}},"beforeContext":"a13"}
     *
     * @private
     */
    _findTerminator: function (matchingText) {
        var result = null;

        this._forEachSymbol(function (key, mark) {
            var index = String(matchingText).indexOf(mark.TERMINATOR);

            if (index >= 0) {
                result = {
                    symbol: $.extend(true, {}, _.object([key], [mark])),
                    beforeContext: String(matchingText).substring(0, index)
                };
                return false;
            }
        });
        return result;
    },

    _getSymbolName: function (symbol) {
        return symbol != null ? _.keys(symbol)[0] : null;
    },

    _getSymbolValue: function (symbol) {
        return symbol != null ? _.values(symbol)[0] : null;
    },

    /** 初始化 */
    init: function () {
        var self = this, symbol = self.SYMBOL, operator = self.OPERATOR, constList = self.CONST_LIST;

        if (self.initialComplete) {
            return;
        }

        $.each(symbol, function (index, mark) {
            mark.STARTER && constList.STARTER.push(mark.STARTER);
            mark.TERMINATOR && constList.TERMINATOR.push(mark.TERMINATOR);
        });

        $.each(operator, function (index, oper) {
            constList.OPERATOR.push(oper);
        });
        $log("constList STARTER：" + constList.STARTER);
        $log("constList TERMINATOR：" + constList.TERMINATOR);
        $log("constList OPERATOR：" + constList.OPERATOR);
    },

    /**
     * 解析公式
     * @typedef {object} resoleVo 解析vo
     * @property {number} index 顺号
     * @property {string} mark 标记
     *
     */
    resolve: function (formula) {
        var self = this, resolvingSymbolArray = [], matchingText = "",
            formulaTree = [];

        $log("formula is :" + formula, {
            "color": "skyblue",
            "padding": "20px 10px"
        });

        var startTerminalSame = false, operateResult,
            starterResult, starterSymbol, starterSymbolValue,
            terminatorResult, terminatorSymbol, terminatorSymbolValue,
            parentFormulaNode, emptyFormulaNode;

        for (var i = 0, length = formula.length; i < length; i++) {
            matchingText += formula[i];
            $log(matchingText);

            // 1.操作符
            operateResult = self._findOperator(matchingText);
            if (operateResult != null) {
                $log("operateResult: " + JSON.stringify(operateResult));
                if (operateResult.beforeContext !== "") {
                    formulaTree.push(self._createTextFormulaNode(operateResult.beforeContext));
                }
                formulaTree.push(self._createOperatorFormulaNode(operateResult.symbol));
                matchingText = "";
                continue;
            }

            // 2.匹配起始符
            starterResult = self._findStarter(matchingText);
            if (starterResult != null && !startTerminalSame) {
                $warn("starterResult: " + JSON.stringify(starterResult));

                // 2.1增加普通文本节点
                if (starterResult.beforeContext !== "") {
                    formulaTree.push(self._createTextFormulaNode(starterResult.beforeContext));
                }

                // 2.2增加公式元素节点
                emptyFormulaNode = self._createEmptyFormulaNode();
                if (_.size(resolvingSymbolArray) === 0) {
                    formulaTree.push(emptyFormulaNode);
                } else {
                    parentFormulaNode = self._getParentFormulaNode(formulaTree);
                    self._addFormulaChild(parentFormulaNode);
                }


                starterSymbol = starterResult.symbol;
                starterSymbolValue = self._getSymbolValue(starterSymbol);
                // 启起符与结束符如果相同，则标记一下，以区分下次出现该符号时不当作起始符对待
                starterSymbolValue.STARTER === starterSymbolValue.TERMINATOR && (startTerminalSame = true);

                resolvingSymbolArray.push({
                    index: i - starterSymbolValue.STARTER.length + 1,
                    symbol: starterSymbol,
                    symbolName: self._getSymbolName(starterSymbol)
                });
                matchingText = "";
                continue;
            }

            // 3.匹配结束符
            terminatorResult = self._findTerminator(matchingText);
            if (terminatorResult != null) {
                $warn("terminatorResult: " + JSON.stringify(terminatorResult));
                terminatorSymbol = terminatorResult.symbol;
                terminatorSymbolValue = self._getSymbolValue(terminatorSymbol);
                starterResult = resolvingSymbolArray.pop();
                if (starterResult === undefined) {
                    throw new Error("报表公式不正确");
                }
                if (self._getSymbolName(starterResult.symbol) !== self._getSymbolName(terminatorSymbol)) {
                    throw new Error("报表公式不正确");
                }
                self._getLastFormulaNode(formulaTree);

                terminatorSymbolValue.STARTER === terminatorSymbolValue.TERMINATOR && (startTerminalSame = false);
                matchingText = "";
            }
        }
        $log("resolvingSymbolArray:" + JSON.stringify(resolvingSymbolArray, null, "\t"));
    }
});

formulaObj.init();
var testFormula = " abc3#corpName#";
formulaObj.resolve(testFormula);
// formulaObj.resolve("#corpName# + [K1001,^S0^G20^Y:0^M:0^E0] + ({11_01!<C3>})");
// formulaObj.resolve(" abc3#corpName# + [K1001,^S0^G20^Y:0^M:0^E0] + ({11_01!<C3>})");
// formulaObj.resolve("{13_01!<C41>}");
// formulaObj.resolve("SUM(<C1>:<C2>)");
