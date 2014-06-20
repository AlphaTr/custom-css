/* global chrome, Prism, saveAs */
"use strict";
(function () {
    var css = {},
        tpl = function (sTmpl, opts) {
            return sTmpl.replace(/\{\$(\w+)\}/g, function (a, b) {
                return opts[b];
            });
        },
        encode4Html = function (s) {
            var el = document.createElement('pre'), //这里要用pre，用div有时会丢失换行，例如：'a\r\n\r\nb'
                text = document.createTextNode(s);
            el.appendChild(text);
            return el.innerHTML;
        },

        encode4HtmlValue = function (s) {
            return encode4Html(s).replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        },

        init = function () {
            chrome.storage.local.get('css', function (obj) {
                var i, cssitem = {};
                if (obj.css) {
                    css = obj.css;
                    $('#rulelist tbody').empty();
                    for (i in obj.css) {
                        cssitem = {
                            name: encode4Html(obj.css[i].name),
                            key: encode4HtmlValue(i)
                        };

                        $('#rulelist tbody').append(tpl($('#tpl-rule').html(), cssitem));
                    }
                }
            });
        },

        saveCSS = function () {
            chrome.storage.local.set({css: css}, function () {
                init();
                chrome.runtime.sendMessage({action: 'init'});
            });
        };

    // 编辑
    $('#rulelist').on('click', 'tr .edit', function (e) {
        e.preventDefault();
        var key = $(this).parents('tr').data('key'),
            cssitem = {
                name: '',
                key: '',
                css: ''
            };
        if (css[key]) {
            cssitem = {
                name: css[key].name,
                key: key,
                css: css[key].css
            };
        }

        $('#view .content').html(tpl($('#tpl-editor').html(), cssitem));
        $('#view-bg').show();
    });

    // 新建
    $('#add').on('click', function (e) {
        e.preventDefault();
        var cssitem = {
            name: '',
            key: '',
            css: ''
        };

        $('#view .content').html(tpl($('#tpl-editor').html(), cssitem));
        $('#view-bg').show();
    });

    // 查看
    $('#rulelist').on('click', 'tr .detail', function (e) {
        e.preventDefault();
        var key = $(this).parents('tr').data('key'),
            cssitem = {
                name: '',
                key: '',
                css: ''
            };
        if (css[key]) {
            cssitem = {
                name: css[key].name,
                key: key,
                css: css[key].css
            };
        }

        $('#view .content').html(tpl($('#tpl-detail').html(), cssitem));
        Prism.highlightElement($('.code-view pre code')[0]);
        $('#view-bg').show();
    });

    // 删除
    $('#rulelist').on('click', 'tr .del', function (e) {
        e.preventDefault();
        var key = $(this).parents('tr').data('key'),
            name = css[key].name;

        if (!confirm('是否删除 "' + name + '" 这条规则')) {
            return;
        }

        delete css[key];
        saveCSS();
    });

    // 保存
    $('#view-bg').on('click', '.submit', function (e) {
        e.preventDefault();
        var $view = $('#view'),
            key = $view.find('.key').val(),
            cssitem = {
                name: $view.find('.name').val(),
                css: $view.find('.csstext').val()
            };
        css[key] = cssitem;
        saveCSS();
        $('#view-bg').hide();
    });

    // 关闭按钮
    $('#view>.close').on('click', function () {
        $('#view-bg').hide();
    });

    // 导出全部规则
    $('#export').on('click', function () {
        chrome.storage.local.get('css', function (obj) {
            var exportRules, blob;
            if (obj.css) {
                exportRules = $.base64Encode(JSON.stringify(obj.css));
                blob = new Blob([exportRules], {type: "text/plain;charset=utf-8"});
                saveAs(blob, "custom.css.txt");
            }
        });
    });

    // 导入规则
    $('#import').on('change', function (e) {
        e.preventDefault();
        if (this.files.length !== 1) {
            return;
        }
        var file = this.files[0],
            textReader = new FileReader();

        if (!file.type.match('plain')) {
            return;
        }

        textReader.addEventListener("load", function (event) {

            var textFile = event.target,
                output;
            try {
                output = JSON.parse($.base64Decode(textFile.result));
            } catch (e) {
                alert("备份文件错误");
            }

            if (output && confirm('是否导入规则，这将覆盖现有的规则！')) {
                css = output;
                saveCSS();
            }
        });

        textReader.readAsText(file);
    });

    init();
}());
