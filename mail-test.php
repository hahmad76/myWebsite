<?php
declare(strict_types=1);

/* TEMPORARY SSHP PHP mail() diagnostic.
 * Upload to public_html/mail-test.php, open it once, then DELETE this file.
 */
$to = 'hahmad76@gmail.com';
$subject = 'SSHP PHP Mail Test';
$body = "SCHOOLS SOLUTIONS HUB PAKISTAN (SSHP)\r\n\r\nThis is a temporary PHP mail() test from sshpk.com.pk.\r\nTime (UTC): " . gmdate('Y-m-d H:i:s') . "\r\n";
$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "From: SSHP Website <no-reply@sshpk.com.pk>\r\n";

$sent = @mail($to, $subject, $body, $headers);
header('Content-Type: text/plain; charset=UTF-8');
if ($sent) {
    echo "PHP mail() returned TRUE. The hosting server accepted the message for handoff.\n";
    echo "Recipient: $to\n";
    echo "Now check Gmail (including Spam) and cPanel E-mail Tracking → Outbound.\n";
} else {
    http_response_code(500);
    echo "PHP mail() returned FALSE. The hosting server did not accept the message.\n";
    echo "This indicates a hosting/PHP mail configuration issue, not a customer-form issue.\n";
}
