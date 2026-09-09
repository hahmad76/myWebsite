<?php
declare(strict_types=1);

/* SSHP owner email helper.
 * Sends website customer submissions to the owner mailbox.
 * Job-seeker / school-teacher recruitment interactions must NOT call this helper.
 */

function sshp_mail_owner(string $subject, string $heading, array $fields): bool {
    $to = 'hahmad76@gmail.com';
    $subject = 'SSHP — ' . $subject;

    $lines = [
        'SCHOOLS SOLUTIONS HUB PAKISTAN (SSHP)',
        $heading,
        str_repeat('=', 60),
    ];

    foreach ($fields as $label => $value) {
        if (is_array($value)) {
            $value = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } elseif (is_bool($value)) {
            $value = $value ? 'Yes' : 'No';
        } elseif ($value === null || $value === '') {
            $value = 'Not provided';
        } else {
            $value = (string)$value;
        }
        $lines[] = (string)$label . ': ' . $value;
    }

    $lines[] = '';
    $lines[] = 'Please contact the customer regarding this submission.';
    $lines[] = '';
    $lines[] = 'This email was generated automatically by the SSHP website.';

    $body = implode("\r\n", $lines);
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'From: SSHP Website <no-reply@sshpk.com.pk>'
    ];

    return @mail($to, $subject, $body, implode("\r\n", $headers));
}
