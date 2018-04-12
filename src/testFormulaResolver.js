// 测试
(function (formulaResolver, $, _) {

    var R = formulaResolver;
    var Logger = formulaResolver.Logger;

    Logger.level = 3;
    Logger.$logBox = $("#main");

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
    Logger.warn("result is: " + JSON.stringify(R.textResolver.convert2Vo(textFormula), null, "\t"));

    Logger.separate();

    // 1.2测试convert2Vo方法
    Logger.caption("1.2 测试 textResolver.convert2Formula(textFormulaVo)");
    var textFormulaVo = {
        "text": "abc"
    };
    Logger.info("textFormulaVo is: " + JSON.stringify(textFormulaVo, null, "\t"));
    Logger.warn("result is: " + R.textResolver.convert2Formula(textFormulaVo), null, "\t");

    // =================================================================================
    Logger.separate();
    Logger.info("2.测试【会计科目】解析器");
    Logger.separate();
    // 2.1测试convert2Vo方法
    Logger.caption("2.1 测试 subjectResolver.convert2Vo(subjectFormula)");
    var subjectFormula = "[K100101,^S1^G20^Y:0^M:0^E0]";
    Logger.info("subjectFormula is: " + subjectFormula);
    Logger.warn("result is: " + JSON.stringify(R.subjectResolver.convert2Vo(subjectFormula), null, "\t"));

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
    Logger.warn("result is: " + R.subjectResolver.convert2Formula(subjectFormulaVo), null, "\t");

    // =================================================================================
    Logger.separate();
    Logger.info("3.测试【表间取值】解析器");
    Logger.separate();
    // 3.1测试convert2Vo方法
    Logger.caption("3.1 测试 mSheetResolver.convert2Vo(mSheetFormula)");
    var mSheetFormula = "{FSTM_JS0102!<B3>}";
    Logger.info("mSheetFormula is: " + mSheetFormula);
    Logger.warn("result is: " + JSON.stringify(R.mSheetResolver.convert2Vo(mSheetFormula), null, "\t"));

    Logger.separate();

    // 3.2测试convert2Vo方法
    Logger.caption("3.2 测试 mSheetResolver.convert2Formula(mSheetFormulaVo)");
    var mSheetFormulaVo = {
        "reportCode": "FSTM_JS0102",
        "position": "B3"
    };
    Logger.info("mSheetFormulaVo is: " + JSON.stringify(mSheetFormulaVo, null, "\t"));
    Logger.warn("result is: " + R.mSheetResolver.convert2Formula(mSheetFormulaVo), null, "\t");

    // =================================================================================
    Logger.separate();
    Logger.info("4.测试【常用字(其它)】解析器");
    Logger.separate();
    // 4.1测试convert2Vo方法
    Logger.caption("4.1 测试 commonWorldResolver.convert2Vo(commonWorldFormula)");
    var commonWorldFormula = "#queryTIN#";
    Logger.info("commonWorldFormula is: " + commonWorldFormula);
    Logger.warn("result is: " + JSON.stringify(R.commonWorldResolver.convert2Vo(commonWorldFormula), null, "\t"));

    Logger.separate();

    // 4.2测试convert2Vo方法
    Logger.caption("2.2 测试 commonWorldResolver.convert2Formula(commonWorldFormulaVo)");
    var commonWorldFormulaVo = {
        "name": "queryTIN",
        "label": "纳税人识别号"
    };
    Logger.info("commonWorldFormulaVo is: " + JSON.stringify(commonWorldFormulaVo, null, "\t"));
    Logger.warn("result is: " + R.commonWorldResolver.convert2Formula(commonWorldFormulaVo), null, "\t");


    // =================================================================================
    Logger.separate();
    Logger.info("5.测试【单元格】解析器");
    Logger.separate();
    // 5.1测试convert2Vo方法
    Logger.caption("5.1 测试 sheetResolver.convert2Vo(sheetFormula)");
    var sheetFormula = "<C3>";
    Logger.info("sheetFormula is: " + sheetFormula);
    Logger.warn("result is: " + JSON.stringify(R.sheetResolver.convert2Vo(sheetFormula), null, "\t"));

    Logger.separate();

    // 5.2测试convert2Vo方法
    Logger.caption("5.2 测试 sheetFormula.convert2Formula(sheetFormulaVo)");
    var sheetFormulaVo = {
        "position": "C3"
    };
    Logger.info("sheetFormulaVo is: " + JSON.stringify(sheetFormulaVo, null, "\t"));
    Logger.warn("result is: " + R.sheetResolver.convert2Formula(sheetFormulaVo), null, "\t");


    // =================================================================================
    Logger.separate();
    Logger.info("6.测试【求和(SUM)】解析器");
    Logger.separate();
    // 6.1测试convert2Vo方法
    Logger.caption("6.1 测试 sumResolver.convert2Vo(sumFormulaVo)");
    var sumFormula = "SUM(<C1>:<C2>)";
    Logger.info("sumFormulaVo is: " + sumFormula);
    Logger.warn("result is: " + JSON.stringify(R.sumResolver.convert2Vo(sumFormula), null, "\t"));

    Logger.separate();

    // 6.2测试convert2Vo方法
    Logger.caption("6.2 测试 sumResolver.convert2Formula(sumFormulaVo)");
    var sumFormulaVo = {
        "startPosition": "C1",
        "endPosition": "C2"
    };
    Logger.info("sumFormulaVo is: " + JSON.stringify(sumFormulaVo, null, "\t"));
    Logger.warn("result is: " + R.sumResolver.convert2Formula(sumFormulaVo), null, "\t");


    // =================================================================================
    Logger.separate();
    Logger.info("7.测试【IF】解析器");
    Logger.separate();
    // 6.1测试convert2Vo方法
    Logger.caption("7.1 测试 ifResolver.convert2Vo(ifFormula)");
    var ifFormula = "IF#(<E14>*<E15>>0,<E14>*<E15>,0)#IF";
    Logger.info("ifFormula is: " + ifFormula);
    Logger.warn("result is: " + JSON.stringify(R.ifResolver.convert2Vo(ifFormula), null, "\t"));

    Logger.separate();

    // 6.2测试convert2Vo方法
    Logger.caption("7.2 测试 ifResolver.convert2Formula(sumFormulaVo)");
    var ifFormulaVo = {
        "condition": "<E14>*<E15>>0",
        "trueValue": "<E14>*<E15>",
        "falseValue": "0"
    };
    Logger.info("ifFormulaVo is: " + JSON.stringify(ifFormulaVo, null, "\t"));
    Logger.warn("result is: " + R.ifResolver.convert2Formula(ifFormulaVo), null, "\t");
    */
    //</editor-fold>


    //<editor-fold desc="测试复杂公式">
    /*
     formulaResolver.resolve(" abc3#corpName#");
     formulaResolver.resolve("[K1001,1002,^S1^G20^Y:3^M:1^E0]+#queryBeginPeriod#+[K1604,1605,^S1^G20^Y2010:3^M6:1^E0]");
     formulaResolver.resolve("#corpName# + [K1001,^S0^G20^Y:0^M:0^E0] + ({11_01!<C3>})");
     formulaResolver.resolve(" abc3#corpName# + [K1001,^S0^G20^Y:0^M:0^E0] + ({11_01!<C3>})");
     formulaResolver.resolve("{13_01!<C41>}");
     */
    //</editor-fold>

    //<editor-fold desc="1.测试单个公式">
     Logger.separate();
     Logger.caption("测试解析树");
     // 1.1.测试普通文本
     Logger.info("1.1.测试普通文本");
     formulaResolver.resolve("abc");
     // 1.2.测试【会计科目】公式
     Logger.info("1.2.测试【会计科目】公式");
     formulaResolver.resolve("[K100101,^S1^G20^Y:0^M:0^E0]");
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
     Logger.info(" 1.7.测试【条件(IF)】公式");

     formulaResolver.resolve("IF#(1+2>0,true,false)#IF");
     formulaResolver.resolve("IF#(<E14>*<E15>>0,<E14>*<E15>,0)#IF");
     formulaResolver.resolve("IF#(<E14>*<E15>>0,<E14>*<E15>, IF#(4 + 5 > 6, 1, 0)#IF)#IF");
     formulaResolver.resolve("IF#(1 + 2 > 3, 4, 5)#IF + IF#(6 + 7 > 8, 9, 10)#IF");

     // 1.8.测试 【组(Group)】公式
     Logger.info(" 1.8.测试 【组(Group)】公式");
     formulaResolver.resolve("(1+2)");
     //</editor-fold>
     //<editor-fold desc="2.测试组和公式">

     // 2.1.测试【会计科目】+【表间取值】+【常用字(其它)】
     Logger.info("2.1.测试【会计科目】+【表间取值】+【常用字(其它)】");
     formulaResolver.resolve("[K1001,(1001,)^S1^G41^Y:0^M:0^E0] + {11!<C3>} + #corpName#+#registAddress#");
     formulaResolver.resolve("[K1001,(1001,)^S1^G41^Y:0^M:0^E0] + {11!<C3>}");
     // 2.2.测试(【会计科目】+【表间取值】) +【常用字(其它)】

     // 2.3.测试(【会计科目】+【表间取值】) / (【会计科目】 - 【表间取值】) * 2.5

    //</editor-fold>

    //<editor-fold desc="测试渲染文本">

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

    // 7.2测试if运算
    var ifRenderTitle1 = "测试混合公式之IF的渲染";
    var ifRenderFormula1 = "IF#(1 + 2 > 3, 4, 5)#IF";
    var ifRenderResult1 = formulaResolver.renderHtml(formulaResolver.resolve(ifRenderFormula1));
    testFormulaRender(ifRenderTitle1, ifRenderFormula1, ifRenderResult1);

    var ifRenderTitle2 = "测试混合公式之IF的渲染";
    var ifRenderFormula2 = "IF#(<E14>*<E15>>0,<E14>*<E15>,0)#IF";
    var ifRenderResult2 = formulaResolver.renderHtml(formulaResolver.resolve(ifRenderFormula2));
    testFormulaRender(ifRenderTitle2, ifRenderFormula2, ifRenderResult2);

    var ifRenderTitle3 = "测试混合公式之IF的渲染";
    var ifRenderFormula3 = "IF#(<E14>*<E15>>0,SUM(<C3>:<C13>), IF#(4 + 5 > 6, 1, 0)#IF)#IF";
    var ifRenderResult3 = formulaResolver.renderHtml(formulaResolver.resolve(ifRenderFormula3));
    testFormulaRender(ifRenderTitle3, ifRenderFormula3, ifRenderResult3);

    var ifRenderTitle4 = "测试混合公式之IF的渲染";
    var ifRenderFormula4 = "IF#(1 + 2 > 3, 4, 5)#IF + IF#(6 + 7 > 8, 9, 10)#IF";
    var ifRenderResult4 = formulaResolver.renderHtml(formulaResolver.resolve(ifRenderFormula4));
    testFormulaRender(ifRenderTitle4, ifRenderFormula4, ifRenderResult4);

    var ifRenderTitle5 = "测试混合公式之IF的渲染";
    var ifRenderFormula5 = "IF#(1 + 2 > 3, 4, [K1001,^S0^G20^Y:0^M:0^E0])#IF + IF#(6 + 7 > 8, 9, 10)#IF";
    var ifRenderResult5 = formulaResolver.renderHtml(formulaResolver.resolve(ifRenderFormula5));
    testFormulaRender(ifRenderTitle5, ifRenderFormula5, ifRenderResult5);

    var ifRenderTitle6 = "测试混合公式之IF的渲染";
    var ifRenderFormula6 = "IF#(({10!<C4>}-{10!<D4>}+{10!<C16>}-{10!<D16>}+{10!<C17>}-{10!<D17>})<0,-({10!<C4>}-{10!<D4>}+{10!<C16>}-{10!<D16>}+{10!<C17>}-{10!<D17>}),0.00)#IF";
    var ifRenderResult6 = formulaResolver.renderHtml(formulaResolver.resolve(ifRenderFormula6));
    testFormulaRender(ifRenderTitle6, ifRenderFormula6, ifRenderResult6);

    var ifRenderTitle7 = "测试混合公式之IF的渲染";
    var ifRenderFormula7 = "IF#(({11!<C10>}-{11!<D10>}+{12!<D13>}+{12!<D6>}+{12!<D5>}-{13_01!<C9>}+(<C30>-{12!<D7>})-({11!<C19>}-{11!<D19>})-({11!<C6>}+{11!<C10>})*0.005/0.995-{13_01!<C32>})>0,0.00,({11!<C10>}-{11!<D10>}+{12!<D13>}+{12!<D6>}+{12!<D5>}-{13_01!<C9>}+(<C30>-{12!<D7>})-({11!<C19>}-{11!<D19>})-({11!<C6>}+{11!<C10>})*0.005/0.995-{13_01!<C32>}))#IF";
    var ifRenderResult7 = formulaResolver.renderHtml(formulaResolver.resolve(ifRenderFormula7));
    testFormulaRender(ifRenderTitle7, ifRenderFormula7, ifRenderResult7);

    var ifRenderTitle8 = "测试混合公式之IF的渲染";
    var ifRenderFormula8 = "IF#(({10!<C4>}-{10!<D4>}+{10!<C16>}-{10!<D16>}+{10!<C17>}-{10!<D17>})<0,-({10!<C4>}-{10!<D4>}+{10!<C16>}-{10!<D16>}+{10!<C17>}-{10!<D17>}),0.00)#IF + IF#(({10!<C4>}-{10!<D4>}+{10!<C16>}-{10!<D16>}+{10!<C17>}-{10!<D17>})<0,-({10!<C4>}-{10!<D4>}+{10!<C16>}-{10!<D16>}+{10!<C17>}-{10!<D17>}),0.00)#IF";
    var ifRenderResult8 = formulaResolver.renderHtml(formulaResolver.resolve(ifRenderFormula8));
    testFormulaRender(ifRenderTitle8, ifRenderFormula8, ifRenderResult8);

    // 9 测试混合公式之表单单元格相加的渲染
    var complexRenderTitle7 = "测试混合公式之表单单元格相加的渲染";
    var complexRenderFormula7 = "<G25>+<G26>+<G27>+<G28>";
    var complexRenderResult7 = formulaResolver.renderHtml(formulaResolver.resolve(complexRenderFormula7));
    testFormulaRender(complexRenderTitle7, complexRenderFormula7, complexRenderResult7);

    // 9 测试混合公式之表单单元格相加的渲染
    var complexRenderTitle8 = "测试混合公式之表间单元格相加的渲染";
    var complexRenderFormula8 = "({10!<C4>}-{10!<D4>}+{10!<C16>}-{10!<D16>}+{10!<C17>}-{10!<D17>})<0";
    var complexRenderResult8= formulaResolver.renderHtml(formulaResolver.resolve(complexRenderFormula8));
    testFormulaRender(complexRenderTitle8, complexRenderFormula8, complexRenderResult8);
    //</editor-fold>

//     Logger.info(JSON.stringify(formulaResolver._findSymbolArray("IF#"), null, null));
//     formulaResolver.resolve("1 + 2 > 0");

    //临时测试
    Logger.info(" 1.8.测试 【组(Group)】公式");
    var groupTitle = "1.8.测试 【组(Group)】公式";
    var groupFormula = "(1+2)";
    var groupResult = formulaResolver.renderHtml(formulaResolver.resolve(groupFormula));
    testFormulaRender(groupTitle, groupFormula, groupResult);

//     var ifRenderTitle1 = "测试混合公式之IF的渲染";
//     var ifRenderFormula1 = "IF#(1 + 2 > 3, 4, 5)#IF";
//     var ifRenderResult1 = formulaResolver.renderHtml(formulaResolver.resolve(ifRenderFormula1));
//     testFormulaRender(ifRenderTitle1, ifRenderFormula1, ifRenderResult1);

})(formulaResolver, $, _);
