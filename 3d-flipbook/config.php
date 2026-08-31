<?php
return [
    // Leave null to automatically use the first PDF found inside /pdf.
    'pdf_file' => null,

    // Viewer branding.
    'brand_name' => 'Company Profile',
    'viewer_title' => null, // null = use the PDF filename
    'accent_color' => '#9DB319',

    // Optional URL used by the top-left back button. Empty = browser back/close behavior.
    'back_url' => '../',

    // Viewer features.
    'allow_download' => true,
    'sound_enabled' => true,
];
