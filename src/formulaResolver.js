(function (root, $, _) {
    var Logger = {
        LEVEL: {
            TRACE: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3
        },

        level: 3,

        // 当需要打印在页面时，配置此参数（jQuery选择器，e.g.： #main）
        $logBox: null,

        log: function (level, text, style) {
            if (level < this.level) {
                return;
            }

            var styleStr = "", template;
            if ($.isPlainObject(style)) {
                $.each(style, function (key, value) {
                    styleStr += key + ":" + value + ";";
                });
            }

            text = $('<div/>').text(text).html();
            template = '<li style="<%= style %>"><pre><%= content%></pre></li>';

            var $item = $(_.template(template, {style: styleStr, content: text}));
            if (this.$logBox) {
                $(this.$logBox).append($item);
            }
            window.console && window.console.log("%c" + $item.text(), $item.attr("style"));
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
    };

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
    var ISymbolResolver = {
        childrenField: null,

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
            return formulaVo.text;
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
            return /\[K((?:[^^,()]+,)+)(?:\(([^)]+)\))*[^\[\]]+]/g;
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

            result += subjectStr;

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

            defaultTemplate += '<span class="formula formula_subject">K(<%= subjectCodeList %>|<%= valueTypeCode %>|<%= reClassify %>)</span>';
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
                return _.template("{<%= reportCode %>!<<%= position %>>}")(formulaVo);
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

            defaultTemplate += '<span class="formula formula_msheet"><%= reportCode %>!<%= position %></span>';
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
                return _.template("#<%= name %>#")(formulaVo);
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

            defaultTemplate += '<span class="formula formula_commonworld"><%= label %></span>';
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
            return /<([A-Za-z]+\d+)>/g;
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
                return _.template("<<%= position %>>")(formulaVo);
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

            defaultTemplate += '<span class="formula formula_sheet"><%= position %></span>';
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
            return /SUM\(<([^)]+)>:<([^)]+)>\)/g;
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
                return _.template("SUM(<<%= startPosition %>>:<<%= endPosition %>>")(formulaVo);
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

            defaultTemplate += '<span class="formula formula_sum">SUM(<%= startPosition %>:<%= endPosition %>)</span>';
            template || (template = defaultTemplate);
            return String(_.template(template, formulaVo));
        }
    });

    /**
     *【条件IF】解析器
     * @implements {ISymbolResolver}
     */
    var ifResolver = $.extend(true, {}, ISymbolResolver, {
        childrenField: ["condition", "trueValue", "falseValue"],

        getRegex: function () {
            // (?:(?:[^(),]+)匹配没有括号也没有逗号的字符串
            // (?:\[(?:[^\]]|,)+])匹配中括号里有逗号的情况，例如 [K1001,^S0^G20^Y:0^M:0^E0])
            // (?:\((?:[^\]]|,)+\)))+)匹配小括号里有逗号的情况(<C1>,<C2>)
            // 整个解释就是匹配IF#(没有括号也没有逗号+中括号里有逗号的情况+小括号里有逗号的情况,同前,同前)#IF
            return /IF#\(((?:(?:[^(),]+)|(?:\[(?:[^\]]|,)+])|(?:\((?:[^)]|,)+\)))+),((?:(?:[^(),]+)|(?:\[(?:[^\]]|,)+])|(?:\((?:[^)]|,)+\)))+),((?:(?:[^(),]+)|(?:\[(?:[^\]]|,)+])|(?:\((?:[^)]|,)+\)))+)\)#IF/g;
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
         * @param childArray
         * @returns {Object}
         */
        convert2Vo: function (formula, childArray) {
            var self = this, matchResult;

            if ($.isArray(childArray)) {
                return  {
                    condition: childArray[0],
                    trueValue: childArray[1],
                    falseValue: childArray[2]
                };
            }

            if (!self.isValidateFormula(formula)) {
                return null;
            }

            matchResult = self.getRegex().exec(formula);
            return matchResult != null
                ? {
                    condition: childArray[0],
                    trueValue: $.trim(matchResult[2]),
                    falseValue: $.trim(matchResult[3])
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
                return _.template("IF#(<%= condition %>,<%= trueValue %>,<%= falseValue%>)#IF")(formulaVo);
            }
            return null;
        },

        /**
         * 将vo转成html
         * @param formulaVo 公式vo
         * @param {?string} template 模板
         * @param {?function} renderCallback 模板
         * @param {?object} renderContext 执行回调函数的上下文
         * @returns {(null | string)} 公式
         */
        convert2Html: function (formulaVo, template, renderCallback, renderContext) {
            var defaultTemplate = '', children, conditionHtml, trueHtml, falseHtml;

            children = formulaVo.children;
            conditionHtml = renderCallback.apply(renderContext, [children[0]]);
            trueHtml = renderCallback.apply(renderContext, [children[1]]);
            falseHtml = renderCallback.apply(renderContext, [children[2]]);
            defaultTemplate += '<span  class="formula formula_if">';
            defaultTemplate += '<em>IF(</em>';
            defaultTemplate += '<%= conditionHtml %><span class="formula_if_separator">,</span>';
            defaultTemplate += '<%= trueHtml %><span class="formula_if_separator">,</span>';
            defaultTemplate += '<%= falseHtml %>';
            defaultTemplate += '<em>)</em>';
            defaultTemplate += '</span>';
            template || (template = defaultTemplate);
            return String(_.template(template, $.extend(true, {}, formulaVo, {
                conditionHtml: conditionHtml,
                trueHtml: trueHtml,
                falseHtml: falseHtml
            })));
        }
    });

//</editor-fold>

    var resolvingSymbolService = {
        /**
         *
         * 解析公式信息中获取公式元素
         * @param resolvingSymbolInfo 正在解析公式信息
         * @param formula 公式
         * @returns {*}
         * @example
         *  formula = "IF#(1+2>0,true,false)#IF"
         *  resolvingSymbolInfo = {
         *      "symbol": {
         *          "IF": {
         *              "STARTER": "IF#(",
         *              "TERMINATOR": ")#IF",
         *              "TRANSIT": ",",
         *              "LEAF": false
         *          }
         *      },
         *      "starterIndex": 3,
         *      "transitArray": [9, 14],
         *  }
         *  =>
         *  IF#(1+2>0,true,false)#IF
         */
        getSymbolFormula: function (resolvingSymbolInfo, formula) {
            var  symbol, symbolValue, symbolFormula;

            if (_.size(resolvingSymbolInfo.transitArray) === 0) {
                return "";
            }

            symbol = resolvingSymbolInfo.symbol;
            symbolValue = formulaResolver._getSymbolValue(symbol);
            symbolFormula = formula.substring(
                resolvingSymbolInfo.starterIndex - symbolValue.STARTER.length + 1,
                resolvingSymbolInfo.terminatorIndex + 1
            );

            return symbolFormula;
        },

        /**
         *
         * @param resolvingSymbolInfo 正在解析公式信息
         * @param formula 公式
         * @returns {Array}
         * @example
         *  formula = "IF#(1+2>0,true,false)#IF"
         *  resolvingSymbolInfo = {
         *      "symbol": {
         *          "IF": {
         *              "STARTER": "IF#(",
         *              "TERMINATOR": ")#IF",
         *              "TRANSIT": ",",
         *              "LEAF": false
         *          }
         *      },
         *      "starterIndex": 3,
         *      "transitArray": [9, 14],
         *  }
         *  =>
         *  ["1+2>0", "true", "false"]
         */
        getTransitStrArray: function (resolvingSymbolInfo, formula) {
            var splitStrArray = [], symbolValue, tempIndex;

            if (_.size(resolvingSymbolInfo.transitArray) === 0) {
                return [];
            }

            symbolValue = formulaResolver._getSymbolValue(resolvingSymbolInfo.symbol);
            tempIndex = resolvingSymbolInfo.starterIndex + 1;
            $.each(resolvingSymbolInfo.transitArray, function (i, transitIndex) {
                splitStrArray.push(formula.substring(tempIndex, transitIndex));
                tempIndex = transitIndex + 1;
            });
            splitStrArray.push(formula.substring(
                tempIndex,
                resolvingSymbolInfo.terminatorIndex - symbolValue.TERMINATOR.length + 1)
            );

            return splitStrArray;
        },

        addRestTransitChildFromFormulaNode: function (resolvingSymbolInfo) {
            var lastChild = resolvingSymbolInfo.formulaNode.children;
            if (_.size(lastChild) > 0) {
                resolvingSymbolInfo.transitChildren.push(lastChild);
                resolvingSymbolInfo.formulaNode.children = [];
            }
        },

        addTransit: function (resolvingSymbolInfo, index) {
            resolvingSymbolInfo.transitArray.push(index);
            resolvingSymbolInfo.transitChildren.push(resolvingSymbolInfo.formulaNode.children);
            resolvingSymbolInfo.formulaNode.children = [];
        }
    };



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
    var formulaResolver = root.formulaResolver = {};

//<editor-fold desc="公式节点相关操作">
    $.extend(formulaResolver, {
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

        _createNotLeafFormulaNode: function (symbol, field, formulaVo) {
            var self = this;

            return {
                type: self._getSymbolName(symbol) + "_" + field,
                formula: formulaVo[field],
                formulaVo: formulaVo[field],
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
         * 设置孩子节点
         * @param {FormulaNode} parentNode 父节点
         * @param {[FormulaNode]} children 孩子节点
         * @private
         */
        _setFormulaChildren: function (parentNode, children) {
            parentNode.children = children;
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
         * 更新公式节点
         * @private
         */
        _updateFormulaNodeByResolvingSymbolInfo: function (resolvingSymbolInfo, formula) {
            var self = this, symbol = resolvingSymbolInfo.symbol, symbolName, splitStrArray,
                resolver, symbolFormula, formulaNode, formulaVo, grandChildren;

            if (_.size(resolvingSymbolInfo.transitArray) === 0) {
                return;
            }

            symbolName = self._getSymbolName(symbol);
            // 1.获取公式
            symbolFormula = resolvingSymbolService.getSymbolFormula(resolvingSymbolInfo, formula);
            // 2.获取中间过渡字符串
            splitStrArray = resolvingSymbolService.getTransitStrArray(resolvingSymbolInfo, formula);
            Logger.trace("update formulaVo, formula:" + symbolFormula + ",splitStrArray:" + splitStrArray);

            formulaNode = resolvingSymbolInfo.formulaNode;
            formulaVo = formulaNode.formulaVo;
            resolver = self._getSymbolResolver(symbolName);
            // 3.更新公式vo
            if (resolver && resolver.convert2Vo) {
                if (formulaVo) {
                    $.extend(formulaVo, resolver.convert2Vo(symbolFormula, splitStrArray));
                } else {
                    formulaVo = resolver.convert2Vo(symbolFormula, splitStrArray)
                }
            }

            resolvingSymbolService.addRestTransitChildFromFormulaNode(resolvingSymbolInfo);
            grandChildren = resolvingSymbolInfo.transitChildren;
            // 4.更新孩子节点
            if (resolver.childrenField) {
                $.each(resolver.childrenField, function (index, field) {
                    var childNode;

                    childNode = self._createNotLeafFormulaNode(symbol, field, formulaVo);
                    self._setFormulaChildren(childNode, grandChildren[index]);
                    self._addFormulaChild(formulaNode, childNode);
                });
            } else {
                self._setFormulaChildren(formulaNode, grandChildren);
            }
        }
    });
//</editor-fold>

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
                LEAF: true
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
                // 中间过渡符号
                TRANSIT: ",",
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
            SUM: sumResolver,
            IF: ifResolver
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
        mappingOperator: function (matchingText) {
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
                symbol, symbolName, symbolValue, regMatch, resolvingText, resolver, mappingItem = null;

            starterArray = self._findSymbolArray(matchingText, function (symbol) {
                return String(symbol.beforeContext).length;
            });

            if (_.size(starterArray) === 0) {
                return null;
            }

            $.each(starterArray, function (index, searchMapping) {
                symbol = searchMapping.symbol;
                symbolName = self._getSymbolName(symbol);
                symbolValue = self._getSymbolValue(symbol);

                mappingItem = {symbol: symbol};
                // 如果是最基础的公式
                resolvingText = formula.substr(searchMapping.beforeContext.length);
                resolver = self._getSymbolResolver(symbolName);
                if (resolver && symbolValue.LEAF) {
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
                symbol, symbolValue, index, beforeContext, mappingItem = null;

            if (_.size(resolvingSymbolArray) === 0) {
                return null;
            }

            lastResolvingSymbolInfo = _.last(resolvingSymbolArray);
            symbol = lastResolvingSymbolInfo.symbol;
            symbolValue = self._getSymbolValue(symbol);
            index = String(matchingText).indexOf(symbolValue.TERMINATOR);

            if (index >= 0) {
                beforeContext = String(matchingText).substring(0, index);
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
         * 匹配公式元素结束符
         * @param matchingText
         * @param resolvingSymbolArray
         * @returns {*}
         */
        mappingTransitSymbol: function (matchingText, resolvingSymbolArray/*, formula*/) {
            var self = this, lastResolvingSymbolInfo,
                symbol, symbolValue, index, beforeContext, mappingItem = null;

            if (_.size(resolvingSymbolArray) === 0) {
                return null;
            }

            lastResolvingSymbolInfo = _.last(resolvingSymbolArray);
            symbol = lastResolvingSymbolInfo.symbol;
            symbolValue = self._getSymbolValue(symbol);
            index = String(matchingText).indexOf(symbolValue.TRANSIT);

            if (index >= 0) {
                beforeContext = String(matchingText).substring(0, index);
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
         * 解析公式
         * @typedef {Object} resoleVo 解析vo
         * @property {number} index 顺号
         * @property {string} mark 标记
         * @returns {[FormulaNode]} 公式节点树
         */
        resolve: function (formula) {
            var self = this, resolvingSymbolArray = [], formulaTree = [], matchingText = "", resolver,
                mappingSymbolResult, mappingFormula,
                mappingLogicResult, logic, logicName, logicValue,
                notLeafSymbolResult, transitSymbolResult, resolvingSymbolInfo;

            Logger.separate("");
            Logger.caption("formula is: " + formula);

            if (formula == null || formula.length === 0) {
                return null;
            }

            var lastResolvingIndex = -1,
                operateResult, symbol, symbolName, symbolValue,
                beforeContext, matchContext,
                parentNode, formulaNode, emptyTextNode;

            for (var i = 0, length = formula.length; i < length; i++) {
                matchingText += formula[i];
                Logger.trace(i + " matchingText:" + matchingText);

                // 1.匹配操作符
                operateResult = self.mappingOperator(matchingText);
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
                    emptyTextNode = beforeContext !== "" ? self._createTextFormulaNode(beforeContext) : null;
                    // 2.2添加普通文本公式
                    self._addFormulaNode(emptyTextNode, parentNode, formulaTree);

                    formulaNode = self._createSymbolFormulaNode(symbol, mappingFormula);
                    // 2.3添加公式元素节点
                    self._addFormulaNode(formulaNode, parentNode, formulaTree);

                    if (symbolValue.LEAF) {
                        // 2.4处理控置变量
                        matchingText = "";
                        if (symbolValue.LEAF) {
                            i += mappingFormula.length - matchContext.length;
                        }
                        lastResolvingIndex = i;
                        continue;
                    }

                    resolver = self._getSymbolResolver(symbolName);
                    if (resolver == null || !resolver.LEAF) {
                        resolvingSymbolArray.push({
                            symbol: symbol,
                            symbolName: symbolName,
                            parentFormulaNode: parentNode,
                            formulaNode: formulaNode,
                            formula: mappingFormula,
                            starterIndex: i,
                            transitArray: [],
                            transitChildren: []
                        });
                        // 2.4处理控置变量
                        matchingText = "";
                        lastResolvingIndex = i;
                        continue;
                    } else {
                        // 2.5处理控置变量
                        matchingText = "";
                        i += mappingFormula.length - matchContext.length;
                        lastResolvingIndex = i;
                    }

                    Logger.trace("匹配公式元素，树结构：" + JSON.stringify(formulaTree));
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

                // 4.处理非叶子基础公式结束符
                notLeafSymbolResult = self.mappingNotLeafSymbol(matchingText, resolvingSymbolArray);
                if (notLeafSymbolResult) {
                    resolvingSymbolInfo = notLeafSymbolResult.resolvingSymbolInfo;
                    beforeContext = notLeafSymbolResult.beforeContext;

                    if (beforeContext) {
                        parentNode = notLeafSymbolResult.resolvingSymbolInfo.formulaNode;
                        emptyTextNode = $.trim(beforeContext) !== "" ? self._createTextFormulaNode(beforeContext) : null;
                        self._addFormulaNode(emptyTextNode, parentNode, formulaTree);
                    }
                    resolvingSymbolInfo.terminatorIndex = i;
                    self._updateFormulaNodeByResolvingSymbolInfo(resolvingSymbolInfo, formula);

                    // 解析完成出栈
                    resolvingSymbolArray.pop();

                    // 处理控置变量
                    matchingText = "";
                    lastResolvingIndex = i;
                    continue;
                }

                // 5.匹配可以含有子节点的symbol的中间符号，例如IF#(A,B,C)#IF中间的逗号
                transitSymbolResult = self.mappingTransitSymbol(matchingText, resolvingSymbolArray);
                if (transitSymbolResult) {
                    beforeContext = transitSymbolResult.beforeContext;
                    resolvingSymbolInfo = transitSymbolResult.resolvingSymbolInfo;

                    if (beforeContext) {
                        parentNode = resolvingSymbolInfo.formulaNode;
                        emptyTextNode = $.trim(beforeContext) !== "" ? self._createTextFormulaNode(beforeContext) : null;
                        self._addFormulaNode(emptyTextNode, parentNode, formulaTree);
                    }
                    resolvingSymbolService.addTransit(resolvingSymbolInfo, i);

                    matchingText = "";
                    lastResolvingIndex = i;
                }
            }

            if (lastResolvingIndex < formula.length - 1) {
                self._addFormulaNode(self._createTextFormulaNode(formula.substr(lastResolvingIndex + 1)), null, formulaTree);
            }

            // 如果解析数组中还有值，说明缺少结束符，公式错误，
            if (_.size(resolvingSymbolArray) > 0) {
                Logger.error("公式有误：" + JSON.stringify(resolvingSymbolArray));
            }

            Logger.warn("formula tree is: " + JSON.stringify(formulaTree, null, "\t"));
            return formulaTree;
        },

        /**
         * 获得渲染的html代码
         * @param formulaTree
         */
        renderHtml: function (formulaTree) {
            var self = this, html = "", resolver;

            if (formulaTree == null) {
                return "";
            }

            if ($.isPlainObject(formulaTree)) {
                formulaTree = [formulaTree];
            }

            if (_.size(formulaTree) === 0) {
                return "";
            }

            $.each(formulaTree, function (index, formulaNode) {
                var type = formulaNode.type;

                resolver = self._getSymbolResolver(type);
                if (_.size(formulaNode.children) === 0) {
                    if (resolver) {
                        html += resolver.convert2Html(formulaNode.formulaVo);
                    } else if (type === "OPERATOR") {
                        html += _.template('<span class="formula formula_operator"><%= text%></span>', {text: formulaNode.formula});
                    } else if (type === "LOGIC") {
                        html += _.template('<span class="formula formula_logic"><%= text%></span>', {text: formulaNode.formula});
                    }
                } else {
                    if (resolver) {
                        html += resolver.convert2Html(formulaNode, null, self.renderHtml, self);
                    } else {
                        html += '<span class="formula_' + String(type).toLocaleLowerCase() + '">' + self.renderHtml(formulaNode.children) + '</span>';
                    }
                }
            });
            return html;
        }
    });

    formulaResolver.Logger = Logger;
    formulaResolver.logicResolver = logicResolver;
    formulaResolver.textResolver = textResolver;
    formulaResolver.subjectResolver = subjectResolver;
    formulaResolver.mSheetResolver = mSheetResolver;
    formulaResolver.commonWorldResolver = commonWorldResolver;
    formulaResolver.sheetResolver = sheetResolver;
    formulaResolver.sumResolver = sumResolver;
    formulaResolver.ifResolver = ifResolver;
})(window, jQuery, _);
