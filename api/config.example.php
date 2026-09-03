<?php
declare(strict_types=1);

// Copy this file to api/config.php on the cPanel hosting account.
// Do NOT commit api/config.php or place real passwords in GitHub.
return [
    'db_host' => 'localhost',
    'db_port' => '3306',
    'db_name' => 'YOUR_CPANEL_DATABASE_NAME',
    'db_user' => 'YOUR_CPANEL_DATABASE_USER',
    'db_pass' => 'YOUR_DATABASE_PASSWORD',
    'admin_username' => 'admin',
    'admin_password_hash' => 'PASTE_PASSWORD_HASH_HERE',
    'session_ttl' => 28800,
    'rate_limit' => 60,
    'rate_window' => 60,
    'cors_origin' => '',
];
