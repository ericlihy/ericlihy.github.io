/**
 * Easy Scroll Dots
 * https://easyscrolldots.primmis.com/
 *
 * Easy Scroll Dots is a commercial plugin. You must purchase a license to use it in a commercial project.
 * For more information visit: https://easyscrolldots.primmis.com/
 *
 * If your application is open source and under a GNU GPL v3 compatible license,
 * you can use Easy Scroll Dots without a commercial license.
 */

/** used this implementation for the side-bar nav. */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Easy Scroll Dots
    easyScrollDots({
        'fixedNav': false,
        'fixedNavId': '',
        'fixedNavUpward': false,
        'offset': 0
    });

    // Add click listeners to dots
    setTimeout(() => {
        const dots = document.querySelectorAll('.scroll-indicator');
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentSectionIndex = index;
            });
        });
    }, 500); // Give time for Easy Scroll Dots to initialize

    // Track scroll position changes from dot clicks
    let scrollEndTimeout;
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            clearTimeout(scrollEndTimeout);
            scrollEndTimeout = setTimeout(() => {
                // Find current section based on scroll position
                const scrollPosition = window.scrollY;
                const windowHeight = window.innerHeight;
                currentSectionIndex = Math.round(scrollPosition / windowHeight);
            }, 100);
        }
    }, { passive: true });

    let isScrolling = false;
    let currentSectionIndex = 0;
    const sections = Array.from(document.querySelectorAll('.scroll-section'));
    let scrollTimeout = null;
    let scrollDelta = 0;
    const scrollThreshold = 50; // Minimum scroll amount needed to trigger slide change
    const scrollResetDelay = 200; // Time to reset scroll accumulation

    // Prevent default scroll
    document.body.style.overflow = 'hidden';

    // Handle wheel events
    window.addEventListener('wheel', (e) => {
        e.preventDefault();

        if (isScrolling) return;

        // Clear the timeout if it exists
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }

        // Accumulate scroll delta
        scrollDelta += Math.abs(e.deltaY);

        // Set timeout to reset scroll delta
        scrollTimeout = setTimeout(() => {
            scrollDelta = 0;
        }, scrollResetDelay);

        // Only proceed if we've accumulated enough scroll
        if (scrollDelta >= scrollThreshold) {
            scrollDelta = 0; // Reset accumulator

            const direction = e.deltaY > 0 ? 1 : -1;
            const nextIndex = currentSectionIndex + direction;

            if (nextIndex >= 0 && nextIndex < sections.length) {
                isScrolling = true;
                currentSectionIndex = nextIndex;

                sections[nextIndex].scrollIntoView({ behavior: 'smooth' });

                // Reset scroll lock after animation
                setTimeout(() => {
                    isScrolling = false;
                }, 1000);
            }
        }
    }, { passive: false });

    // Handle touch events
    let touchStartY = 0;
    let touchEndY = 0;
    const minSwipeDistance = 50;

    window.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
        if (isScrolling) return;

        touchEndY = e.changedTouches[0].clientY;
        const swipeDistance = touchStartY - touchEndY;

        if (Math.abs(swipeDistance) > minSwipeDistance) {
            const direction = swipeDistance > 0 ? 1 : -1;
            const nextIndex = currentSectionIndex + direction;

            if (nextIndex >= 0 && nextIndex < sections.length) {
                isScrolling = true;
                currentSectionIndex = nextIndex;

                sections[nextIndex].scrollIntoView({ behavior: 'smooth' });

                setTimeout(() => {
                    isScrolling = false;
                }, 1000);
            }
        }
    }, { passive: true });

    // Handle visualization updates on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const content = entry.target.querySelector('.section-content');
                if (content) {
                    content.classList.add('visible');
                }

                const visContainer = entry.target.querySelector('.visualization-container');
                if (visContainer) {
                    setTimeout(() => {
                        visContainer.classList.add('visible');
                    }, 300);
                }

                triggerVisualizationUpdate(entry.target.id);
            }
        });
    }, {
        threshold: 0.3
    });

    // Observe all sections
    sections.forEach(section => {
        observer.observe(section);
    });
});

function triggerVisualizationUpdate(sectionId) {
    switch(sectionId) {
        case 'publisher-analysis':
            // Update publisher analysis visualization
            break;
        case 'character-comparison':
            if (window.radarChart) {
                window.radarChart.updateVis();
            }
            break;
        case 'bar-chart-section':
            if (window.barChart) {
                window.barChart.updateVis();
            }
            break;
        case 'scatter-plot-section':
            if (window.scatterPlot) {
                window.scatterPlot.updateVis();
            }
            break;
        case 'trends':
            if (window.timeline) {
                window.timeline.updateVis();
            }
            break;
    }
}