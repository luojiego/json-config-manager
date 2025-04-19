$(document).ready(function() {
    const ac = GetCookies("ac");
    const adminName = GetCookies("ad");
    let desc = permissionDesc(ac, adminName);

    desc = `${desc}  ${adminName}`;

    if (adminName) {
        $("#adminName").text(desc);
    }

    // 创建管理员下拉菜单
    const userMenuItem = $(".nav-item:has(#adminName)");
    
    // 将普通链接转换为下拉菜单
    userMenuItem.html(`
        <div class="nav-link dropdown">
            <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false">
                <i class="fas fa-user mr-1"></i> <span id="adminName">${desc || "管理员"}</span>
            </a>
            <div class="dropdown-menu dropdown-menu-right">
                <a class="dropdown-item" href="#" id="changePasswordBtn">
                    <i class="fas fa-key mr-2"></i>修改密码
                </a>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item" href="#" id="logoutBtn">
                    <i class="fas fa-sign-out-alt mr-2"></i>退出
                </a>
            </div>
        </div>
    `);

    // 绑定修改密码按钮点击事件
    $("#changePasswordBtn").on("click", function(e) {
        e.preventDefault();
        showChangePasswordModal();
    });

    // 绑定登出按钮点击事件
    $("#logoutBtn").on("click", function(e) {
        e.preventDefault();
        showLogoutConfirmation();
    });

    // 添加修改密码的模态框
    function showChangePasswordModal() {
        Swal.fire({
            title: '修改密码',
            html: `
                <div class="form-group">
                    <label for="currentPassword">当前密码</label>
                    <input type="password" id="currentPassword" class="form-control">
                </div>
                <div class="form-group">
                    <label for="newPassword">新密码</label>
                    <input type="password" id="newPassword" class="form-control">
                </div>
                <div class="form-group">
                    <label for="confirmPassword">确认新密码</label>
                    <input type="password" id="confirmPassword" class="form-control">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: '确认修改',
            cancelButtonText: '取消',
            preConfirm: () => {
                const current = document.getElementById('currentPassword').value;
                const newPass = document.getElementById('newPassword').value;
                const confirm = document.getElementById('confirmPassword').value;
                
                if (!current || !newPass || !confirm) {
                    Swal.showValidationMessage('请填写所有密码字段');
                    return false;
                }
                
                if (newPass !== confirm) {
                    Swal.showValidationMessage('新密码与确认密码不匹配');
                    return false;
                }

                if (!isPasswordStrong(newPass)) {
                    Swal.showValidationMessage('密码强度不够: 密码必须包含大小写字母、数字和特殊字符, 长度不能低于6位');
                    return false;
                }
                
                return { current, newPass };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                let req = {
                    BG: 'hxttback',
                    UG: GetCookies("UG"),
                    PWD: result.value.current,
                    NEWPWD: result.value.newPass,
                    ADMINID: GetCookies("ad")
                }
                openWs(8621, req, (data)=>{
                    if (data.ERR == -1) {
                        showMessage("修改成功");
                    } else {
                        if (data.ERR == 5010) {
                            showError("当前密码错误");
                        } else {
                            showError(`修改失败: ${data.ERR}`);
                        }
                    }
                });
            }
        });
    }

    // 确认登出对话框
    function showLogoutConfirmation() {
        Swal.fire({
            title: '确认退出',
            text: '您确定要退出系统吗？',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '确认',
            cancelButtonText: '取消'
        }).then((result) => {
            if (result.isConfirmed) {
                // 执行登出操作
                logoutSystem();
            }
        });
    }

    // 登出系统
    function logoutSystem() {
        // 清除 Cookie
        document.cookie = "ad=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        
        // 跳转到登录页面
        window.location.href = "login";
    }
});

// 显示登出确认对话框
function showLogoutConfirmation() {
    Swal.fire({
        title: '确认登出',
        text: "您确定要退出系统吗？",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
    }).then((result) => {
        if (result.isConfirmed) {
            logout();
        }
    });
}

// 执行登出操作
function logout() {
    // 显示加载状态
    let loading = Swal.fire({
        title: '正在退出...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    // 清除所有Cookie
    clearAllCookies();
    
    // 可以选择发送登出请求到服务器
    // sendLogoutRequest();
    
    // 延迟后跳转到登录页面
    setTimeout(function() {
        Swal.close();
        window.location.href = "login"; // 跳转到登录页
    }, 1000);
}

// 清除所有Cookies
function clearAllCookies() {
    // 获取所有cookie
    let cookies = document.cookie.split(';');
    
    // 遍历并删除每个cookie
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        let eqPos = cookie.indexOf("=");
        let name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
    
    // 删除常用的认证相关cookie
    document.cookie = "UG=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    document.cookie = "ad=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    document.cookie = "pw=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    document.cookie = "area=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    document.cookie = "duid=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    document.cookie = "ac=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    
    // 清除本地存储
    localStorage.clear();
    sessionStorage.clear();
}

// 发送登出请求到服务器
function sendLogoutRequest() {
    window.location.href = "login";
}
