<?php
// log.php - Basit log görüntüleme
echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Log Kayıtları</title>';
echo '<style>body{font-family: Arial; padding:20px; background:#f5f5f5;}';
echo '.log-file{background:white; padding:15px; margin:10px 0; border-radius:5px; box-shadow:0 2px 5px rgba(0,0,0,0.1);}';
echo 'pre{white-space:pre-wrap; background:#eee; padding:10px; border-radius:3px;}';
echo '</style></head><body>';
echo '<h1>📊 Log Kayıtları</h1>';

// Tüm txt dosyalarını listele
$files = glob('*.txt');
foreach ($files as $file) {
    $size = filesize($file);
    $lines = count(file($file));
    
    echo "<div class='log-file'>";
    echo "<h3>📄 $file ($lines satır, " . round($size/1024, 2) . " KB)</h3>";
    
    if ($size < 500000) { // 500KB'den küçükse göster
        $content = htmlspecialchars(file_get_contents($file));
        echo "<pre>$content</pre>";
    } else {
        echo "<p>Dosya çok büyük, ilk 1000 satır gösteriliyor:</p>";
        $lines = file($file);
        $first_lines = array_slice($lines, 0, 1000);
        echo "<pre>" . htmlspecialchars(implode('', $first_lines)) . "</pre>";
    }
    
    echo "</div>";
}

echo '<p>Toplam ' . count($files) . ' log dosyası bulundu.</p>';
echo '</body></html>';
?>