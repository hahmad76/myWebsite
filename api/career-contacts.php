<?php
declare(strict_types=1);

/* SSHP Direct Recruitment — direct contact helper.
 * Authenticated teachers can retrieve the contact details of a school
 * that published a specific open vacancy. No notification is generated.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$configFile=__DIR__.'/config.php';
$config=is_file($configFile)?(require $configFile):[];
$config=is_array($config)?$config:[];
$env=function($k,$d=''){ $v=getenv($k); return ($v===false||$v==='')?$d:$v; };
$cfg=function($k,$d='')use(&$config,$env){return $config[$k]??$env($k,$d);};
function cc_out(int $status,array $data):never{http_response_code($status);echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
try{
    $pdo=new PDO('mysql:host='.$cfg('db_host','localhost').';port='.$cfg('db_port','3306').';dbname='.$cfg('db_name').';charset=utf8mb4',(string)$cfg('db_user'),(string)$cfg('db_pass'),[
        PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES=>false
    ]);
}catch(Throwable $e){cc_out(500,['success'=>false,'error'=>'Career database is not configured.']);}

$h=$_SERVER['HTTP_AUTHORIZATION']??'';
if(!preg_match('/^Bearer\s+(.+)$/i',$h,$m))cc_out(401,['success'=>false,'error'=>'Please sign in first.']);
$s=$pdo->prepare('SELECT u.* FROM career_sessions s JOIN career_users u ON u.id=s.user_id WHERE s.id=? AND s.expires_at>? AND u.status="active" LIMIT 1');
$s->execute([hash('sha256',$m[1]),time()]);
$user=$s->fetch();
if(!$user)cc_out(401,['success'=>false,'error'=>'Please sign in first.']);
if($user['role']!=='teacher')cc_out(403,['success'=>false,'error'=>'Direct school contact from this endpoint is available to teacher accounts.']);

$vacancyId=trim((string)($_GET['vacancy_id']??''));
if($vacancyId==='')cc_out(422,['success'=>false,'error'=>'vacancy_id is required.']);

$s=$pdo->prepare('SELECT v.id,v.title,v.subject,v.location,u.name school_name,u.email school_email,u.phone school_phone,u.address school_address FROM vacancies v JOIN career_users u ON u.id=v.school_user_id WHERE v.id=? AND v.status="open" AND u.role="school" AND u.status="active" LIMIT 1');
$s->execute([$vacancyId]);
$v=$s->fetch();
if(!$v)cc_out(404,['success'=>false,'error'=>'Open vacancy or school not found.']);

cc_out(200,['success'=>true,'data'=>$v,'message'=>'School contact details are available for direct communication.']);
