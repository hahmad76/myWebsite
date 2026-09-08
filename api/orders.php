<?php
declare(strict_types=1);

/* SSHP production order endpoint.
 * One identical submission creates one order and one notification.
 * Requires the orders.request_text column from /order-request-text.sql.
 */

function og_env(string $key, ?string $default=null): ?string {
    $v=getenv($key);
    return ($v===false || $v==='') ? $default : $v;
}

$configFile=__DIR__.'/config.php';
$config=[];
if(is_file($configFile)){
    $loaded=require $configFile;
    if(is_array($loaded)) $config=$loaded;
}
$config=array_merge([
    'db_host'=>og_env('DB_HOST','localhost'),
    'db_port'=>og_env('DB_PORT','3306'),
    'db_name'=>og_env('DB_NAME',''),
    'db_user'=>og_env('DB_USER',''),
    'db_pass'=>og_env('DB_PASS','')
],$config);

function og_json(int $status,array $data):never{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    exit;
}

function og_body():array{
    $raw=file_get_contents('php://input') ?: '';
    if(strlen($raw)>1048576) og_json(413,['success'=>false,'error'=>'Request body too large']);
    $data=json_decode($raw,true);
    if(!is_array($data)) og_json(400,['success'=>false,'error'=>'Invalid JSON']);
    return $data;
}

function og_clean(mixed $v):mixed{
    if(is_array($v)){
        $o=[];
        foreach($v as $k=>$x) $o[(string)$k]=og_clean($x);
        return $o;
    }
    return is_string($v) ? trim($v) : $v;
}

function og_id():string{return bin2hex(random_bytes(16));}
function og_now():string{return gmdate('Y-m-d H:i:s');}

if(($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST'){
    og_json(405,['success'=>false,'error'=>'Method not allowed']);
}

$b=og_clean(og_body());
$service=trim((string)($b['service'] ?? $b['service_select'] ?? ''));
$name=trim((string)($b['name'] ?? $b['customer_name'] ?? ''));
$phone=trim((string)($b['phone'] ?? ''));
$email=trim((string)($b['email'] ?? ''));
$requestText=trim((string)($b['request_text'] ?? $b['request'] ?? $b['requirement'] ?? $b['description'] ?? $b['notes'] ?? ''));
$quoteId=trim((string)($b['quote_id'] ?? ''));
$currency=trim((string)($b['currency'] ?? 'PKR')) ?: 'PKR';
$amountMinor=$b['amount_minor'] ?? null;
if($amountMinor==='') $amountMinor=null;

$errors=[];
if($service==='') $errors[]='service is required';
if($name==='') $errors[]='name is required';
if($phone==='') $errors[]='phone is required';
if($email!=='' && !filter_var($email,FILTER_VALIDATE_EMAIL)) $errors[]='email is invalid';
if($phone!=='' && !preg_match('/^[+()\-\s\d]{7,40}$/',$phone)) $errors[]='phone is invalid';
if($errors) og_json(422,['success'=>false,'error'=>'Validation failed','details'=>$errors]);

try{
    $dsn='mysql:host='.$config['db_host'].';port='.$config['db_port'].';dbname='.$config['db_name'].';charset=utf8mb4';
    $pdo=new PDO($dsn,(string)$config['db_user'],(string)$config['db_pass'],[
        PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES=>false
    ]);

    /* The lock is held on this same PDO connection until the insert is complete. */
    $fingerprint=hash('sha256',json_encode([
        strtolower($service),strtolower($name),$phone,strtolower($email),$requestText,
        $quoteId,$amountMinor,$currency
    ],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
    $lockName='sshp-order-'.$fingerprint;
    $lockStmt=$pdo->prepare('SELECT GET_LOCK(?,5)');
    $lockStmt->execute([$lockName]);
    $locked=((int)$lockStmt->fetchColumn()===1);
    if(!$locked) og_json(503,['success'=>false,'error'=>'The order is being processed. Please wait a moment and try again.']);

    try{
        $existingStmt=$pdo->prepare(
            'SELECT id FROM orders WHERE customer_name=? AND phone=? AND COALESCE(email,\'\')=? AND service=? AND COALESCE(request_text,\'\')=? AND created_at >= UTC_TIMESTAMP() - INTERVAL 120 SECOND ORDER BY created_at DESC LIMIT 1'
        );
        $existingStmt->execute([$name,$phone,$email,$service,$requestText]);
        $existing=$existingStmt->fetch();
        if($existing){
            og_json(200,[
                'success'=>true,'ok'=>true,'id'=>$existing['id'],'duplicate'=>true,
                'message'=>'Your service order has already been received. Please do not submit it again.'
            ]);
        }

        $id=og_id();
        $now=og_now();
        $insert=$pdo->prepare(
            'INSERT INTO orders (id,quote_id,customer_name,phone,email,service,request_text,amount_minor,currency,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
        );
        $insert->execute([
            $id,
            $quoteId!=='' ? $quoteId : null,
            $name,
            $phone,
            $email!=='' ? $email : null,
            $service,
            $requestText!=='' ? $requestText : null,
            $amountMinor,
            $currency,
            'pending',
            $now,
            $now
        ]);

        $notificationId=og_id();
        $message='New service order from '.$name.' ('.$phone.') for '.$service.'.';
        if($requestText!=='') $message.=' Customer request: '.$requestText;
        $notify=$pdo->prepare(
            'INSERT INTO notifications (id,type,title,message,recipient,entity_id,read_flag,created_at) VALUES (?,?,?,?,?,?,0,?)'
        );
        $notify->execute([$notificationId,'order','New Service Order',$message,'admin',$id,$now]);

        og_json(201,[
            'success'=>true,'ok'=>true,'id'=>$id,'duplicate'=>false,
            'message'=>'Your service order has been received successfully.'
        ]);
    } finally {
        $pdo->prepare('SELECT RELEASE_LOCK(?)')->execute([$lockName]);
    }
} catch(PDOException $e){
    error_log('SSHP order endpoint database error: '.$e->getMessage());
    og_json(500,['success'=>false,'error'=>'Unable to save the service order right now.']);
} catch(Throwable $e){
    error_log('SSHP order endpoint error: '.$e->getMessage());
    og_json(500,['success'=>false,'error'=>'Unable to process the service order right now.']);
}
