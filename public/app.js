const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const compressBtn = document.getElementById('compressBtn');
const fileListDiv = document.getElementById('fileList');
const resultsDiv = document.getElementById('results');
const resultsContainer = document.getElementById('resultsContainer');

let selectedFiles = [];

uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFiles(Array.from(e.dataTransfer.files));
});

fileInput.addEventListener('change', (e) => {
    handleFiles(Array.from(e.target.files));
});

function handleFiles(files) {
    const videoFiles = files.filter(file =>
        file.type.startsWith('video/') ||
        /\.(mp4|mkv|mov|avi|webm|m4v)$/i.test(file.name)
    );

    selectedFiles = [...selectedFiles, ...videoFiles];

    updateFileList();
    compressBtn.disabled = selectedFiles.length === 0;
}

function updateFileList() {
    if (!selectedFiles.length) {
        fileListDiv.classList.add('hidden');
        return;
    }

    fileListDiv.classList.remove('hidden');

    fileListDiv.innerHTML = `
        <h3>📋 Selected Files (${selectedFiles.length})</h3>
        ${selectedFiles.map((file, i) => `
            <div class="file-item">
                <span class="file-name">${escapeHtml(file.name)}</span>
                <span class="file-size">${formatBytes(file.size)}</span>
                <button onclick="removeFile(${i})">❌</button>
            </div>
        `).join('')}
    `;
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();

    compressBtn.disabled = selectedFiles.length === 0;
    if (!selectedFiles.length) fileInput.value = '';
}

function formatBytes(bytes) {
    if (!bytes) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, (m) =>
        m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;'
    );
}

compressBtn.addEventListener('click', async () => {
    if (!selectedFiles.length) return;

    const formData = new FormData();

    selectedFiles.forEach(file => formData.append('videos', file));

    formData.append('targetSize', document.getElementById('targetSize').value);
    formData.append('unit', document.getElementById('sizeUnit').value);
    formData.append('quality', document.getElementById('quality').value);
    formData.append('preset', document.getElementById('preset').value);

    compressBtn.disabled = true;

    const btnText = compressBtn.querySelector('.btn-text');
    const btnLoader = compressBtn.querySelector('.btn-loader');

    btnText.textContent = 'Compressing...';
    btnLoader?.classList.remove('hidden');

    resultsDiv.classList.add('hidden');

    try {
        const res = await fetch('/process', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        if (data.error) {
            alert(data.error);
            return;
        }

        displayResults(data);

    } catch (err) {
        console.error(err);
        alert('Compression failed');
    } finally {
        compressBtn.disabled = false;
        btnText.textContent = 'Compress Videos';
        btnLoader?.classList.add('hidden');
    }
});

function displayResults(data) {
    resultsContainer.innerHTML = `
        <div class="summary">
            ${data.summary.successful}/${data.summary.total} successful
        </div>

        ${data.results.map(r => `
            <div class="result-card ${r.success ? 'success' : 'failed'}">
                <div>
                    ${escapeHtml(r.originalName)}
                </div>

                ${
                    r.success
                        ? `
                        <div>
                            ${formatBytes(r.originalSize)} → ${formatBytes(r.compressedSize)}
                        </div>
                        <div>${r.reductionPercent.toFixed(1)}% smaller</div>
                        <a href="${r.output}" download>Download</a>
                    `
                        : `<div>${escapeHtml(r.error || 'Error')}</div>`
                }
            </div>
        `).join('')}
    `;

    resultsDiv.classList.remove('hidden');
}