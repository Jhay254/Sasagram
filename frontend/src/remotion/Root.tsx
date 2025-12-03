import { registerRoot } from 'remotion';
import { Composition } from 'remotion';
import { CinematicTemplate } from '@/remotion/templates/Cinematic';
import { FastPacedTemplate } from '@/remotion/templates/FastPaced';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="Cinematic"
                component={CinematicTemplate as any}
                durationInFrames={450} // 15 seconds at 30fps
                fps={30}
                width={1080}
                height={1920}
                defaultProps={{
                    title: 'My Life Chapter',
                    images: [],
                    primaryColor: '#ffffff',
                }}
            />
            <Composition
                id="FastPaced"
                component={FastPacedTemplate as any}
                durationInFrames={300} // 10 seconds at 30fps
                fps={30}
                width={1080}
                height={1920}
                defaultProps={{
                    title: 'Quick Highlights',
                    images: [],
                }}
            />
        </>
    );
};
