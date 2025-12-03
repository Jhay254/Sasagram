import { registerRoot } from 'remotion';
import { CinematicTemplate } from './templates/Cinematic';

export const RemotionRoot = () => {
    return (
        <>
            <CinematicTemplate />
        </>
    );
};

registerRoot(RemotionRoot);
