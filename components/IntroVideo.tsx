"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Video2Ascii from "video2ascii";

type IntroPhase = "hello" | "video" | "done";

// Time-based subtitles: [startTime in seconds, text]
const TIMED_SUBTITLES: [number, string][] = [
    [0, "hi, my name is madhavan."],
    [3, "thanks to clams casino for the intro."],
    [6, "a lot of this is stuff i'm learning on the go,"],
    [9, "so it's not fully complete."],
    [12, "i chose this video because it makes no sense."],
    [15, "none of the scenes make any sense,"],
    [18, "but there's a general idea being built."],
    [21, "i kinda see it like there's two people in parallel in pursuit of something,"],
    [26, "we see scenes of both the man and woman waking up from a bed."],
    [31, "maybe it is all a dream?"],
    [35, "it seems like their dream brings them together."],
    [39, "not in a cliche way but, it feels like,"],
    [43, "it is our ideas of people or objects or goals that makes these interests converge."],
    [49, "maybe it's not fate per se, but maybe it is destiny to an extent."],
    [55, "there's really no meaning to anything,"],
    [58, "but there kinda is."],
    [61, "i'm trying to figure out what that 'kinda' is."],
    [65, "i made this site to document my progress,"],
    [69, "through things i never could've learned alone."],
    [73, "so thanks to the people that help."],
    [77, "and thanks to elijah from yutori for the ascii library."],
    // Easter eggs
    [90, "(shiba)"], // 1:30 mark - secret code
    [180, "did you enjoy that?"], // 3:00 mark - end easter egg
];

export default function IntroVideo() {
    const [phase, setPhase] = useState<IntroPhase>("hello");
    const [fadeOut, setFadeOut] = useState(false);
    const [displayedText, setDisplayedText] = useState("");
    const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(-1);
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const [videoTime, setVideoTime] = useState(0);
    const videoStartTimeRef = useRef<number | null>(null);

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
            return;
        }

        // Start tracking time when video phase begins
        videoStartTimeRef.current = Date.now();

        const interval = setInterval(() => {
            if (videoStartTimeRef.current) {
                const elapsed = (Date.now() - videoStartTimeRef.current) / 1000;
                setVideoTime(elapsed);
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
        if (phase !== "done") {
            e.preventDefault();
            setFadeOut(true);
            setTimeout(() => {
                setPhase("done");
            }, 500);
        }
    }, [phase]);

    // Handle touch scroll for mobile
    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (phase !== "done") {
            e.preventDefault();
            setFadeOut(true);
            setTimeout(() => {
                setPhase("done");
            }, 500);
        }
    }, [phase]);

    useEffect(() => {
        if (phase !== "done") {
            // Prevent body scroll while video is showing
            document.body.style.overflow = "hidden";

            window.addEventListener("wheel", handleWheel, { passive: false });
            window.addEventListener("touchmove", handleTouchMove, { passive: false });
        } else {
            // Re-enable body scroll
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("wheel", handleWheel);
            window.removeEventListener("touchmove", handleTouchMove);
        };
    }, [phase, handleWheel, handleTouchMove]);

    // Also allow click to continue from hello
    const handleClick = useCallback(() => {
        if (phase === "hello") {
            setPhase("video");
        } else if (phase === "video") {
            setFadeOut(true);
            setTimeout(() => {
                setPhase("done");
            }, 500);
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
                    enableMouse={true}
                    enableRipple={true}
                    charset="arrows"
                    isPlaying={phase === "video"}
                    autoPlay={phase === "video"}
                />

                {/* Typewriter Subtitle Overlay */}
                {phase === "video" && displayedText && (
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
