<?php
// advanced_logger.php - BASİT
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$session_id = $input['session_id'] ?? 'unknown';
$data = $input['data'] ?? [];

$date = date('d.m.Y H:i:s');
$ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

// JSON dosyasına kaydet
$json_data = [
    'timestamp' => $date,
    'ip' => $ip,
    'session_id' => $session_id,
    'data' => $data
];

$filename = 'advanced_data/' . $date . '_' . substr($session_id, 0, 8) . '.json';

// Klasör yoksa oluştur
if (!is_dir('advanced_data')) {
    mkdir('advanced_data', 0755, true);
}

file_put_contents($filename, json_encode($json_data, JSON_PRETTY_PRINT));

echo json_encode(['success' => true, 'file' => $filename]);
?>