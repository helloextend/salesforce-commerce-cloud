'use strict';

module.exports = {
    stringToHtml: function (str) {
        return str;
    },
    encodeBase64: function (str) {
        return str;
    },
    format: function (format) {
        return format;
    },
    formatCalendar(calendar, format) {
        var date = calendar.time;

        var year = toFormattedString(date.getFullYear(), 4);
        var month = toFormattedString(date.getMonth() + 1, 2);
        var day = toFormattedString(date.getDate(), 2);

        format = format.replace(/yyyy/i, year);
        format = format.replace(/mm/i, month);
        format = format.replace(/dd/i, day);

        return format;

        function toFormattedString(value, length) {
            var prefix = '';
            var str = value.toString();
            if(str.length < length) {
                prefix = (new Array(length - str.length + 1)).join('0');
            }
            return prefix + str;
        }
    }
};
