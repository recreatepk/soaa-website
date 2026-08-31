<?php
/**
 * SOAA Contact Form Mail Handler
 * Upload to: public_html/mail.php
 *
 * Option A — Server mail()  : Works out of the box on cPanel. USE_SMTP = false
 * Option B — Gmail SMTP     : More reliable. Set USE_SMTP = true + fill credentials below.
 */

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
define('TO_EMAIL',       'info@soaa.pk');
define('TO_NAME',        'SOAA Contact');
define('FROM_EMAIL',     'noreply@soaa.pk');
define('FROM_NAME',      'SOAA Website');
define('SUBJECT_PREFIX', '[SOAA Website] ');

define('USE_SMTP',       false);
define('SMTP_HOST',      'smtp.gmail.com');
define('SMTP_PORT',      587);
define('SMTP_USERNAME',  'info@soaa.pk');
define('SMTP_PASSWORD',  'YOUR_APP_PASSWORD');

// ─── HEADERS ──────────────────────────────────────────────────────────────────
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

// ─── READ INPUT ───────────────────────────────────────────────────────────────
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (empty($data)) {
    $data = $_POST;
}

function clean($value) {
    return htmlspecialchars(strip_tags(trim((string)$value)), ENT_QUOTES, 'UTF-8');
}

$firstName = clean($data['firstName'] ?? '');
$lastName  = clean($data['lastName']  ?? '');
$email     = filter_var(trim($data['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$phone     = clean($data['phone']     ?? '');
$subject   = clean($data['subject']   ?? '');
$message   = clean($data['message']   ?? '');
$honeypot  = $data['website']         ?? '';

// Honeypot
if (!empty($honeypot)) {
    echo json_encode(['success' => true, 'message' => 'Message sent.']);
    exit;
}

// Validate
$errors = [];
if (empty($firstName)) $errors[] = 'First name is required.';
if (empty($lastName))  $errors[] = 'Last name is required.';
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'A valid email is required.';
if (empty($subject))   $errors[] = 'Subject is required.';
if (empty($message))   $errors[] = 'Message is required.';

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

// ─── BUILD EMAIL ──────────────────────────────────────────────────────────────
$subject_labels = [
    'membership'  => 'Membership Enquiry',
    'advertiser'  => 'Advertiser / Agency Enquiry',
    'complaint'   => 'Complaint or Suggestion',
    'arbitration' => 'Arbitration Request',
    'events'      => 'Event / Sponsorship',
    'media'       => 'Media / Press Enquiry',
    'other'       => 'Other',
];

$subject_label = $subject_labels[$subject] ?? ucfirst($subject);
$full_name     = "$firstName $lastName";
$email_subject = SUBJECT_PREFIX . $subject_label;
$phone_row     = !empty($phone) ? "<tr><td style='padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.8px;font-weight:700;'>Phone</td><td style='padding:8px 0;font-size:15px;color:#1a1a1a;'>$phone</td></tr>" : '';
$sent_date     = date('d M Y, h:i A');

$body = <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
    <div style="background:#1a3a5c;padding:28px 32px;">
      <h1 style="color:#fff;margin:0;font-size:20px;">New Contact Form Submission</h1>
      <p style="color:#a8c4e0;margin:4px 0 0;font-size:13px;">SOAA Website — soaa.pk</p>
    </div>
    <div style="padding:28px 32px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.8px;font-weight:700;">Subject</td><td style="padding:8px 0;"><span style="background:#e8f0f8;color:#1a3a5c;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;">$subject_label</span></td></tr>
        <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.8px;font-weight:700;">Name</td><td style="padding:8px 0;font-size:15px;color:#1a1a1a;">$full_name</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.8px;font-weight:700;">Email</td><td style="padding:8px 0;font-size:15px;"><a href="mailto:$email" style="color:#1a3a5c;">$email</a></td></tr>
        $phone_row
        <tr><td colspan="2" style="padding:16px 0 8px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.8px;font-weight:700;">Message</td></tr>
        <tr><td colspan="2"><div style="background:#f8f9fa;border-left:3px solid #1a3a5c;padding:16px;border-radius:0 4px 4px 0;font-size:15px;color:#1a1a1a;line-height:1.6;">$message</div></td></tr>
      </table>
    </div>
    <div style="background:#f0f4f8;padding:14px 32px;font-size:12px;color:#888;border-top:1px solid #e0e0e0;">
      Sent from soaa.pk contact form on $sent_date (PKT)
    </div>
  </div>
</body>
</html>
HTML;

// ─── SEND ─────────────────────────────────────────────────────────────────────
$sent = false;

if (USE_SMTP) {
    // PHPMailer via SMTP
    // Uncomment and configure if USE_SMTP = true
    /*
    require 'PHPMailer/src/Exception.php';
    require 'PHPMailer/src/PHPMailer.php';
    require 'PHPMailer/src/SMTP.php';
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USERNAME;
        $mail->Password   = SMTP_PASSWORD;
        $mail->SMTPSecure = 'tls';
        $mail->Port       = SMTP_PORT;
        $mail->CharSet    = 'UTF-8';
        $mail->setFrom(FROM_EMAIL, FROM_NAME);
        $mail->addAddress(TO_EMAIL, TO_NAME);
        $mail->addReplyTo($email, $full_name);
        $mail->isHTML(true);
        $mail->Subject = $email_subject;
        $mail->Body    = $body;
        $mail->AltBody = "From: $full_name <$email>\nSubject: $subject_label\n\n$message";
        $mail->send();
        $sent = true;
    } catch (Exception $e) {
        $sent = false;
    }
    */
} else {
    // Server mail()
    $headers  = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: " . FROM_NAME . " <" . FROM_EMAIL . ">\r\n";
    $headers .= "Reply-To: $full_name <$email>\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

    $sent = mail(TO_EMAIL, $email_subject, $body, $headers);
}

// ─── RESPONSE ─────────────────────────────────────────────────────────────────
if ($sent) {
    echo json_encode([
        'success' => true,
        'message' => "Thank you, $firstName! Your message has been sent. We'll get back to you within 1-2 business days."
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Sorry, we could not send your message right now. Please email us directly at info@soaa.pk.'
    ]);
}