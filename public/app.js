const fileInput = document.getElementById('pdf-input');
const dropZone = document.getElementById('drop-zone');
const fileLabelText = document.getElementById('file-label-text');
const convertBtn = document.getElementById('convert-btn');
const statusEl = document.getElementById('status');
const outputSection = document.getElementById('output-section');
const output = document.getElementById('output');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');

let selectedFile = null;

// ── File selection ────────────────────────────────────────────────────────────

fileInput.addEventListener('change', () => {
  selectFile(fileInput.files[0] ?? null);
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer?.files[0];
  if (file?.type === 'application/pdf') {
    selectFile(file);
  } else {
    showError('Please drop a PDF file.');
  }
});

function selectFile(file) {
  selectedFile = file;
  fileLabelText.textContent = file ? file.name : 'Choose a PDF or drag it here';
  convertBtn.disabled = !file;
  clearStatus();
}

// ── Conversion ────────────────────────────────────────────────────────────────

convertBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  setConverting(true);
  outputSection.hidden = true;
  showInfo('Converting\u2026');

  const formData = new FormData();
  formData.append('pdf', selectedFile);

  try {
    const res = await fetch('/api/convert', { method: 'POST', body: formData });
    const data = await res.json();

    if (!res.ok) {
      showError(data.error ?? 'Conversion failed.');
      return;
    }

    clearStatus();
    output.value = data.markdown;
    outputSection.hidden = false;
  } catch {
    showError('Network error \u2014 is the server running?');
  } finally {
    setConverting(false);
  }
});

function setConverting(converting) {
  convertBtn.disabled = converting;
  convertBtn.textContent = converting ? 'Converting\u2026' : 'Convert';
}

// ── Output actions ────────────────────────────────────────────────────────────

copyBtn.addEventListener('click', async () => {
  await navigator.clipboard.writeText(output.value);
  copyBtn.textContent = 'Copied!';
  setTimeout(() => (copyBtn.textContent = 'Copy'), 2000);
});

downloadBtn.addEventListener('click', () => {
  const baseName = (selectedFile?.name ?? 'output').replace(/\.pdf$/i, '');
  const blob = new Blob([output.value], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseName}.md`;
  a.click();
  URL.revokeObjectURL(url);
});

// ── Status helpers ────────────────────────────────────────────────────────────

function showInfo(msg) {
  statusEl.textContent = msg;
  statusEl.className = 'status info';
  statusEl.hidden = false;
}

function showError(msg) {
  statusEl.textContent = msg;
  statusEl.className = 'status';
  statusEl.hidden = false;
}

function clearStatus() {
  statusEl.hidden = true;
  statusEl.textContent = '';
}
