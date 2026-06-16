const fileInput = document.getElementById('pdf-input');
const dropZone = document.getElementById('drop-zone');
const fileLabelText = document.getElementById('file-label-text');
const convertBtn = document.getElementById('convert-btn');
const statusEl = document.getElementById('status');
const outputSection = document.getElementById('output-section');
const output = document.getElementById('output');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const downloadDocxBtn = document.getElementById('download-docx-btn');

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
  triggerDownload(blob, `${baseName}.md`);
});

downloadDocxBtn.addEventListener('click', async () => {
  const markdown = output.value;
  if (!markdown) {
    showError('Nothing to export yet. Convert a PDF first.');
    return;
  }

  const baseName = (selectedFile?.name ?? 'output').replace(/\.pdf$/i, '');
  const filename = `${baseName}.docx`;

  downloadDocxBtn.disabled = true;
  const oldLabel = downloadDocxBtn.textContent;
  downloadDocxBtn.textContent = 'Exporting\u2026';
  showInfo('Generating Word document\u2026');

  try {
    const res = await fetch('/api/export-docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        markdown,
        filename,
        title: baseName,
        subject: 'PDF to Markdown export',
        creator: 'PDFToMarkdown',
      }),
    });

    if (!res.ok) {
      let message = 'DOCX export failed.';
      try {
        const data = await res.json();
        message = data.error ?? message;
      } catch {
        // Fall through and use default message if response is not JSON.
      }

      showError(message);
      return;
    }

    const blob = await res.blob();
    triggerDownload(blob, filename);
    clearStatus();
  } catch {
    showError('Network error while exporting DOCX.');
  } finally {
    downloadDocxBtn.disabled = false;
    downloadDocxBtn.textContent = oldLabel;
  }
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

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
