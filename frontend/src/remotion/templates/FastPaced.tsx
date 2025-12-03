import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, spring } from 'remotion';

interface FastPacedProps {
    title: string;
    images: string[];
}

export const FastPacedTemplate: React.FC<FastPacedProps> = ({ title, images }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Quick cuts every 15 frames (0.5s)
    const cutDuration = 15;
    const currentImageIndex = Math.floor(frame / cutDuration) % (images.length || 1);
    const currentImage = images[currentImageIndex] || 'https://via.placeholder.com/1080x1920';

    const scale = spring({
        frame: frame % cutDuration,
        fps,
        config: { damping: 200 },
        from: 0.8,
        to: 1,
    });

    return (
        <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }}>
            <Img
                src={currentImage}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `scale(${scale})`,
                }}
            />
            <AbsoluteFill
                style={{
                    justifyContent: 'flex-end',
                    padding: 50,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                }}
            >
                <h2 style={{ color: 'white', fontSize: 60, fontFamily: 'sans-serif' }}>{title}</h2>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
