export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
}

export function log(message, type = 'info') {
    const container = document.getElementById('logContainer');
    if (!container) {
        console.log(message);
        return;
    }

    const emptyText = container.querySelector('.empty-text');
    if (emptyText) {
        emptyText.remove();
    }

    const line = document.createElement('div');
    line.className = `log-line ${type}`;

    const timestamp = new Date().toLocaleTimeString();
    line.innerHTML = `<span class="timestamp">[${timestamp}]</span>${escapeHtml(message)}`;

    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
    console.log(message);
}
