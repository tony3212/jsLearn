var Logger = {
    LEVEL: {
        TRACE: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    },

    level: 1,

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

        text = $('<div/>').text(text).html()
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

    separate: function (text) {
        var fix = "=========================================================";
        this.log(this.LEVEL.WARN, fix + (text || "") + fix, {color: "#FFEF8F"});
    }
}


var formulaResolver = formulaResolver || {};

/**
 * @typedef {Object} FormulaNode 公式节点
 * @property {string} type 节点类型
 * @property {string} formula 公式
 * @property {Object} formulaVo 公式对应的对象
 * @property {?(null | [FormulaNode])} children 孩子节点
 *
 * @typedef {Object} SymbolValue 公式元素值
 * @property {string} STARTER 起始符
 * @property {string} TERMINATOR 结束符
 * @property {boolean} LEAF 是否基本公式
 *
 * @typedef {Object.<string, SymbolValue>} Symbol 公式元素
 */

$.extend(formulaResolver, {
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
            formulaVo: text,
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
            formulaVo: null,
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
            formulaVo: null,
            children: null
        };
    },

    /**
     * TODO
     * @param resolvingSymbolArray
     * @returns {*}
     * @private
     */
    _getParentFormulaNode: function (resolvingSymbolArray) {
        return _.size(resolvingSymbolArray) === 0
            ? null :
            resolvingSymbolArray[resolvingSymbolArray.length - 1].formulaNode;
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
     * @param {FormulaNode} parentNode 父节点
     * @param {FormulaNode} childNode 子节点
     * @private
     */
    _addFormulaChild: function (parentNode, childNode) {
        parentNode.children || (parentNode.children = []);
        parentNode.children.push(childNode);
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

$.extend(formulaResolver, {
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
            TERMINATOR: "]",
            LEAF: true
        },

        // 【表间取值】起始、结束符
        M_SHEET: {
            STARTER: "{",
            TERMINATOR: "}",
            LEAF: true,
        },

        // 【常用字(其它)】起始、结束符
        COMMON_WORD: {
            STARTER: "#",
            TERMINATOR: "#",
            LEAF: true
        },

        // 【单元格】起始、结束符
        SHEET: {
            STARTER: "<",
            TERMINATOR: ">",
            LEAF: true
        },

        // 【求和(SUM)】起始、结束符
        SUM: {
            STARTER: "SUM(",
            TERMINATOR: ")",
            LEAF: true
        },

        // 【条件(IF)】起始、结束符
        IF: {
            STARTER: "IF#",
            TERMINATOR: "#IF",
            LEAF: false
        },

        // 【组(Group)】起始、结束符
        GROUP: {
            STARTER: "(",
            TERMINATOR: ")",
            LEAF: false
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
     * @typedef {Object} SearchMapping
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
                    symbol: $.extend(true, {}, _.Object([key], [operator])),
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
     * @typedef {Object} SearchMapping
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
                    symbol: $.extend(true, {}, _.Object([key], [mark])),
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
     * @param {string} matchingText
     * @param {Symbol} symbol
     *
     * @typedef {Object} SearchMapping
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
    _findTerminator: function (matchingText, symbol) {
        var self = this, matchResult, index, result = null;


        // 如果有传symbol时,直接返回匹配结果
        if (symbol) {
            index = String(matchingText).indexOf(self._getSymbolValue(symbol).TERMINATOR)
            return index >= 0
                ? {
                    symbol: $.extend(true, {}, symbol),
                    beforeContext: String(matchingText).substring(0, index)
                }
                : null;
        }

        self._forEachSymbol(function (symbolName, symbolValue) {
            index = String(matchingText).indexOf(symbolValue.TERMINATOR);

            if (index >= 0) {
                matchResult = {
                    symbol: $.extend(true, {}, _.Object([symbolName], [symbolValue])),
                    beforeContext: String(matchingText).substring(0, index)
                };

                if (result == null) {
                    result = matchResult;
                } else if ($.isPlainObject(result)) {
                    result = [result, matchResult];
                } else {
                    result.push(matchResult);
                }
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
     * @typedef {Object} resoleVo 解析vo
     * @property {number} index 顺号
     * @property {string} mark 标记
     *
     */
    resolve: function (formula) {
        var self = this, resolvingSymbolArray = [], matchingText = "",
            formulaTree = [];

        Logger.separate("");
        Logger.info("formula is: " + formula, {
            "color": "blue",
            "padding": "10px 10px"
        });

        var lastResolvingIndex, startTerminalSame = false, resolvingLeaf = false,
            operateResult,
            starterResult, starterSymbol, starterSymbolValue, starterSymbolName,
            terminatorResult, terminatorSymbol, terminatorSymbolValue,
            parentFormulaNode, updatingNode, emptyFormulaNode, emptyTextNode,
            starterInfo, terminatorInfo;

        lastResolvingIndex = -1;
        for (var i = 0, length = formula.length; i < length; i++) {
            matchingText += formula[i];
            Logger.trace(matchingText);

            // 1.匹配操作符
            operateResult = self._findOperator(matchingText);
            if (operateResult != null) {
                Logger.info("operateResult: " + JSON.stringify(operateResult));
                emptyTextNode = operateResult.beforeContext !== ""
                    ? self._createTextFormulaNode(operateResult.beforeContext)
                    : null;
                emptyFormulaNode = self._createOperatorFormulaNode(operateResult.symbol);
                parentFormulaNode = self._getParentFormulaNode(resolvingSymbolArray);
                if (parentFormulaNode == null) {
                    emptyTextNode && formulaTree.push(emptyTextNode);
                    formulaTree.push(emptyFormulaNode);
                } else {
                    emptyTextNode && self._addFormulaChild(parentFormulaNode, emptyTextNode);
                    self._addFormulaChild(parentFormulaNode, emptyFormulaNode);
                }
                formulaTree.push();
                Logger.trace("匹配操作符：" + JSON.stringify(formulaTree));
                matchingText = "";
                lastResolvingIndex = i;
                continue;
            }

            // 2.匹配起始符
            starterResult = self._findStarter(matchingText);
            if (starterResult != null && !startTerminalSame && !resolvingLeaf) {
                Logger.info("starterResult: " + JSON.stringify(starterResult));

                // 2.1增加元素节点
                starterSymbol = starterResult.symbol;
                starterSymbolValue = self._getSymbolValue(starterSymbol);
                // 启起符与结束符如果相同，则标记一下，以区分下次出现该符号时不当作起始符对待
                starterSymbolValue.STARTER === starterSymbolValue.TERMINATOR && (startTerminalSame = true);

                emptyFormulaNode = self._createEmptyFormulaNode();
                // 2.2增加普通文本节点
                emptyTextNode = starterResult.beforeContext !== ""
                    ? self._createTextFormulaNode(starterResult.beforeContext)
                    : null;
                parentFormulaNode = self._getParentFormulaNode(resolvingSymbolArray);
                if (parentFormulaNode == null) {
                    emptyTextNode && formulaTree.push(emptyTextNode);
                    formulaTree.push(emptyFormulaNode);
                } else {
                    emptyTextNode && self._addFormulaChild(parentFormulaNode, emptyTextNode);
                    self._addFormulaChild(parentFormulaNode, emptyFormulaNode);
                }

                resolvingSymbolArray.push({
                    index: i - starterSymbolValue.STARTER.length + 1,
                    symbol: starterSymbol,
                    symbolName: self._getSymbolName(starterSymbol),
                    parentFormulaNode: parentFormulaNode,
                    formulaNode: emptyFormulaNode
                });

                starterSymbolValue.LEAF && (resolvingLeaf = true);
                matchingText = "";
                Logger.trace("匹配起始符："+ JSON.stringify(formulaTree));
                continue;
            }

            // 3.匹配结束符
            terminatorResult = self._findTerminator(
                matchingText,
                resolvingLeaf ? _.last(resolvingSymbolArray).symbol : null
            );
            if (terminatorResult != null) {
                Logger.info("terminatorResult: " + JSON.stringify(terminatorResult));

                starterInfo = resolvingSymbolArray.pop();
                starterSymbolName = starterInfo.symbolName;
                if ($.isArray(terminatorResult)) {
                    terminatorResult = _.find(terminatorResult, function (termResult) {
                        return  starterSymbolName === self._getSymbolName(termResult.symbol);
                    });
                }
                terminatorSymbol = terminatorResult.symbol;
                terminatorSymbolValue = self._getSymbolValue(terminatorSymbol);
                if (starterResult === undefined) {
                    Logger.error("报表公式不正确");
                    throw new Error("报表公式不正确");
                }
                if (starterSymbolName !== self._getSymbolName(terminatorSymbol)) {
                    Logger.error("报表公式不正确");
                    throw new Error("报表公式不正确");
                }
                updatingNode = starterInfo.formulaNode;
                terminatorInfo = {
                    index: i,
                    symbol: terminatorSymbol,
                    symbolName: self._getSymbolName(terminatorSymbol)
                }

                emptyTextNode = !resolvingLeaf && terminatorResult.beforeContext !== ""
                    ? self._createTextFormulaNode(terminatorResult.beforeContext)
                    : null;
                parentFormulaNode = starterInfo.formulaNode;
                if (parentFormulaNode == null) {
                    emptyTextNode && formulaTree.push(emptyTextNode);
                } else {
                    emptyTextNode && self._addFormulaChild(parentFormulaNode, emptyTextNode);
                }

                // 更新节点
                self._updateNode(updatingNode, starterInfo, terminatorInfo, formula);

                terminatorSymbolValue.STARTER === terminatorSymbolValue.TERMINATOR && (startTerminalSame = false);
                matchingText = "";
                resolvingLeaf = false;
                lastResolvingIndex = i;
            }
        }
        if (lastResolvingIndex < formula.length - 1) {
            formulaTree.push(self._createTextFormulaNode(formula.substring(lastResolvingIndex + 1)));
        }

        if (_.size(resolvingSymbolArray) > 0) {
            Logger.error("报表公式有误：" + formulaTree);
        }
        Logger.warn("resolve result:" + JSON.stringify(formulaTree, null, "\t"));
        Logger.separate("");
    }
});




// 测试
(function () {
    formulaResolver.init();
// formulaResolver.resolve(" abc3#corpName#");
// formulaResolver.resolve("[K1001,1002,^S1^G20^Y:3^M:1^E0]+#queryBeginPeriod#+[K1604,1605,^S1^G20^Y2010:3^M6:1^E0]");
// formulaResolver.resolve("#corpName# + [K1001,^S0^G20^Y:0^M:0^E0] + ({11_01!<C3>})");
//     formulaResolver.resolve(" abc3#corpName# + [K1001,^S0^G20^Y:0^M:0^E0] + ({11_01!<C3>})");
// formulaResolver.resolve("{13_01!<C41>}");

    //<editor-fold desc="1.测试单个公式">
    // 1.1.测试普通文本
//     Logger.info("1.1.测试普通文本");
//     formulaResolver.resolve("abc");

    // 1.2.测试【会计科目】公式
//     Logger.info("1.2.测试【会计科目】公式");
//     formulaResolver.resolve("[K100101,^S1^G20^Y:0^M:0^E0]");

    // 1.3.测试【表间取值】公式
    Logger.info("1.3.测试【表间取值】公式");
    formulaResolver.resolve("{FSTM_JS0102!<B3>}");

    // 1.4.测试【常用字(其它)】公式
    Logger.info("1.4.测试【常用字(其它)】公式");
    formulaResolver.resolve("#queryTIN#");

    // 1.5.测试 【单元格】公式
    Logger.info("1.5.测试 【单元格】公式");
    formulaResolver.resolve("<C3>");

    // 1.6.测试 【求和(SUM)】公式
    Logger.info(" 1.6.测试 【求和(SUM)】公式");
    formulaResolver.resolve("SUM(<C1>:<C2>)");

    // 1.7.测试 【条件(IF)】公式

    // 1.8.测试 【组(Group)】公式
    Logger.info(" 1.8.测试 【组(Group)】公式");
    formulaResolver.resolve("(1+2)");

    //</editor-fold>

    //<editor-fold desc="2.测试组和公式">
    // 2.1.测试【会计科目】+【表间取值】+【常用字(其它)】
    Logger.info("2.1.测试【会计科目】+【表间取值】+【常用字(其它)】");
    formulaResolver.resolve("[K1001,(1001,)^S1^G41^Y:0^M:0^E0] + {11!<C3>} + #corpName#+#registAddress#");

    /*
    // 2.2.测试(【会计科目】+【表间取值】) +【常用字(其它)】

    // 2.3.测试(【会计科目】+【表间取值】) / (【会计科目】 - 【表间取值】) * 2.5

    //</editor-fold>
    */
})(formulaResolver);

