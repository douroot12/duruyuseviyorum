// Modüller ve Sınıflar
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
        this.playBackgroundMusic();
    }

    cacheElements() {
        // DOM Elementleri
        this.evetBtn = document.getElementById('evetBtn');
        this.hayirBtn = document.getElementById('hayirBtn');
        this.restartBtn = document.getElementById('restartBtn');
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

        // Element koleksiyonları
        this.mainElements = {
            heart: document.querySelector('.heart-pulse'),
            title: document.querySelector('.main-title'),
            subtitle: document.querySelector('.subtitle'),
            buttons: document.querySelector('.buttons-container'),
            floatingHearts: document.getElementById('floatingHearts')
        };
    }

    bindEvents() {
        this.hayirBtn.addEventListener('click', () => this.handleHayirClick());
        this.evetBtn.addEventListener('click', () => this.handleEvetClick());
        this.restartBtn?.addEventListener('click', () => this.restartGame());
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

    // Ses Kontrolleri
    playBackgroundMusic() {
        if (this.heartbeatAudio) {
            this.heartbeatAudio.volume = 0.12;
            this.heartbeatAudio.play().catch(e => console.log('Audio play failed:', e));
        }
    }

    playSound(audio, volume = 0.7) {
        if (audio) {
            audio.currentTime = 0;
            audio.volume = volume;
            audio.play().catch(e => console.log('Sound play failed:', e));
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

    destroyButton() {
        this.createAshEffect();
        setTimeout(() => {
            if (this.hayirBtn.parentElement) {
                this.hayirBtn.remove();
            }
        }, 1700);
    }

    // YENİ: DEV KALP YAĞMURU EFEKTİ
    createGiantHeartRain() {
        // Beyaz ekranı göster
        this.whiteScreen.classList.add('show');
        this.playSound(this.happyAudio, 0.6);

        // 1. DEV KALP (renk değiştirerek büyüyen)
        setTimeout(() => {
            const giantHeart = document.createElement('div');
            giantHeart.className = 'giant-heart';
            giantHeart.innerHTML = '💖';
            this.giantHeartContainer.appendChild(giantHeart);

            // 2. KALP YAĞMURU
            this.createHeartRain();

            // 3. ORTALAMA KALPLER (ekranın köşelerinden)
            this.createConvergingHearts();

            // 4. PATLAMA EFEKTİ
            this.createEnhancedExplosion();
        }, 300);

        // Final ekranını göster
        setTimeout(() => {
            this.heartbeatAudio.pause();
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

                // Animasyon bitince temizle
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

                // Animasyon bitince temizle
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

                // Rastgele yöne doğru hareket
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
        this.createGiantHeartRain();
    }

    showFinalScreen() {
        // Efekt container'larını temizle
        this.giantHeartContainer.innerHTML = '';
        this.heartRainContainer.innerHTML = '';
        this.heartExplosion.innerHTML = '';
        
        // Ana ekranı gizle
        Object.values(this.mainElements).forEach(el => {
            if (el) el.style.display = 'none';
        });

        // Final ekranını göster
        this.whiteScreen.classList.remove('show');
        this.sonEkran.classList.add('show');
    }

    restartGame() {
        // Sayfayı yenile
        window.location.reload();
    }
}

// Uygulamayı Başlat
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    
    // Global erişim için (isteğe bağlı)
    window.game = game;
});
// ===== MÜZİK SİSTEMİ =====
class MusicSystem {
    constructor() {
        this.bgMusic = document.getElementById('bgMusic');
        this.musicToggle = document.getElementById('musicToggle');
        this.musicText = document.querySelector('.music-text');
        this.musicIcon = document.querySelector('.music-icon');
        
        this.isPlaying = false;
        this.volume = 0.5; // %50 ses
        
        this.init();
    }
    
    init() {
        if (!this.bgMusic || !this.musicToggle) {
            console.log("❌ Müzik elementi veya buton bulunamadı");
            return;
        }
        
        console.log("✅ Müzik sistemi hazır");
        
        // Müzik ayarları
        this.bgMusic.volume = this.volume;
        
        // Buton event'ini bağla
        this.musicToggle.addEventListener('click', () => this.toggleMusic());
        
        // Müziği başlatmaya çalış
        this.startMusic();
    }
    
    startMusic() {
        if (this.isPlaying) return;
        
        console.log("🔄 Müzik başlatılıyor...");
        
        this.bgMusic.play()
            .then(() => {
                console.log("🎶 Müzik başladı!");
                this.isPlaying = true;
                this.updateUI();
            })
            .catch(error => {
                console.log("⚠️ Otomatik başlatma başarısız:", error.name);
                this.isPlaying = false;
                this.updateUI();
                
                // Kullanıcıya tıklama için mesaj göster
                this.showHint();
            });
    }
    
    toggleMusic() {
        if (!this.bgMusic) return;
        
        if (this.isPlaying) {
            // Müziği durdur
            this.bgMusic.pause();
            this.isPlaying = false;
            console.log("⏸️ Müzik durduruldu");
        } else {
            // Müziği başlat
            this.bgMusic.play()
                .then(() => {
                    this.isPlaying = true;
                    console.log("▶️ Müzik başlatıldı");
                })
                .catch(error => {
                    console.log("❌ Müzik başlatılamadı:", error);
                    alert("Müzik başlatılamadı. Lütfen sayfayı yenileyin veya başka bir tarayıcı deneyin.");
                });
        }
        
        this.updateUI();
    }
    
    updateUI() {
        if (!this.musicToggle || !this.musicText || !this.musicIcon) return;
        
        if (this.isPlaying) {
            this.musicText.textContent = 'Müzik: AÇIK';
            this.musicIcon.textContent = '🎵';
            this.musicToggle.classList.add('playing');
        } else {
            this.musicText.textContent = 'Müzik: KAPALI';
            this.musicIcon.textContent = '🔇';
            this.musicToggle.classList.remove('playing');
        }
    }
    
    showHint() {
        // Eğer müzik başlatılamazsa buton text'ini değiştir
        if (this.musicText) {
            this.musicText.textContent = 'TIKLA BAŞLAT';
            this.musicIcon.textContent = '▶️';
        }
        
        // Kullanıcı tıklayınca müziği başlat
        const startOnClick = () => {
            if (!this.isPlaying) {
                this.bgMusic.play()
                    .then(() => {
                        this.isPlaying = true;
                        this.updateUI();
                        console.log("✅ Kullanıcı tıklamasıyla müzik başladı");
                    })
                    .catch(e => {
                        console.log("❌ Hala başlatılamadı:", e);
                    });
            }
            
            // Event'leri temizle
            document.removeEventListener('click', startOnClick);
            document.removeEventListener('touchstart', startOnClick);
        };
        
        // Tüm sayfada tıklamayı dinle
        document.addEventListener('click', startOnClick);
        document.addEventListener('touchstart', startOnClick);
    }
}

// Müzik sistemini başlat
let musicSystem = null;

document.addEventListener('DOMContentLoaded', () => {
    // Oyunu başlat
    const game = new Game();
    window.game = game;
    
    // Müzik sistemini başlat
    musicSystem = new MusicSystem();
    window.musicSystem = musicSystem;
    
    console.log("🎮 Oyun ve müzik sistemi hazır!");
});