const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const heading = $('header h2');
const cdImage = $('.cd-img');
const cd = $('.cd');
const audio = $('#audio');
const playBtn = $('.toggle-play-btn');
const player = $('.player');
const progress = $('#progress');
const prevButton = $('.prev-btn');
const nextButton = $('.next-btn');
const processMin = $('.process-min');
const randomButton = $('.random-btn');
const repeatButton = $('.reperat-btn');
const playlist = $('.playlist');

let audioContext;
let source;
let gainNode;
let bassFilter;

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);  // Lấy số phút
    const secs = Math.floor(seconds % 60);  // Lấy số giây còn lại
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;  // Định dạng mm:ss
}

const app = {
    currentIndex: 0,
    isPlaying: false,
    isRandom: false,
    isRepeat: false,
    songs: [
        {
            name: 'Everything Goes on',
            author: 'Porter Robinson',
            img: './asset/img/everything-goes-on.jpg',
            path: './asset/mp3/y2mate.com - Everything Goes On  Porter Robinson Official Music Video  Star Guardian 2022.mp3'
        },
        {
            name: 'Shelter',
            author: 'Porter Robinson & Madeon',
            img: './asset/img/shelter.jpeg',
            path: './asset/mp3/y2mate.com - Porter Robinson  Madeon  Shelter Official Audio.mp3'
        },
        {
            name: 'Sad Machine',
            author: 'Porter Robinson',
            img: './asset/img/sadmachine.jpg',
            path: './asset/mp3/y2mate.com - Porter Robinson  Sad Machine Official Lyric Video.mp3'
        },
        {
            name: 'Something Comforting',
            author: 'Porter Robinson',
            img: './asset/img/somethingcomforting.jpg',
            path: './asset/mp3/y2mate.com - Porter Robinson  Something Comforting Official Audio.mp3'
        },
        {
            name: 'Look At The Sky',
            author: 'Porter Robinson',
            img: './asset/img/lookatthesky.jpeg',
            path: './asset/mp3/y2mate.com - Porter Robinson  Look at the Sky Official Lyric Video.mp3'
        },
        {
            name: 'Goodbye To A World',
            author: 'Porter Robinson',
            img: './asset/img/goodbyetoaworld.jpg',
            path: './asset/mp3/y2mate.com - Porter Robinson  Goodbye To A World Official Audio.mp3'
        },
    ],
    
    render: function() {
        const htmls = this.songs.map((song, index) => {
            return `
                <div class="song ${index === this.currentIndex ? 'active' : ''}" data-index="${index}">
                    <div class="song-img" style="background-image: url('${song.img}')"></div>
                    <div class="body">
                        <h3 class="title">${song.name}</h3>
                        <p class="author">${song.author}</p>
                    </div>
                    <div class="option">
                        <i class="fa-solid fa-ellipsis"></i>
                    </div>
                </div>
            `;
        });
        $('.playlist').innerHTML = htmls.join(''); // in ra màn hình
    },

    definePropertires: function() {
        Object.defineProperty(this, 'currentSong', {
            get: function() {
                return this.songs[this.currentIndex];
            }
        });
    },

    handleEvents: function() {
        const _this = this;
        const cdWidth = cd.offsetWidth; // độ dài của cd

        const cdImgAnimate = cdImage.animate([
            { transform: 'rotate(0deg)' },    // Từ 0 độ
            { transform: 'rotate(360deg)' }   // Đến 360 độ
        ], {
            duration: 10000,   // Thời gian quay (10 giây)
            iterations: Infinity   // Quay liên tục
        });
        
        cdImgAnimate.pause();  // Tạm dừng ngay sau khi khởi tạo
        
        // Xử lý phóng to thu/nhỏ của đĩa nhạc
        document.onscroll = function() {
            const scrollTop = window.scrollY || document.documentElement.scrollTop; // lấy ra độ dài của trình duyệt khi cuộn trang
            const newCdWidth = cdWidth - scrollTop; // Tính ra độ dài mới sau cuộn trang
            cd.style.width = newCdWidth > 0 ? newCdWidth + 'px' : 0; // thay đổi độ dài của cd
            cd.style.opacity = newCdWidth / cdWidth;
        };

        playBtn.onclick = function() {
            initAudioContext();  // Khởi tạo AudioContext khi người dùng nhấp vào nút phát
            setupAudioNodes();   // Thiết lập các node âm thanh
            
            if (_this.isPlaying) {
                audio.pause();  // Dừng nhạc
                cdImgAnimate.pause();  // Dừng xoay đĩa
            } else {
                audio.play();  // Phát nhạc
                cdImgAnimate.play();  // Bắt đầu xoay đĩa
            }
        };

        // Khi nhạc bắt đầu phát
        audio.onplay = function() {
            _this.isPlaying = true;  // Cập nhật trạng thái
            player.classList.add('playing');  // Thêm class để thay đổi giao diện
            cdImgAnimate.play();  // Bắt đầu xoay đĩa khi nhạc phát
        };

        // Khi nhạc tạm dừng
        audio.onpause = function() {
            _this.isPlaying = false;  // Cập nhật trạng thái
            player.classList.remove('playing');  // Gỡ class khi dừng nhạc
            cdImgAnimate.pause();  // Dừng xoay đĩa khi nhạc tạm dừng
        };
        
        // Khi tiến độ bài hát thay đổi
        audio.ontimeupdate = function() {
            if (audio.duration) {
                // Cập nhật thanh tiến độ
                const progressPercent = Math.floor((audio.currentTime / audio.duration) * 100);
                progress.value = progressPercent;
        
                // Hiển thị thời gian đã phát và tổng thời gian
                processMin.textContent = `${formatTime(audio.currentTime)}/${formatTime(audio.duration)}`;
            }
        };

        // Khi metadata của bài hát được tải
        audio.onloadedmetadata = function() {
            processMin.textContent = `0:00/${formatTime(audio.duration)}`;
        };

        // Xử lý tua
        progress.oninput = function(e) {
            const seekTime = audio.duration / 100 * e.target.value;
            audio.currentTime = seekTime;
        };

        // Chuyển bài hát
        nextButton.onclick = function() {
            if (_this.isRandom) {
                _this.playRandomSong();
            } else {
                _this.nextSong();
            }
            audio.play();
            _this.render();
            _this.scrollToActiveSong();
        };

        // Quay lại bài trước
        prevButton.onclick = function() {
            if (_this.isRandom) {
                _this.playRandomSong();
            } else {
                _this.prevSong();
            }
            audio.play();
            _this.render();
            _this.scrollToActiveSong();
        };

        // Sự kiện ngẫu nhiên bài hát
        randomButton.onclick = function() {
            _this.isRandom = !_this.isRandom;
            randomButton.classList.toggle('active', _this.isRandom);
        };

        // Xử lý phát lại lặp lại bài hát
        repeatButton.onclick = function() {
            _this.isRepeat = !_this.isRepeat;
            repeatButton.classList.toggle('active', _this.isRepeat);
        };

        // Sự kiện khi kết thúc bài hát
        audio.onended = function() {
            if (_this.isRepeat) {
                audio.play();
            } else {
                nextButton.click();
            }
        };

        // Xử lý nhấp vào danh sách bài hát
        playlist.onclick = function(e) {
            const songNode = e.target.closest('.song:not(.active)');

            if (songNode || e.target.closest('.option')) {
                // Hành động khi nhấn vào bài hát
                if (songNode) {
                    _this.currentIndex = parseInt(songNode.dataset.index, 10);
                    _this.loadCurrentSong();
                    audio.play();
                }
                // Hành động khi ấn vào tùy chọn của bài hát
                if (e.target.closest('.option')) {
                    // Xử lý tùy chọn bài hát nếu cần
                }
            }
        };
    },

    scrollToActiveSong: function() {
        setTimeout(() => {
            $('.song.active').scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 300);
    },

    // Tải thông tin bài hát hiện tại
    loadCurrentSong: function() {
        heading.textContent = this.currentSong.name;
        cdImage.style.backgroundImage = `url('${this.currentSong.img}')`;
        audio.src = this.currentSong.path;
    },

    // Đặt thời gian hiện tại của bài hát về 0
    resetProgress: function() {
        progress.value = 0;
        processMin.textContent = `0:00/${formatTime(audio.duration)}`;
    },

    // Phát bài hát ngẫu nhiên
    playRandomSong: function() {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * this.songs.length);
        } while (newIndex === this.currentIndex);
        
        this.currentIndex = newIndex;
        this.loadCurrentSong();
    },

    // Chuyển đến bài tiếp theo
    nextSong: function() {
        this.currentIndex++;
        if (this.currentIndex >= this.songs.length) {
            this.currentIndex = 0;
        }
        this.loadCurrentSong();
    },

    // Quay lại bài trước
    prevSong: function() {
        this.currentIndex--;
        if (this.currentIndex < 0) {
            this.currentIndex = this.songs.length - 1;
        }
        this.loadCurrentSong();
    },

    // Khởi động ứng dụng
    start: function() {
        this.definePropertires();
        this.handleEvents();
        this.loadCurrentSong();
        this.render();
    }
};

function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function setupAudioNodes() {
    if (!audioContext) return;

    // Tạo nguồn âm thanh và các node xử lý
    source = audioContext.createMediaElementSource(audio);
    gainNode = audioContext.createGain();
    bassFilter = audioContext.createBiquadFilter();

    // Cấu hình bộ lọc bass
    bassFilter.type = 'lowshelf';
    bassFilter.frequency.value = 200; // Tần số cắt bass
    bassFilter.gain.value = -10; // Giảm cường độ bass

    // Kết nối các node
    source.connect(bassFilter);
    bassFilter.connect(gainNode);
    gainNode.connect(audioContext.destination);
}

app.start();
