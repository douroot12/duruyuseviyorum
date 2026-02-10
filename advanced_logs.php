<?php
// advanced_logs.php - Gelişmiş log görüntüleme
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gelişmiş Log Sistem</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial; background: #0f172a; color: #e2e8f0; padding: 20px; }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; padding: 20px; background: #1e293b; border-radius: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-box { background: #334155; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 2rem; color: #60a5fa; font-weight: bold; }
        .log-section { background: #1e293b; padding: 20px; border-radius: 10px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #475569; }
        th { background: #334155; }
        tr:hover { background: #2d3748; }
        .json-viewer { background: #1a202c; padding: 15px; border-radius: 8px; overflow-x: auto; }
        pre { color: #90cdf4; }
        .tabs { display: flex; gap: 10px; margin: 20px 0; }
        .tab { padding: 10px 20px; background: #334155; border-radius: 5px; cursor: pointer; }
        .tab.active { background: #3b82f6; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .device-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; }
        .device-card { background: #334155; padding: 15px; border-radius: 8px; }
        .chart-container { height: 300px; margin: 20px 0; }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Gelişmiş Log Sistemi</h1>
            <p>Son güncelleme: <?php echo date('d.m.Y H:i:s'); ?></p>
        </div>

        <?php
        // İstatistikleri hesapla
        function getStats() {
            $stats = [
                'total_sessions' => 0,
                'unique_devices' => 0,
                'android_count' => 0,
                'ios_count' => 0,
                'mobile_count' => 0,
                'today_count' => 0
            ];
            
            if (is_dir('advanced_logs')) {
                $files = glob('advanced_logs/*.json');
                $stats['total_sessions'] = count($files);
                
                $devices = [];
                $today = date('Y-m-d');
                
                foreach ($files as $file) {
                    $data = json_decode(file_get_contents($file), true);
                    
                    // Cihaz
                    if (isset($data['data']['device']['brand'])) {
                        $deviceKey = $data['data']['device']['brand'] . '_' . ($data['data']['device']['model'] ?? 'unknown');
                        $devices[$deviceKey] = true;
                    }
                    
                    // OS sayıları
                    if (isset($data['data']['device']['os'])) {
                        $os = strtolower($data['data']['device']['os']);
                        if (strpos($os, 'android') !== false) $stats['android_count']++;
                        if (strpos($os, 'ios') !== false) $stats['ios_count']++;
                    }
                    
                    // Cihaz tipi
                    if (isset($data['data']['device']['type'])) {
                        if ($data['data']['device']['type'] === 'mobile') $stats['mobile_count']++;
                    }
                    
                    // Bugünkü kayıtlar
                    if (isset($data['timestamp']) && strpos($data['timestamp'], date('d.m.Y')) !== false) {
                        $stats['today_count']++;
                    }
                }
                
                $stats['unique_devices'] = count($devices);
            }
            
            return $stats;
        }
        
        $stats = getStats();
        ?>
        
        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-number"><?php echo $stats['total_sessions']; ?></div>
                <div>Toplam Oturum</div>
            </div>
            <div class="stat-box">
                <div class="stat-number"><?php echo $stats['unique_devices']; ?></div>
                <div>Farklı Cihaz</div>
            </div>
            <div class="stat-box">
                <div class="stat-number"><?php echo $stats['android_count']; ?></div>
                <div>Android</div>
            </div>
            <div class="stat-box">
                <div class="stat-number"><?php echo $stats['ios_count']; ?></div>
                <div>iOS</div>
            </div>
            <div class="stat-box">
                <div class="stat-number"><?php echo $stats['mobile_count']; ?></div>
                <div>Mobil Cihaz</div>
            </div>
            <div class="stat-box">
                <div class="stat-number"><?php echo $stats['today_count']; ?></div>
                <div>Bugün</div>
            </div>
        </div>
        
        <div class="tabs">
            <div class="tab active" onclick="showTab('realtime')">⏱️ Gerçek Zamanlı</div>
            <div class="tab" onclick="showTab('sessions')">📋 Oturumlar</div>
            <div class="tab" onclick="showTab('devices')">📱 Cihazlar</div>
            <div class="tab" onclick="showTab('analytics')">📈 Analitik</div>
            <div class="tab" onclick="showTab('raw')">📄 Ham Veri</div>
        </div>
        
        <div id="realtime" class="tab-content active">
            <div class="log-section">
                <h2>⏱️ Gerçek Zamanlı İzleme</h2>
                <?php
                if (file_exists('realtime_monitor.json')) {
                    $realtime = json_decode(file_get_contents('realtime_monitor.json'), true);
                    echo "<p>Son güncelleme: " . ($realtime['last_update'] ?? 'Bilinmiyor') . "</p>";
                    echo "<div class='device-list'>";
                    echo "<h3>Son 10 Aktif Cihaz:</h3>";
                    foreach (($realtime['active_devices'] ?? []) as $device) {
                        echo "<div class='device-card'>$device</div>";
                    }
                    echo "</div>";
                }
                ?>
            </div>
        </div>
        
        <div id="sessions" class="tab-content">
            <div class="log-section">
                <h2>📋 Son Oturumlar</h2>
                <table>
                    <tr>
                        <th>Tarih</th>
                        <th>Session ID</th>
                        <th>Cihaz</th>
                        <th>IP</th>
                        <th>Ekran</th>
                        <th>İşlem</th>
                    </tr>
                    <?php
                    if (is_dir('advanced_logs')) {
                        $files = glob('advanced_logs/*.json');
                        rsort($files);
                        $files = array_slice($files, 0, 20);
                        
                        foreach ($files as $file) {
                            $data = json_decode(file_get_contents($file), true);
                            echo "<tr>";
                            echo "<td>" . ($data['timestamp'] ?? '') . "</td>";
                            echo "<td><small>" . substr($data['session_id'] ?? '', 0, 10) . "...</small></td>";
                            echo "<td>" . ($data['data']['device']['brand'] ?? '') . " " . ($data['data']['device']['model'] ?? '') . "</td>";
                            echo "<td>" . ($data['ip'] ?? '') . "</td>";
                            echo "<td>" . ($data['data']['basic']['screen'] ?? '') . "</td>";
                            echo "<td><button onclick='viewDetails(\"" . basename($file) . "\")'>Detay</button></td>";
                            echo "</tr>";
                        }
                    }
                    ?>
                </table>
            </div>
        </div>
        
        <div id="devices" class="tab-content">
            <div class="log-section">
                <h2>📱 Cihaz İstatistikleri</h2>
                <div class="chart-container">
                    <canvas id="deviceChart"></canvas>
                </div>
                <?php
                $deviceStats = [];
                if (is_dir('advanced_logs')) {
                    $files = glob('advanced_logs/*.json');
                    foreach ($files as $file) {
                        $data = json_decode(file_get_contents($file), true);
                        $brand = $data['data']['device']['brand'] ?? 'Unknown';
                        $deviceStats[$brand] = ($deviceStats[$brand] ?? 0) + 1;
                    }
                    arsort($deviceStats);
                }
                ?>
                <table>
                    <tr><th>Marka</th><th>Sayı</th><th>Yüzde</th></tr>
                    <?php
                    $total = array_sum($deviceStats);
                    foreach ($deviceStats as $brand => $count) {
                        $percent = $total > 0 ? round(($count / $total) * 100, 1) : 0;
                        echo "<tr><td>$brand</td><td>$count</td><td>$percent%</td></tr>";
                    }
                    ?>
                </table>
            </div>
        </div>
        
        <div id="analytics" class="tab-content">
            <div class="log-section">
                <h2>📈 Analitik Veriler</h2>
                <?php
                // CSV dosyasını oku
                if (file_exists('advanced_logs/summary.csv')) {
                    $csv = file('advanced_logs/summary.csv');
                    echo "<p>Toplam " . (count($csv) - 1) . " kayıt</p>";
                    
                    // İlk 10 satırı göster
                    echo "<table>";
                    for ($i = 0; $i < min(11, count($csv)); $i++) {
                        echo "<tr>";
                        $cells = str_getcsv($csv[$i]);
                        foreach ($cells as $cell) {
                            echo "<td>$cell</td>";
                        }
                        echo "</tr>";
                    }
                    echo "</table>";
                }
                ?>
            </div>
        </div>
        
        <div id="raw" class="tab-content">
            <div class="log-section">
                <h2>📄 Ham Veri Görüntüleyici</h2>
                <select id="fileSelector" onchange="loadFile(this.value)">
                    <option value="">Dosya seçin</option>
                    <?php
                    if (is_dir('advanced_logs')) {
                        $files = glob('advanced_logs/*.json');
                        rsort($files);
                        foreach ($files as $file) {
                            echo "<option value='$file'>" . basename($file) . "</option>";
                        }
                    }
                    ?>
                </select>
                <div id="jsonViewer" class="json-viewer">
                    <pre id="jsonContent">Bir dosya seçin...</pre>
                </div>
            </div>
        </div>
    </div>
    
    <script>
    function showTab(tabName) {
        // Tab'ları gizle
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Seçilen tab'ı göster
        document.getElementById(tabName).classList.add('active');
        event.target.classList.add('active');
    }
    
    function viewDetails(filename) {
        fetch('advanced_logs/' + filename)
            .then(response => response.json())
            .then(data => {
                document.getElementById('jsonContent').textContent = 
                    JSON.stringify(data, null, 2);
                showTab('raw');
            });
    }
    
    function loadFile(filename) {
        fetch(filename)
            .then(response => response.json())
            .then(data => {
                document.getElementById('jsonContent').textContent = 
                    JSON.stringify(data, null, 2);
            });
    }
    
    // Chart oluştur
    <?php if (!empty($deviceStats)): ?>
    const ctx = document.getElementById('deviceChart').getContext('2d');
    const deviceChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: <?php echo json_encode(array_keys($deviceStats)); ?>,
            datasets: [{
                data: <?php echo json_encode(array_values($deviceStats)); ?>,
                backgroundColor: [
                    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
                    '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#ec4899'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                }
            }
        }
    });
    <?php endif; ?>
    
    // 30 saniyede bir yenile
    setInterval(() => {
        location.reload();
    }, 30000);
    </script>
</body>
</html>