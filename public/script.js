let monacoEditor;
let currentFilePath = null;
let originalContent = '';
let currentDirectory = '';
let currentProcessId = null;
let outputEventSource = null;

const API_BASE = '/api';

// DOM Elements
const fileTree = document.getElementById('file-tree');
const filenameDisplay = document.getElementById('filename-display');
const fullPathDisplay = document.getElementById('full-path-display');
const saveBtn = document.getElementById('save-btn');
const runBtn = document.getElementById('run-btn');
const pathInput = document.getElementById('target-path');
const pathGoBtn = document.getElementById('path-go-btn');
const unsavedIndicator = document.getElementById('unsaved-indicator');
const cursorPosDisplay = document.getElementById('cursor-pos');
const mcpStatus = document.getElementById('mcp-status');
const consolePanel = document.getElementById('console-panel');
const consoleOutput = document.getElementById('console-output');
const mcpToolsList = document.getElementById('mcp-tools-list');
const stopBtn = document.getElementById('stop-process');
const clearBtn = document.getElementById('clear-console');
const closeConsoleBtn = document.getElementById('close-console');

// Initialize Monaco
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
require(['vs/editor/editor.main'], function () {
    // Define custom MCP theme traits or language extensions if needed
    // For now, we'll use a custom dark theme and add some highlights

    monaco.editor.defineTheme('mcp-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'mcp-decorator', foreground: '00e676', fontStyle: 'bold' },
            { token: 'mcp-keyword', foreground: '7c4dff', fontStyle: 'bold' },
            { token: 'mcp-class', foreground: '00d4ff', fontStyle: 'bold' }
        ],
        colors: {
            'editor.background': '#0f111a',
            'editor.lineHighlightBackground': '#1a1c2e'
        }
    });

    // Enhance Python language with MCP tokens
    monaco.languages.register({ id: 'python' }); // Ensure it's registered

    // This is a simplified way to add specific highlights to an existing language
    // In a real scenario we'd use a more complex monarch definition
    // For now we'll rely on the default python but we can add specific word highlights

    monacoEditor = monaco.editor.create(document.getElementById('editor-container'), {
        value: '',
        language: 'python',
        theme: 'mcp-dark',
        fontFamily: "'Fira Code', monospace",
        fontSize: 14,
        automaticLayout: true,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        roundedSelection: true,
        padding: { top: 20 }
    });

    // Handle cursor position change
    monacoEditor.onDidChangeCursorPosition(e => {
        cursorPosDisplay.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
    });

    // Handle content change
    monacoEditor.onDidChangeModelContent(() => {
        const currentContent = monacoEditor.getValue();
        if (currentContent !== originalContent) {
            unsavedIndicator.style.display = 'block';
        } else {
            unsavedIndicator.style.display = 'none';
        }

        // Discover tools on change
        if (currentFilePath && currentFilePath.endsWith('.py')) {
            updateToolList(currentContent);
        }
    });

    // Save shortcut
    monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function () {
        saveFile();
    });

    // Initial load
    loadFiles();
});

// Load files/folders
async function loadFiles(path = '') {
    fileTree.innerHTML = '<div class="loading-spinner"><i class="fas fa-circle-notch fa-spin"></i></div>';

    try {
        const response = await fetch(`${API_BASE}/files?path=${encodeURIComponent(path)}`);
        const data = await response.json();

        if (data.error) {
            if (path) {
                const fileResponse = await fetch(`${API_BASE}/file?path=${encodeURIComponent(path)}`);
                const fileData = await fileResponse.json();
                if (!fileData.error) {
                    openFile(path);
                    const separator = path.includes('\\') ? '\\' : '/';
                    const parentPath = path.substring(0, path.lastIndexOf(separator));
                    loadFiles(parentPath);
                    return;
                }
            }
            showNotification(data.error, 'error');
            fileTree.innerHTML = '';
            return;
        }

        currentDirectory = data.currentPath;
        pathInput.value = currentDirectory;
        renderFileTree(data.files);
    } catch (error) {
        showNotification('Failed to load files', 'error');
    }
}

function renderFileTree(files) {
    fileTree.innerHTML = '';
    files.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
    });

    if (currentDirectory.length > 3) {
        const separator = currentDirectory.includes('\\') ? '\\' : '/';
        const parentPath = currentDirectory.substring(0, currentDirectory.lastIndexOf(separator)) || (separator === '/' ? '/' : '');
        addTreeItem({ name: '..', path: parentPath, isDirectory: true, isParent: true });
    }

    files.forEach(file => addTreeItem(file));
}

function addTreeItem(file) {
    const item = document.createElement('div');
    item.className = 'tree-item';
    if (currentFilePath === file.path) item.classList.add('active');

    const icon = document.createElement('i');
    if (file.isDirectory) {
        icon.className = file.isParent ? 'fas fa-level-up-alt' : 'fas fa-folder';
    } else {
        const ext = file.name.split('.').pop();
        if (ext === 'py') icon.className = 'fab fa-python python-icon';
        else if (ext === 'js') icon.className = 'fab fa-node-js';
        else if (ext === 'html') icon.className = 'fab fa-html5';
        else icon.className = 'far fa-file-code';
    }

    const name = document.createElement('span');
    name.textContent = file.name;

    item.appendChild(icon);
    item.appendChild(name);

    item.addEventListener('click', () => {
        if (file.isDirectory) loadFiles(file.path);
        else openFile(file.path);
    });

    fileTree.appendChild(item);
}

// Open a file
async function openFile(path) {
    if (unsavedIndicator.style.display === 'block') {
        if (!confirm('You have unsaved changes. Discard them?')) return;
    }

    try {
        const response = await fetch(`${API_BASE}/file?path=${encodeURIComponent(path)}`);
        const data = await response.json();

        if (data.error) {
            showNotification(data.error, 'error');
            return;
        }

        const ext = path.split('.').pop();
        let language = 'plaintext';
        if (ext === 'py') language = 'python';
        else if (ext === 'js') language = 'javascript';
        else if (ext === 'html') language = 'html';
        else if (ext === 'css') language = 'css';
        else if (ext === 'json') language = 'json';
        else if (ext === 'md') language = 'markdown';

        monaco.editor.setModelLanguage(monacoEditor.getModel(), language);
        monacoEditor.setValue(data.content);
        originalContent = data.content;
        currentFilePath = path;

        const fileName = path.split(/[\\/]/).pop();
        filenameDisplay.textContent = fileName;
        fullPathDisplay.textContent = path;
        unsavedIndicator.style.display = 'none';

        document.querySelectorAll('.tree-item').forEach(item => {
            item.classList.remove('active');
            if (item.querySelector('span').textContent === fileName) item.classList.add('active');
        });

        // Discovery for Python
        if (language === 'python') {
            updateToolList(data.content);
        } else {
            mcpToolsList.innerHTML = '<div class="empty-state">Not a Python file</div>';
        }

        showNotification(`Opened ${fileName}`, 'info');
    } catch (error) {
        showNotification('Failed to open file', 'error');
    }
}

// Save file
async function saveFile() {
    if (!currentFilePath) return;

    const content = monacoEditor.getValue();
    try {
        const response = await fetch(`${API_BASE}/file`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: currentFilePath, content })
        });

        const data = await response.json();
        if (data.success) {
            showNotification('File saved', 'success');
            originalContent = content;
            unsavedIndicator.style.display = 'none';
        } else {
            showNotification(data.error || 'Failed to save', 'error');
        }
    } catch (error) {
        showNotification('Network error while saving', 'error');
    }
}

// Run MCP Server
async function runServer() {
    if (!currentFilePath || !currentFilePath.endsWith('.py')) {
        showNotification('Open a Python MCP file to run', 'warning');
        return;
    }

    // Save before run
    if (unsavedIndicator.style.display === 'block') {
        await saveFile();
    }

    if (currentProcessId) {
        await stopServer();
    }

    consoleOutput.innerHTML = '';
    consolePanel.classList.remove('hide');
    stopBtn.disabled = false;
    mcpStatus.textContent = 'MCP: Starting...';
    mcpStatus.className = 'status-pill pulse';

    try {
        const response = await fetch(`${API_BASE}/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                command: 'python',
                args: [currentFilePath],
                cwd: currentDirectory
            })
        });

        const data = await response.json();
        currentProcessId = data.processId;
        startOutputStreaming(currentProcessId);
        showNotification('MCP Server starting...', 'success');
    } catch (error) {
        showNotification('Failed to start server', 'error');
        mcpStatus.textContent = 'MCP: Error';
    }
}

function startOutputStreaming(processId) {
    if (outputEventSource) outputEventSource.close();

    outputEventSource = new EventSource(`${API_BASE}/output/${processId}`);

    outputEventSource.onmessage = (event) => {
        const item = JSON.parse(event.data);

        if (item.type === 'status' && item.data === 'closed') {
            addLine(`Process exited with code ${item.exitCode}`, 'status');
            mcpStatus.textContent = 'MCP: Stopped';
            mcpStatus.classList.remove('pulse');
            stopBtn.disabled = true;
            currentProcessId = null;
            outputEventSource.close();
        } else {
            addLine(item.data, `stdout line-${item.type}`);
            if (item.data.toLowerCase().includes('running') || item.data.toLowerCase().includes('listening')) {
                mcpStatus.textContent = 'MCP: Running';
                mcpStatus.classList.remove('pulse');
            }
        }
    };

    outputEventSource.onerror = () => {
        outputEventSource.close();
    };
}

async function stopServer() {
    if (!currentProcessId) return;
    try {
        await fetch(`${API_BASE}/stop/${currentProcessId}`, { method: 'POST' });
    } catch (e) { }
}

function addLine(text, className) {
    const span = document.createElement('div');
    span.className = className;
    span.textContent = text;
    consoleOutput.appendChild(span);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// Tool Discovery
function updateToolList(content) {
    // Regex to find @mcp.tool() or @app.tool() etc and the function name below it
    const toolRegex = /@\w+\.tool\(.*?\)\s+async\s+def\s+(\w+)/gs;
    const matches = [...content.matchAll(toolRegex)];

    mcpToolsList.innerHTML = '';

    if (matches.length === 0) {
        mcpToolsList.innerHTML = '<div class="empty-state">No tools found</div>';
        return;
    }

    matches.forEach(match => {
        const toolName = match[1];
        const item = document.createElement('div');
        item.className = 'mcp-tool-item';
        item.innerHTML = `<i class="fas fa-hammer"></i> <span>${toolName}</span>`;
        item.addEventListener('click', () => {
            // Find line in monaco and scroll
            const model = monacoEditor.getModel();
            const result = model.findMatches(match[0]);
            if (result.length > 0) {
                const range = result[0].range;
                monacoEditor.revealRangeInCenter(range);
                monacoEditor.setPosition({ lineNumber: range.startLineNumber, column: range.startColumn });
                monacoEditor.focus();
            }
        });
        mcpToolsList.appendChild(item);
    });
}

// Event Listeners
saveBtn.addEventListener('click', saveFile);
runBtn.addEventListener('click', runServer);
pathGoBtn.addEventListener('click', () => loadFiles(pathInput.value));
pathInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') loadFiles(pathInput.value); });
stopBtn.addEventListener('click', stopServer);
clearBtn.addEventListener('click', () => { consoleOutput.innerHTML = ''; });
closeConsoleBtn.addEventListener('click', () => { consolePanel.classList.add('hide'); });

// Section toggles
document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', () => {
        const list = header.nextElementSibling;
        const icon = header.querySelector('.fa-chevron-down');
        if (list.style.display === 'none') {
            list.style.display = 'block';
            icon.style.transform = 'rotate(0deg)';
        } else {
            list.style.display = 'none';
            icon.style.transform = 'rotate(-90deg)';
        }
    });
});

// Notifications
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const toast = document.createElement('div');
    toast.className = `notification ${type}`;

    const icon = document.createElement('i');
    if (type === 'success') icon.className = 'fas fa-check-circle';
    else if (type === 'error') icon.className = 'fas fa-exclamation-triangle';
    else icon.className = 'fas fa-info-circle';

    const text = document.createElement('span');
    text.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(text);
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
