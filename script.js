// ===== LOG SİSTEMİ - EN BAŞTA TANIMLA =====
class Logger {
    constructor() {
        this.sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
        this.pageStartTime = Date.now();
        console.log('📊 Logger başlatıldı:', this.sessionId);
    }

    async log(action, details) {
        const logData = {
            action: action,
            details: details,
            page: window.location.pathname.split('/').pop() || 'index',
            screen: `${window.screen.width}x${window.screen.height}`,
            timestamp: Date.now(),
            session_id: this.sessionId
        };

        console.log('📝 Log:', action, '-', details);

        try {
            const response = await fetch('server.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(logData)
            });
            
            return await response.json();
        } catch (error) {
            console.log('⚠️ Log sunucusuna ulaşılamadı');
            this.saveToLocalStorage(logData);
            return { success: false };
        }
    }

    saveToLocalStorage(logData) {
        try {
            const logs = JSON.parse(localStorage.getItem('pending_logs') || '[]');
            logs.push(logData);
            localStorage.setItem('pending_logs', JSON.stringify(logs.slice(-50)));
        } catch (e) {
            // localStorage yoksa görmezden gel
        }
    }

    collectDeviceInfo() {
        const info = {
            screen: `${window.screen.width}x${window.screen.height}`,
            userAgent: navigator.userAgent.substring(0, 200), // Kısalt
            platform: navigator.platform,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            hasTouch: 'ontouchstart' in window,
            online: navigator.onLine
        };

        this.log('device_info', JSON.stringify(info));

        // Network bilgisi
        if (navigator.connection) {
            const conn = navigator.connection;
            const networkInfo = {
                type: conn.type || 'unknown',
                effectiveType: conn.effectiveType || 'unknown',
                downlink: conn.downlink || 0,
                rtt: conn.rtt || 0
            };
            this.log('network_info', JSON.stringify(networkInfo));
        }

        // CPU çekirdek sayısı
        if (navigator.hardwareConcurrency) {
            this.log('cpu_info', `CPU Çekirdek: ${navigator.hardwareConcurrency}`);
        }

        // Bellek bilgisi (Chrome)
        if (performance.memory) {
            const mem = performance.memory;
            this.log('memory_info', JSON.stringify({
                used: Math.round(mem.usedJSHeapSize / 1048576),
                total: Math.round(mem.totalJSHeapSize / 1048576)
            }));
        }
    }
}

// GLOBAL LOGGER - BURASI ÇOK ÖNEMLİ
const logger = new Logger();

// ===== AÇILIŞ EKRANI - MÜZİK BAŞLATMA + KOD GİRİŞİ =====
document.addEventListener('DOMContentLoaded', function() {
    console.log("⚫ Açılış ekranı hazırlanıyor...");
    
    // Cihaz bilgilerini topla (hemen)
    setTimeout(() => {
        logger.collectDeviceInfo();
    }, 1000);
    
    const blackOverlay = document.getElementById('blackOverlay');
    const startButton = document.getElementById('startButton');
    const bgMusic = document.getElementById('bgMusic');
    const codeInput = document.getElementById('codeInput');
    const codeSubmit = document.getElementById('codeSubmit');
    
    if (!blackOverlay || !startButton || !bgMusic || !codeInput || !codeSubmit) {
        console.error("❌ Açılış elementleri bulunamadı!");
        return;
    }
    
    // Sayfa yüklendi logu
    logger.log('page_load', 'Açılış ekranı yüklendi');
    
    // Made By Dou'yu göster
    const madeByDou = document.querySelector('.made-by-dou');
    if (madeByDou) {
        madeByDou.style.zIndex = '100000';
        madeByDou.style.opacity = '0.7';
    }
    
    // Diğer tüm içeriği gizle
    const hideElements = [
        '.main-container',
        '.music-controls',
        '.effect-overlay',
        '.damage-edge',
        '.floating-hearts-container'
    ];
    
    hideElements.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            el.style.visibility = 'hidden';
            el.style.opacity = '0';
        });
    });
    
    // Müzik ayarları
    bgMusic.volume = 0.5;
    bgMusic.loop = true;
    
    // DOĞRU KOD
    const CORRECT_CODE = "0525";
    let attempts = 0;
    const MAX_ATTEMPTS = 3;
    
    // ===== KOD GİRİŞİ FONKSİYONLARI =====
    
    // KODU KONTROL ET
    function checkCode() {
        const enteredCode = codeInput.value.trim();
        
        if (enteredCode.length !== 4) {
            showCodeError("Kod 4 haneli olmalı!");
            logger.log('code_error', 'Kod 4 haneli değil');
            return;
        }
        
        // Kod girişi logu
        logger.log('code_attempt', `Kod: ${enteredCode}, Deneme: ${attempts + 1}/${MAX_ATTEMPTS}`);
        
        if (enteredCode === CORRECT_CODE) {
            // KOD DOĞRU
            codeInput.classList.remove('error');
            codeInput.classList.add('success');
            codeSubmit.innerHTML = '✅';
            codeSubmit.style.background = 'linear-gradient(45deg, #4CAF50, #2E7D32)';
            
            console.log("✅ Doğru kod girildi!");
            logger.log('code_success', 'Doğru kod girildi');
            
            // 1 saniye sonra test.html'yi aç
            setTimeout(() => {
                window.location.href = 'test.html';
            }, 1000);
            
        } else {
            // KOD YANLIŞ
            attempts++;
            codeInput.classList.add('error');
            codeInput.classList.remove('success');
            
            logger.log('code_wrong', `Yanlış kod: ${enteredCode}`);
            
            if (attempts >= MAX_ATTEMPTS) {
                showCodeError(`Hatalı kod! (${attempts}/${MAX_ATTEMPTS}) - Giriş kilitlendi (Dou AntiSpam) `);
                codeInput.disabled = true;
                codeSubmit.disabled = true;
                logger.log('code_locked', 'Kod girişi kilitlendi');
            } else {
                showCodeError(`Hatalı kod! (${attempts}/${MAX_ATTEMPTS})`);
                codeInput.value = ''; // Input'u temizle
                codeInput.focus(); // Tekrar focusla
            }
        }
    }
    
    // HATA GÖSTER
    function showCodeError(message) {
        // Geçici hata mesajı
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = message;
        errorMsg.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 107, 107, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 10px;
            z-index: 100001;
            animation: fadeInOut 2s ease;
        `;
        
        document.body.appendChild(errorMsg);
        
        // 2 saniye sonra sil
        setTimeout(() => {
            errorMsg.remove();
        }, 2000);
    }
    
    // CSS animasyonu ekle
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
            20% { opacity: 1; transform: translateX(-50%) translateY(0); }
            80% { opacity: 1; transform: translateX(-50%) translateY(0); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        }
    `;
    document.head.appendChild(style);
    
    // ===== EVENT LISTENERS =====
    
    // KOD SUBMIT BUTONU
    codeSubmit.addEventListener('click', checkCode);
    
    // ENTER TUŞU İLE GÖNDER
    codeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkCode();
        }
    });
    
    // INPUT'A YAZARKEN SADECE RAKAM KABUL ET
    codeInput.addEventListener('input', function() {
        // Sadece rakamları al
        this.value = this.value.replace(/\D/g, '');
        
        // 4 haneyi doldurunca otomatik kontrol et
        if (this.value.length === 4) {
            setTimeout(checkCode, 300);
        }
        
        // Hata durumunu temizle
        this.classList.remove('error');
    });
    
    // BAŞLA BUTONU TIKLANINCA
    startButton.addEventListener('click', function() {
        console.log("▶️ Başla butonuna tıklandı");
        logger.log('button_click', 'BAŞLA butonu');
        
        // Butonu devre dışı bırak
        startButton.disabled = true;
        startButton.style.opacity = '0.7';
        startButton.style.cursor = 'not-allowed';
        
        // 1. MÜZİĞİ BAŞLAT
        bgMusic.play().then(() => {
            console.log("✅ Müzik başladı");
            logger.log('music_start', 'Arka plan müziği başlatıldı');
            
            // 2. BUTONA ANİMASYON EKLE
            startButton.style.animation = 'pulse 0.5s 3';
            
            // 3. 1 SANİYE SONRA OVERLAY'İ KALDIR
            setTimeout(() => {
                // Overlay'i gizle
                blackOverlay.classList.add('hidden');
                
                // 4. DİĞER ELEMENTLERİ GÖSTER
                hideElements.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        el.style.visibility = 'visible';
                        el.style.opacity = '1';
                        el.style.transition = 'opacity 0.8s ease';
                    });
                });
                
                // Made By Dou'yu normale döndür
                if (madeByDou) {
                    madeByDou.style.zIndex = '9999';
                    madeByDou.style.opacity = '1';
                }
                
                console.log("🎭 Açılış ekranı kaldırıldı, site gösteriliyor");
                logger.log('overlay_closed', 'Açılış ekranı kapatıldı');
                
                // 5. MÜZİK KONTROL BUTONLARINI GÜNCELLE
                setTimeout(() => {
                    const musicToggle = document.getElementById('musicToggle');
                    const musicText = document.querySelector('.music-text');
                    const musicIcon = document.querySelector('.music-icon');
                    
                    if (musicToggle && musicText && musicIcon) {
                        musicToggle.classList.add('active');
                        musicText.textContent = 'AÇIK';
                        musicIcon.textContent = '🎵';
                    }
                    
                    // Oyunu başlat
                    initGame();
                }, 500);
                
            }, 1000);
            
        }).catch(error => {
            console.log("❌ Müzik başlatılamadı:", error);
            logger.log('music_error', 'Müzik başlatılamadı: ' + error.message);
            
            // Hata durumunda butonu yeniden aktif et
            startButton.disabled = false;
            startButton.style.opacity = '1';
            startButton.style.cursor = 'pointer';
            
            alert("Müzik başlatılamadı. Lütfen sayfayı yenileyin ve izin verin.");
        });
    });
    
    // BUTON HOVER EFEKTLERİ
    startButton.addEventListener('mouseenter', function() {
        if (!this.disabled) {
            this.style.transform = 'perspective(500px) rotateX(0deg) scale(1.05)';
        }
    });
    
    startButton.addEventListener('mouseleave', function() {
        if (!this.disabled) {
            this.style.transform = 'perspective(500px) rotateX(5deg) scale(1)';
        }
    });
    
    // OTOMATİK FOCUS
    setTimeout(() => {
        // Önce kod input'una focus ol, Enter'la geçilebilsin
        codeInput.focus();
    }, 1000);
    
    console.log("🎯 Açılış ekranı hazır! Kod: 0525");
    
    // ===== MÜZİK SİSTEMİ - TEK YOL =====
    console.log("🔥 Müzik sistemi başlatılıyor...");
    
    if (!bgMusic) {
        console.error("❌ Müzik bulunamadı!");
        return;
    }
    
    // 1. DİREKT BAŞLAT
    console.log("▶️ Müzik direkt başlatılıyor...");
    bgMusic.volume = 0.5; // %50 ses
    bgMusic.loop = true;
    
    // HEMEN ÇALDIR
    bgMusic.play().then(() => {
        console.log("✅ Müzik başladı!");
        updateMusicButton(true);
    }).catch(error => {
        console.log("⚠️ Direkt başlatılamadı:", error.name);
        console.log("ℹ️ Bu normal, kullanıcı izin vermeli");
        // Otomatik başlatma başarısız, bekleyelim
    });
    
    // BUTON KONTROLLERİ
    const musicToggle = document.getElementById('musicToggle');
    const volumeDown = document.getElementById('volumeDown');
    const volumeUp = document.getElementById('volumeUp');
    
    let isPlaying = false;
    let volume = 0.5;
    
    // MÜZİK AÇ/KAPA
    if (musicToggle) {
        musicToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            
            if (isPlaying) {
                bgMusic.pause();
                isPlaying = false;
                updateMusicButton(false);
                logger.log('music_toggle', 'Müzik durduruldu');
            } else {
                bgMusic.play().then(() => {
                    isPlaying = true;
                    updateMusicButton(true);
                    logger.log('music_toggle', 'Müzik başlatıldı');
                });
            }
        });
    }
    
    // SES AZALT
    if (volumeDown) {
        volumeDown.addEventListener('click', function(e) {
            e.stopPropagation();
            if (volume > 0) {
                volume -= 0.1;
                if (volume < 0) volume = 0;
                bgMusic.volume = volume;
                showVolume(volume);
                logger.log('volume_down', `Ses: %${Math.round(volume * 100)}`);
            }
        });
    }
    
    // SES ARTIR
    if (volumeUp) {
        volumeUp.addEventListener('click', function(e) {
            e.stopPropagation();
            if (volume < 1) {
                volume += 0.1;
                if (volume > 1) volume = 1;
                bgMusic.volume = volume;
                showVolume(volume);
                logger.log('volume_up', `Ses: %${Math.round(volume * 100)}`);
            }
        });
    }
    
    // BUTON GÜNCELLE
    function updateMusicButton(playing) {
        if (!musicToggle) return;
        
        const text = musicToggle.querySelector('.music-text');
        const icon = musicToggle.querySelector('.music-icon');
        
        if (playing) {
            if (text) text.textContent = 'AÇIK';
            if (icon) icon.textContent = '🎵';
            musicToggle.classList.add('active');
        } else {
            if (text) text.textContent = 'KAPALI';
            if (icon) icon.textContent = '🔇';
            musicToggle.classList.remove('active');
        }
    }
    
    // SES GÖSTERİMİ
    function showVolume(vol) {
        const percent = Math.round(vol * 100);
        let icon = '🔊';
        if (percent === 0) icon = '🔇';
        else if (percent < 30) icon = '🔈';
        else if (percent < 70) icon = '🔉';
        
        // ESKİSİNİ TEMİZLE
        const old = document.querySelector('.volume-display');
        if (old) old.remove();
        
        // YENİSİNİ EKLE
        const display = document.createElement('div');
        display.className = 'volume-display';
        display.textContent = `${icon} ${percent}%`;
        document.body.appendChild(display);
        
        // 1 SANİYE SONRA SİL
        setTimeout(() => display.remove(), 1000);
    }
    
    console.log("🎮 Sistem hazır!");
});

// ===== OYUN SİSTEMİ =====
function initGame() {
    console.log("🎮 Oyun sistemi başlatılıyor...");
    logger.log('game_init', 'Oyun sistemi başlatıldı');
    
    class Game {
    constructor() {
        this.hayirTik = 0;
        this.isKaciyor = false;
        this.maxAttempts = 3;
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.createFloatingHearts();
        logger.log('game_ready', 'Oyun hazır');
    }

    cacheElements() {
        // DOM Elementleri
        this.evetBtn = document.getElementById('evetBtn');
        this.hayirBtn = document.getElementById('hayirBtn');
        this.damageOverlay = document.getElementById('damage-overlay');
        this.damageEdges = document.querySelectorAll('.damage-edge');
        this.whiteScreen = document.getElementById('white-screen');
        this.heartExplosion = document.getElementById('heartExplosion');
        this.sonEkran = document.getElementById('son-ekran');
        this.buttonsContainer = document.querySelector('.buttons-container');
        this.giantHeartContainer = document.getElementById('giantHeart');
        this.heartRainContainer = document.getElementById('heartRain');

        // Audio Elementleri
        this.heartbeatAudio = document.getElementById('heartbeatLoop');
        this.sadAudio = document.getElementById('sadSound');
        this.happyAudio = document.getElementById('happySound');
    }

    bindEvents() {
        this.hayirBtn.addEventListener('click', () => this.handleHayirClick());
        this.evetBtn.addEventListener('click', () => this.handleEvetClick());
    }

    // Yüzen Kalpler
    createFloatingHearts() {
        const container = document.getElementById('floatingHearts');
        const heartCount = window.innerWidth < 768 ? 8 : 12;

        for (let i = 0; i < heartCount; i++) {
            const heart = document.createElement('div');
            heart.className = 'float-heart';
            heart.innerHTML = '❤️';
            heart.style.left = `${Math.random() * 100}vw`;
            heart.style.animationDuration = `${18 + Math.random() * 15}s`;
            heart.style.animationDelay = `${Math.random() * 20}s`;
            container.appendChild(heart);
        }
    }

    // Hasar Efekti
    triggerDamageEffect() {
        document.body.classList.add('shake-active');
        setTimeout(() => document.body.classList.remove('shake-active'), 900);

        this.damageOverlay.classList.add('active');
        this.damageEdges.forEach(el => el.classList.add('active'));

        setTimeout(() => {
            this.damageOverlay.classList.remove('active');
            this.damageEdges.forEach(el => el.classList.remove('active'));
        }, 1300);
    }

    // Buton Konumlandırma
    getSafePosition() {
        const containerRect = this.buttonsContainer.getBoundingClientRect();
        const padding = 20;
        const maxX = containerRect.width - this.hayirBtn.offsetWidth - padding * 2;
        const maxY = containerRect.height - this.hayirBtn.offsetHeight - padding * 2;

        let x = padding + Math.random() * (maxX * 0.7);
        let y = padding + Math.random() * (maxY * 0.6);

        // EVET butonundan uzak dur
        const evetRect = this.evetBtn.getBoundingClientRect();
        const hayirW = this.hayirBtn.offsetWidth;
        const evetCenterX = evetRect.left - containerRect.left + evetRect.width / 2;
        const evetCenterY = evetRect.top - containerRect.top + evetRect.height / 2;

        if (Math.abs(x - evetCenterX) < hayirW * 1.6 && Math.abs(y - evetCenterY) < hayirW * 1.6) {
            x = evetCenterX + hayirW * 1.8 + Math.random() * 30;
            if (x > maxX) x = maxX - hayirW;
        }

        return {
            x: Math.min(maxX, Math.max(padding, x)),
            y: Math.min(maxY, Math.max(padding, y))
        };
    }

    moveHayirButton() {
        const pos = this.getSafePosition();
        this.hayirBtn.style.left = `${pos.x}px`;
        this.hayirBtn.style.top = `${pos.y}px`;
    }

    startRunning() {
        if (this.isKaciyor) return;
        this.isKaciyor = true;
        this.hayirBtn.classList.add('running');
        this.moveHayirButton();
        logger.log('button_run', 'Hayır butonu koşmaya başladı');
    }

    // Kül Efekti
    createAshEffect() {
        this.hayirBtn.classList.add('ash-fade');
        this.playSound(this.sadAudio);

        const rect = this.hayirBtn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 18; i++) {
            setTimeout(() => {
                const isBroken = i < 6;
                const particle = document.createElement('div');
                particle.className = isBroken ? 'ash-particle broken-heart' : 'ash-particle';
                if (isBroken) particle.innerHTML = '💔';
                particle.style.left = `${centerX}px`;
                particle.style.top = `${centerY}px`;

                document.body.appendChild(particle);

                const angle = Math.random() * Math.PI * 2;
                const distance = 60 + Math.random() * 140;
                const translateX = Math.cos(angle) * distance;
                const translateY = Math.sin(angle) * distance - 30;

                particle.animate([
                    { opacity: 0, transform: 'scale(0.2) translate(0,0)' },
                    { opacity: 0.9, transform: `translate(${translateX}px, ${translateY}px) scale(1.3)`, offset: 0.4 },
                    { opacity: 0, transform: `translate(${translateX * 1.6}px, ${translateY * 1.6 + 70}px) scale(0.1)` }
                ], {
                    duration: 1300 + Math.random() * 600,
                    easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)'
                }).onfinish = () => particle.remove();
            }, i * 55);
        }
    }

    playSound(audio, volume = 0.7) {
        if (audio) {
            audio.currentTime = 0;
            audio.volume = volume;
            audio.play().catch(e => console.log('Sound play failed:', e));
        }
    }

    destroyButton() {
        this.createAshEffect();
        logger.log('button_destroyed', `Hayır butonu yok edildi. Toplam tıklama: ${this.hayirTik}`);
        
        // "ÖYLE BİR ŞEY YOK :)" MESAJINI GÖSTER
        this.createDisappearMessage();
        
        setTimeout(() => {
            if (this.hayirBtn.parentElement) {
                this.hayirBtn.remove();
            }
        }, 1700);
    }

    // "ÖYLE BİR ŞEY YOK :)" MESAJI
    createDisappearMessage() {
        // Butonun konumunu al
        const rect = this.hayirBtn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Mesajı oluştur
        const message = document.createElement('div');
        message.className = 'disappear-message';
        message.textContent = 'öyle bir şey yok :)';
        message.style.left = `${centerX}px`;
        message.style.top = `${centerY}px`;
        
        // Her harfe ayrı animasyon ekle
        setTimeout(() => {
            const text = message.textContent;
            message.innerHTML = '';
            
            for (let i = 0; i < text.length; i++) {
                const charSpan = document.createElement('span');
                charSpan.className = 'message-char';
                charSpan.textContent = text[i];
                charSpan.style.animationDelay = `${i * 0.05}s`;
                message.appendChild(charSpan);
            }
        }, 10);
        
        document.body.appendChild(message);
        
        // KALP İZİ EFEKTİ
        this.createHeartTrail(centerX, centerY);
        
        // KIRIK KALP YAĞMURU
        this.createBrokenHeartRain(centerX, centerY);
        
        // MESAJ BİTİNCE TEMİZLE
        setTimeout(() => {
            message.remove();
        }, 3500);
    }

    // KALP İZİ EFEKTİ
    createHeartTrail(startX, startY) {
        const heartCount = 8;
        const hearts = ['💔', '🖤', '💔', '🖤', '💔', '🖤', '💔', '🖤'];
        
        for (let i = 0; i < heartCount; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.className = 'heart-trail';
                heart.innerHTML = hearts[i % hearts.length];
                heart.style.left = `${startX}px`;
                heart.style.top = `${startY}px`;
                
                // Rastgele yön
                const angle = (Math.PI / 4) * i + Math.random() * 0.5;
                const distance = 80 + Math.random() * 120;
                const tx = Math.cos(angle) * distance;
                const ty = Math.sin(angle) * distance - 50;
                
                heart.style.setProperty('--tx', `${tx}px`);
                heart.style.setProperty('--ty', `${ty}px`);
                
                document.body.appendChild(heart);
                
                // Animasyon bitince temizle
                setTimeout(() => heart.remove(), 1500);
            }, i * 150);
        }
    }

    // KIRIK KALP YAĞMURU
    createBrokenHeartRain(startX, startY) {
        const container = document.createElement('div');
        container.className = 'broken-heart-rain';
        document.body.appendChild(container);
        
        const heartCount = 15;
        
        for (let i = 0; i < heartCount; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.className = 'broken-heart-particle';
                heart.innerHTML = '💔';
                heart.style.left = `${startX + (Math.random() - 0.5) * 200}px`;
                heart.style.top = `${startY}px`;
                heart.style.fontSize = `${1 + Math.random() * 1.5}rem`;
                heart.style.animationDelay = `${Math.random() * 0.5}s`;
                heart.style.animationDuration = `${2 + Math.random() * 1.5}s`;
                
                container.appendChild(heart);
                
                // Animasyon bitince temizle
                setTimeout(() => {
                    if (heart.parentElement) heart.remove();
                }, 3000);
            }, i * 100);
        }
        
        // Container'ı temizle
        setTimeout(() => {
            container.remove();
        }, 4000);
    }

    // DEV KALP YAĞMURU EFEKTİ
    createGiantHeartRain() {
        // Beyaz ekranı göster
        this.whiteScreen.classList.add('show');
        this.playSound(this.happyAudio, 0.6);
        logger.log('victory_effect', 'Zafer efekti başlatıldı');

        // 1. DEV KALP
        setTimeout(() => {
            const giantHeart = document.createElement('div');
            giantHeart.className = 'giant-heart';
            giantHeart.innerHTML = '💖';
            this.giantHeartContainer.appendChild(giantHeart);

            // 2. KALP YAĞMURU
            this.createHeartRain();

            // 3. ORTALAMA KALPLER
            this.createConvergingHearts();

            // 4. PATLAMA EFEKTİ
            this.createEnhancedExplosion();
        }, 300);

        // Final ekranını göster
        setTimeout(() => {
            if (this.heartbeatAudio) this.heartbeatAudio.pause();
            this.showFinalScreen();
        }, 3500);
    }

    createHeartRain() {
        for (let i = 0; i < 40; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.className = 'heart-rain';
                heart.innerHTML = this.getRandomHeartEmoji();
                heart.style.left = `${Math.random() * 100}vw`;
                heart.style.fontSize = `${20 + Math.random() * 25}px`;
                heart.style.animationDelay = `${Math.random() * 0.5}s`;
                
                this.heartRainContainer.appendChild(heart);

                setTimeout(() => heart.remove(), 3000);
            }, i * 75);
        }
    }

    createConvergingHearts() {
        const positions = [
            { x: -50, y: -50 },
            { x: 50, y: -50 },
            { x: -50, y: 50 },
            { x: 50, y: 50 },
            { x: 0, y: -50 },
            { x: -50, y: 0 },
            { x: 50, y: 0 },
            { x: 0, y: 50 }
        ];

        positions.forEach((pos, index) => {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.className = 'converge-heart';
                heart.innerHTML = '💖';
                heart.style.setProperty('--startX', `${pos.x}vw`);
                heart.style.setProperty('--startY', `${pos.y}vh`);
                
                document.body.appendChild(heart);

                setTimeout(() => heart.remove(), 1500);
            }, index * 180);
        });
    }

    createEnhancedExplosion() {
        for (let i = 0; i < 60; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.className = 'heart-particle';
                heart.innerHTML = this.getRandomHeartEmoji();
                heart.style.left = '50%';
                heart.style.top = '50%';
                heart.style.fontSize = `${20 + Math.random() * 35}px`;
                
                this.heartExplosion.appendChild(heart);

                const angle = Math.random() * Math.PI * 2;
                const distance = 100 + Math.random() * 250;
                const tx = Math.cos(angle) * distance;
                const ty = Math.sin(angle) * distance;

                heart.animate([
                    { transform: 'translate(-50%, -50%) scale(0.1)', opacity: 0 },
                    { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(1.3)`, opacity: 1, offset: 0.4 },
                    { transform: `translate(calc(-50% + ${tx * 1.5}px), calc(-50% + ${ty * 1.5}px)) scale(0.4)`, opacity: 0 }
                ], {
                    duration: 1400 + Math.random() * 900,
                    easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)'
                }).onfinish = () => heart.remove();
            }, i * 50);
        }
    }

    getRandomHeartEmoji() {
        const hearts = ['❤️', '💕', '💖', '💗', '💓', '💞', '💘', '💝'];
        return hearts[Math.floor(Math.random() * hearts.length)];
    }

    // Event Handlers
    handleHayirClick() {
        this.hayirTik++;
        
        logger.log('hayir_click', `${this.hayirTik}. tıklama`);
        this.triggerDamageEffect();

        if (this.hayirTik === 1) {
            this.startRunning();
        }

        if (this.hayirTik <= this.maxAttempts) {
            this.moveHayirButton();
            
            if (this.hayirTik === this.maxAttempts) {
                setTimeout(() => this.destroyButton(), 400);
            } else {
                this.createAshEffect();
            }
        }
    }

    handleEvetClick() {
        logger.log('evet_click', 'Evet butonuna tıklandı - Zafer!');
        this.createGiantHeartRain();
    }

    showFinalScreen() {
        // Efekt container'larını temizle
        this.giantHeartContainer.innerHTML = '';
        this.heartRainContainer.innerHTML = '';
        this.heartExplosion.innerHTML = '';
        
        // Ana ekranı gizle
        document.querySelector('.main-container').style.display = 'none';
        document.querySelector('.music-controls').style.display = 'none';

        // Final ekranını göster
        this.whiteScreen.classList.remove('show');
        this.sonEkran.classList.add('show');
        
        logger.log('final_screen', 'Final ekranı gösterildi');
    }
}

    // Oyunu başlat
    window.game = new Game();
}

// Mobil kontroller
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
if (isMobile) {
    console.log("📱 Mobil cihaz tespit edildi");
    logger.log('device_detected', 'Mobil cihaz tespit edildi');
    
    document.addEventListener('touchstart', function startMusicOnce() {
        const bgMusic = document.getElementById('bgMusic');
        if (bgMusic && bgMusic.paused) {
            bgMusic.play().then(() => {
                console.log("📱 Mobilde müzik başlatıldı");
                logger.log('mobile_music_start', 'Mobilde müzik başlatıldı');
            });
        }
        
        document.removeEventListener('touchstart', startMusicOnce);
    }, { once: true });
}

// Müzik butonunu vurgula
setTimeout(() => {
    const musicToggle = document.getElementById('musicToggle');
    if (musicToggle) {
        musicToggle.style.animation = 'pulse 1s infinite';
        musicToggle.style.boxShadow = '0 0 20px gold';
        
        setTimeout(() => {
            musicToggle.style.animation = '';
            musicToggle.style.boxShadow = '';
        }, 10000);
    }
}, 1000);

// Sayfadan çıkışta log
window.addEventListener('beforeunload', function() {
    const timeSpent = Date.now() - logger.pageStartTime;
    logger.log('page_exit', `Sayfada ${Math.round(timeSpent/1000)} saniye kalındı`);
});

// Hata yakalama
window.addEventListener('error', function(e) {
    logger.log('javascript_error', `${e.message}`);
});

// Sayfa görünürlüğü
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        logger.log('page_hidden', 'Sayfa arka planda');
    } else {
        logger.log('page_visible', 'Sayfa ön plana geldi');
    }
});