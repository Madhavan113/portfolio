"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Video2Ascii from "video2ascii";

type IntroPhase = "hello" | "video" | "thanks" | "skipped" | "done";

// Time-based subtitles: [startTime in seconds, text, duration (optional, for disappearing)]
const TIMED_SUBTITLES: [number, string, number?][] = [
    // intro FIRST
    [2, "hi, my name is madhavan."],
    [6, "thanks to clams casino for the intro."],
    [10, "i made this site to document what i'm learning,"],
    [14, "and the things i never could've figured out alone."],
    [18, "so thanks to everyone who's helped along the way."],
    [22, "and thanks to elijah from yutori for the ascii library."],

    // commentary starts
    [30, "we open with a woman resting. maybe she is not alone."],
    [35, "it feels peaceful, but something about it feels tense."],
    [40, "then the tone shifts completely."],
    [45, "someone is burned at the stake. we never really know why."],
    [50, "from here the video starts to feel like a dream."],

    [60, "i like videos that leave things unanswered. they keep suspense alive."],

    // book moment
    [69, "she finds a book. it seems important, but we have no idea how yet."],
    [75, "suddenly there are two versions of her. then more fire again."],

    // easter egg
    [90, "(shiba)", 5],

    // relationship thread
    [120, "later, we see a man totally fixated on her."],
    [128, "it feels less like love and more like he is chasing the idea of her."],
    [145, "he wakes up. she is gone."],
    [150, "maybe it happened. maybe it was all in his head."],

    [160, "i like that the video never explains itself."],

    // unraveling
    [170, "by now the scenes stop lining up in a clean way."],
    [175, "it feels like moments stitched together on purpose."],
    [180, "it barely looks real anymore."],

    // closing
    [210, "not everything here makes sense."],
    [214, "but it leaves something behind anyway."],
    [218, "thanks for watching."],
];

// Video duration in seconds (when to show thanks) - video is 3:38, show at 3:40
const VIDEO_DURATION = 220; // 3:40

export default function IntroVideo() {
    const [phase, setPhase] = useState<IntroPhase>("hello");
    const [fadeOut, setFadeOut] = useState(false);
    const [displayedText, setDisplayedText] = useState("");
    const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(-1);
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const [videoTime, setVideoTime] = useState(0);
    const [showSubtitle, setShowSubtitle] = useState(true);
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

    // Handle click for different phases
    const handleClick = useCallback(() => {
        if (phase === "hello") {
            unmuteVideo(); // User interacted, so we can unmute!
            setPhase("video");
        } else if (phase === "video") {
            const video = document.querySelector(".fullscreen-ascii video") as HTMLVideoElement;
            // If still muted (e.g. from auto-transition), first click unmutes
            if (video && video.muted) {
                unmuteVideo();
            } else {
                // Otherwise skip
                setFadeOut(true);
                setTimeout(() => {
                    setPhase("skipped");
                }, 500);
            }
        } else if (phase === "thanks" || phase === "skipped") {
            setPhase("done");
        }
    }, [phase, unmuteVideo]);

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
                src="/video.mp4"
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
                    src="/video.mp4"
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
                        scroll or click to skip
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
