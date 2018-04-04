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
    },

    caption: function (text) {
        Logger.info(text, {
            "color": "blue",
            "padding": "10px 10px"
        });
    }
}

//<editor-fold desc="基本解析器">
var logicResolver = {
    GT: {
        /**
         * 匹配 "> 数字|会计科目|表间取值|单元格|求和|分组"的
         * e.g.> [K100101,^S1^G20^Y:0^M:0^E0]中的
         * @returns {RegExp}
         */
        getRegex: function () {
            return />\s*(?=\b\d+\b|\[K|{\w+|<w+|SUM\(|\()/g;
        }
    },

    LT: {
        /**
         * 匹配 "< 数字|会计科目|表间取值|单元格|求和|分组"的
         * e.g.< [K100101,^S1^G20^Y:0^M:0^E0]中的
         * @returns {RegExp}
         */
        getRegex: function () {
            return /<\s*(?=\b\d+\b|\[K|{\w+|<w+|SUM\(|\()/g;
        }
    },

    GE: {
        /**
         * 匹配 ">= 数字|会计科目|表间取值|单元格|求和|分组"的
         * e.g.>= [K100101,^S1^G20^Y:0^M:0^E0]中的
         * @returns {RegExp}
         */
        getRegex: function () {
            return />=\s*(?=\b\d+\b|\[K|{\w+|<w+|SUM\(|\()/g;
        }
    },

    LE: {
        /**
         * 匹配 "<= 数字|会计科目|表间取值|单元格|求和|分组"的
         * e.g.<= [K100101,^S1^G20^Y:0^M:0^E0]中的
         * @returns {RegExp}
         */
        getRegex: function () {
            return /<=\s*(?=\b\d+\b|\[K|{\w+|<w+|SUM\(|\()/g;
        }
    },

    EQ: {
        /**
         * 匹配 "== 数字|会计科目|表间取值|单元格|求和|分组"的
         * e.g.== [K100101,^S1^G20^Y:0^M:0^E0]中的
         * @returns {RegExp}
         */
        getRegex: function () {
            return /<=\s*(?=\b\d+\b|\[K|{\w+|<w+|SUM\(|\()/g;
        }
    },
};

/**
 * @interface
 * @type {{convert2Vo: *}}
 */
var ISymbolResolver = ISymbolResolver || {

    getRegex: function () {
        return null;
    },

    /**
     * 是否是正确的公式
     * @param {string} formula 公式
     * @returns {boolean}
     */
    isValidateFormula: function (formula) {
        return true;
    },

    /**
     * 将基本公式转成vo对象
     * @param formula 基本公式
     * @returns {Object}
     */
    convert2Vo: function (formula) {
        return {};
    },

    /**
     * 将vo转成formula公式
     * @param formulaVo 公式vo
     * @returns {(null | string)} 公式
     */
    convert2Formula: function (formulaVo) {
        return null;
    },

    /**
     * 将vo转成html
     * @param formulaVo 公式vo
     * @param {?string} template 模板
     * @returns {(null | string)} 公式
     */
    convert2Html: function (formulaVo, template) {
        return "";
    }
};

/**
 * 【普通文本】解析器
 * @implements {ISymbolResolver}
 *
 * @typedef {Object} TextFormulaVo 【普通文本VO】
 * @property {string} text 普通文本
 */
var textResolver = $.extend(true, {}, ISymbolResolver, {
    /**
     * 是否是正确的公式
     * @param {?string} [formula] 公式
     * @returns {boolean}
     */
    isValidateFormula: function (formula) {
        return true;
    },

    /**
     * 将基本公式转成vo对象
     * @returns {TextFormulaVo}
     */
    convert2Vo: function (formula) {
        return {text: formula};
    },

    /**
     * 将vo转成formula公式
     * @param {TextFormulaVo} formulaVo 公式vo
     * @returns {(null | string)} 公式
     */
    convert2Formula: function (formulaVo) {
        return formulaVo.text
    },

    /**
     * 将vo转成html
     * @param formulaVo 公式vo
     * @param {?string} template 模板
     * @returns {(null | string)} 公式
     */
    convert2Html: function (formulaVo, template) {
        if ($.trim(formulaVo.text) === "") {
            return "";
        }

        template || (template = '<span class="formula formula_text"><%= text%></span>');
        return String(_.template(template, formulaVo));
    }
});

/**
 * 【会计科目】解析器
 * @implements {ISymbolResolver}
 *
 * @typedef {Object} SubjectFormulaVo 【会计科目公式相关信息】
 * @property {Array} subjectCodeList 会计科目编码集合
 * @property {?Array} oppositeSubjectCodeList 对方会计科目编码集合
 * @property {string} reClassify 否重分类
 * @property {string} valueTypeCode 取值类型
 * @property {?string} acctYear 会计年度
 * @property {?string} acctYearInc 会计年度增减
 * @property {?string} acctMonth 会计期间
 * @property {?string} acctMonthInc 会计期间增减
 * @property {?string} exLossProfit 不含结转凭证
 *
 *
 * @typedef {string} SubjectFormula 会计科目公式，形如[K100201,100202,(2201,2202,)^S1^G41^Y2008^M2^E1]
 */
var subjectResolver = $.extend(true, {}, ISymbolResolver, {
    SYMBOL: {
        /* 开始符 */
        STARTER: "[",
        /* 结束符 */
        TERMINATOR: "]",
        /* 分隔符 */
        SEPARATOR: "^",
        /* 【会计科目】分隔符 */
        SUB_SEPARATOR: ",",
        /* 【会计科目】标记符 */
        SUB_SYMBOL: "K",
        /* 【对方科目】开始符 */
        OPPOSITE_STARTER: "(",
        /* 【对方科目】结束符*/
        OPPOSITE_TERMINATOR: ")",
        /*【是否重分类】标记符*/
        RECLASSIFY: "S",
        /* 【取值类型】标记符*/
        VALUE_TYPE: "G",
        /*【会计年度】标记符*/
        ACCT_YEAR: "Y",
        /*【会计年度增减】标记符*/
        ACCT_YEAR_INC: "Y:",
        /*【会计期间】标记符*/
        ACCT_MONTH: "M",
        /*【会计期间增减】标记符*/
        ACCT_MONTH_INC: "M:",
        /*【【不含结转凭证】标记符*/
        EX_LOSS_PROFIT: "E"
    },

    getRegex: function () {
        return /\[K((?:[^^,()]+,)+)(?:\(([^)]+)\))*.+]/g;
    },

    /**
     * 是否是正确的公式
     * @param {string} formula 公式
     * @returns {boolean}
     */
    isValidateFormula: function (formula) {
        return this.getRegex().test(formula);
    },

    /**
     * 将基本公式转成vo对象
     * @param {String} subjectFormula 基本公式
     * @returns {Object}
     *
     * @example
     *  convert2Vo('{FSTM_JS0102!<B3>}')
     *  =>
     *  {
     *      reportCode: 'FSTM_JS0102',
     *      position: 'B3'
     *  }
     */
    convert2Vo: function (subjectFormula) {
        var self = this;

        if (!self.isValidateFormula(subjectFormula)) {
            return null;
        }

        // 去除科目公式的最后的"]"的符号，e.g.: [K1002,^S1^G21^Y:1^M:-1] => [K1002,^S1^G21^Y:1^M:-1
        subjectFormula = subjectFormula.replace(/]$/, "");
        var matchResult, subjectStr, oppositeSubjectStr, result = {};

        /*
            1.找到【会计科目】与【对方科目】
            正则：K((?:[^^,()]+,)+)(?:\(([^)]+)\))*

            e.g. subjectFormula = [K100201,100202,(2201,2202,)^S1^G41^Y2008^M2^E1]
            =>
            会计科目(1)：100201,100202,
            对方会计科目(2)：2201,2202,
         */
        matchResult = /K((?:[^^,()]+,)+)(?:\(([^)]+)\))*/.exec(subjectFormula);
        if (matchResult != null) {
            // e.g. matchResult[1] = 100201,100202,
            subjectStr = matchResult[1];
            // e.g. 去除空格、去除最后的逗号,再转成数组，subjectCodeList = [100201,100202]
            result.subjectCodeList = self.convert2SubjectCodeList(subjectStr);

            // e.g. matchResult[2] = 2201,2202,
            oppositeSubjectStr = matchResult[2];
            // e.g. 去除空格、去除最后的逗号,再转成数组，oppositeSubjectCodeList = [2201,2202]
            if (oppositeSubjectStr) {
                result.oppositeSubjectCodeList = self.convert2SubjectCodeList(oppositeSubjectStr);
            }
        }

        /*
            2.找到【是否重分类】
            正则：\^S([^^]+)
            e.g. subjectFormula = [K100201,100202,(2201,2202,)^S1^G41^Y2008^M2^E1]
            => reClassify = 1; reClassifyName = 是
         */
        matchResult = /\^S([^^]+)/.exec(subjectFormula);
        if (matchResult != null) {
            result.reClassify = $.trim(matchResult[1]);
        }

        /*
            3.找到【取值类型】
            正则：\^G([^^]+)

            e.g. subjectFormula = [K100201,100202,(2201,2202,)^S1^G41^Y2008^M2^E1]
            => valueTypeCode = 41
         */
        matchResult = /\^G([^^]+)/.exec(subjectFormula);
        if (matchResult != null) {
            result.valueTypeCode = $.trim(matchResult[1]);
        }

        /*
            4.找到【会计年度】
            正则：\^Y([^:^]+)

            e.g. subjectFormula = [K100201,100202,(2201,2202,)^S1^G41^Y2008^M2^E1]
            => acctYear = 2008
         */
        matchResult = /\^Y([^:^]+)/.exec(subjectFormula);
        if (matchResult != null) {
            result.acctYear = $.trim(matchResult[1]);
        }

        /*
            5.找到【会计年度增减】
            正则：\^Y:([^^]+)

            e.g. subjectFormula = [K1002,^S1^G21^Y:1^M:-1]
            => acctYearInc = 1
         */
        matchResult = /\^Y:([^^]+)/.exec(subjectFormula);
        if (matchResult != null) {
            result.acctYearInc = $.trim(matchResult[1]);
        }

        /*
            6.找到【会计期间】
            正则：\^M([^:^]+)

            e.g. subjectFormula = [K100201,100202,(2201,2202,)^S1^G41^Y2008^M2^E1]
            => acctMonth = 2
         */
        matchResult = /\^M([^:^]+)/.exec(subjectFormula);
        if (matchResult != null) {
            result.acctMonth = $.trim(matchResult[1]);
        }

        /*
            7.找到【会计期间增减】
            正则：\^M:([^^]+)

            e.g. subjectFormula = [K1002^S1^G21^Y:1^M:-1]
            => acctMonthInc = -1
         */
        matchResult = /\^M:([^^]+)/.exec(subjectFormula);
        if (matchResult != null) {
            result.acctMonthInc = $.trim(matchResult[1]);
        }

        /*
            8.找到【不含结转凭证】
            正则：\^E([^^]+)

            e.g. subjectFormula = [K100201,100202,(2201,2202,)^S1^G41^Y2008^M2^E1]
            => exLossProfit = 1
         */
        matchResult = /\^E([^^]+)/.exec(subjectFormula);
        if (matchResult != null) {
            result.exLossProfit = $.trim(matchResult[1]);
        }

        return result;
    },

    /**
     * 将vo转成formula公式
     * @param {SubjectFormulaVo} subjectFormulaVo 公式vo
     * @returns {(null | string)} 公式
     */
    convert2Formula: function (subjectFormulaVo) {
        var self = this, result = "", subjectStr = "";

        //region 1.反解析【会计科目】与【对方科目】
        // e.g. subjectCodeList = [100201,100202] => K100201,100202,
        if (_.size(subjectFormulaVo.subjectCodeList) > 0) {
            subjectStr += self.SYMBOL.SUB_SYMBOL + self.convert2SubjectString(subjectFormulaVo.subjectCodeList);
        }
        // e.g. oppositeSubjectCodeList = [2201,2202] => (2201,2202,)
        // subjectStr = K100201,100202,(2201,2202,)
        if (_.size(subjectFormulaVo.oppositeSubjectCodeList) > 0) {
            subjectStr += self.SYMBOL.OPPOSITE_STARTER
                + self.convert2SubjectString(subjectFormulaVo.oppositeSubjectCodeList)
                + self.SYMBOL.OPPOSITE_TERMINATOR;
        }
        //endregion

        result += subjectStr

        // 2.反解析【是否重分类】
        if ($.trim(subjectFormulaVo.reClassify) !== "") {
            // e.g. ^S0
            result += self.SYMBOL.SEPARATOR + self.SYMBOL.RECLASSIFY + $.trim(subjectFormulaVo.reClassify);
        }

        // 3.反解析【取值类型】
        if ($.trim(subjectFormulaVo.valueTypeCode) !== "") {
            // e.g. ^G41
            result += self.SYMBOL.SEPARATOR + self.SYMBOL.VALUE_TYPE + $.trim(subjectFormulaVo.valueTypeCode);
        }

        // 4.反解析【会计年度】
        if ($.trim(subjectFormulaVo.acctYear) !== "") {
            // e.g. ^Y2008
            result += self.SYMBOL.SEPARATOR + self.SYMBOL.ACCT_YEAR + $.trim(subjectFormulaVo.acctYear);
        }

        // 5.反解析【会计年度增减】
        if ($.trim(subjectFormulaVo.acctYearInc) !== "") {
            // e.g. ^Y:1
            result += self.SYMBOL.SEPARATOR + self.SYMBOL.ACCT_YEAR_INC + $.trim(subjectFormulaVo.acctYearInc);
        }

        // 6.反解析【会计期间】
        if ($.trim(subjectFormulaVo.acctMonth) !== "") {
            // e.g. ^M12
            result += self.SYMBOL.SEPARATOR + self.SYMBOL.ACCT_MONTH + $.trim(subjectFormulaVo.acctMonth);
        }

        // 7.反解析【会计期间增减】
        if ($.trim(subjectFormulaVo.acctMonthInc) !== "") {
            // e.g. ^M:1
            result += self.SYMBOL.SEPARATOR + self.SYMBOL.ACCT_MONTH_INC + $.trim(subjectFormulaVo.acctMonthInc);
        }

        // 8.反解析【不含结转凭证】
        if ($.trim(subjectFormulaVo.exLossProfit) !== "") {
            // e.g. ^E1
            result += self.SYMBOL.SEPARATOR + self.SYMBOL.EX_LOSS_PROFIT + $.trim(subjectFormulaVo.exLossProfit);
        }

        // 9.加上会计科目的开始与结束符
        // e.g. result = K1002,^S1^G21^Y:1^M:-1 = > [K1002,^S1^G21^Y:1^M:-1]
        if ($.trim(result) !== "") {
            result = self.SYMBOL.STARTER + result + self.SYMBOL.TERMINATOR;
        }

        return result;
    },

    /**
     * 将vo转成html
     * @param formulaVo 公式vo
     * @param {?string} template 模板
     * @returns {(null | string)} 公式
     */
    convert2Html: function (formulaVo, template) {
        var defaultTemplate = '';

        defaultTemplate += '<span class="formula formula_subject">';
        defaultTemplate += '    K(<%= subjectCodeList %>|<%= reClassify %>|<%= valueTypeCode %>|<%= reClassify %>)';
        defaultTemplate += '</span>';
        template || (template = defaultTemplate);
        return String(_.template(template, formulaVo));
    },

    /**
     * 将科目编码转成字符串的形式
     * e.g. subjectCodeList = [1001,1002] => 1001,1002,
     */
    convert2SubjectString: function (subjectCodeList) {
        var self = this;

        return _.size(subjectCodeList) === 0
            ? ""
            : (subjectCodeList.join(self.SYMBOL.SUB_SEPARATOR) + self.SYMBOL.SUB_SEPARATOR);
    },

    /**
     * 将科目编码的字符串形式转成数组
     * e.g. 去除空格、去除最后的逗号,再转成数组，subjectCodeList = [100201,100202]
     */
    convert2SubjectCodeList: function (subjectStr) {
        var self = this;

        return $.trim(subjectStr) !== ""
            ? subjectStr.replace(/\s*/g, "").replace(/,$/, "").split(self.SYMBOL.SUB_SEPARATOR) : null;
    },

    /**
     * 遍历公式里的所有会计科目公式
     *
     * @param {string} formula 普通公式
     * @param {function} callback 回调函数
     */
    forEachSubjectFormula: function (formula, callback) {
        var subjectRegexp = /\[[^\[\]]+]/g,
            match = subjectRegexp.exec(formula),
            index = -1;

        while (match != null) {
            callback.apply(null, [match[0], ++index]);
            // matched text: match[0]
            // match start: match.index
            // capturing group n: match[n]
            match = subjectRegexp.exec(formula);
        }
    },

    /**
     * 找出会计科目公式，并将其替换成回调里的返回内容
     * @param {string} formula 普通公式
     * @param {function} callback 回调函数
     */
    reduceSubjectFormula: function (formula, callback) {
        var self = this, index = -1;

        return formula.replace(/\[[^\[\]]+]/g, function (subjectFormula) {
            return callback.apply(self, [subjectFormula, ++index]);
        });
    },

    /**
     * 在给定的公式中找出会计科目信息
     * @param formula 普通公式
     */
    getSubjectFormulaVoList: function (formula) {
        var self = this, result = [];

        self.forEachSubjectFormula(formula, function (subjectFormula/*, matchIndex*/) {
            result.push(self.convert2Vo(subjectFormula));
        });
        return result;
    },

    /**
     * 根据给定的【会计科目公式相关信息】替换原有的会计科目
     * @param {string} formula
     * @param {[SubjectFormulaVo]} formulaVoList 【会计科目公式相关信息】数组
     */
    replaceSubjectFormula: function (formula, formulaVoList) {
        var self = this;

        return self.reduceSubjectFormula(formula, function (subjectFormula, matchIndex) {
            return self.convert2Formula(formulaVoList[matchIndex]);
        });
    }
});

/**
 * 【表间取值】解析器
 * @implements {ISymbolResolver}
 */
var mSheetResolver = $.extend(true, {}, ISymbolResolver, {
    getRegex: function () {
        return /{([^}!]+)!<(\w+)>}/g;
    },

    /**
     * 是否是正确的公式
     * @param {string} formula 公式
     * @returns {boolean}
     */
    isValidateFormula: function (formula) {
        return this.getRegex().test(formula);
    },

    /**
     * 将基本公式转成vo对象
     * @param formula 基本公式
     * @returns {Object}
     *
     * @example
     *  convert2Vo('{FSTM_JS0102!<B3>}')
     *  =>
     *  {
     *      reportCode: 'FSTM_JS0102',
     *      position: 'B3'
     *  }
     */
    convert2Vo: function (formula) {
        var self = this, matchResult;

        if (!self.isValidateFormula(formula)) {
            return null;
        }

        matchResult = self.getRegex().exec(formula);
        return matchResult != null
            ? {
                reportCode: matchResult[1],
                position: matchResult[2]
            }
            : null;
    },

    /**
     * 将vo转成formula公式
     * @param formulaVo 公式vo
     * @returns {(null | string)} 公式
     */
    convert2Formula: function (formulaVo) {
        if (formulaVo != null) {
            return _.template("{<%= reportCode %>!<<%= position %>>}", formulaVo);
        }
        return null;
    },

    /**
     * 将vo转成html
     * @param formulaVo 公式vo
     * @param {?string} template 模板
     * @returns {(null | string)} 公式
     */
    convert2Html: function (formulaVo, template) {
        var defaultTemplate = '';

        defaultTemplate += '<span class="formula formula_msheet">';
        defaultTemplate += '    <%= reportCode %>!<%= position %>';
        defaultTemplate += '</span>';
        template || (template = defaultTemplate);
        return String(_.template(template, formulaVo));
    }
});

/**
 * 【常用字(其它)】解析器
 * @implements {ISymbolResolver}
 */
var commonWorldResolver = $.extend(true, {}, ISymbolResolver, {

    getRegex: function () {
        return /#(\w+)#/g;
    },

    /**
     * 是否是正确的公式
     * @param {string} formula 公式
     * @returns {boolean}
     */
    isValidateFormula: function (formula) {
        return this.getRegex().test(formula);
    },

    /**
     * 将基本公式转成vo对象
     * @param formula 基本公式
     * @returns {Object}
     */
    convert2Vo: function (formula) {
        var self = this, matchResult, commonWorldEnum, name;

        commonWorldEnum = {
            corpName: "公司名称",
            queryTIN: "纳税人识别号",
            registAddress: "注册地址",
            queryPeriod: "账期区间",
            legalRepresentative: "法人代表",
            address: "生产经营地址",
            queryBeginPeriod: "起始账期日期",
            contactNumber: "联系电话",
            bankName: "开户银行",
            queryEndPeriod: "结束账期日期",
            belongIndustry: "所属行业",
            bankAccount: "开户银行账号",
            currentDate: "当前日期",
            registType: "企业登记注册类型",
            taxOrgName: "主管税务机关名称",
            taxOrgCode: "主管税务机关代码"
        };

        if (!self.isValidateFormula(formula)) {
            return null;
        }

        matchResult = self.getRegex().exec(formula);
        if (matchResult != null) {
            name = matchResult[1];
            return {
                name: name,
                label: commonWorldEnum[name]
            };
        }

        return null;
    },

    /**
     * 将vo转成formula公式
     * @param formulaVo 公式vo
     * @returns {(null | string)} 公式
     */
    convert2Formula: function (formulaVo) {
        if (formulaVo != null) {
            return _.template("#<%= name %>#", formulaVo);
        }
        return null;
    },

    /**
     * 将vo转成html
     * @param formulaVo 公式vo
     * @param {?string} template 模板
     * @returns {(null | string)} 公式
     */
    convert2Html: function (formulaVo, template) {
        var defaultTemplate = '';

        defaultTemplate += '<span class="formula formula_commonworld">';
        defaultTemplate += '    <%= label %>';
        defaultTemplate += '</span>';
        template || (template = defaultTemplate);
        return String(_.template(template, formulaVo));
    }
});

/**
 * 【单元格】解析器
 * @implements {ISymbolResolver}
 */
var sheetResolver = $.extend(true, {}, ISymbolResolver, {
    getRegex: function () {
        return /<([A-Za-z]+\d+)>/g
    },

    /**
     * 是否是正确的公式
     * @param {string} formula 公式
     * @returns {boolean}
     */
    isValidateFormula: function (formula) {
        return this.getRegex().test(formula);
    },

    /**
     * 将基本公式转成vo对象
     * @param formula 基本公式
     * @returns {Object}
     */
    convert2Vo: function (formula) {
        var self = this, matchResult;

        if (!self.isValidateFormula(formula)) {
            return null;
        }

        matchResult = self.getRegex().exec(formula);
        return matchResult != null
            ? {position: matchResult[1]}
            : null;
    },

    /**
     * 将vo转成formula公式
     * @param formulaVo 公式vo
     * @returns {(null | string)} 公式
     */
    convert2Formula: function (formulaVo) {
        if (formulaVo != null) {
            return _.template("<<%= position %>>", formulaVo);
        }
        return null;
    },

    /**
     * 将vo转成html
     * @param formulaVo 公式vo
     * @param {?string} template 模板
     * @returns {(null | string)} 公式
     */
    convert2Html: function (formulaVo, template) {
        var defaultTemplate = '';

        defaultTemplate += '<span class="formula formula_sheet">';
        defaultTemplate += '    <%= position %>';
        defaultTemplate += '</span>';
        template || (template = defaultTemplate);
        return String(_.template(template, formulaVo));
    }
});

/**
 *【求和(SUM)】解析器
 * @implements {ISymbolResolver}
 */
var sumResolver = $.extend(true, {}, ISymbolResolver, {
    getRegex: function () {
        return /SUM\(<([^)]+)>:<([^)]+)>\)/g
    },

    /**
     * 是否是正确的公式
     * @param {string} formula 公式
     * @returns {boolean}
     */
    isValidateFormula: function (formula) {
        return this.getRegex().test(formula);
    },

    /**
     * 将基本公式转成vo对象
     * @param formula 基本公式
     * @returns {Object}
     */
    convert2Vo: function (formula) {
        var self = this, matchResult;

        if (!self.isValidateFormula(formula)) {
            return null;
        }

        matchResult = self.getRegex().exec(formula);
        return matchResult != null
            ? {startPosition: $.trim(matchResult[1]), endPosition: $.trim(matchResult[2])}
            : null;
    },

    /**
     * 将vo转成formula公式
     * @param formulaVo 公式vo
     * @returns {(null | string)} 公式
     */
    convert2Formula: function (formulaVo) {
        if (formulaVo != null) {
            return _.template("SUM(<<%= startPosition %>>:<<%= endPosition %>>", formulaVo);
        }
        return null;
    },

    /**
     * 将vo转成html
     * @param formulaVo 公式vo
     * @param {?string} template 模板
     * @returns {(null | string)} 公式
     */
    convert2Html: function (formulaVo, template) {
        var defaultTemplate = '';

        defaultTemplate += '<span class="formula formula_sum">';
        defaultTemplate += '    SUM(<%= startPosition %>:<%= endPosition %>)';
        defaultTemplate += '</span>';
        template || (template = defaultTemplate);
        return String(_.template(template, formulaVo));
    }
});

/**
 *【条件IF】解析器
 * @implements {ISymbolResolver}
 */
var ifResolver = $.extend(true, {}, ISymbolResolver, {
    getRegex: function () {
        return /IF#{(.*),(.*),(.*)}#IF/g;
    },

    /**
     * 是否是正确的公式
     * @param {string} formula 公式
     * @returns {boolean}
     */
    isValidateFormula: function (formula) {
        return this.getRegex().test(formula);
    },

    /**
     * 将基本公式转成vo对象
     * @param formula 基本公式
     * @returns {Object}
     */
    convert2Vo: function (formula) {
        var self = this, matchResult;

        if (!self.isValidateFormula(formula)) {
            return null;
        }

        matchResult = self.getRegex().exec(formula);
        return matchResult != null
            ? {
                condition: $.trim(matchResult[1]),
                trueValue: $.trim(matchResult[2]),
                falseValue: $.trim(matchResult[2])
            }
            : null;
    },

    /**
     * 将vo转成formula公式
     * @param formulaVo 公式vo
     * @returns {(null | string)} 公式
     */
    convert2Formula: function (formulaVo) {
    },

    /**
     * 将vo转成html
     * @param formulaVo 公式vo
     * @param {?string} template 模板
     * @returns {(null | string)} 公式
     */
    convert2Html: function (formulaVo, template) {
    }
});

//</editor-fold>

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
var formulaTreeResolver = formulaTreeResolver || {};

//<editor-fold desc="公式节点相关操作">
$.extend(formulaTreeResolver, {
    /**
     * 创建文本节点
     * @param text 普通文本
     * @returns {{FormulaNode}}
     * @private
     */
    _createTextFormulaNode: function (text) {
        var self = this, formulaNode, symbolResolver;

        formulaNode = {
            type: "TEXT",
            formula: text,
            formulaVo: text,
            children: null
        };

        symbolResolver = self._getSymbolResolver(formulaNode.type);
        if (symbolResolver && symbolResolver.convert2Vo) {
            formulaNode.formulaVo = symbolResolver.convert2Vo(formulaNode.formula);
        }

        return formulaNode;
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
     * 创建操作符节点
     * @returns {{FormulaNode}}
     * @private
     */
    _createLogicFormulaNode: function (logic) {
        Logger.trace("logic :" + JSON.stringify(logic));
        return {
            type: "LOGIC",
            formula: this._getLogicValue(logic),
            formulaVo: null,
            children: null
        };
    },

    /**
     * 获得上级节点
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
     * 添加公式节点
     * 1.当有父节点时，直接往父节点添加子元素
     * 2.当没有父节时，直接往公式树里添加节点
     * @param childNode 公式节点
     * @param parentNode 父节点
     * @param formulaTree 公式树
     * @private
     */
    _addFormulaNode: function (childNode, parentNode, formulaTree) {
        var self = this;

        if (parentNode == null) {
            childNode && formulaTree.push(childNode);
        } else {
            childNode && self._addFormulaChild(parentNode, childNode);
        }
    },

    /** 创建基础公式节点 */
    _createSymbolFormulaNode: function (symbol, symbolFormula) {
        var self = this, symbolName, treeNode = {}, resolver;

        symbolName = self._getSymbolName(symbol);
        $.extend(treeNode, {
            type: symbolName,
            formula: symbolFormula
        });
        resolver = self._getSymbolResolver(symbolName);
        if (resolver && resolver.convert2Vo) {
            $.extend(treeNode, {
                formulaVo: resolver.convert2Vo(symbolFormula)
            });
        }

        return treeNode;
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
        var self = this, symbolResolver;

        Logger.trace("=================updateNode========================");
        Logger.trace(JSON.stringify(formulaNode));
        Logger.trace(JSON.stringify(starterInfo));
        Logger.trace(JSON.stringify(terminatorInfo));

        formulaNode.type = starterInfo.symbolName;
        formulaNode.formula = String(formula).substring(starterInfo.index, terminatorInfo.index + 1);
        symbolResolver = self._getSymbolResolver(starterInfo.symbolName);
        if (symbolResolver && symbolResolver.convert2Vo) {
            formulaNode.formulaVo = symbolResolver.convert2Vo(formulaNode.formula);
        }
    }
});
//</editor-fold>

$.extend(formulaTreeResolver, {
    /** 初始化是否完成 */
    initialComplete: false,

    /** 操作符 */
    OPERATOR: {
        ADD: "+",
        SUBTRACT: "-",
        MULTIPLY: "*",
        DIVIDE: "/"
    },

    /** 逻辑运算符 */
    LOGIC_OPERATOR: {
        GT: ">",
        LT: "<",
        GE: ">=",
        LE: "<=",
        EQ: "=="
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
            STARTER: "IF#(",
            TERMINATOR: ")#IF",
            LEAF: false
        },

        // 【组(Group)】起始、结束符
        GROUP: {
            STARTER: "(",
            TERMINATOR: ")",
            LEAF: false
        }
    },

    /**
     * 解析器映射
     * 须与SYMBOL的属性匹配
     */
    resolverMap: {
        TEXT: textResolver,
        SUBJECT: subjectResolver,
        M_SHEET: mSheetResolver,
        COMMON_WORD: commonWorldResolver,
        SHEET: sheetResolver,
        SUM: sumResolver
    },

    _CONST: {
        STARTER_SYMBOL_ARRAY: null,
        TERMINATOR_SYMBOL_ARRAY: null,
        LOGIC_ARRAY: null
    },

    _getSymbolName: function (symbol) {
        return symbol != null ? _.keys(symbol)[0] : null;
    },

    _getSymbolValue: function (symbol) {
        return symbol != null ? _.values(symbol)[0] : null;
    },

    /**
     * 获得公式元素数组
     * @returns {*}
     * @private
     */
    _getSymbolArray: function () {
        return _.map(this.SYMBOL, function (symbolValue, symbolName) {
            return _.object([symbolName], [symbolValue]);
        });
    },

    /**
     * 获得公式元素数组
     * @returns {*}
     * @private
     */
    _getSymbolArrayOrderByStarterLengthDesc: function () {
        var self = this;

        if (self._CONST.STARTER_SYMBOL_ARRAY == null) {
            self._CONST.STARTER_SYMBOL_ARRAY = _.sortBy(self._getSymbolArray(), function (symbol) {
                return -(self._getSymbolValue(symbol).STARTER.length);
            });
        }

        return self._CONST.STARTER_SYMBOL_ARRAY;
    },

    _getSymbolArrayOrderByTerminatorLengthDesc: function () {
        var self = this;

        if (self._CONST.TERMINATOR_SYMBOL_ARRAY == null) {
            self._CONST.TERMINATOR_SYMBOL_ARRAY = _.sortBy(self._getSymbolArray(), function (symbol) {
                return -(self._getSymbolValue(symbol).TERMINATOR.length);
            });
        }

        return self._CONST.TERMINATOR_SYMBOL_ARRAY;
    },

    /**
     * 在给定的文件中查找启起符结果
     *
     * @param starterMatchingText 匹配起始符的文字
     * @param {?function} sortIterate 排序规则
     * @param matchingByStarter 是否按起符符去匹配
     *
     * @typedef {Object} SearchMapping 匹配结果
     * @property {Symbol} symbol
     * @property {string} beforeContext
     *
     * @returns {[SearchMapping]}
     *
     * @example
     * _findSymbolArray('"IF#")
     * =>
     *  [
     *      {"symbol":{"IF":{"STARTER":"IF#","TERMINATOR":"#IF","LEAF":false}},"beforeContext":""},
     *      {"symbol":{"COMMON_WORD":{"STARTER":"#","TERMINATOR":"#","LEAF":true}},"beforeContext":"IF"}
     *  ]
     * @private
     */
    _findSymbolArray: function (starterMatchingText, sortIterate, matchingByStarter) {
        var self = this, result = [], matchResult, symbolArray;

        matchingByStarter === undefined && (matchingByStarter = true);
        symbolArray = matchingByStarter
            ? self._getSymbolArrayOrderByStarterLengthDesc()
            : self._getSymbolArrayOrderByTerminatorLengthDesc();

        $.each(symbolArray, function (key, symbol) {
            var symbolValue = self._getSymbolValue(symbol),
                mappingFiledValue = matchingByStarter ? symbolValue.STARTER : symbolValue.TERMINATOR,
                index = String(starterMatchingText).indexOf(mappingFiledValue);

            if (index >= 0) {
                matchResult = {
                    symbol: $.extend(true, {}, symbol),
                    beforeContext: String(starterMatchingText).substring(0, index)
                };

                result.push(matchResult);
            }
        });

        if (sortIterate && _.size(result) > 0) {
            result = _.sortBy(result, sortIterate);
        }

        return result;
    },

    /**
     * 根据公式类型名称获得解析器
     * @param symbolName
     * @returns {*}
     * @private
     */
    _getSymbolResolver: function (symbolName) {
        return this.resolverMap[symbolName];
    },

    _getLogicName: function (logic) {
        return logic != null ? _.keys(logic)[0] : null;
    },

    _getLogicValue: function (logic) {
        return logic != null ? _.values(logic)[0] : null;
    },

    _getLogicArray: function () {
        return _.map(this.LOGIC_OPERATOR, function (logicValue, logicName) {
            return _.object([logicName], [logicValue]);
        });
    },

    _getLogicArrayOrderByLengthDesc: function () {
        var self = this;

        if (self._CONST.LOGIC_ARRAY == null) {
            self._CONST.LOGIC_ARRAY = _.sortBy(self._getLogicArray(), function (logic) {
                return -(self._getLogicValue(logic).length);
            });
        }

        return self._CONST.LOGIC_ARRAY;
    },


    /**
     * 在给定的文件中查找启起符结果
     *
     * @param logicMatchingText 匹配起始符的文字
     * @param {?function} sortIterate 排序规则
     *
     * @typedef {Object} SearchMapping 匹配结果
     * @property {Symbol} symbol
     * @property {string} beforeContext
     *
     * @returns {[SearchMapping]}
     *
     * @example
     * _findSymbolArray('"IF#")
     * =>
     *  [
     *      {"symbol":{"IF":{"STARTER":"IF#","TERMINATOR":"#IF","LEAF":false}},"beforeContext":""},
     *      {"symbol":{"COMMON_WORD":{"STARTER":"#","TERMINATOR":"#","LEAF":true}},"beforeContext":"IF"}
     *  ]
     * @private
     */
    _findLogicArray: function (logicMatchingText, sortIterate) {
        var self = this, result = [], matchResult;

        $.each(self._getLogicArrayOrderByLengthDesc(), function (key, logic) {
            var logicValue = self._getLogicValue(logic),
                index = String(logicMatchingText).indexOf(logicValue);

            if (index >= 0) {
                matchResult = {
                    logic: $.extend(true, {}, logic),
                    beforeContext: String(logicMatchingText).substring(0, index)
                };

                result.push(matchResult);
            }
        });

        if (sortIterate && _.size(result) > 0) {
            result = _.sortBy(result, sortIterate);
        }

        return result;
    },


    /**
     * 根据公式类型名称获得解析器
     * @param logicName
     * @returns {*}
     * @private
     */
    _getLogicResolver: function (logicName) {
        return logicResolver[logicName];
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
                    symbol: $.extend(true, {}, _.object([key], [operator])),
                    beforeContext: String(matchingText).substring(0, index)
                };
                return false;
            }
        });
        return result;
    },

    /**
     * 匹配公式元素
     * @param matchingText
     * @param {string} formula
     * @param resolvingSymbolArray 正正解析的函数
     */
    mappingSymbol: function (matchingText, resolvingSymbolArray, formula) {
        var self = this, starterArray,
            symbol, symbolName, regMatch, resolvingText, resolver, mappingItem = null;

        starterArray = self._findSymbolArray(matchingText, function (symbol) {
            return String(symbol.beforeContext).length;
        });

        if (_.size(starterArray) === 0) {
            return null;
        }

        $.each(starterArray, function (index, searchMapping) {
            symbol = searchMapping.symbol;
            symbolName = self._getSymbolName(searchMapping.symbol);

            mappingItem = {symbol: symbol};
            // 如果是最基础的公式
            resolvingText = formula.substr(searchMapping.beforeContext.length);
            resolver = self._getSymbolResolver(symbolName);
            if (resolver) {
                // 根据字符串找出公式
                regMatch = resolver.getRegex().exec(resolvingText);
                if (regMatch && regMatch.index === 0) {
                    $.extend(mappingItem, {
                        beforeContext: searchMapping.beforeContext,
                        mappingFormula: regMatch[0],
                        matchContext: matchingText.substr(searchMapping.beforeContext.length)
                    });
                    return false;
                } else {
                    mappingItem = null;
                }
            } else {
                $.extend(mappingItem, {
                    beforeContext: searchMapping.beforeContext,
                    matchContext: matchingText.substr(searchMapping.beforeContext.length)
                });
                return false;
            }
        });

        return mappingItem;
    },

    /**
     * 匹配公式元素结束符
     * @param matchingText
     * @param resolvingSymbolArray
     * @returns {*}
     */
    mappingNotLeafSymbol: function (matchingText, resolvingSymbolArray/*, formula*/) {
        var self = this, lastResolvingSymbolInfo,
            symbol, symbolValue, index , beforeContext, mappingItem = null;

        if (_.size(resolvingSymbolArray) === 0) {
            return null;
        }

        lastResolvingSymbolInfo = _.last(resolvingSymbolArray);
        symbol = lastResolvingSymbolInfo.symbol;
        symbolValue = self._getSymbolValue(symbol);
        index = String(matchingText).indexOf(symbolValue.TERMINATOR);

        if (index >= 0) {
            beforeContext = String(matchingText).substring(0, index)
            mappingItem = {
                symbol: symbol,
                beforeContext: beforeContext,
                resolvingSymbolInfo: lastResolvingSymbolInfo,
                matchContext: matchingText.substr(beforeContext.length)
            };
        }

        return mappingItem;
    },

    /**
     * 匹配逻辑操作符
     */
    mappingLogic: function (logicMatchingText, resolvingSymbolArray, formula) {
        var self = this, logicArray,
            logic, logicName, regMatch, resolvingText, resolver, mappingItem = null;

        logicArray = self._findLogicArray(logicMatchingText, function (logic) {
            return String(logic.beforeContext).length;
        });

        if (_.size(logicArray) === 0) {
            return null;
        }

        $.each(logicArray, function (index, logicMapping) {
            logic = logicMapping.logic;
            logicName = self._getLogicName(logic);

            mappingItem = {logic: logic};
            // 如果是最基础的公式
            resolvingText = formula.substr(logicMapping.beforeContext.length);
            resolver = self._getLogicResolver(logicName);
            // 根据字符串找出公式
            regMatch = resolver.getRegex().exec(resolvingText);
            if (regMatch && regMatch.index === 0) {
                $.extend(mappingItem, {
                    beforeContext: logicMapping.beforeContext,
                    matchContext: logicMatchingText.substr(logicMapping.beforeContext.length)
                });
                return false;
            } else {
                mappingItem = null;
            }

        });

        return mappingItem;
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
        var self = this, index, matchResult, result = null;


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

        $.each(self._getSymbolArrayOrderByTerminatorLengthDesc(), function (key, symbol) {
            var symbolValue = self._getSymbolValue(symbol),
                index = String(matchingText).indexOf(symbolValue.TERMINATOR);

            if (index >= 0) {
                matchResult = {
                    symbol: $.extend(true, {}, symbol),
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


    /**
     * 解析公式
     * @typedef {Object} resoleVo 解析vo
     * @property {number} index 顺号
     * @property {string} mark 标记
     * @returns {[FormulaNode]} 公式节点树
     */
    resolve: function (formula) {
        var self = this, resolvingSymbolArray = [], formulaTree = [], matchingText = "",
            mappingSymbolResult, mappingFormula,
            mappingLogicResult, logic, logicName, logicValue,
            notLeafSymbolResult;

        Logger.separate("");
        Logger.caption("formula is: " + formula);

        var lastResolvingIndex = -1,
            operateResult, symbol, symbolName, symbolValue,
            beforeContext, matchContext,
            parentNode, formulaNode, emptyTextNode;

        for (var i = 0, length = formula.length; i < length; i++) {
            matchingText += formula[i];
            Logger.trace(i + " matchingText:" + matchingText);

            // 1.匹配操作符
            operateResult = self._findOperator(matchingText);
            if (operateResult != null) {
                Logger.info("匹配操作符: " + JSON.stringify(operateResult));

                parentNode = self._getParentFormulaNode(resolvingSymbolArray);
                emptyTextNode = operateResult.beforeContext !== ""
                    ? self._createTextFormulaNode(operateResult.beforeContext)
                    : null;
                formulaNode = self._createOperatorFormulaNode(operateResult.symbol);
                self._addFormulaNode(emptyTextNode, parentNode, formulaTree);
                self._addFormulaNode(formulaNode, parentNode, formulaTree);
                Logger.trace("匹配操作符后，树结构：" + JSON.stringify(formulaTree));
                matchingText = "";
                lastResolvingIndex = i;
                continue;
            }

            // 2.匹配基础公式（symbol）
            mappingSymbolResult = self.mappingSymbol(matchingText, resolvingSymbolArray, formula.substr(lastResolvingIndex + 1));
            if (mappingSymbolResult) {
                symbol = mappingSymbolResult.symbol;
                symbolName = self._getSymbolName(symbol);
                symbolValue = self._getSymbolValue(symbol);
                beforeContext = mappingSymbolResult.beforeContext;
                matchContext = mappingSymbolResult.matchContext;
                mappingFormula = mappingSymbolResult.mappingFormula;

                Logger.info("匹配公式元素:" + symbolName + ", matchContext:" + matchContext + ", mappingFormula:" + mappingFormula);

                // 2.1找出父节点
                parentNode = self._getParentFormulaNode(resolvingSymbolArray);
                emptyTextNode = $.trim(beforeContext) !== "" ? self._createTextFormulaNode(beforeContext) : null;
                // 2.2添加普通文本公式
                self._addFormulaNode(emptyTextNode, parentNode, formulaTree);

                formulaNode = self._createSymbolFormulaNode(symbol, mappingFormula);
                // 2.3添加公式元素节点
                self._addFormulaNode(formulaNode, parentNode, formulaTree);

                // 2.4.非基础元素公式（symbol）,则将公式压入栈
                if (!symbolValue.LEAF) {
                    resolvingSymbolArray.push({
                        symbol: symbol,
                        symbolName: symbolName,
                        parentFormulaNode: parentNode,
                        formulaNode: formulaNode,
                        formula: mappingFormula
                    });
                }
                Logger.trace("匹配公式元素，树结构：" + JSON.stringify(formulaTree));

                // 2.5处理控置变量
                matchingText = "";
                if (symbolValue.LEAF) {
                    i += mappingFormula.length - matchContext.length;
                }
                lastResolvingIndex = i;

                continue;
            }

            // 3.处理逻辑操作符
            mappingLogicResult = self.mappingLogic(matchingText, resolvingSymbolArray, formula.substr(lastResolvingIndex + 1));
            if (mappingLogicResult) {
                logic = mappingLogicResult.logic;
                logicName = self._getLogicName(logic);
                logicValue = self._getLogicValue(logic);
                beforeContext = mappingLogicResult.beforeContext;
                matchContext = mappingLogicResult.matchContext;

                Logger.info("匹配逻辑操作符:" + logicName + ", matchContext:" + matchContext + ", mappingLogic:" + logicValue);

                // 3.1找出父节点
                parentNode = self._getParentFormulaNode(resolvingSymbolArray);
                emptyTextNode = $.trim(beforeContext) !== "" ? self._createTextFormulaNode(beforeContext) : null;
                // 3.2添加普通文本公式
                self._addFormulaNode(emptyTextNode, parentNode, formulaTree);

                formulaNode = self._createLogicFormulaNode(logic);
                // 3.3添加公式元素节点
                self._addFormulaNode(formulaNode, parentNode, formulaTree);

                Logger.trace("匹配逻辑操作符，树结构：" + JSON.stringify(formulaTree));

                // 3.4处理控置变量
                matchingText = "";
                i += logicValue.length - matchContext.length;
                lastResolvingIndex = i;

                continue;
            }

            // 4.处理非叶子基础公式
            notLeafSymbolResult = self.mappingNotLeafSymbol(matchingText, resolvingSymbolArray);
            if (notLeafSymbolResult) {
                beforeContext = notLeafSymbolResult.beforeContext;

                if (beforeContext) {
                    parentNode = notLeafSymbolResult.resolvingSymbolInfo.formulaNode;
                    emptyTextNode = $.trim(beforeContext) !== "" ? self._createTextFormulaNode(beforeContext) : null;
                    self._addFormulaNode(emptyTextNode, parentNode, formulaTree);
                }
                matchingText = "";
                lastResolvingIndex = i;
            }
        }

        if (lastResolvingIndex < formula.length - 1) {
            self._addFormulaNode(self._createTextFormulaNode(formula.substr(lastResolvingIndex + 1)), null, formulaTree);
        }

        Logger.warn("formula tree is: " + JSON.stringify(formulaTree, null, "\t"));
    },

    /**
     * 获得渲染的html代码
     * @param formulaTree
     */
    renderHtml: function (formulaTree) {
        var self = this, html = "", resolver;

        $.each(formulaTree, function (index, formulaNode) {
            var type = formulaNode.type;

            if (_.size(formulaNode.children) === 0) {
                resolver = self._getSymbolResolver(type);
                if (resolver) {
                    html += resolver.convert2Html(formulaNode.formulaVo)
                } else if (type === "OPERATOR") {
                    html += _.template('<span class="formula formula_operator"><%= text%></span>', {text: formulaNode.formula});
                }
            } else {
                html += "<span>" + self.renderHtml(formulaNode.children) + "</span>"
            }
        });
        return html;
    }
});


// 测试
(function () {

    //<editor-fold desc="测试解析器">
    /*
            // =================================================================================
            Logger.separate();
            Logger.info("1.测试【普通文本】解析器");
            Logger.separate();
            // 1.1测试convert2Vo方法
            Logger.caption("1.1 测试 textResolver.convert2Vo(textFormula)");
            var textFormula = "abc";
            Logger.info("textFormula is: " + textFormula);
            Logger.warn("result is: " + JSON.stringify(textResolver.convert2Vo(textFormula), null, "\t"));

            Logger.separate();

               // 1.2测试convert2Vo方法
               Logger.caption("1.2 测试 textResolver.convert2Formula(textFormulaVo)");
               var textFormulaVo = {
                   "text": "abc"
               };
               Logger.info("textFormulaVo is: " + JSON.stringify(textFormulaVo, null, "\t"));
               Logger.warn("result is: " + textResolver.convert2Formula(textFormulaVo), null, "\t");

               // =================================================================================
               Logger.separate();
               Logger.info("2.测试【会计科目】解析器");
               Logger.separate();
               // 2.1测试convert2Vo方法
               Logger.caption("2.1 测试 subjectResolver.convert2Vo(subjectFormula)");
               var subjectFormula = "[K100101,^S1^G20^Y:0^M:0^E0]";
               Logger.info("subjectFormula is: " + subjectFormula);
               Logger.warn("result is: " + JSON.stringify(subjectResolver.convert2Vo(subjectFormula), null, "\t"));

               Logger.separate();

               // 2.2测试convert2Vo方法
               Logger.caption("2.2 测试 subjectResolver.convert2Formula(subjectFormulaVo)");
               var subjectFormulaVo = {
                   "subjectCodeList": [
                       "100101"
                   ],
                   "reClassify": "1",
                   "valueTypeCode": "20",
                   "acctYearInc": "0",
                   "acctMonthInc": "0",
                   "exLossProfit": "0"
               };
               Logger.info("subjectFormulaVo is: " + JSON.stringify(subjectFormulaVo, null, "\t"));
               Logger.warn("result is: " + subjectResolver.convert2Formula(subjectFormulaVo), null, "\t");

               // =================================================================================
               Logger.separate();
               Logger.info("3.测试【表间取值】解析器");
               Logger.separate();
               // 3.1测试convert2Vo方法
               Logger.caption("3.1 测试 mSheetResolver.convert2Vo(mSheetFormula)");
               var mSheetFormula = "{FSTM_JS0102!<B3>}";
               Logger.info("mSheetFormula is: " + mSheetFormula);
               Logger.warn("result is: " + JSON.stringify(mSheetResolver.convert2Vo(mSheetFormula), null, "\t"));

               Logger.separate();

               // 3.2测试convert2Vo方法
               Logger.caption("3.2 测试 mSheetResolver.convert2Formula(mSheetFormulaVo)");
               var mSheetFormulaVo = {
                   "reportCode": "FSTM_JS0102",
                   "position": "B3"
               };
               Logger.info("mSheetFormulaVo is: " + JSON.stringify(mSheetFormulaVo, null, "\t"));
               Logger.warn("result is: " + mSheetResolver.convert2Formula(mSheetFormulaVo), null, "\t");

               // =================================================================================
               Logger.separate();
               Logger.info("4.测试【常用字(其它)】解析器");
               Logger.separate();
               // 4.1测试convert2Vo方法
               Logger.caption("4.1 测试 commonWorldResolver.convert2Vo(commonWorldFormula)");
               var commonWorldFormula = "#queryTIN#";
               Logger.info("commonWorldFormula is: " + commonWorldFormula);
               Logger.warn("result is: " + JSON.stringify(commonWorldResolver.convert2Vo(commonWorldFormula), null, "\t"));

               Logger.separate();

               // 4.2测试convert2Vo方法
               Logger.caption("2.2 测试 commonWorldResolver.convert2Formula(commonWorldFormulaVo)");
               var commonWorldFormulaVo = {
                   "name": "queryTIN",
                   "label": "纳税人识别号"
               };
               Logger.info("commonWorldFormulaVo is: " + JSON.stringify(commonWorldFormulaVo, null, "\t"));
               Logger.warn("result is: " + commonWorldResolver.convert2Formula(commonWorldFormulaVo), null, "\t");


               // =================================================================================
               Logger.separate();
               Logger.info("5.测试【单元格】解析器");
               Logger.separate();
               // 5.1测试convert2Vo方法
               Logger.caption("5.1 测试 sheetResolver.convert2Vo(sheetFormula)");
               var sheetFormula = "<C3>";
               Logger.info("sheetFormula is: " + sheetFormula);
               Logger.warn("result is: " + JSON.stringify(sheetResolver.convert2Vo(sheetFormula), null, "\t"));

               Logger.separate();

               // 5.2测试convert2Vo方法
               Logger.caption("5.2 测试 sheetFormula.convert2Formula(sheetFormulaVo)");
               var sheetFormulaVo =  {
                   "position": "C3"
               };
               Logger.info("sheetFormulaVo is: " + JSON.stringify(sheetFormulaVo, null, "\t"));
               Logger.warn("result is: " + sheetResolver.convert2Formula(sheetFormulaVo), null, "\t");


               // =================================================================================
               Logger.separate();
               Logger.info("6.测试【求和(SUM)】解析器");
               Logger.separate();
               // 6.1测试convert2Vo方法
               Logger.caption("6.1 测试 sumResolver.convert2Vo(sumFormulaVo)");
               var sumFormula = "SUM(<C1>:<C2>)";
               Logger.info("sumFormulaVo is: " + sumFormula);
               Logger.warn("result is: " + JSON.stringify(sumResolver.convert2Vo(sumFormula), null, "\t"));

               Logger.separate();

               // 6.2测试convert2Vo方法
               Logger.caption("6.2 测试 sumResolver.convert2Formula(sumFormulaVo)");
               var sumFormulaVo =  {
                   "startPosition": "C1",
                   "endPosition": "C2"
               };
               Logger.info("sumFormulaVo is: " + JSON.stringify(sumFormulaVo, null, "\t"));
               Logger.warn("result is: " + sumResolver.convert2Formula(sumFormulaVo), null, "\t");

           */
    //</editor-fold>


    //<editor-fold desc="测试复杂公式">
    /*
    formulaTreeResolver.resolve(" abc3#corpName#");
    formulaTreeResolver.resolve("[K1001,1002,^S1^G20^Y:3^M:1^E0]+#queryBeginPeriod#+[K1604,1605,^S1^G20^Y2010:3^M6:1^E0]");
    formulaTreeResolver.resolve("#corpName# + [K1001,^S0^G20^Y:0^M:0^E0] + ({11_01!<C3>})");
    formulaTreeResolver.resolve(" abc3#corpName# + [K1001,^S0^G20^Y:0^M:0^E0] + ({11_01!<C3>})");
    formulaTreeResolver.resolve("{13_01!<C41>}");
    */
    //</editor-fold>

    //<editor-fold desc="1.测试单个公式">
    /*
        Logger.separate();
        Logger.caption("测试解析树")
        // 1.1.测试普通文本
        Logger.info("1.1.测试普通文本");
        formulaTreeResolver.resolve("abc");
        // 1.2.测试【会计科目】公式
        Logger.info("1.2.测试【会计科目】公式");
        formulaTreeResolver.resolve("[K100101,^S1^G20^Y:0^M:0^E0]");
         // 1.3.测试【表间取值】公式
         Logger.info("1.3.测试【表间取值】公式");
         formulaTreeResolver.resolve("{FSTM_JS0102!<B3>}");

         // 1.4.测试【常用字(其它)】公式
         Logger.info("1.4.测试【常用字(其它)】公式");
         formulaTreeResolver.resolve("#queryTIN#");

         // 1.5.测试 【单元格】公式
         Logger.info("1.5.测试 【单元格】公式");
         formulaTreeResolver.resolve("<C3>");

         // 1.6.测试 【求和(SUM)】公式
         Logger.info(" 1.6.测试 【求和(SUM)】公式");
         formulaTreeResolver.resolve("SUM(<C1>:<C2>)");


*/
    // 1.7.测试 【条件(IF)】公式

//     formulaTreeResolver.resolve("IF#(1+2>0,true,false)#IF");
    formulaTreeResolver.resolve("IF#(<E14>*<E15>>0,<E14>*<E15>,0)#IF");

/*

    // 1.8.测试 【组(Group)】公式
    Logger.info(" 1.8.测试 【组(Group)】公式");
    formulaTreeResolver.resolve("(1+2)");
*/

    //</editor-fold>
    //<editor-fold desc="2.测试组和公式">
    /*
    // 2.1.测试【会计科目】+【表间取值】+【常用字(其它)】
    Logger.info("2.1.测试【会计科目】+【表间取值】+【常用字(其它)】");
//     formulaTreeResolver.resolve("[K1001,(1001,)^S1^G41^Y:0^M:0^E0] + {11!<C3>} + #corpName#+#registAddress#");
    formulaTreeResolver.resolve("[K1001,(1001,)^S1^G41^Y:0^M:0^E0] + {11!<C3>}");
*/
    // 2.2.测试(【会计科目】+【表间取值】) +【常用字(其它)】

    // 2.3.测试(【会计科目】+【表间取值】) / (【会计科目】 - 【表间取值】) * 2.5


    //</editor-fold>

    //<editor-fold desc="测试渲染文本">
    /*
    function testFormulaRender(title, formula, result) {
        var $formulaBox = $("#formulaBox"), template = "";

        template += '<div class="separator">==================================================================================================================</div>';
        template += '<h4><%= title %></h4>';
        template += '<div>';
        template += '   <div class="caption">the formula is:<%= formula %></div>';
        template += '   <div>result is:<br/> <%= result %></div>';
        template += '<div>';
        template += '</div>';
        template += '<div class="separator">==================================================================================================================</div>';

        $formulaBox.append(String(_.template(template, {
            title: title,
            formula: $('<div/>').text(formula).html(),
            result: result
        })));
    }

    // 1.测试【普通文本】渲染
    var textRenderTitle = "测试【普通文本】渲染"
    var textRenderFormula = "abc";
    var textRenderResult = textResolver.convert2Html(textResolver.convert2Vo(textRenderFormula));
    testFormulaRender(textRenderTitle, textRenderFormula, textRenderResult);

    // 2.测试【会计科目】渲染
    var subjectRenderTitle = "测试【会计科目】渲染"
    var subjectRenderFormula = "[K100101,^S1^G20^Y:0^M:0^E0]";
    var subjectRenderResult = subjectResolver.convert2Html(subjectResolver.convert2Vo(subjectRenderFormula));
    testFormulaRender(subjectRenderTitle, subjectRenderFormula, subjectRenderResult);

    // 3.测试【表间取值】渲染
    var mSheetRenderTitle = "测试【表间取值】渲染"
    var mSheetRenderFormula = "{FSTM_JS0102!<B3>}";
    var mSheetRenderResult = mSheetResolver.convert2Html(mSheetResolver.convert2Vo(mSheetRenderFormula));
    testFormulaRender(mSheetRenderTitle, mSheetRenderFormula, mSheetRenderResult);

    // 4.测试【常用字(其它)】渲染
    var commonWorldRenderTitle = "测试【常用字(其它)】渲染"
    var commonWorldRenderFormula = "#queryTIN#";
    var commonWorldRenderResult = commonWorldResolver.convert2Html(commonWorldResolver.convert2Vo(commonWorldRenderFormula));
    testFormulaRender(commonWorldRenderTitle, commonWorldRenderFormula, commonWorldRenderResult);

    // 5.测试【单元格】渲染
    var sheetRenderTitle = "测试【单元格】渲染"
    var sheetRenderFormula = "<C3>";
    var sheetRenderResult = sheetResolver.convert2Html(sheetResolver.convert2Vo(sheetRenderFormula));
    testFormulaRender(sheetRenderTitle, sheetRenderFormula, sheetRenderResult);

    // 6.测试【求和(SUM)】渲染
    var sumRenderTitle = "测试【求和(SUM)】渲染"
    var sumRenderFormula = "SUM(<C1>:<C2>)";
    var sumRenderResult = sumResolver.convert2Html(sumResolver.convert2Vo(sumRenderFormula));
    testFormulaRender(sumRenderTitle, sumRenderFormula, sumRenderResult);

    // 7.测试混合公式的渲染
    var complexRenderTitle = "测试混合公式的渲染"
    var complexRenderFormula = "[K1001,^S0^G20^Y:0^M:0^E0] - ({11_01!<C3>}) + #corpName# + SUM(<C1>:<C2>)";
    var complexRenderResult = formulaTreeResolver.renderHtml(formulaTreeResolver.resolve(complexRenderFormula));
    testFormulaRender(complexRenderTitle, complexRenderFormula, complexRenderResult);
*/
    //</editor-fold>

//     Logger.info(JSON.stringify(formulaTreeResolver._findSymbolArray("IF#"), null, null));
//     formulaTreeResolver.resolve("1 + 2 > 0");

})(formulaTreeResolver);

