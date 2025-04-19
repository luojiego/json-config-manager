$(()=>{
    let socket = null;
    let isConnecting = false;
    let reconnectCount = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_INTERVAL = 3000;
    
    const callbackRegistry = {};
    
    // 使用队列存储待发送的消息
    const pendingMessages = [];
    
    // 注册iframe的事件监听器
    window.addEventListener('message', function(event) {
        // 确保消息来源是我们的子iframe
        if (event.origin === window.origin) {
            const { action, msgId, data, callback } = event.data;
            
            switch (action) {
                case 'close-connection':
                    closeWebSocket();
                    break;
                default:
                    window.logger.warn(' 收到未知操作:', action);
            }
        }
    });

    function registerCallback(msgId, callback) {
        // 注册回调函数
        if (!callbackRegistry) {
            console.log(`callbackRegistry 初始化`);
            callbackRegistry = {};
        }

        callbackRegistry[Number(msgId)] = callback;

        for (const msgId in callbackRegistry) {
            console.log(`注册 msgId: ${msgId}`);
        }
    }

    // 初始化WebSocket连接
    function initWebSocket() {
        if (socket && socket.readyState === WebSocket.OPEN) {
            return Promise.resolve(socket);
        }
        
        if (isConnecting) {
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    if (socket && socket.readyState === WebSocket.OPEN) {
                        clearInterval(checkInterval);
                        resolve(socket);
                    }
                }, 100);
            });
        }
        
        return new Promise((resolve, reject) => {
            isConnecting = true;
            
            // 正确处理协议、域名、路径
            const wsType = window.location.protocol === "https:" ? "wss://" : "ws://";
            // 获取当前URL信息
            const url = new URL(window.location.href);
            const hostname = url.hostname;
            const port = url.port ? `:${url.port}` : "";
            
            // 提取基本路径 - 适应任何路径结构
            const pathname = url.pathname;
            // 获取最后一个非空路径部分之前的所有路径作为基本路径
            const lastSlashIndex = pathname.lastIndexOf('/');
            let basePath = '';
            if (lastSlashIndex > 0) {
                // 提取到最后一个斜杠之前的路径作为基本路径
                basePath = pathname.substring(0, lastSlashIndex);
            }
            
            // 构建WebSocket URL
            const wsUrl = `${wsType}${hostname}${port}${basePath}/ws/join?guid=${GetCookies("UG")}&username=${GetCookies("un")}`;
            window.logger.log(" WebSocket连接地址:", wsUrl);
            
            try {
                socket = new WebSocket(wsUrl);
                
                socket.onopen = function() {
                    window.logger.log(" WebSocket连接已建立");
                    isConnecting = false;
                    reconnectCount = 0;
                    
                    // 处理所有待发送的消息
                    while (pendingMessages.length > 0) {
                        const { msgId, content } = pendingMessages.shift();
                        sendWebSocketMessage(msgId, content);
                    }
                    
                    resolve(socket);
                };
                
                socket.onerror = function(error) {
                    window.logger.error(" WebSocket连接错误", error);
                    isConnecting = false;
                    
                    if (reconnectCount < MAX_RECONNECT_ATTEMPTS) {
                        window.logger.log(` 连接错误，${RECONNECT_INTERVAL/1000}秒后尝试重连 (${reconnectCount + 1}/${MAX_RECONNECT_ATTEMPTS})`);
                    } else {
                        showConnectionError('连接失败', '服务器连接失败，请重新登录');
                        reject(error);
                    }
                };
                
                socket.onclose = function(event) {
                    window.logger.log(" WebSocket连接已关闭", event.code, event.reason);
                    isConnecting = false;
                    
                    if (event.code === 1000) {
                        window.logger.log(" 连接正常关闭");
                        socket = null;
                        return;
                    }
                    
                    if (reconnectCount < MAX_RECONNECT_ATTEMPTS) {
                        reconnectCount++;
                        window.logger.log(` 连接关闭，${RECONNECT_INTERVAL/1000}秒后尝试重连 (${reconnectCount}/${MAX_RECONNECT_ATTEMPTS})`);
                        
                        setTimeout(() => {
                            initWebSocket()
                                .then(() => window.logger.log(" 重连成功"))
                                .catch(err => window.logger.error(" 重连失败:", err));
                        }, RECONNECT_INTERVAL);
                    } else {
                        showConnectionError('连接断开', `与服务器的连接已断开 (代码: ${event.code})，请重新登录`);
                        socket = null;
                        reject(new Error(`连接关闭，代码: ${event.code}`));
                    }
                };
                
                socket.onmessage = function(msg) {
                    try {
                        window.logger.log(" WebSocket收到消息:", msg.data);
                        const data = msg.data;

                        if (data[0] !== '{') {
                            // 解析消息ID和内容
                            const msgId = Number(data.slice(0, 4));
                            const content = data.slice(4);
                            
                            // 解析JSON内容
                            let obj;
                            try {
                                obj = JSON.parse(content);
                            } catch (e) {
                                window.logger.error(" 消息解析错误:", e);
                                return;
                            }
                            
                            // 处理登录过期或错误
                            if (obj.Err === -100) {
                                window.logger.log(" 会话已过期，需要重新登录");
                                Swal.fire({
                                    title: '会话已过期',
                                    text: '请重新登录',
                                    icon: 'error',
                                    confirmButtonText: '确认'
                                }).then((result) => {
                                    if (result.isConfirmed) {
                                        top.window.location.href = "login";
                                    }
                                });
                                return;
                            }

                            console.log(`callbackRegistry: ${callbackRegistry}`);

                            for (const msgId in callbackRegistry) {
                                console.log(`msgId: ${msgId}`);
                            }

                            processMessage(callbackRegistry[msgId], content);

                            // 处理系统消息，无论是否有iframe注册了回调
                            handleSystemMessage(msgId, obj);
                        } else {
                            // 解析JSON内容
                            let obj;
                            try {
                                obj = JSON.parse(data);
                            } catch (e) {
                                window.logger.error(" 消息解析错误:", e);
                                return;
                            }
                            
                            showRequestFailed(obj);
                        }
                    } catch (error) {
                        window.logger.error(" 处理消息时出错:", error);
                    }
                        
                };
            } catch (error) {
                isConnecting = false;
                window.logger.error(" 初始化WebSocket时出错:", error);
                reject(error);
            }
        });
    }

    function showRequestFailed(obj) {
        closeLoadingLayer();
        let desc = "";
        switch (obj.Err) {
            case -100:
                desc = '登录已过期，请重新登录';
                break;
            case -102:
                desc = '请求超时，请稍后再试';
                break;
            case -103:
                desc = '请求参数错误';
                break;
            default:
                desc = `请求失败 ${obj.Err}`;
                break;
        }

        Swal.fire({
            title: '请求失败',
            text: desc,
            icon: 'error',
            confirmButtonText: '确认'
        });
    }
    
    // 处理系统消息（例如通知类消息）
    function handleSystemMessage(msgId, data) {
        // 处理充值记录变更
        if (msgId === 8101) {
            
        }
        // 处理兑换数据变更
        else if (msgId === 8102) {
            window.logger.log(" 兑换数据变更", data);
            Swal.fire({
                title: '兑换数据变更',
                text: '是否去查看最新数据',
                icon: 'info',
                confirmButtonText: '确认',
                showCancelButton: true,
                cancelButtonText: '取消'
            }).then((result) => {
                if (result.isConfirmed) {
                    openOrRefreshTab("Paymentpay.html", '兑换记录');
                }
            });
        } else if (msgId === 8103) {
            window.logger.log(" 管理员重复登录", data);
            Swal.fire({
                title: '重复登录',
                text: '该账号已在其他地方登录',
                icon: 'error',
                confirmButtonText: '确认'
            }).then((result) => {
                if (result.isConfirmed) {
                    top.window.location.href = "login";
                }
            });
        }
    }
    
    // 显示连接错误的弹窗
    function showConnectionError(title, text) {
        Swal.fire({
            title: title,
            text: text,
            icon: 'error',
            confirmButtonText: '确认'
        }).then(result => {
            if (result.isConfirmed) {
                top.window.location.href = "login";
            }
        });
    }
    
    // 向特定iframe发送消息
    function processMessage(callback, message) {
        message = JSON.parse(message);
        callback(message);
        /*
        if (message && message.data) {
            const content = message.data;
            const msgId = message.msgId;
            console.log(`msgId: ${msgId} content: ${content}`);

            if (callbackRegistry[msgId]) {
                callbackRegistry[msgId](content);
            } else if (callbackRegistry[msgId - 1]) {
                callbackRegistry[msgId - 1](content);
            } else {
                window.logger.warn(` 找不到消息ID ${msgId} 对应的回调函数`);
            }
        }*/
    }
        
    // 发送 WebSocket 消息
    function sendWebSocketMessage(msgId, content) {
        // 如果连接未就绪，先初始化
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            pendingMessages.push({ msgId, content });
            return initWebSocket();
        }
        
        return new Promise((resolve, reject) => {
            try {
                const message = `${msgId}${content}`;
                window.logger.log("发送WebSocket消息:", message);
                socket.send(message);
                resolve();
            } catch (error) {
                window.logger.error("发送WebSocket消息时出错:", error);
                reject(error);
            }
        });
    }
    
    // 关闭WebSocket连接
    function closeWebSocket(code = 1000, reason = "正常关闭") {
        if (socket) {
            try {
                socket.close(code, reason);
                socket = null;
                window.logger.log(` WebSocket连接已关闭: ${reason}`);
            } catch (error) {
                window.logger.error(" 关闭WebSocket时出错:", error);
            }
        }
    }
    
    // 页面关闭前清理
    window.addEventListener('beforeunload', function() {
        closeWebSocket();
    });
    
    // 在DOM变化时检查新iframe
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.tagName === 'IFRAME' && !node.hasAttribute('data-iframe-id')) {
                        const iframeId = `iframe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        node.setAttribute('data-iframe-id', iframeId);
                    }
                });
            }
        });
    });
    
    // 开始观察DOM变化
    observer.observe(document.body, { childList: true, subtree: true });
    
    function openWs(msgId, sendMsgMap, callback) {
        return new Promise((resolve, reject) => {
            // 生成唯一的回调ID

            callbackRegistry[parseInt(msgId) + 1] = callback;

            // 准备消息内容
            let content = "";
            if (sendMsgMap instanceof Map) {
                sendMsgMap.forEach(function (value, key) {
                    content += '"' + key + '":' + value;
                });

                content = "{" + content + "}";
            } else {
                content = JSON.stringify(sendMsgMap);
            }

            // 发送WebSocket消息
            sendWebSocketMessage(msgId, content)
            .then(() => {
                console.log(` 消息已发送: ${msgId}`);
            })
            .catch(error => {
                console.log(` 消息发送失败: ${msgId}`);
            });
        });
    }
    window.openWs = openWs;
})