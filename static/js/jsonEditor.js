// JSON Editor Main Script
$(document).ready(function() {
    // Initialize variables
    let editor = null;
    let currentFileId = null;
    let currentFileName = null;
    let jsonFilesTable = null;
    let hasUnsavedChanges = false;
    let isEditorFullscreen = false;

    // Initialize editor
    function initEditor() {
        editor = ace.edit("jsonEditor");
        editor.setTheme("ace/theme/monokai");
        editor.session.setMode("ace/mode/json");
        editor.setOptions({
            fontSize: "14px",
            showPrintMargin: false,
            highlightActiveLine: true,
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true
        });

        editor.on("change", function() {
            if (!hasUnsavedChanges) {
                hasUnsavedChanges = true;
                updateEditorStatus("未保存更改");
            }
        });
    }

    // Initialize DataTable for JSON files
    function initDataTable() {
        jsonFilesTable = $('#jsonFilesTable').DataTable({
            ajax: {
                url: '/json-api/json',
                dataSrc: '',
                error: function(xhr, error, thrown) {
                    console.error('Error loading JSON files:', error);
                    toastr.error('加载 JSON 文件列表失败，请检查网络连接', '错误');
                }
            },
            columns: [
                { data: 'id' },
                { data: 'filename' },
                { 
                    data: 'modified_time',
                    render: function(data) {
                        return formatDateTime(data);
                    }
                },
                { 
                    data: 'size',
                    render: function(data) {
                        return formatFileSize(data);
                    }
                },
                {
                    data: null,
                    render: function(data) {
                        return `
                            <div class="file-actions">
                                <button type="button" class="btn btn-primary btn-xs edit-file" data-id="${data.id}" data-filename="${data.filename}">
                                    <i class="fas fa-edit"></i> 编辑
                                </button>
                                <button type="button" class="btn btn-info btn-xs api-info" data-id="${data.id}" data-filename="${data.filename}">
                                    <i class="fas fa-link"></i> API
                                </button>
                                <button type="button" class="btn btn-danger btn-xs delete-file" data-id="${data.id}" data-filename="${data.filename}">
                                    <i class="fas fa-trash"></i> 删除
                                </button>
                            </div>
                        `;
                    }
                }
            ],
            responsive: true,
            language: {
                "emptyTable": "没有 JSON 文件",
                "info": "显示第 _START_ 至 _END_ 项结果，共 _TOTAL_ 项",
                "infoEmpty": "显示第 0 至 0 项结果，共 0 项",
                "infoFiltered": "(由 _MAX_ 项结果过滤)",
                "lengthMenu": "显示 _MENU_ 项结果",
                "search": "搜索:",
                "zeroRecords": "没有匹配结果",
                "paginate": {
                    "first": "首页",
                    "last": "末页",
                    "next": "下一页",
                    "previous": "上一页"
                }
            },
            order: [[2, 'desc']] // Order by modified date by default
        });
    }

    // Show editor with file content
    function openEditor(fileId, fileName) {
        currentFileId = fileId;
        currentFileName = fileName;
        $("#currentFileName").text(fileName);
        
        $.ajax({
            url: `/json-api/json/${fileName}`,
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                const jsonString = JSON.stringify(data, null, 4);
                editor.setValue(jsonString);
                editor.clearSelection();
                editor.scrollToLine(0, true, true, function() {});
                hasUnsavedChanges = false;
                updateEditorStatus("已加载");
                $("#editorSection").slideDown();
                
                // Highlight this row in the table
                $('#jsonFilesTable tbody tr').removeClass('active');
                $(`#jsonFilesTable tbody tr:has(button[data-id="${fileId}"])`).addClass('active');
                
                // Scroll to editor
                $('html, body').animate({
                    scrollTop: $("#editorSection").offset().top - 75
                }, 500);
            },
            error: function(xhr) {
                showError('加载文件失败', xhr.responseJSON?.message || '无法加载文件内容');
            }
        });
    }

    // Format JSON in editor
    function formatJson() {
        try {
            const content = editor.getValue();
            const jsonObj = JSON.parse(content);
            const formatted = JSON.stringify(jsonObj, null, 4);
            editor.setValue(formatted);
            editor.clearSelection();
            updateEditorStatus("已格式化");
        } catch (e) {
            showError('格式化 JSON 失败', '当前内容不是有效的 JSON');
        }
    }

    // Save JSON file
    function saveJsonFile() {
        try {
            const content = editor.getValue();
            JSON.parse(content); // Validate JSON
            
            $.ajax({
                url: `/json-api/json/${currentFileName}`,
                method: 'PUT',
                data: content,
                contentType: 'application/json',
                success: function() {
                    hasUnsavedChanges = false;
                    updateEditorStatus("已保存");
                    showSuccess('保存成功', '文件已成功保存');
                    refreshFileList();
                },
                error: function(xhr) {
                    showError('保存失败', xhr.responseJSON?.message || '无法保存文件');
                }
            });
        } catch (e) {
            showError('保存失败', '包含无效的 JSON，请修正后重试');
        }
    }

    // Create new JSON file
    function createNewFile() {
        const filename = $("#newFileName").val().trim();
        const initialContentType = $("input[name='initialContent']:checked").val();
        
        if (!filename) {
            showError('创建失败', '请输入文件名');
            return;
        }
        
        if (!/^[a-zA-Z0-9_-]+$/.test(filename)) {
            showError('创建失败', '文件名只能包含字母、数字、下划线和连字符');
            return;
        }
        
        let initialContent = {};
        
        if (initialContentType === 'array') {
            initialContent = [];
        } else if (initialContentType === 'sample') {
            initialContent = {
                "name": "示例数据",
                "description": "这是一个 JSON 示例",
                "created": new Date().toISOString(),
                "items": [
                    {
                        "id": 1,
                        "value": "项目 1"
                    },
                    {
                        "id": 2,
                        "value": "项目 2"
                    }
                ],
                "settings": {
                    "enabled": true,
                    "maxItems": 10
                }
            };
        }
        
        $.ajax({
            url: `/json-api/json/${filename}.json`,
            method: 'POST',
            data: JSON.stringify(initialContent),
            contentType: 'application/json',
            success: function(data) {
                showSuccess('创建成功', '文件已成功创建');
                refreshFileList();
                $("#createFileModal").modal('hide');
                
                // Open the new file in editor
                setTimeout(function() {
                    openEditor(data.id, `${filename}.json`);
                }, 500);
            },
            error: function(xhr) {
                showError('创建失败', xhr.responseJSON?.message || '无法创建文件');
            }
        });
    }

    // Delete JSON file
    function deleteJsonFile(fileId, fileName) {
        $.ajax({
            url: `/json-api/json/${fileName}`,
            method: 'DELETE',
            success: function() {
                showSuccess('删除成功', '文件已成功删除');
                refreshFileList();
                
                // Close editor if the deleted file was open
                if (currentFileName === fileName) {
                    closeEditor();
                }
            },
            error: function(xhr) {
                showError('删除失败', xhr.responseJSON?.message || '无法删除文件');
            }
        });
    }

    // Show API info for a file
    function showApiInfo(fileId, fileName) {
        const baseUrl = window.location.origin;
        const apiUrl = `${baseUrl}/json-api/json/${fileName}`;
        const downloadUrl = `${baseUrl}/json-api/json/${fileName}/download`;
        
        $("#apiUrlField").val(apiUrl);
        $("#downloadUrlField").val(downloadUrl);
        $("#apiExampleFileName").text(fileName);
        $("#downloadExampleFileName").text(fileName);
        
        $("#apiInfoModal").modal('show');
    }

    // Toggle fullscreen editor
    function toggleEditorFullscreen() {
        const editorContainer = document.getElementById('editorSection');
        
        if (!isEditorFullscreen) {
            editorContainer.classList.add('editor-fullscreen');
            $("#fullscreenEditorBtn").html('<i class="fas fa-compress-arrows-alt"></i>');
            editor.resize();
        } else {
            editorContainer.classList.remove('editor-fullscreen');
            $("#fullscreenEditorBtn").html('<i class="fas fa-expand-arrows-alt"></i>');
            editor.resize();
        }
        
        isEditorFullscreen = !isEditorFullscreen;
    }

    // Refresh file list
    function refreshFileList() {
        jsonFilesTable.ajax.reload();
    }

    // Close editor
    function closeEditor() {
        if (hasUnsavedChanges) {
            confirmDialog('有未保存的更改', '您有未保存的更改，确定要关闭编辑器吗？', function() {
                $("#editorSection").slideUp();
                currentFileId = null;
                currentFileName = null;
                $('#jsonFilesTable tbody tr').removeClass('active');
                
                if (isEditorFullscreen) {
                    toggleEditorFullscreen();
                }
            });
        } else {
            $("#editorSection").slideUp();
            currentFileId = null;
            currentFileName = null;
            $('#jsonFilesTable tbody tr').removeClass('active');
            
            if (isEditorFullscreen) {
                toggleEditorFullscreen();
            }
        }
    }

    // Update editor status
    function updateEditorStatus(message) {
        $("#editorStatus").text(message);
    }

    // Format date and time
    function formatDateTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString();
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Show success message
    function showSuccess(title, message) {
        toastr.success(message, title);
    }

    // Show error message
    function showError(title, message) {
        toastr.error(message, title);
    }

    // Confirmation dialog
    function confirmDialog(title, message, callback) {
        Swal.fire({
            title: title,
            text: message,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: '确定',
            cancelButtonText: '取消'
        }).then((result) => {
            if (result.isConfirmed && callback) {
                callback();
            }
        });
    }

    // Initialize components
    initEditor();
    initDataTable();

    // Configure toastr notifications
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "newestOnTop": false,
        "progressBar": true,
        "positionClass": "toast-top-right",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };

    // Event listeners
    $('#createFileBtn').on('click', function() {
        $("#newFileName").val('');
        $("#emptyObject").prop('checked', true);
        $("#createFileModal").modal('show');
    });

    $('#confirmCreateFileBtn').on('click', function() {
        createNewFile();
    });

    $('#jsonFilesTable').on('click', '.edit-file', function() {
        const fileId = $(this).data('id');
        const fileName = $(this).data('filename');
        openEditor(fileId, fileName);
    });

    $('#jsonFilesTable').on('click', '.api-info', function() {
        const fileId = $(this).data('id');
        const fileName = $(this).data('filename');
        showApiInfo(fileId, fileName);
    });

    $('#jsonFilesTable').on('click', '.delete-file', function() {
        const fileId = $(this).data('id');
        const fileName = $(this).data('filename');
        
        $("#deleteFileName").text(fileName);
        $("#confirmDeleteBtn").data('id', fileId).data('filename', fileName);
        $("#deleteFileModal").modal('show');
    });

    $('#confirmDeleteBtn').on('click', function() {
        const fileId = $(this).data('id');
        const fileName = $(this).data('filename');
        deleteJsonFile(fileId, fileName);
        $("#deleteFileModal").modal('hide');
    });

    $('#formatJsonBtn').on('click', function() {
        formatJson();
    });

    $('#saveJsonBtn').on('click', function() {
        saveJsonFile();
    });

    $('#downloadJsonBtn').on('click', function() {
        if (currentFileName) {
            window.location.href = `/json-api/json/${currentFileName}/download`;
        }
    });

    $('#copyApiUrlBtn').on('click', function() {
        if (currentFileName) {
            showApiInfo(currentFileId, currentFileName);
        }
    });

    $('#copyApiUrlFieldBtn').on('click', function() {
        $("#apiUrlField").select();
        document.execCommand('copy');
        showSuccess('复制成功', 'API URL 已复制到剪贴板');
    });

    $('#copyDownloadUrlBtn').on('click', function() {
        $("#downloadUrlField").select();
        document.execCommand('copy');
        showSuccess('复制成功', '下载 URL 已复制到剪贴板');
    });

    $('#closeEditorBtn').on('click', function() {
        closeEditor();
    });

    $('#fullscreenEditorBtn').on('click', function() {
        toggleEditorFullscreen();
    });
    
    $('#apiDocLink').on('click', function(e) {
        e.preventDefault();
        $("#apiDocModal").modal('show');
    });

    // Enter key in new filename field should trigger creation
    $('#newFileName').on('keyup', function(e) {
        if (e.key === 'Enter') {
            $('#confirmCreateFileBtn').click();
        }
    });

    // Keyboard shortcuts
    $(document).keydown(function(e) {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.which === 83) {
            e.preventDefault();
            if (currentFileName) {
                saveJsonFile();
            }
        }
        
        // ESC to close fullscreen
        if (e.key === 'Escape' && isEditorFullscreen) {
            toggleEditorFullscreen();
        }
    });

    // Window before unload handler for unsaved changes
    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '您有未保存的更改，确定要离开吗？';
            return e.returnValue;
        }
    });
});