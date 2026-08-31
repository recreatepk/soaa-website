<?php
$config = require __DIR__ . '/config.php';
$pdfDirectory = __DIR__ . '/pdf';
$pdfFiles = glob($pdfDirectory . '/*.pdf') ?: [];
natcasesort($pdfFiles);
$pdfFiles = array_values($pdfFiles);

$requestedFile = isset($_GET['file']) ? basename((string) $_GET['file']) : null;
$configuredFile = !empty($config['pdf_file']) ? basename((string) $config['pdf_file']) : null;
$selectedPath = null;

if ($requestedFile) {
    $candidate = $pdfDirectory . DIRECTORY_SEPARATOR . $requestedFile;
    if (is_file($candidate) && strtolower(pathinfo($candidate, PATHINFO_EXTENSION)) === 'pdf') {
        $selectedPath = $candidate;
    }
}

if (!$selectedPath && $configuredFile) {
    $candidate = $pdfDirectory . DIRECTORY_SEPARATOR . $configuredFile;
    if (is_file($candidate) && strtolower(pathinfo($candidate, PATHINFO_EXTENSION)) === 'pdf') {
        $selectedPath = $candidate;
    }
}

if (!$selectedPath && !empty($pdfFiles)) {
    $selectedPath = $pdfFiles[0];
}

$pdfUrl = $selectedPath ? 'pdf/' . rawurlencode(basename($selectedPath)) : '';
$filenameTitle = $selectedPath ? pathinfo($selectedPath, PATHINFO_FILENAME) : 'Company Profile';
$viewerTitle = !empty($config['viewer_title']) ? (string) $config['viewer_title'] : $filenameTitle;
$brandName = (string) ($config['brand_name'] ?? 'Company Profile');
$accentColor = (string) ($config['accent_color'] ?? '#9DB319');
$backUrl = (string) ($config['back_url'] ?? '../');
$allowDownload = !empty($config['allow_download']);
$soundEnabled = !array_key_exists('sound_enabled', $config) || !empty($config['sound_enabled']);

function e(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#101214">
    <title><?= e($viewerTitle) ?> — 3D Flipbook</title>
    <link rel="stylesheet" href="assets/css/flipbook.css?v=1.0.0">
</head>
<body>
<div
    id="flipbookApp"
    class="flipbook-app"
    data-pdf-url="<?= e($pdfUrl) ?>"
    data-title="<?= e($viewerTitle) ?>"
    data-brand="<?= e($brandName) ?>"
    data-accent="<?= e($accentColor) ?>"
    data-back-url="<?= e($backUrl) ?>"
    data-download="<?= $allowDownload ? '1' : '0' ?>"
    data-sound="<?= $soundEnabled ? '1' : '0' ?>"
    style="--accent: <?= e($accentColor) ?>;"
>
    <header class="viewer-header" aria-label="Flipbook toolbar">
        <div class="header-left">
            <a class="icon-btn header-back" href="<?= e($backUrl ?: '#') ?>" aria-label="Back" title="Back">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
            </a>
            <div class="brand-block">
                <span class="brand-kicker"><?= e($brandName) ?></span>
                <strong class="document-title" id="documentTitle"><?= e($viewerTitle) ?></strong>
            </div>
        </div>

        <div class="header-center" aria-label="Page navigation">
            <button class="icon-btn" id="prevBtn" type="button" aria-label="Previous pages" title="Previous">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div class="page-counter">
                <label class="sr-only" for="pageInput">Page</label>
                <input id="pageInput" inputmode="numeric" value="1" aria-label="Current page">
                <span class="counter-divider">/</span>
                <span id="totalPages">—</span>
            </div>
            <button class="icon-btn" id="nextBtn" type="button" aria-label="Next pages" title="Next">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
            </button>
        </div>

        <div class="header-actions">
            <button class="icon-btn desktop-only" id="thumbBtn" type="button" aria-label="Open page thumbnails" title="Thumbnails">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="7" rx="1"/><rect x="14" y="4" width="6" height="7" rx="1"/><rect x="4" y="15" width="6" height="5" rx="1"/><rect x="14" y="15" width="6" height="5" rx="1"/></svg>
            </button>
            <button class="icon-btn" id="zoomOutBtn" type="button" aria-label="Zoom out" title="Zoom out">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M8 11h6M16 16l4 4"/></svg>
            </button>
            <button class="zoom-value" id="zoomResetBtn" type="button" title="Reset zoom">100%</button>
            <button class="icon-btn" id="zoomInBtn" type="button" aria-label="Zoom in" title="Zoom in">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M8 11h6M11 8v6M16 16l4 4"/></svg>
            </button>
            <button class="icon-btn" id="soundBtn" type="button" aria-label="Toggle page sound" title="Page sound">
                <svg class="sound-on-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9v6h4l5 4V5L9 9H5z"/><path d="M17 9.5c1.4 1.4 1.4 3.6 0 5M19.5 7c2.8 2.8 2.8 7.2 0 10"/></svg>
                <svg class="sound-off-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9v6h4l5 4V5L9 9H5z"/><path d="M17 10l4 4M21 10l-4 4"/></svg>
            </button>
            <?php if ($allowDownload && $pdfUrl): ?>
            <a class="icon-btn desktop-only" id="downloadBtn" href="<?= e($pdfUrl) ?>" download aria-label="Download PDF" title="Download PDF">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M8 11l4 4 4-4M5 20h14"/></svg>
            </a>
            <?php endif; ?>
            <button class="icon-btn" id="fullscreenBtn" type="button" aria-label="Toggle fullscreen" title="Fullscreen">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>
            </button>
        </div>
    </header>

    <main class="viewer-main">
        <aside class="thumbnail-panel" id="thumbnailPanel" aria-label="Page thumbnails" aria-hidden="true">
            <div class="thumbnail-head">
                <div><span>Pages</span><small id="thumbCount">Loading…</small></div>
                <button class="icon-btn" id="closeThumbBtn" type="button" aria-label="Close thumbnails">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
            </div>
            <div class="thumbnail-list" id="thumbnailList"></div>
        </aside>

        <section class="book-viewport" id="bookViewport" aria-live="polite">
            <div class="ambient ambient-one"></div>
            <div class="ambient ambient-two"></div>

            <div class="loading-panel" id="loadingPanel">
                <?php if (!$pdfUrl): ?>
                    <div class="empty-icon">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M8 14h8M8 18h6"/></svg>
                    </div>
                    <h1>Add your company profile PDF</h1>
                    <p>Place one PDF file inside <code>3d-flipbook/pdf/</code>, then refresh this page.</p>
                <?php else: ?>
                    <div class="loader-book" aria-hidden="true"><span></span><span></span><span></span></div>
                    <h1>Preparing your profile</h1>
                    <p id="loadingText">Opening PDF…</p>
                    <div class="loading-track"><span id="loadingBar"></span></div>
                <?php endif; ?>
            </div>

            <div class="book-wrap" id="bookWrap" hidden>
                <div class="book" id="book" role="group" aria-label="Interactive company profile flipbook">
                    <div class="book-depth depth-left"></div>
                    <div class="book-depth depth-right"></div>
                    <div class="book-spine"></div>
                    <div class="base-page left-page" id="leftPage"></div>
                    <div class="base-page right-page" id="rightPage"></div>
                    <div class="page-turn-layer" id="pageTurnLayer"></div>
                    <button class="page-hotspot page-hotspot-left" id="pageHotspotLeft" type="button" aria-label="Previous pages"></button>
                    <button class="page-hotspot page-hotspot-right" id="pageHotspotRight" type="button" aria-label="Next pages"></button>
                </div>
                <div class="book-shadow" aria-hidden="true"></div>
            </div>

            <div class="gesture-hint" id="gestureHint" hidden>
                <span>Drag, click an edge, or use ← →</span>
            </div>
        </section>
    </main>

    <div class="mobile-toolbar" aria-label="Mobile flipbook controls">
        <button id="mobileThumbBtn" type="button" aria-label="Thumbnails">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="7" rx="1"/><rect x="14" y="4" width="6" height="7" rx="1"/><rect x="4" y="15" width="6" height="5" rx="1"/><rect x="14" y="15" width="6" height="5" rx="1"/></svg><span>Pages</span>
        </button>
        <?php if ($allowDownload && $pdfUrl): ?>
        <a href="<?= e($pdfUrl) ?>" download aria-label="Download PDF">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M8 11l4 4 4-4M5 20h14"/></svg><span>PDF</span>
        </a>
        <?php endif; ?>
        <button id="mobileFullscreenBtn" type="button" aria-label="Fullscreen">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg><span>Full</span>
        </button>
    </div>

    <div class="toast" id="toast" role="status" aria-live="polite"></div>
</div>

<script src="assets/vendor/pdfjs/pdf.min.js"></script>
<script src="assets/js/flipbook.js?v=1.0.0"></script>
</body>
</html>
