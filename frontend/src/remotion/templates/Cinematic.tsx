import { AbsoluteFill, Img, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';

interface CinematicProps {
    title: string;
    images: string[];
    primaryColor: string;
}

export const CinematicTemplate: React.FC<CinematicProps> = ({ title, images, primaryColor }) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    // Ken Burns effect logic
    const scale = interpolate(frame, [0, durationInFrames], [1, 1.1]);
    const opacity = interpolate(frame, [0, 30, durationInFrames - 30, durationInFrames], [0, 1, 1, 0]);

    // Simple slideshow logic: cycle through images
    const imageDuration = durationInFrames / (images.length || 1);
    const currentImageIndex = Math.floor(frame / imageDuration) % (images.length || 1);
    const currentImage = images[currentImageIndex] || 'https://via.placeholder.com/1080x1920';

    return (
        <AbsoluteFill style={{ backgroundColor: 'black' }}>
            <AbsoluteFill style={{ opacity }}>
                <Img
                    src={currentImage}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: `scale(${scale})`,
                    }}
                />
            </AbsoluteFill>

            <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
                <h1
                    style={{
                        fontFamily: 'Helvetica, Arial, sans-serif',
                        fontSize: 80,
                        color: primaryColor,
                        textAlign: 'center',
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                        opacity: interpolate(frame, [0, 60], [0, 1], { extrapolateRight: 'clamp' }),
                        transform: `translateY(${interpolate(frame, [0, 60], [50, 0], { extrapolateRight: 'clamp' })}px)`,
                    }}
                >
                    {title}
                </h1>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
