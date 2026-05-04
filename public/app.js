const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const compressBtn = document.getElementById('compressBtn');
const fileListDiv = document.getElementById('fileList');
const resultsDiv = document.getElementById('results');
const resultsContainer = document.getElementById('resultsContainer');

let selectedFiles = [];

// Upload area events
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
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(Array.from(e.target.files));
});

function handleFiles(files) {
    const videoFiles = files.filter(f => 
        f.type.startsWith('video/') || 
        /\.(mp4|mkv|mov|avi|webm|m4v)$/i.test(f.name)
    );
    
    selectedFiles = [...selectedFiles, ...videoFiles];
    updateFileList();
    compressBtn.disabled = selectedFiles.length === 0;
}

function updateFileList() {
    if (selectedFiles.length === 0) {
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
                <button onclick="removeFile(${i})" style="background:none;border:none;cursor:pointer;">❌</button>
            </div>
        `).join('')}
    `;
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
    compressBtn.disabled = selectedFiles.length === 0;
    if (selectedFiles.length === 0) fileInput.value = '';
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

compressBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;
    
    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('videos', file));
    formData.append('targetSize', document.getElementById('targetSize').value);
    formData.append('unit', document.getElementById('sizeUnit').value);
    formData.append('quality', document.getElementById('quality').value);
    formData.append('preset', document.getElementById('preset').value);
    
    // UI updates
    compressBtn.disabled = true;
    const btnText = compressBtn.querySelector('.btn-text');
    const btnLoader = compressBtn.querySelector('.btn-loader');
    btnText.textContent = 'Compressing...';
    btnLoader.classList.remove('hidden');
    
    resultsDiv.classList.add('hidden');
    
    try {
        const response = await fetch('/process', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.error) {
            alert(`Error: ${data.error}`);
            return;
        }
        
        displayResults(data);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to compress videos. Check console for details.');
    } finally {
        compressBtn.disabled = false;
        btnText.textContent = 'Compress Videos';
        btnLoader.classList.add('hidden');
    }
});

function displayResults(data) {
    resultsContainer.innerHTML = `
        <div class="summary">
            <strong>📊 Summary:</strong> ${data.summary.successful}/${data.summary.total} successful
            (${data.summary.failed} failed)
        </div>
        ${data.results.map(result => `
            <div class="result-card ${result.success ? 'success' : 'failed'}">
                <div class="result-header">
                    <span class="result-name">${escapeHtml(result.originalName)}</span>
                    <span class="result-badge ${result.success ? 'success' : 'failed'}">
                        ${result.success ? '✓ Success' : '✗ Failed'}
                    </span>
                </div>
                ${result.success ? `
                    <div class="result-details">
                        <div>📦 Original: ${formatBytes(result.originalSize)}</div>
                        <div>🗜️ Compressed: ${formatBytes(result.compressedSize)}</div>
                        <div>📉 Reduction: ${result.reductionPercent.toFixed(1)}%</div>
                        <div>⏱️ Duration: ${result.duration.toFixed(1)}s</div>
                    </div>
                    <a href="${result.output}" class="result-download" download>⬇ Download Compressed Video</a>
                ` : `
                    <div class="result-details">
                        <div>❌ Error: ${escapeHtml(result.error || 'Unknown error')}</div>
                    </div>
                `}
            </div>
        `).join('')}
    `;
    resultsDiv.classList.remove('hidden');
}