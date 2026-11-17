// multiplayer.js - Plugin Mabar

(function() {
    // 1. Hubungkan ke server Socket.io
    const socket = io();
    const otherPlayers = {};

    // 2. Fungsi untuk mendeteksi dan menyadap Canvas utama game
    function injectMultiplayerLayer() {
        const canvas = document.querySelector('canvas');
        if (!canvas) {
            setTimeout(injectMultiplayerLayer, 500);
            return;
        }
        const ctx = canvas.getContext('2d');

        // Menyadap fungsi requestAnimationFrame milik browser
        const originalRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = function(callback) {
            return originalRAF(function(timestamp) {
                // Jalankan frame game asli Anda terlebih dahulu
                callback(timestamp);
                
                // Gambar pemain lain di atas frame yang baru saja dirender
                renderOtherPlayers(ctx);
            });
        };

        // Kirim posisi pemain lokal secara berkala (setiap 50ms / 20fps)
        setInterval(() => {
            // Membaca variabel global 'player' (jika tersedia di window)
            if (typeof window.player !== 'undefined') {
                socket.emit('playerMovement', {
                    x: window.player.x,
                    y: window.player.y,
                    skin: window.player.skin || 'biru',
                    direction: window.player.direction || 'right'
                });
            }
        }, 50);
    }

    // 3. Logika menggambar karakter teman mabar
    function renderOtherPlayers(ctx) {
        Object.values(otherPlayers).forEach(p => {
            ctx.save();
            // Jika aset sprite global tersedia, gunakan sprite; jika tidak, gambar kotak indikator
            ctx.fillStyle = getColorBySkin(p.skin);
            ctx.fillRect(p.x, p.y, 32, 32); // Sesuaikan ukuran default karakter
            
            // Nama/ID pemain di atas kepala
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Player ${p.id.substring(0, 4)}`, p.x + 16, p.y - 6);
            ctx.restore();
        });
    }

    function getColorBySkin(skin) {
        const colors = {
            biru: '#3498db',
            hijau: '#2ecc71',
            merah: '#e74c3c',
            kuning: '#f1c40f',
            ungu: '#9b59b6',
            hitam: '#34495e'
        };
        return colors[skin] || '#3498db';
    }

    // 4. Event Listener Jaringan (Socket.io)
    socket.on('currentPlayers', (players) => {
        Object.keys(players).forEach((id) => {
            if (id !== socket.id) otherPlayers[id] = players[id];
        });
    });

    socket.on('newPlayer', (playerInfo) => {
        otherPlayers[playerInfo.id] = playerInfo;
    });

    socket.on('playerMoved', (playerInfo) => {
        if (otherPlayers[playerInfo.id]) {
            otherPlayers[playerInfo.id] = playerInfo;
        }
    });

    socket.on('disconnectPlayer', (id) => {
        delete otherPlayers[id];
    });

    // Jalankan injeksi saat halaman selesai dimuat
    window.addEventListener('load', injectMultiplayerLayer);
})();