// log.js - İstemci tarafı log sistemi
class Logger {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.pageStartTime = Date.now();
        this.pageName = window.location.pathname.split('/').pop() || 'index';
        this.init();
    }

    generateSessionId() {
        return 'sess_' + Math.random().toString(36).substr(2, 9) + 
               '_' + Date.now().toString(36);
    }

    init() {
        // Sayfa yüklendiğinde
        this.log('page_load', 'Sayfa yüklendi', this.pageName);
        
        // Sayfadan çıkışta
        window.addEventListener('beforeunload', () => {
            const timeSpent = Date.now() - this.pageStartTime;
            this.log('page_exit', `Sayfada ${Math.round(timeSpent/1000)} saniye kaldı`, this.pageName);
        });

        // Ekran boyutunu logla
        this.logScreenSize();
    }

    logScreenSize() {
        const screen = `${window.screen.width}x${window.screen.height}`;
        this.sendLog('screen_info', `Ekran: ${screen}`, this.pageName);
    }

    async sendLog(action, details, page = this.pageName) {
        const logData = {
            action: action,
            details: details,
            page: page,
            screen: `${window.screen.width}x${window.screen.height}`,
            timestamp: Date.now()
        };

        try {
            const response = await fetch('server.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(logData)
            });
            
            const data = await response.json();
            if (data.success) {
                console.log(`✅ Log kaydedildi: ${action} - ${details}`);
            }
        } catch (error) {
            console.error('❌ Log gönderilemedi:', error);
            // Fallback: localStorage'a kaydet
            this.saveToLocalStorage(logData);
        }
    }

    saveToLocalStorage(logData) {
        const logs = JSON.parse(localStorage.getItem('pending_logs') || '[]');
        logs.push(logData);
        localStorage.setItem('pending_logs', JSON.stringify(logs));
        
        // 10'dan fazla bekleyen log varsa dene
        if (logs.length > 10) {
            this.retryPendingLogs();
        }
    }

    async retryPendingLogs() {
        const pendingLogs = JSON.parse(localStorage.getItem('pending_logs') || '[]');
        if (pendingLogs.length === 0) return;

        for (const log of pendingLogs) {
            await this.sendLog(log.action, log.details, log.page);
        }
        
        localStorage.removeItem('pending_logs');
    }

    // Hızlı log fonksiyonları
    log(action, details, page = this.pageName) {
        setTimeout(() => this.sendLog(action, details, page), 100);
    }

    buttonClick(buttonName) {
        this.log('button_click', buttonName);
    }

    codeSubmit(code, attempt) {
        this.log('code_submit', code, 'attempt_' + attempt);
    }

    musicToggle(state) {
        this.log('music_toggle', state ? 'Müzik açıldı' : 'Müzik kapandı');
    }

    volumeChange(volume) {
        this.log('volume_change', `Ses seviyesi: %${volume * 100}`);
    }

    gameEvent(event, details) {
        this.log('game_event', `${event}: ${details}`);
    }

    errorEvent(errorMessage) {
        this.log('error', errorMessage);
    }

    // Zamanlayıcı ile periyodik log
    startPeriodicLogging(interval = 60000) {
        setInterval(() => {
            const timeSpent = Date.now() - this.pageStartTime;
            this.log('periodic_check', 
                `Sayfada ${Math.round(timeSpent/1000)} saniyedir aktif`);
        }, interval);
    }
}

// Global logger instance
window.logger = new Logger();

// Buton tıklamalarını otomatik yakala
document.addEventListener('DOMContentLoaded', function() {
    // Tüm butonları bul
    const buttons = document.querySelectorAll('button');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const buttonText = this.textContent.trim() || this.id || this.className;
            const buttonName = buttonText.substring(0, 50); // Sınırla
            
            // Özel butonlar
            if (this.id === 'evetBtn') {
                logger.gameEvent('evet_butonu', 'Evet seçildi');
            } else if (this.id === 'hayirBtn') {
                logger.gameEvent('hayir_butonu', 'Hayır seçildi');
            } else if (this.id === 'startButton') {
                logger.buttonClick('BAŞLA butonu');
            } else if (this.id === 'codeSubmit') {
                const code = document.getElementById('codeInput')?.value || '';
                logger.codeSubmit(code, 'code_submit');
            } else if (this.id === 'musicToggle') {
                const isPlaying = this.classList.contains('active');
                logger.musicToggle(isPlaying);
            } else {
                logger.buttonClick(buttonName);
            }
        });
    });

    // Input değişikliklerini yakala
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('change', function() {
            if (this.type === 'text' || this.type === 'password') {
                logger.log('input_change', 
                    `${this.id || this.name}: ${this.value.substring(0, 20)}...`);
            }
        });
    });

    // Müzik kontrolleri
    const volumeButtons = document.querySelectorAll('#volumeDown, #volumeUp');
    volumeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            logger.volumeChange(document.getElementById('bgMusic')?.volume || 0);
        });
    });

    // Oyun event'leri için global dinleyici
    window.addEventListener('gameEvent', function(e) {
        if (e.detail) {
            logger.gameEvent(e.detail.type, e.detail.message);
        }
    });

    // Hata yakalama
    window.addEventListener('error', function(e) {
        logger.errorEvent(e.message);
    });

    // Sayfa görünürlüğü
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            logger.log('page_hidden', 'Sayfa arka planda');
        } else {
            logger.log('page_visible', 'Sayfa ön plana geldi');
        }
    });

    // Fare hareketleri (çok sık olmaması için throttle)
    let mouseMoveTimer;
    document.addEventListener('mousemove', function(e) {
        clearTimeout(mouseMoveTimer);
        mouseMoveTimer = setTimeout(() => {
            logger.log('mouse_move', 
                `X:${e.clientX}, Y:${e.clientY}`);
        }, 5000); // Her 5 saniyede bir
    });

    // Klavye tuşları (önemli tuşlar)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === 'Escape' || e.key === 'Tab') {
            logger.log('key_press', `Tuş: ${e.key}`);
        }
    });

    // Başlangıçta periyodik log'u başlat
    setTimeout(() => logger.startPeriodicLogging(), 10000);
});

// Hızlı erişim fonksiyonları
window.logEvent = function(action, details) {
    window.logger.log(action, details);
};

window.logError = function(error) {
    window.logger.errorEvent(error);
};