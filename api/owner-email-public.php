<?php
declare(strict_types=1);
/* SSHP Universal Owner Email Endpoint
 * Normal public customer submissions only.
 * Do NOT use for school-teacher recruitment/contact workflows.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/owner-email.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success'=>false,'error'=>'Method not allowed']);
    exit;
}

$raw=file_get_contents('php://input');
$body=json_decode($raw ?: '', true);
$body=is_array($body)?$body:[];
$type=trim((string)($body['form_type'] ?? 'Website Customer Submission'));
$excluded=['Teacher Career Interest','School Vacancy','Recruitment','Career Contact','Direct Recruitment'];
foreach($excluded as $x){
    if(strcasecmp($type,$x)===0){
        echo json_encode(['success'=>false,'excluded'=>true]);
        exit;
    }
}
$fields=$body['submitted_fields']??[];
if(!is_array($fields)) $fields=[];
$fields['Submission Type']=$type;
if(isset($body['source_page'])) $fields['Source Page']=$body['source_page'];
if(isset($body['submitted_at'])) $fields['Submitted At']=$body['submitted_at'];

$subject='Universal Customer Submission';
if(isset($body['subject']) && trim((string)$body['subject'])!=='') $subject=trim((string)$body['subject']);

try{
    $sent=sshp_send_owner_email($subject,$fields);
    echo json_encode(['success'=>$sent,'email_handed_to_mail_system'=>$sent]);
}catch(Throwable $e){
    error_log('SSHP universal owner email error: '.$e->getMessage());
    http_response_code(500);
    echo json_encode(['success'=>false,'error'=>'Email service error']);
}
