import React from 'react';
import { AbsoluteFill, Img, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

interface CinematicProps {
    title: string;
    images: string[];
    music?: string;
}

export const CinematicComposition: React.FC<CinematicProps> = ({ title, images }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Title animation (fade in with spring)
    const titleOpacity = spring({
        frame,
        fps,
        config: {
            damping: 200,
        },
    });

    // Title scale animation
    const titleScale = interpolate(frame, [0, 30], [0.8, 1], {
        extrapolateRight: 'clamp',
    });

    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
            {/* Title Sequence */}
            <Sequence from={0} durationInFrames={90}>
                <AbsoluteFill
                    style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                >
                    <h1
                        style={{
                            color: 'white',
                            fontSize: 80,
                            fontWeight: 'bold',
                            opacity: titleOpacity,
                            transform: `scale(${titleScale})`,
                            fontFamily: 'Arial, sans-serif',
                            textAlign: 'center',
                            padding: '0 40px',
                            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        }}
                    >
                        {title}
                    </h1>
                </AbsoluteFill>
            </Sequence>

            {/* Image Sequences with Ken Burns effect */}
            {images.slice(0, 5).map((image, index) => {
                const startFrame = 90 + index * 72; // 2.4 seconds per image
                const durationFrames = 72;

                return (
                    <Sequence key={index} from={startFrame} durationInFrames={durationFrames}>
                        <ImageWithKenBurns image={image} />
                    </Sequence>
                );
            })}

            {/* Ending fade to black */}
            <Sequence from={420} durationInFrames={30}>
                <AbsoluteFill
                    style={{
                        backgroundColor: '#000',
                        opacity: interpolate(frame - 420, [0, 30], [0, 1]),
                    }}
                />
            </Sequence>
        </AbsoluteFill>
    );
};

// Ken Burns effect component for smooth zoom/pan
const ImageWithKenBurns: React.FC<{ image: string }> = ({ image }) => {
    const frame = useCurrentFrame();

    // Zoom in effect
    const scale = interpolate(frame, [0, 72], [1, 1.1], {
        extrapolateRight: 'clamp',
    });

    // Fade in/out
    const opacity = interpolate(
        frame,
        [0, 10, 62, 72],
        [0, 1, 1, 0],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        }
    );

    return (
        <AbsoluteFill>
            <Img
                src={image}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `scale(${scale})`,
                    opacity,
                }}
            />
        </AbsoluteFill>
    );
};
