# JSON 配置文件编辑器

这是一个基于 Web 的 JSON 配置文件编辑器，允许用户创建、编辑、查看和下载 JSON 配置文件。

## 功能特点

- 创建新的 JSON 配置文件
- 编辑现有的 JSON 配置文件
- 查看 JSON 文件内容
- 下载 JSON 文件
- 删除 JSON 文件
- 安全的访问控制（需要密码验证）

## 技术栈

- 后端：Go (Gin 框架)
- 前端：HTML, JavaScript
- 数据库：用于存储文件元数据
- 文件存储：本地文件系统

## 安装与运行

1. 确保已安装 Go 环境
2. 克隆项目到本地
3. 安装依赖：
   ```bash
   go mod download
   ```
4. 运行项目：
   ```bash
   go run main.go
   ```
5. 访问 `http://localhost:8080` 开始使用

## 使用说明

1. 访问主页时需要提供密码进行身份验证
2. 在 URL 中添加 `?password=YOUR_PASSWORD` 参数进行访问
3. 主要功能：
   - 创建新文件：点击 "新建" 按钮
   - 编辑文件：选择文件后点击 "编辑"
   - 查看文件：选择文件后点击 "查看"
   - 下载文件：选择文件后点击 "下载"
   - 删除文件：选择文件后点击 "删除"

## API 接口

- `GET /json-api/json` - 获取所有 JSON 文件列表
- `GET /json-api/json/:filename` - 获取指定 JSON 文件内容
- `GET /json-api/json/:filename/download` - 下载指定 JSON 文件
- `POST /json-api/json/:filename` - 创建新的 JSON 文件
- `PUT /json-api/json/:filename` - 更新指定 JSON 文件
- `DELETE /json-api/json/:filename` - 删除指定 JSON 文件

## 安全说明

- 所有访问都需要密码验证
- 建议在生产环境中修改默认密码
- 文件操作都有权限验证

## 注意事项

- 请确保有足够的磁盘空间用于存储 JSON 文件
- 建议定期备份重要的配置文件
- 请勿在公共网络环境中使用默认密码 