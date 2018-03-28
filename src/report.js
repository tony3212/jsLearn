var formulaObj = formulaObj || {};

var Logger = {
    LEVEL: {
        TRACE: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    },

    level: 0,

    log: function (level, text, style) {
        if (level < this.level) {
            return;
        }

        var styleStr = "", template;
        if ($.isPlainObject(style)) {
            $.each(style, function (key, value) {
                styleStr += key + ":" + value + ";"
            });
        }

        template = '<li style="<%= style%>"><pre><%= content%></pre></li>'

        $("#main").append(_.template(template, {style: styleStr, content: text}));
    },

    trace: function (text) {
        this.log(this.LEVEL.TRACE, text, {color: "grey"});
    },

    info: function (text, style) {
        this.log(this.LEVEL.INFO, text, style);
    },

    warn: function (text) {
        this.log(this.LEVEL.WARN, text, {color: "red"});
    },

    error: function (text) {
        this.log(this.LEVEL.ERROR, text, {color: "red", "font-weight": "bold"});
    },

    seperate: function (text) {
        var fix = "=========================================================";
        this.log(this.LEVEL.WARN, fix + (text || "") + fix, {color: "#FFEF8F"});
    }
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
        Logger.trace("operator:" + JSON.stringify(operator));
        return {
            type: "OPERATOR",
            formula: this._getSymbolValue(operator),
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
    },

    /**
     * 更新节点
     * @param {FormulaNode}formulaNode
     * @param {{index: {number}, symbol: {Symbol}, symbolName: {string}}} starterInfo
     * @param {{index: {number}, symbol: {Symbol}, symbolName: {string}}} terminatorInfo
     * @param {{string}} formula
     * @private
     */
    _updateNode: function (formulaNode, starterInfo, terminatorInfo, formula) {
        Logger.trace("=================updateNode========================");
        Logger.trace(JSON.stringify(formulaNode));
        Logger.trace(JSON.stringify(starterInfo));
        Logger.trace(JSON.stringify(terminatorInfo));

        formulaNode.type = starterInfo.symbolName;
        formulaNode.formula = String(formula).substring(starterInfo.index, terminatorInfo.index + 1);
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
        Logger.trace("constList STARTER：" + constList.STARTER);
        Logger.trace("constList TERMINATOR：" + constList.TERMINATOR);
        Logger.trace("constList OPERATOR：" + constList.OPERATOR);
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

        Logger.seperate("");
        Logger.info("formula is :" + formula, {
            "color": "blue",
            "padding": "10px 10px"
        });

        var startTerminalSame = false, operateResult,
            starterResult, starterSymbol, starterSymbolValue,
            terminatorResult, terminatorSymbol, terminatorSymbolValue,
            parentFormulaNode, emptyFormulaNode, updatingNode,
            starterInfo, terminatorInfo;

        for (var i = 0, length = formula.length; i < length; i++) {
            matchingText += formula[i];
            Logger.trace(matchingText);

            // 1.操作符
            operateResult = self._findOperator(matchingText);
            if (operateResult != null) {
                Logger.info("operateResult: " + JSON.stringify(operateResult));
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
                Logger.info("starterResult: " + JSON.stringify(starterResult));

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
                Logger.info("terminatorResult: " + JSON.stringify(terminatorResult));
                terminatorSymbol = terminatorResult.symbol;
                terminatorSymbolValue = self._getSymbolValue(terminatorSymbol);
                starterInfo = resolvingSymbolArray.pop();
                if (starterResult === undefined) {
                    Logger.error("报表公式不正确");
                    throw new Error("报表公式不正确");
                }
                if (self._getSymbolName(starterInfo.symbol) !== self._getSymbolName(terminatorSymbol)) {
                    Logger.error("报表公式不正确");
                    throw new Error("报表公式不正确");
                }
                updatingNode = self._getLastFormulaNode(formulaTree);
                terminatorInfo = {
                    index: i,
                    symbol: terminatorSymbol,
                    symbolName: self._getSymbolName(terminatorSymbol)
                }
                // 更新节点
                self._updateNode(updatingNode, starterInfo, terminatorInfo, formula);

                terminatorSymbolValue.STARTER === terminatorSymbolValue.TERMINATOR && (startTerminalSame = false);
                matchingText = "";
            }
        }
        Logger.warn("formulaObject:" + JSON.stringify(formulaTree, null, "\t"));
        Logger.seperate("");
    }
});

formulaObj.init();
formulaObj.resolve(" abc3#corpName#");
formulaObj.resolve("[K1001,1002,^S1^G20^Y:3^M:1^E0]+#queryBeginPeriod#+[K1604,1605,^S1^G20^Y2010:3^M6:1^E0]");
// formulaObj.resolve("#corpName# + [K1001,^S0^G20^Y:0^M:0^E0] + ({11_01!<C3>})");
// formulaObj.resolve(" abc3#corpName# + [K1001,^S0^G20^Y:0^M:0^E0] + ({11_01!<C3>})");
// formulaObj.resolve("{13_01!<C41>}");
// formulaObj.resolve("SUM(<C1>:<C2>)");
