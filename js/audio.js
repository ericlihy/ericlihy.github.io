document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('intro-video');
    const music = document.getElementById('backgroundMusic');
    const audioControls = document.querySelector('.audio-controls');
    const playOverlay = document.getElementById('playOverlay');

    // Initial setup
    const INITIAL_VOLUME = 0.3;
    music.volume = INITIAL_VOLUME;
    audioControls.style.display = 'none';
    let hasStartedPlaying = false;
    let isFading = false;
    let hasCompletedPlayback = false;

    // Play button click handler
    playOverlay.addEventListener('click', function() {
        if (!hasStartedPlaying) {
            startPlayback();
            hasStartedPlaying = true;
        }
    });

    function startPlayback() {
        video.load();
        Promise.all([
            video.play(),
            music.play()
        ]).then(() => {
            video.classList.add('visible');
            setTimeout(() => {
                playOverlay.style.display = 'none';
            }, 500);
            audioControls.style.display = 'flex';
        }).catch(error => {
            console.error('Playback failed:', error);
        });
    }

    // Handle video timeupdate for fade out
    video.addEventListener('timeupdate', function() {
        if (!video.duration) return; // Wait until duration is available

        const timeLeft = video.duration - video.currentTime;

        // Start fade out 2 seconds before the end
        if (timeLeft <= 2.0 && !isFading && music.volume > 0) {
            isFading = true;
            fadeOutMusic();
        }
    });

    function fadeOutMusic() {
        const fadeOutDuration = 2000; // 2 seconds in milliseconds
        const interval = 50; // Update every 50ms
        const steps = fadeOutDuration / interval;
        const volumeStep = music.volume / steps;

        const fadeInterval = setInterval(() => {
            if (music.volume > volumeStep) {
                music.volume = Math.max(0, music.volume - volumeStep);
            } else {
                music.volume = 0;
                clearInterval(fadeInterval);
            }
        }, interval);
    }

    // Function to check if element is in viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.top <= (window.innerHeight || document.documentElement.clientHeight)
        );
    }

    // Handle scroll events
    document.addEventListener('scroll', function() {
        if (!hasStartedPlaying || hasCompletedPlayback) return;

        if (isInViewport(video)) {
            if (video.paused && !hasCompletedPlayback) {
                video.play();
                music.play();
                audioControls.style.display = 'flex';
            }
        } else {
            video.pause();
            music.pause();
            audioControls.style.display = 'none';
        }
    });

// Handle video ending
    video.addEventListener('ended', function() {
        music.pause();
        music.currentTime = 0;
        music.volume = 0; // Reset volume for next play
        audioControls.style.display = 'none';
        isFading = false;
        hasCompletedPlayback = true;

        // Add fade out transition
        const videoIntro = document.getElementById('video-intro');
        videoIntro.classList.add('fade-out');

        // Wait for fade to complete before hiding video and showing next section
        setTimeout(() => {
            video.style.display = 'none';
            videoIntro.style.display = 'none';
            // Ensure the next section is visible and fades in
            const nextSection = document.getElementById('xavier-invitation');
            if (nextSection) {
                nextSection.style.display = 'flex';
                nextSection.classList.add('fade-in');
            }
        }, 1000); // Match this with the CSS transition duration
    });

    // Reset state if video is seeking
    video.addEventListener('seeking', function() {
        music.volume = INITIAL_VOLUME;
        isFading = false;
    });
});

// Volume control function
function adjustMusicVolume(value) {
    const music = document.getElementById('backgroundMusic');
    music.volume = value;
}

// Mute toggle function
function toggleMute() {
    const music = document.getElementById('backgroundMusic');
    music.muted = !music.muted;
    const muteButton = document.querySelector('.mute-button');
    muteButton.textContent = music.muted ? 'Unmute' : 'Mute';
}