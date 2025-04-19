/**
 * 高级日志系统 - 显示原始调用位置
 */
(function(window) {
    // 创建日志工具
    var Logger = function(isDebug) {
        this.isDebug = !!isDebug;
    };
    
    // 从堆栈获取调用信息
    function getCallerInfo() {
        try {
            throw new Error();
        } catch (err) {
            // 解析堆栈信息
            var stackLines = err.stack.split('\n');
            
            // 跳过前面几行（Error, getCallerInfo, 和日志方法本身）
            // 具体跳过行数可能需要根据浏览器调整
            var callerLine = stackLines[3] || '';
            
            // 提取文件名和行号
            var match = callerLine.match(/at\s+(.*)\s+\((.*):(\d+):(\d+)\)/) || 
                       callerLine.match(/at\s+(.*):(\d+):(\d+)/);
                       
            if (match && match.length >= 4) {
                var method = match[1] || '(anonymous)';
                var file = match[2] || match[1];
                var line = match[3];
                var column = match[4];
                
                // 获取文件名而不是完整路径
                var fileName = file.split('/').pop();
                
                return fileName + ':' + line;
            }
            return '(unknown source)';
        }
    }
    
    // 创建控制台输出函数
    function createConsoleMethod(method) {
        return function() {
            if (!this.isDebug || !console || !console[method]) {
                return this;
            }
            
            // 获取调用位置
            var callerInfo = getCallerInfo();
            var args = Array.prototype.slice.call(arguments);
            
            // 在开发者工具中保持可点击的链接需要特殊处理
            if (typeof console[method] === 'function') {
                // 在某些浏览器中可以直接传递格式化字符串
                var formatString = '[%s] [' + callerInfo + ']';
                console[method].apply(console, [formatString, method.toUpperCase()].concat(args));
            }
            
            return this;
        };
    }
    
    // 原型方法
    Logger.prototype = {
        // 设置调试模式
        setDebugMode: function(isDebug) {
            this.isDebug = !!isDebug;
            return this;
        },
        
        // 获取当前模式
        getDebugMode: function() {
            return this.isDebug;
        },
        
        // 使用工厂方法创建各种日志函数
        log: createConsoleMethod('log'),
        info: createConsoleMethod('info'),
        warn: createConsoleMethod('warn'),
        error: createConsoleMethod('error'),
        
        // 表格输出（不会显示调用位置）
        table: function(data) {
            if (this.isDebug && console && console.table) {
                console.table(data);
            }
            return this;
        }
    };
    
    // 判断是否为调试模式
    function detectDebugMode() {
        return true;
        // 通过域名判断
        if (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.startsWith('192.168.') ||
            window.location.hostname.startsWith('172.')) {
            return true;
        }
        
        // 通过 URL 参数判断
        if (window.location.search.indexOf('debug=true') !== -1) {
            return true;
        }
        
        // 通过全局变量判断
        if (window.DEBUG_MODE === true) {
            return true;
        }
        
        return false;
    }
    
    // 创建全局实例
    window.logger = new Logger(detectDebugMode());
    
})(window);