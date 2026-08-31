# Modern 3D Company Profile Flipbook

A standalone PHP + HTML + CSS + JavaScript PDF flipbook. It is designed to be dropped into an existing Bootstrap/PHP website without changing the rest of the site.

## 1. Add your PDF

Place your company profile PDF here:

```
3d-flipbook/pdf/
```

By default, the viewer automatically opens the first `.pdf` file it finds. The PDF can have any filename, for example:

```
3d-flipbook/pdf/Alejtiaz-Media-Company-Profile.pdf
```

If you keep several PDFs in that folder, you can either set a fixed filename in `config.php` or open a specific one with:

```
3d-flipbook/?file=My-Profile.pdf
```

## 2. Add the Company Profile button to your website header

Use this pattern in your existing header/navigation:

```html
<a href="3d-flipbook/" target="_blank" rel="noopener" class="btn btn-primary">
    Company Profile
</a>
```

If your header is in a different folder depth, adjust the path. Examples:

```html
<!-- Site root page -->
<a href="/3d-flipbook/" target="_blank" rel="noopener">Company Profile</a>

<!-- Local project subfolder -->
<a href="./3d-flipbook/" target="_blank" rel="noopener">Company Profile</a>
```

## 3. Optional branding/configuration

Edit `config.php`:

- `brand_name`: small label in the viewer header.
- `viewer_title`: custom title; leave null to use the PDF filename.
- `accent_color`: any CSS hex color.
- `back_url`: URL for the viewer's back button.
- `allow_download`: show/hide the PDF download action.
- `sound_enabled`: default page-flip sound state.
- `pdf_file`: fixed PDF filename, or null for automatic detection.

## Main features

- PDF rendered locally in the browser with Mozilla PDF.js.
- Real 3D perspective page-turn animation built specifically for this project.
- Generated paper flip/landing sound through Web Audio API; no large MP3 is required.
- Clickable left/right page edges.
- Mouse/touch swipe navigation.
- Keyboard navigation: arrows, Page Up/Down, Home, End.
- Zoom controls and Ctrl/Cmd + mouse wheel zoom.
- Double-click book to zoom/reset.
- Fullscreen mode.
- Responsive mobile layout.
- Page thumbnails with direct page jump.
- Download original PDF option.
- Reduced-motion accessibility support.
- Works independently of Bootstrap, so it will not conflict with Bootstrap 4/5 CSS in the parent site.

## Browser/server notes

Serve the project through PHP/Apache/Nginx. Do not open `index.php` as a raw `file://` URL because browsers restrict PDF.js worker loading from local files.

For XAMPP, a typical URL is:

```
http://localhost/your-project/3d-flipbook/
```

## PDF.js license

The bundled `pdf.min.js` and `pdf.worker.min.js` are Mozilla PDF.js components, licensed under Apache License 2.0. Their license notices are retained inside the files.
