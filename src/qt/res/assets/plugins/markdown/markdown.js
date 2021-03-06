/*
 * µmarkdown.js
 * markdown in under 5kb
 *
 * Copyright 2014, Simon Waldherr - http://simon.waldherr.eu/
 * Released under the MIT Licence
 * http://simon.waldherr.eu/license/mit/
 *
 * Github:  https://github.com/simonwaldherr/micromarkdown.js/
 * Version: 0.3.0
 */

/*jslint browser: true, node: true, plusplus: true, indent: 2, regexp: true, ass: true */
/*global ActiveXObject, define */

var micromarkdown = {
  useajax: false,
  regexobject: {
    headline: /^(\#{1,6})([^\#\n]+)$/m,
    code: /\s\`\`\`\n?([^`]+)\`\`\`/g,
    hr: /^(?:([\*\-_] ?)+)\1\1$/gm,
    lists: /^((\s*((\*|\-)|\d(\.|\))) [^\n]+)\n)+/gm,
    bolditalic: /(?:([\*_~]{1,3}))([^\*_~\n]+[^\*_~\s])\1/g,
    links: /!?\[([^\]<>]+)\]\(([^ \)<>]+)( "[^\(\)\"]+")?\)/g,
    reflinks: /\[([^\]]+)\]\[([^\]]+)\]/g,
    smlinks: /\@([a-z0-9]{3,})\@(t|gh|fb|gp|adn)/gi,
    mail: /<(([a-z0-9_\-\.])+\@([a-z0-9_\-\.])+\.([a-z]{2,7}))>/gmi,
    tables: /\n(([^|\n]+ *\| *)+([^|\n]+\n))((:?\-+:?\|)+(:?\-+:?)*\n)((([^|\n]+ *\| *)+([^|\n]+)\n)+)/g,
    include: /[\[<]include (\S+) from (https?:\/\/[a-z0-9\.\-]+\.[a-z]{2,9}[a-z0-9\.\-\?\&\/]+)[\]>]/gi,
    url: /<([a-zA-Z0-9@:%_\+.~#?&\/\/=]{2,256}\.[a-z]{2,4}\b(\/[\-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)?)>/g
  },
  parse: function (str, strict) {
    'use strict';
    var line, nstatus = 0,
      status, cel, calign, indent, helper, helper1, helper2, count, repstr, stra, trashgc = [],
      casca = 0,
      i = 0,
      j = 0;
    str = '\n' + str + '\n';

    if (strict !== true) {
      micromarkdown.regexobject.lists = /^((\s*(\*|\d\.) [^\n]+)\n)+/gm;
    }

    /* code */
    while ((stra = micromarkdown.regexobject.code.exec(str)) !== null) { //removed htmlEncode and.replace(/\n/gm, '<br/>').replace(/\ /gm, '&nbsp;')
      str = str.replace(stra[0], '<code>\n' + stra[1].replace(/\n/gm, '<br/>') + '</code>\n');
    }

    /* headlines */
    while ((stra = micromarkdown.regexobject.headline.exec(str)) !== null) {
      count = stra[1].length;
      str = str.replace(stra[0], '<h' + count + '>' + stra[2] + '</h' + count + '>' + '\n');
    }

    /* lists */
    while ((stra = micromarkdown.regexobject.lists.exec(str)) !== null) {
      casca = 0;
      if ((stra[0].trim().substr(0, 1) === '*') || (stra[0].trim().substr(0, 1) === '-')) {
        repstr = '<ul>';
      } else {
        repstr = '<ol>';
      }
      helper = stra[0].split('\n');
      helper1 = [];
      status = 0;
      indent = false;
      for (i = 0; i < helper.length; i++) {
        if ((line = /^((\s*)((\*|\-)|\d(\.|\))) ([^\n]+))/.exec(helper[i])) !== null) {
          if ((line[2] === undefined) || (line[2].length === 0)) {
            nstatus = 0;
          } else {
            if (indent === false) {
              indent = line[2].replace(/\t/, '    ').length;
            }
            nstatus = Math.round(line[2].replace(/\t/, '    ').length / indent);
          }
          while (status > nstatus) {
            repstr += helper1.pop();
            status--;
            casca--;
          }
          while (status < nstatus) {
            if ((line[0].trim().substr(0, 1) === '*') || (line[0].trim().substr(0, 1) === '-')) {
              repstr += '<ul>';
              helper1.push('</ul>');
            } else {
              repstr += '<ol>';
              helper1.push('</ol>');
            }
            status++;
            casca++;
          }
          repstr += '<li>' + line[6] + '</li>' + '\n';
        }
      }
      while (casca > 0) {
        repstr += '</ul>';
        casca--;
      }
      if ((stra[0].trim().substr(0, 1) === '*') || (stra[0].trim().substr(0, 1) === '-')) {
        repstr += '</ul>';
      } else {
        repstr += '</ol>';
      }
      str = str.replace(stra[0], repstr + '\n');
    }

    /* tables */
    while ((stra = micromarkdown.regexobject.tables.exec(str)) !== null) {
      repstr = '<table><tr>';
      helper = stra[1].split('|');
      calign = stra[4].split('|');
      for (i = 0; i < helper.length; i++) {
        if (calign.length <= i) {
          calign.push(0);
        } else if ((calign[i].trimRight().slice(-1) === ':') && (strict !== true)) {
          if (calign[i][0] === ':') {
            calign[i] = 3;
          } else {
            calign[i] = 2;
          }
        } else if (strict !== true) {
          if (calign[i][0] === ':') {
            calign[i] = 1;
          } else {
            calign[i] = 0;
          }
        } else {
          calign[i] = 0;
        }
      }
      cel = ['<th>', '<th align="left">', '<th align="right">', '<th align="center">'];
      for (i = 0; i < helper.length; i++) {
        repstr += cel[calign[i]] + helper[i].trim() + '</th>';
      }
      repstr += '</tr>';
      cel = ['<td>', '<td align="left">', '<td align="right">', '<td align="center">'];
      helper1 = stra[7].split('\n');
      for (i = 0; i < helper1.length; i++) {
        helper2 = helper1[i].split('|');
        if (helper2[0].length !== 0) {
          while (calign.length < helper2.length) {
            calign.push(0);
          }
          repstr += '<tr>';
          for (j = 0; j < helper2.length; j++) {
            repstr += cel[calign[j]] + helper2[j].trim() + '</td>';
          }
          repstr += '</tr>' + '\n';
        }
      }
      repstr += '</table>';
      str = str.replace(stra[0], repstr);
    }

    /* bold and italic */
    for (i = 0; i < 3; i++) {
      while ((stra = micromarkdown.regexobject.bolditalic.exec(str)) !== null) {
        repstr = [];
        if (stra[1] === '~~') {
          str = str.replace(stra[0], '<del>' + stra[2] + '</del>');
        } else
        if (stra[1] === '__') {
          str = str.replace(stra[0], '<u>' + stra[2] + '</u>');
        } else {
          switch (stra[1].length) {
          case 1:
            repstr = ['<i>', '</i>'];
            break;
          case 2:
            repstr = ['<b>', '</b>'];
            break;
          case 3:
            repstr = ['<i><b>', '</b></i>'];
            break;
          }
          str = str.replace(stra[0], repstr[0] + stra[2] + repstr[1]);
        }
      }
    }

    /* links */
    while ((stra = micromarkdown.regexobject.links.exec(str)) !== null) {
      if (stra[0].substr(0, 1) === '!') {
        str = str.replace(stra[0], '<img src="qrc:///assets/img/sdc_leak_image.jpg" onclick="confirmConversationShowImage(this)" data-src="' + stra[2] + '" alt="' + stra[1] + '" title="' + stra[1] + '" />\n');
      } else {
        str = str.replace(stra[0], '<a ' + micromarkdown.mmdCSSclass(stra[2], strict) + 'onclick="return confirmConversationOpenLink()" target="_blank" href="' + stra[2] + '">' + stra[1] + '</a>\n');
      }
    }
    while ((stra = micromarkdown.regexobject.mail.exec(str)) !== null) {
      str = str.replace(stra[0], '<a href="mailto:' + stra[1] + '">' + stra[1] + '</a>');
    }
    while ((stra = micromarkdown.regexobject.url.exec(str)) !== null) {
      repstr = stra[1];
      if (repstr.indexOf('://') === -1) {
        repstr = 'http://' + repstr;
      }
      str = str.replace(stra[0], '<a ' + micromarkdown.mmdCSSclass(repstr, strict) + 'href="' + repstr + '">' + repstr.replace(/(https:\/\/|http:\/\/|mailto:|ftp:\/\/)/gmi, '') + '</a>');
    }
    while ((stra = micromarkdown.regexobject.reflinks.exec(str)) !== null) {
      helper1 = new RegExp('\\[' + stra[2] + '\\]: ?([^ \n]+)', "gi");
      if ((helper = helper1.exec(str)) !== null) {
        str = str.replace(stra[0], '<a ' + micromarkdown.mmdCSSclass(helper[1], strict) + 'href="' + helper[1] + '">' + stra[1] + '</a>');
        trashgc.push(helper[0]);
      }
    }
    for (i = 0; i < trashgc.length; i++) {
      str = str.replace(trashgc[i], '');
    }
    while ((stra = micromarkdown.regexobject.smlinks.exec(str)) !== null) {
      switch (stra[2]) {
      case 't':
        repstr = 'https://twitter.com/' + stra[1];
        break;
      case 'gh':
        repstr = 'https://github.com/' + stra[1];
        break;
      case 'fb':
        repstr = 'https://www.facebook.com/' + stra[1];
        break;
      case 'gp':
        repstr = 'https://plus.google.com/+' + stra[1];
        break;
      case 'adn':
        repstr = 'https://alpha.app.net/' + stra[1];
        break;
      }
      str = str.replace(stra[0], '<a ' + micromarkdown.mmdCSSclass(repstr, strict) + 'href="' + repstr + '">' + stra[1] + '</a>');
    }

    /* horizontal line */
    while ((stra = micromarkdown.regexobject.hr.exec(str)) !== null) {
      str = str.replace(stra[0], '\n<hr/>\n');
    }

    /* include */
    if ((micromarkdown.useajax !== false) && (strict !== true)) {
      while ((stra = micromarkdown.regexobject.include.exec(str)) !== null) {
        helper = stra[2].replace(/[\.\:\/]+/gm, '');
        helper1 = '';
        if (document.getElementById(helper)) {
          helper1 = document.getElementById(helper).innerHTML.trim();
        } else {
          micromarkdown.ajax(stra[2]);
        }
        if ((stra[1] === 'csv') && (helper1 !== '')) {
          helper2 = {
            ';': [],
            '\t': [],
            ',': [],
            '|': []
          };
          helper2[0] = [';', '\t', ',', '|'];
          helper1 = helper1.split('\n');
          for (j = 0; j < helper2[0].length; j++) {
            for (i = 0; i < helper1.length; i++) {
              if (i > 0) {
                if (helper2[helper2[0][j]] !== false) {
                  if ((helper2[helper2[0][j]][i] !== helper2[helper2[0][j]][i - 1]) || (helper2[helper2[0][j]][i] === 1)) {
                    helper2[helper2[0][j]] = false;
                  }
                }
              }
            }
          }
          if ((helper2[';'] !== false) || (helper2['\t'] !== false) || (helper2[','] !== false) || (helper2['|'] !== false)) {
            if (helper2[';'] !== false) {
              helper2 = ';';
            } else if (helper2['\t']) {
              helper2 = '\t';
            } else if (helper2[',']) {
              helper2 = ',';
            } else if (helper2['|']) {
              helper2 = '|';
            }
            repstr = '<table>';
            for (i = 0; i < helper1.length; i++) {
              helper = helper1[i].split(helper2);
              repstr += '<tr>';
              for (j = 0; j < helper.length; j++) {
                repstr += '<td>' + micromarkdown.htmlEncode(helper[j]) + '</td>';
              }
              repstr += '</tr>';
            }
            repstr += '</table>';
            str = str.replace(stra[0], repstr);
          } else {
            str = str.replace(stra[0], '<code>' + helper1.join('\n') + '</code>');
          }
        } else {
          str = str.replace(stra[0], '');
        }
      }
    }

    //str = str.replace(/ {2,}[\n]{1,}/gmi, '<br/><br/>');
    //str = str.replace(/\n/gmi, '<br/>').replace(/^<br\/>/gmi, "\n");
    return str;
  },
  ajax: function (str) {
    'use strict';
    var xhr;
    if (document.getElementById(str.replace(/[\.\:\/]+/gm, ''))) {
      return false;
    }
    if (window.ActiveXObject) {
      try {
        xhr = new ActiveXObject("Microsoft.XMLHTTP");
      } catch (e) {
        xhr = null;
        return e;
      }
    } else {
      xhr = new XMLHttpRequest();
    }
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        var ele = document.createElement('code');
        ele.innerHTML = xhr.responseText;
        ele.id = str.replace(/[\.\:\/]+/gm, '');
        ele.style.display = 'none';
        document.getElementsByTagName('body')[0].appendChild(ele);
        micromarkdown.useajax();
      }
    };
    xhr.open('GET', str, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send();
  },
  countingChars: function (str, split) {
    'use strict';
    str = str.split(split);
    if (typeof str === 'object') {
      return str.length - 1;
    }
    return 0;
  },
  htmlEncode: function (str) {
    'use strict';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    str = div.innerHTML;
    div = undefined;
    return str;
  },
  mmdCSSclass: function (str, strict) {
    'use strict';
    var urlTemp;
    if ((str.indexOf('/') !== -1) && (strict !== true)) {
      urlTemp = str.split('/');
      if (urlTemp[1].length === 0) {
        urlTemp = urlTemp[2].split('.');
      } else {
        urlTemp = urlTemp[0].split('.');
      }
      return 'class="mmd_' + urlTemp[urlTemp.length - 2].replace(/[^\w\d]/g, '') + urlTemp[urlTemp.length - 1] + '" ';
    }
    return '';
  }
};

(function (root, factory) {
  "use strict";
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.returnExports = factory();
  }
}(this, function () {
  'use strict';
  return micromarkdown;
}));
