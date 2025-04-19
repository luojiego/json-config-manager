function SetCookie(name, value, outTimeToHour) {
    var exp = new Date();
    exp.setTime(exp.getTime() + outTimeToHour * 60 * 60 * 1000);
    document.cookie = name + "=" + value + ";expires=" + exp.toGMTString();
}

function GetCookies(name) {
    var arr = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
    if (arr != null) {
        return arr[2];
    }
    return null;
}

function DelCookie(name) {
    var exp = new Date();
    exp.setTime(exp.getTime() - 1);
    var cval = GetCookies(name);
    if (cval != null) {
        document.cookie = name + "=" + cval + ";expires=" + exp.toGMTString();
    }
}

//加载动画
function loadingLayer(timeout = 10000) {
    return Swal.fire({
        title: '加载中...',
        html: '',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        },
        timer: timeout,
        timerProgressBar: true,
    });
}

function closeLoadingLayer(loadInstance) {
    Swal.close(loadInstance);
}

function showMessage(title, callback) {
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: title,
        showConfirmButton: false,
        timer: 2000
    }).then(() => {
        if (callback) {
            callback();
        }
    });
}

function showError(title, callback) {
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: title,
        showConfirmButton: false,
        timer: 2000
    }).then(() => {
        if (callback) {
            callback();
        }
    });
}

function showMiddleError(content) {
    Swal.fire({
        toast: true,
        icon: 'error',
        title: '错误',
        text: content,
        showConfirmButton: false,
        timer: 2000
    });
}

async function showQuestion(title, callback) {
    const result = await Swal.fire({
        icon: 'question',
        title: title,
        showConfirmButton: true, // Set to true to display the "确认" button
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: '确认',
        cancelButtonText: '取消'
      });
    
      callback(result.isConfirmed); // Simplify the callback call
}

function showSuccess(title, callback) {
    Swal.fire({
        icon: 'success',
        title: title,
        showConfirmButton: false,
        timer: 2000
    }).then(() => {
        if (callback) {
            callback();
        }
    });
}

// TODO 垃圾代码，重写年月日时分秒代码
function bTmEtm(tmSt) {
    var date = new Date();
    var year = date.getFullYear();
    var nowTime = date.getTime();
    var month = date.getMonth() + 1;
    if (month < 10) {
        month = "0" + month;
    } else {
        month = month;
    }
    var day = date.getDate();
    if (day < 10) {
        day = "0" + day;
    } else {
        day = day;
    }
    var hour = date.getHours();
    if (hour < 10) {
        hour = "0" + hour;
    } else {
        hour = hour;
    }
    var minute = date.getMinutes();
    if (minute < 10) {
        minute = "0" + minute;
    } else {
        minute = minute;
    }
    var second = date.getSeconds();
    if (second < 10) {
        second = "0" + second;
    } else {
        second = second;
    }

    var tmArr = new Array();

    if (tmSt == 0) { //实时时间
        var bTm = year + "-" + month + "-" + day + " " + "00:00:00";
        var eTm = year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
    } else if (tmSt == 1) { //日时间
        var bTm = year + "-" + month + "-" + day + " " + "00:00:00";
        var eTm = year + "-" + month + "-" + day + " " + "23:59:59";
    } else if (tmSt == 2) { //周时间
        var myDate = new Date();
        var Week = myDate.getDay(); //獲取當前星期X(0-6,0代表星期天)

        //获取本周的周一和周末
        function getDay(day) {
            var today = new Date();
            var targetday_milliseconds = today.getTime() + 1000 * 60 * 60 * 24 * day;
            if (Week == 0) { //如果当天为周日，则请求时间段为当天往前推7天
                today.setTime(targetday_milliseconds - (86400000 * 7)); //註意，這行是關鍵代碼
            } else {//如果当天为非周日，则请求时间段为本周7天
                today.setTime(targetday_milliseconds); //註意，這行是關鍵代碼
            }
            var tYear = today.getFullYear();
            var tMonth = today.getMonth();
            var tDate = today.getDate();
            tMonth = doHandleMonth(tMonth + 1);
            tDate = doHandleMonth(tDate);
            return tYear + "-" + tMonth + "-" + tDate;
        }

        function doHandleMonth(month) {
            var m = month;
            if (month.toString().length == 1) {
                m = "0" + month;
            }
            return m;
        }

        var num1 = -(Week - 1);//獲取到本周周壹
        var num2 = 7 - Week;//獲取到本周周日
        var time1 = getDay(num1);
        var time2 = getDay(num2);
        var bTm = time1 + " 00:00:00";
        var eTm = time2 + " 23:59:59";
    } else if (tmSt == 3) { //月时间
        var nowdays = new Date();
        var year = nowdays.getFullYear();
        var month = nowdays.getMonth() + 1;
        month = month > 9 ? month : "0" + month;

        var firstDayOfCurMonth = `${year}-${month}-01`;
        var lastDay = new Date(year, month, 0);
        var lastDayOfCurMonth = `${year}-${month}-${lastDay.getDate()}`;

        var bTm = firstDayOfCurMonth + " " + "00:00:00";
        var eTm = lastDayOfCurMonth + " " + "23:59:59";
    } else if (tmSt == 4) { //年时间
        var bTm = year + "-" + "01-01 00:00:00";
        var eTm = year + "-" + "12-31 23:59:59";
    }

    tmArr.push(bTm);
    tmArr.push(eTm);

    return tmArr;
}

// 用户登录过期，重新登录
function loginExpired(err) {
    if (err == 99) {
        showMessage("*登录过期，请重新登录！", {icon: 5, time: 3000}, function () {
            alert("登录过期，请重新登录！1");
            parent.window.location.href = "login";
        });

        return false
    }
    return true
}

function loginOut(err) {
    if (!loginExpired(err)) {
        return
    }
}

function openUserDetailTab(sid, userName) {
    window.location.href = `userDetail?sid=${sid}`;
};

function formateTimestamp(timestamp) {
    return new Date(timestamp * 1000).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).replace(/\//g, '-');
}

// 根据 sid 获取 超链接字符串
function getUserSidLink(sid, is_robot=0) {
    var userIdWithBadge = sid;
    if (is_robot === 1) {
        userIdWithBadge = sid + '<span class="badge badge-primary" style="margin-left: 5px;">机器人</span>';
    }
    // 修改为在当前页面打开
    return '<a href="javascript:void(0);" onclick="openUserDetailTab(' + sid + ')" class="">' + userIdWithBadge + '</a>';
}

// 表头过长时鼠标放入展示被省略的文字
function tdTitle(load) {
    closeLoadingLayer(load);
    $('th').each(function (index, element) {
        $(element).attr('title', $(element).text());
    });
    $('td').each(function (index, element) {
        $(element).attr('title', $(element).text());
    });
}

function showErrorMessage(title, message) {
    Swal.fire({
        position: 'top-end',
        icon: 'error',
        title: title,
        text: message,
        showConfirmButton: false,
        timer: 1500
    });
}

function showSuccessMessage(title, message) {
    Swal.fire({
        position: 'top-end',
        icon: 'success',
        title: title,
        text: message,
        showConfirmButton: false,
        timer: 1500
    });
}

// 每3位加逗号
function localeS(nums) {
    return (parseInt(nums)).toLocaleString();
}

function areaName(num) {
    return "一区";
}

// 检查数组长度
function isArrlen(arr) {
    return arr ? arr.length : 0;
}

function permissionDesc(permission, userName) {
    // 需要使用 span 标签包裹
    let desc = "";
    switch (Number(permission)) {
        case 9:
            desc = "<span class='badge badge-primary'>管理员</span>";
            if (userName == "888888") {
                desc = "<span class='badge badge-danger'>超级管理员</span>";
            }
            break;
        case 8:
            desc = "<span class='badge badge-warning'>代理用户</span>";
            break;
        case 7:
            desc = "<span class='badge badge-info'>日志管理员</span>";
            break;
        case 6:
            desc = "<span class='badge badge-success'>财务管理员</span>";
            break;
        default:
            desc = "<span class='badge badge-secondary'>未知</span>";
    }
    return desc;
}

const minPassLength = 6;

// 密码强度验证
function isPasswordStrong(password) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*]/.test(password);

    return (
        password.length >= minPassLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumbers &&
        hasSpecialChars
    );
}

function test(val) {
    openWs(8916, {
        BG: 'hxttback',
        // UG: GetCookies("UG"),
        UG: '',
        // UN: GetCookies("UN"),
        UN: val,
    }, (data) => {
        console.log(data);
    });
}

function checkTime(time) {
    if (time) {
        if (time.includes('T')) {
            time = time.replace('T', ' ');
            if (time.endsWith('Z')) {
                time = time.slice(0, -1);
            }
        }
    }
    return time;
}

// 创建一个日期解析函数，考虑时区
function parseDateTime(dateTimeStr, tz) {
    // Handle ISO 8601 format (with T and Z)
    if (dateTimeStr.includes('T')) {
        dateTimeStr = dateTimeStr.replace('T', ' ');
        if (dateTimeStr.endsWith('Z')) {
            dateTimeStr = dateTimeStr.slice(0, -1);
        }   
    }

    // 将日期时间字符串解析为其组成部分
    var parts = dateTimeStr.split(' ');
    var dateParts = parts[0].split('-');
    var timeParts = parts[1].split(':');
    
    // 创建一个日期对象，使用UTC来避免浏览器的本地时区影响
    var date = new Date();
    date.setUTCFullYear(parseInt(dateParts[0]));
    date.setUTCMonth(parseInt(dateParts[1]) - 1); // 月份从0开始
    date.setUTCDate(parseInt(dateParts[2]));
    date.setUTCHours(parseInt(timeParts[0]));
    date.setUTCMinutes(parseInt(timeParts[1]));
    date.setUTCSeconds(parseInt(timeParts[2]));
    
    // 获取服务器时区与UTC的时差（小时）
    var tzOffset = 0;
    if (tz === 'Asia/Ho_Chi_Minh') {
        tzOffset = 7; // 越南时间 UTC+7
    } else if (tz === 'Asia/Shanghai') {
        tzOffset = 8; // 中国时间 UTC+8
    }
    // 可以添加更多时区
    
    // 将UTC时间调整为服务器时区时间
    var serverTimestamp = date.getTime() - (tzOffset * 3600 * 1000);
    return serverTimestamp;
}

// 格式化货币金额显示
function formatCurrency(isRMB, amount) {
    const numAmount = parseFloat(amount);
    if (isRMB) {
        // 转换为人民币并保留2位小数
        return '¥' + (numAmount / EXCHANGE_RATE).toFixed(2);
    } else {
        // 保持越南盾
        return numAmount.toFixed(2) + '₫';
    }
}