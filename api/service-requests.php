<?php
declare(strict_types=1);

/* SSHP production service-request endpoint.
 * - Saves the customer request in MySQL.
 * - Sends the complete submitted details to hahmad76@gmail.com.
 * - Does NOT create an admin/cPanel notification row, preventing duplicate
 *   dashboard notifications.
 * - School/teacher job-seeker interactions do NOT use this endpoint.
 */

function sr_env(string $key, ?string $default=null): ?string {
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
    'db_host'=>sr_env('DB_HOST','localhost'),
    'db_port'=>sr_env('DB_PORT','3306'),
    'db_name'=>sr_env('DB_NAME',''),
    'db_user'=>sr_env('DB_USER',''),
    'db_pass'=>sr_env('DB_PASS','')
],$config);

require_once __DIR__.'/owner-email.php';

function sr_json(int $status,array $data):never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    exit;
}

function sr_body():array {
    $raw=file_get_contents('php://input') ?: '';
    if(strlen($raw)>1048576) sr_json(413,['success'=>false,'error'=>'Request body too large']);
    if($raw==='') sr_json(400,['success'=>false,'error'=>'Invalid JSON']);
    $data=json_decode($raw,true);
    if(!is_array($data)) sr_json(400,['success'=>false,'error'=>'Invalid JSON']);
    return $data;
}

function sr_clean(mixed $v):mixed {
    if(is_array($v)){
        $o=[];
        foreach($v as $k=>$x) $o[(string)$k]=sr_clean($x);
        return $o;
    }
    return is_string($v) ? trim($v) : $v;
}

function sr_id():string{return bin2hex(random_bytes(16));}
function sr_now():string{return gmdate('Y-m-d H:i:s');}

if(($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST'){
    sr_json(405,['success'=>false,'error'=>'Method not allowed']);
}

$b=sr_clean(sr_body());
$service=trim((string)($b['service'] ?? $b['service_select'] ?? ''));
$name=trim((string)($b['name'] ?? ''));
$phone=trim((string)($b['phone'] ?? ''));
$email=trim((string)($b['email'] ?? ''));
$requirement=trim((string)($b['requirement'] ?? $b['request'] ?? $b['request_text'] ?? $b['description'] ?? $b['notes'] ?? ''));
$action=trim((string)($b['action'] ?? 'service')) ?: 'service';

$errors=[];
if($service==='') $errors[]='service_select is required';
if($name==='') $errors[]='name is required';
if($phone==='') $errors[]='phone is required';
if($requirement==='') $errors[]='requirement is required';
if($email!=='' && !filter_var($email,FILTER_VALIDATE_EMAIL)) $errors[]='email is invalid';
if($phone!=='' && !preg_match('/^[+()\-\s\d]{7,40}$/',$phone)) $errors[]='phone is invalid';
if($errors) sr_json(422,['success'=>false,'error'=>'Validation failed','details'=>$errors]);

try{
    $dsn='mysql:host='.$config['db_host'].';port='.$config['db_port'].';dbname='.$config['db_name'].';charset=utf8mb4';
    $pdo=new PDO($dsn,(string)$config['db_user'],(string)$config['db_pass'],[
        PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES=>false
    ]);

    $fingerprint=hash('sha256',json_encode([
        strtolower($service),strtolower($name),$phone,strtolower($email),$requirement,$action
    ],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
    $lockName='sshp-service-request-'.$fingerprint;
    $lockStmt=$pdo->prepare('SELECT GET_LOCK(?,5)');
    $lockStmt->execute([$lockName]);
    $locked=((int)$lockStmt->fetchColumn()===1);
    if(!$locked) sr_json(503,['success'=>false,'error'=>'The request is being processed. Please wait a moment and try again.']);

    try{
        /* Idempotency window: repeated identical submission within 120 seconds
         * returns the original ID and does not send another email. */
        $existingStmt=$pdo->prepare(
            'SELECT id FROM service_requests WHERE name=? AND phone=? AND COALESCE(email,\'\')=? AND service=? AND requirement=? AND action=? AND created_at >= UTC_TIMESTAMP() - INTERVAL 120 SECOND ORDER BY created_at DESC LIMIT 1'
        );
        $existingStmt->execute([$name,$phone,$email,$service,$requirement,$action]);
        $existing=$existingStmt->fetch();
        if($existing){
            sr_json(200,[
                'success'=>true,'ok'=>true,'id'=>$existing['id'],'duplicate'=>true,
                'message'=>'Your service request has already been received. Please do not submit it again.'
            ]);
        }

        $id=sr_id();
        $now=sr_now();
        $insert=$pdo->prepare(
            'INSERT INTO service_requests (id,service,name,phone,email,requirement,action,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)'
        );
        $insert->execute([
            $id,$service,$name,$phone,
            $email!=='' ? $email : null,
            $requirement,$action,'received',$now,$now
        ]);

        /* Send every submitted field, including future fields added to the form. */
        $fields=[];
        foreach($b as $key=>$value){
            if($key==='request_action') continue;
            $label=ucwords(str_replace(['_','-'],' ',(string)$key));
            $fields[$label]=$value;
        }
        $fields['Request ID']=$id;
        $fields['Submitted At (UTC)']=$now;
        $fields['Database Status']='received';

        $sent=sshp_mail_owner('New Website Service Request #'.$id,'NEW WEBSITE CUSTOMER SERVICE REQUEST',$fields);
        if(!$sent){
            error_log('SSHP service-request email could not be handed to the hosting mail system for request '.$id);
        }

        sr_json(201,[
            'success'=>true,'ok'=>true,'id'=>$id,'duplicate'=>false,
            'email_handed_to_mail_system'=>$sent,
            'message'=>'Your service request has been received successfully.'
        ]);
    } finally {
        $pdo->prepare('SELECT RELEASE_LOCK(?)')->execute([$lockName]);
    }
} catch(PDOException $e){
    error_log('SSHP service request database error: '.$e->getMessage());
    sr_json(500,['success'=>false,'error'=>'Unable to save the service request right now.']);
} catch(Throwable $e){
    error_log('SSHP service request endpoint error: '.$e->getMessage());
    sr_json(500,['success'=>false,'error'=>'Unable to process the service request right now.']);
}
