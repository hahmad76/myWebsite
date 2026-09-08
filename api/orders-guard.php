<?php
declare(strict_types=1);

/* SSHP order deduplication guard. Passes normal requests to the production API. */
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    require __DIR__ . '/index.php';
    exit;
}

function og_cfg(string $key, ?string $default = null): ?string {
    $v = getenv($key);
    return ($v === false || $v === '') ? $default : $v;
}
$configFile = __DIR__ . '/config.php';
$config = [];
if (is_file($configFile)) {
    $loaded = require $configFile;
    if (is_array($loaded)) $config = $loaded;
}
$config = array_merge([
    'db_host' => og_cfg('DB_HOST', 'localhost'),
    'db_port' => og_cfg('DB_PORT', '3306'),
    'db_name' => og_cfg('DB_NAME', ''),
    'db_user' => og_cfg('DB_USER', ''),
    'db_pass' => og_cfg('DB_PASS', '')
], $config);

$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) {
    require __DIR__ . '/index.php';
    exit;
}

$service = trim((string)($data['service'] ?? ''));
$name = trim((string)($data['name'] ?? ''));
$phone = trim((string)($data['phone'] ?? ''));
$email = trim((string)($data['email'] ?? ''));
if ($service === '' || $name === '' || $phone === '') {
    require __DIR__ . '/index.php';
    exit;
}

try {
    $dsn = 'mysql:host=' . $config['db_host'] . ';port=' . $config['db_port'] . ';dbname=' . $config['db_name'] . ';charset=utf8mb4';
    $guardPdo = new PDO($dsn, (string)$config['db_user'], (string)$config['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);

    $fingerprint = hash('sha256', strtolower($service) . '|' . strtolower($name) . '|' . $phone . '|' . strtolower($email));
    $lockName = 'sshp-order-' . $fingerprint;
    $lock = $guardPdo->prepare('SELECT GET_LOCK(?, 5)');
    $lock->execute([$lockName]);
    $locked = ((int)$lock->fetchColumn() === 1);

    if ($locked) {
        $q = $guardPdo->prepare('SELECT id FROM orders WHERE customer_name=? AND phone=? AND COALESCE(email,\'\')=? AND service=? AND created_at >= UTC_TIMESTAMP() - INTERVAL 60 SECOND ORDER BY created_at DESC LIMIT 1');
        $q->execute([$name, $phone, $email, $service]);
        $existing = $q->fetch();
        if ($existing) {
            $guardPdo->prepare('SELECT RELEASE_LOCK(?)')->execute([$lockName]);
            header('Content-Type: application/json; charset=utf-8');
            header('Cache-Control: no-store');
            echo json_encode([
                'success' => true,
                'ok' => true,
                'id' => $existing['id'],
                'duplicate' => true,
                'message' => 'Your service order has already been received. Please do not submit it again.'
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            exit;
        }
        /* Keep the advisory lock held while index.php creates the first order. */
    }
} catch (Throwable $e) {
    error_log('SSHP order deduplication guard failed: ' . $e->getMessage());
}

require __DIR__ . '/index.php';
