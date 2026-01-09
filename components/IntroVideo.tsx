"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Video2Ascii from "video2ascii";

type IntroPhase = "hello" | "video" | "thanks" | "skipped" | "done";

// Time-based subtitles: [startTime in seconds, text, duration (optional, for disappearing)]
const TIMED_SUBTITLES: [number, string, number?][] = [
    [2, "hi, my name is madhavan."],
    [6, "this is my website."],
    [10, "thanks to elijah from yutori for the ascii library."],
    [20, "(shiba)", 5],
];

// Video duration in seconds (when to show thanks) - video3.mp4 is 2:22
const VIDEO_DURATION = 142;

export default function IntroVideo() {
    const [phase, setPhase] = useState<IntroPhase>("hello");
    const [fadeOut, setFadeOut] = useState(false);
    const [displayedText, setDisplayedText] = useState("");
    const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(-1);
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const [videoTime, setVideoTime] = useState(0);
    const [showSubtitle, setShowSubtitle] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const videoStartTimeRef = useRef<number | null>(null);
    const subtitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const muteIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Force mute the video element to allow autoplay
    useEffect(() => {
        const attemptMute = () => {
            const video = document.querySelector(".fullscreen-ascii video") as HTMLVideoElement;
            if (video) {
                video.muted = true;
                video.playsInline = true;
                video.setAttribute("muted", "");
                video.setAttribute("playsinline", "");
            }
        };

        // Try immediately and strictly
        attemptMute();

        // Backup: Check periodically for a short time to catch lazy rendering
        muteIntervalRef.current = setInterval(attemptMute, 100);
        setTimeout(() => {
            if (muteIntervalRef.current) {
                clearInterval(muteIntervalRef.current);
                muteIntervalRef.current = null;
            }
        }, 2000);

        return () => {
            if (muteIntervalRef.current) clearInterval(muteIntervalRef.current);
        };
    }, []);

    // Helper to unmute
    const unmuteVideo = useCallback(() => {
        // Stop forcing mute if user interacts!
        if (muteIntervalRef.current) {
            clearInterval(muteIntervalRef.current);
            muteIntervalRef.current = null;
        }

        const video = document.querySelector(".fullscreen-ascii video") as HTMLVideoElement;
        if (video) {
            video.muted = false;
            video.removeAttribute("muted");
            // Try to play if paused (sometimes needed after unmuting)
            if (video.paused) {
                video.play().catch(() => { });
            }
        }
    }, []);

    // Transition from hello to video after 2 seconds
    useEffect(() => {
        if (phase === "hello") {
            const timer = setTimeout(() => {
                setPhase("video");
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [phase]);

    // Track video time when in video phase
    useEffect(() => {
        if (phase !== "video") {
            videoStartTimeRef.current = null;
            setVideoTime(0);
            setCurrentSubtitleIndex(-1);
            setCurrentCharIndex(0);
            setDisplayedText("");
            setIsTyping(false);
            setShowSubtitle(true);
            return;
        }

        // Start tracking time when video phase begins
        videoStartTimeRef.current = Date.now();

        const interval = setInterval(() => {
            if (videoStartTimeRef.current) {
                const elapsed = (Date.now() - videoStartTimeRef.current) / 1000;
                setVideoTime(elapsed);

                // Check if video has ended
                if (elapsed >= VIDEO_DURATION) {
                    setPhase("thanks");
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [phase]);

    // Find current subtitle based on video time
    useEffect(() => {
        if (phase !== "video") return;

        // Find the subtitle that should be shown at current time
        let newIndex = -1;
        for (let i = TIMED_SUBTITLES.length - 1; i >= 0; i--) {
            if (videoTime >= TIMED_SUBTITLES[i][0]) {
                newIndex = i;
                break;
            }
        }

        // If we've moved to a new subtitle, start typing it
        if (newIndex !== currentSubtitleIndex && newIndex !== -1) {
            setCurrentSubtitleIndex(newIndex);
            setCurrentCharIndex(0);
            setDisplayedText("");
            setIsTyping(true);
            setShowSubtitle(true);

            // Clear any existing timeout
            if (subtitleTimeoutRef.current) {
                clearTimeout(subtitleTimeoutRef.current);
            }

            // Check if this subtitle should disappear
            const duration = TIMED_SUBTITLES[newIndex][2];
            if (duration) {
                subtitleTimeoutRef.current = setTimeout(() => {
                    setShowSubtitle(false);
                }, duration * 1000);
            }
        }
    }, [phase, videoTime, currentSubtitleIndex]);

    // Typewriter effect for current subtitle
    useEffect(() => {
        if (!isTyping || currentSubtitleIndex === -1) return;

        const currentLine = TIMED_SUBTITLES[currentSubtitleIndex]?.[1];
        if (!currentLine) return;

        if (currentCharIndex < currentLine.length) {
            const timer = setTimeout(() => {
                setDisplayedText(currentLine.slice(0, currentCharIndex + 1));
                setCurrentCharIndex((prev) => prev + 1);
            }, 50); // Typing speed in ms
            return () => clearTimeout(timer);
        } else {
            setIsTyping(false);
        }
    }, [isTyping, currentSubtitleIndex, currentCharIndex]);

    // Handle scroll to skip - use wheel event for better detection
    const handleWheel = useCallback((e: WheelEvent) => {
        if (phase === "video" || phase === "hello") {
            e.preventDefault();
            setFadeOut(true);
            setTimeout(() => {
                setPhase("skipped");
            }, 500);
        }
    }, [phase]);

    // Handle touch scroll for mobile
    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (phase === "video" || phase === "hello") {
            e.preventDefault();
            setFadeOut(true);
            setTimeout(() => {
                setPhase("skipped");
            }, 500);
        }
    }, [phase]);

    useEffect(() => {
        if (phase === "hello" || phase === "video") {
            // Prevent body scroll while video is showing
            document.body.style.overflow = "hidden";

            window.addEventListener("wheel", handleWheel, { passive: false });
            window.addEventListener("touchmove", handleTouchMove, { passive: false });
        } else if (phase === "thanks" || phase === "skipped") {
            // Keep scroll disabled during thanks/skipped screens
            document.body.style.overflow = "hidden";
        } else {
            // Re-enable body scroll when done
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("wheel", handleWheel);
            window.removeEventListener("touchmove", handleTouchMove);
        };
    }, [phase, handleWheel, handleTouchMove]);

    // Handle click on audio prompt (enables audio without skipping)
    const handleAudioPromptClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation(); // Don't trigger parent click
        unmuteVideo();
        setAudioEnabled(true);
    }, [unmuteVideo]);

    // Handle click for different phases
    const handleClick = useCallback(() => {
        if (phase === "hello") {
            // Don't unmute here - let the audio prompt handle it
            setPhase("video");
        } else if (phase === "thanks" || phase === "skipped") {
            setPhase("done");
        }
        // Note: clicking during video phase no longer skips - use scroll to skip
    }, [phase]);

    // Transition from thanks/skipped to done after showing message
    useEffect(() => {
        if (phase === "thanks") {
            const timer = setTimeout(() => {
                setPhase("done");
            }, 4000); // Show thanks for 4 seconds then allow scroll
            return () => clearTimeout(timer);
        }
        if (phase === "skipped") {
            const timer = setTimeout(() => {
                setPhase("done");
            }, 2000); // Show sad face for 2 seconds
            return () => clearTimeout(timer);
        }
    }, [phase]);

    // Don't render anything once done
    if (phase === "done") {
        return null;
    }

    return (
        <div
            onClick={handleClick}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 99999,
                background: "#2D2A26", // charcoal
                cursor: "pointer",
                opacity: fadeOut ? 0 : 1,
                transition: "opacity 0.5s ease-out",
                margin: 0,
                padding: 0,
                overflow: "hidden",
            }}
        >
            {/* Hidden video preloader - loads video in background during hello phase */}
            <video
                src="/video3.mp4"
                preload="auto"
                muted
                playsInline
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    opacity: 0,
                    pointerEvents: "none",
                }}
            />

            {/* Hello Phase - fullscreen text */}
            {phase === "hello" && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#F5F0E8", // cream
                        margin: 0,
                        padding: 0,
                    }}
                >
                    <h1
                        style={{
                            fontFamily:
                                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                            fontSize: "clamp(5rem, 20vw, 14rem)",
                            fontWeight: 500,
                            color: "#2D2A26", // charcoal
                            letterSpacing: "-0.03em",
                            margin: 0,
                            textTransform: "lowercase",
                            animation: "fadeIn 1s ease-out",
                        }}
                    >
                        hello
                    </h1>

                    {/* Click to continue hint */}
                    <div
                        style={{
                            position: "absolute",
                            bottom: "3rem",
                            left: "50%",
                            transform: "translateX(-50%)",
                            color: "#2D2A26",
                            opacity: 0.4,
                            fontFamily: "'Courier Prime', monospace",
                            fontSize: "0.75rem",
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                        }}
                    >
                        click or wait
                    </div>
                </div>
            )}

            {/* Video Phase - ASCII video plays (always mounted for preloading, hidden during hello) */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100vw",
                    height: "100vh",
                    margin: 0,
                    padding: 0,
                    lineHeight: 0,
                    fontSize: 0,
                    overflow: "hidden",
                    opacity: phase === "video" ? 1 : 0,
                    visibility: phase === "video" ? "visible" : "hidden",
                    transition: "opacity 0.8s ease-out",
                }}
                className="fullscreen-ascii"
            >
                <Video2Ascii
                    src="/video3.mp4"
                    numColumns={200}
                    colored={true}
                    blend={50}
                    brightness={1.0}
                    audioEffect={50}
                    // @ts-ignore
                    muted={true}
                    enableMouse={true}
                    enableRipple={true}
                    charset="detailed"
                    isPlaying={phase === "video"}
                    autoPlay={phase === "video"}
                />

                {/* Typewriter Subtitle Overlay */}
                {phase === "video" && displayedText && showSubtitle && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: "6rem",
                            left: "50%",
                            transform: "translateX(-50%)",
                            color: "#F5F0E8",
                            fontFamily: "'Courier Prime', monospace",
                            fontSize: "clamp(1rem, 3vw, 1.5rem)",
                            letterSpacing: "0.05em",
                            textAlign: "center",
                            background: "rgba(0, 0, 0, 0.5)",
                            padding: "1rem 2rem",
                            borderRadius: "8px",
                            maxWidth: "80%",
                            lineHeight: 1.6,
                        }}
                    >
                        {displayedText}
                        {/* Show cursor while typing */}
                        {isTyping && (
                            <span
                                style={{
                                    display: "inline-block",
                                    width: "2px",
                                    height: "1.2em",
                                    background: "#F5F0E8",
                                    marginLeft: "4px",
                                    verticalAlign: "text-bottom",
                                    animation: "blink 1s infinite",
                                }}
                            />
                        )}
                    </div>
                )}

                {/* Audio Enable Prompt - shows until user clicks to enable sound */}
                {phase === "video" && !audioEnabled && (
                    <div
                        onClick={handleAudioPromptClick}
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            zIndex: 10,
                            animation: "fadeIn 0.5s ease-out",
                        }}
                    >
                        <div
                            style={{
                                width: "80px",
                                height: "80px",
                                borderRadius: "50%",
                                border: "2px solid rgba(245, 240, 232, 0.8)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "rgba(0, 0, 0, 0.4)",
                                marginBottom: "1rem",
                                transition: "transform 0.2s ease, background 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "scale(1.1)";
                                e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                                e.currentTarget.style.background = "rgba(0, 0, 0, 0.4)";
                            }}
                        >
                            {/* Sound icon */}
                            <svg
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#F5F0E8"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                            </svg>
                        </div>
                        <span
                            style={{
                                color: "#F5F0E8",
                                fontFamily: "'Courier Prime', monospace",
                                fontSize: "0.85rem",
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                opacity: 0.9,
                                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                            }}
                        >
                            click for sound
                        </span>
                    </div>
                )}

                {/* Skip hint */}
                {phase === "video" && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: "2rem",
                            right: "2rem",
                            color: "#F5F0E8",
                            opacity: 0.6,
                            fontFamily: "'Courier Prime', monospace",
                            fontSize: "0.7rem",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            background: "rgba(0,0,0,0.3)",
                            padding: "0.5rem 1rem",
                            borderRadius: "4px",
                        }}
                    >
                        scroll to skip
                    </div>
                )}
            </div>

            {/* Thanks Screen - Vanta Black with White Text */}
            {phase === "thanks" && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#000000", // Vanta black
                        animation: "fadeIn 0.8s ease-out",
                    }}
                >
                    <h1
                        style={{
                            fontFamily: "'Courier Prime', monospace",
                            fontSize: "clamp(1.5rem, 5vw, 3rem)",
                            fontWeight: 400,
                            color: "#FFFFFF", // White
                            letterSpacing: "0.05em",
                            margin: 0,
                            textAlign: "center",
                            padding: "0 2rem",
                        }}
                    >
                        thanks for your time.
                    </h1>
                    <p
                        style={{
                            fontFamily: "'Courier Prime', monospace",
                            fontSize: "0.8rem",
                            color: "rgba(255, 255, 255, 0.5)",
                            marginTop: "2rem",
                            letterSpacing: "0.1em",
                        }}
                    >
                        click to continue
                    </p>
                </div>
            )}

            {/* Skipped Screen - Sad Face */}
            {phase === "skipped" && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#000000", // Vanta black
                        animation: "fadeIn 0.5s ease-out",
                    }}
                >
                    <span
                        style={{
                            fontFamily:
                                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                            fontSize: "clamp(5rem, 20vw, 14rem)",
                            fontWeight: 500,
                            color: "#FFFFFF", // White
                            letterSpacing: "-0.03em",
                        }}
                    >
                        :(
                    </span>
                </div>
            )}

            {/* CSS Animation */}
            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                @keyframes blink {
                    0%,
                    50% {
                        opacity: 1;
                    }
                    51%,
                    100% {
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
}
