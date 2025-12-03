import { Composition } from 'remotion';
import { CinematicComposition } from './CinematicComposition';

export const CinematicTemplate = () => {
    return (
        <Composition
            id="Cinematic"
            component={CinematicComposition}
            durationInFrames={450} // 15 seconds at 30fps
            fps={30}
            width={1920}
            height={1080}
            defaultProps={{
                title: 'My Story',
                images: [],
                music: undefined,
            }}
        />
    );
};
