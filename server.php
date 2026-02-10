<?php
// server.php - BASİT VE ÇALIŞAN VERSİYON
date_default_timezone_set('Europe/Istanbul');

$action = $_POST['action'] ?? 'unknown';
$details = $_POST['details'] ?? '';
$session_id = $_POST['session_id'] ?? 'unknown';
$screen = $_POST['screen'] ?? '0x0';

$date = date('d.m.Y H:i:s');
$ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

// Genel log
$log = "[$date] | IP: $ip | Session: " . substr($session_id, 0, 10) . "... | Action: $action | Details: $details\n";
file_put_contents('log.txt', $log, FILE_APPEND | LOCK_EX);

// Cihaz tespiti
$ua = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
$device = 'Other';
if (stripos($ua, 'Android') !== false) $device = 'Android';
elseif (stripos($ua, 'iPhone') !== false) $device = 'iPhone';
elseif (stripos($ua, 'iPad') !== false) $device = 'iPad';
elseif (stripos($ua, 'Windows') !== false) $device = 'Windows';

// Cihaz log
$device_log = "[$date] | IP: $ip | Device: $device | Screen: $screen | Action: $action\n";
file_put_contents($device . '_log.txt', $device_log, FILE_APPEND | LOCK_EX);

// JSON cevabı
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'message' => 'Log saved',
    'time' => $date,
    'device' => $device
]);
?>