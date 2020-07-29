
//生成UUID
function uuid() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
}

/**
 * 秒转换成 00:00:00格式
 * @param second
 * @returns {*}
 */
function realFormatSecond(second) {
    if(second < 0){
        console.log('转换时间格式的时候，传入参数为负数!')
        return 0;
    }
    var secondType = typeof second;
    if (secondType === "number" || secondType === "string") {
        second = parseInt(second);
        var mimute = Math.floor(second / 60);
        second = second - mimute * 60;
        return ("0" + mimute).slice(-2) + ":" + ("0" + second).slice(-2);
    } else {
        return "00:00";
    }
}


/**
 * 时间戳转换成日期
 * @param timestamp  时间戳
 * @returns {string}
 */
function timestampToTime(timestamp) {
    var date = new Date(timestamp * 1000);//时间戳为10位需*1000，时间戳为13位的话不需乘1000
    var Y = date.getFullYear() + '-';
    var M = (date.getMonth()+1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1) + '-';
    var D = date.getDate() + ' ';
    var h = date.getHours() + ':';
    var m = date.getMinutes() + ':';
    var s = date.getSeconds();
    return Y+M+D+h+m+s;
}

module.exports = {

    uuid,
    realFormatSecond,
    timestampToTime


}