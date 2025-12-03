# Remotion Setup Guide: Video Generation Service

## Prerequisites
- Node.js 18+ installed
- Backend server stopped (to avoid conflicts during installation)

---

## Step 1: Install Dependencies

Navigate to the backend directory and install the required packages:

```bash
cd C:\Users\Administrator\Documents\Lifeline\backend

# Install React (required by Remotion)
npm install react react-dom

# Install Remotion core packages
npm install remotion @remotion/bundler @remotion/renderer @remotion/cli

# Install Remotion Lambda (optional, for cloud rendering)
# npm install @remotion/lambda
```

**Expected Output**: You should see these packages added to `package.json`:
- `react`: ^18.x.x
- `react-dom`: ^18.x.x
- `remotion`: ^4.x.x
- `@remotion/bundler`: ^4.x.x
- `@remotion/renderer`: ^4.x.x
- `@remotion/cli`: ^4.x.x

---

## Step 2: Create Remotion Directory Structure

Create the Remotion composition directory:

```bash
# Create the remotion folder
mkdir src\remotion

# Create subdirectories for templates
mkdir src\remotion\templates
```

---

## Step 3: Create Remotion Root File

Create `src/remotion/index.tsx`:

```tsx
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
```

---

## Step 4: Create Your First Template

Create `src/remotion/templates/Cinematic.tsx`:

```tsx
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
```

---

## Step 5: Create the Composition Component

Create `src/remotion/templates/CinematicComposition.tsx`:

```tsx
import React from 'react';
import { AbsoluteFill, Img, Sequence, useCurrentFrame, interpolate } from 'remotion';

interface CinematicProps {
  title: string;
  images: string[];
  music?: string;
}

export const CinematicComposition: React.FC<CinematicProps> = ({ title, images }) => {
  const frame = useCurrentFrame();
  
  // Title animation (fade in)
  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Title Sequence */}
      <Sequence from={0} durationInFrames={90}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <h1
            style={{
              color: 'white',
              fontSize: 80,
              opacity: titleOpacity,
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {title}
          </h1>
        </AbsoluteFill>
      </Sequence>

      {/* Image Sequences */}
      {images.slice(0, 5).map((image, index) => (
        <Sequence key={index} from={90 + index * 60} durationInFrames={60}>
          <AbsoluteFill>
            <Img
              src={image}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </AbsoluteFill>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
```

---

## Step 6: Configure TypeScript

Add to `tsconfig.json` (if not already present):

```json
{
  "compilerOptions": {
    "jsx": "react",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

---

## Step 7: Test the Setup

Create a test script `src/test-remotion.ts`:

```typescript
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';

async function testRemotion() {
  console.log('Bundling Remotion project...');
  
  const bundleLocation = await bundle({
    entryPoint: path.join(__dirname, 'remotion', 'index.tsx'),
    webpackOverride: (config) => config,
  });

  console.log('Bundle created at:', bundleLocation);

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'Cinematic',
    inputProps: {
      title: 'Test Video',
      images: [
        'https://via.placeholder.com/1920x1080/FF0000/FFFFFF?text=Image+1',
        'https://via.placeholder.com/1920x1080/00FF00/FFFFFF?text=Image+2',
      ],
    },
  });

  console.log('Rendering video...');

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: path.join(__dirname, '..', 'uploads', 'test-video.mp4'),
  });

  console.log('Video rendered successfully!');
}

testRemotion().catch(console.error);
```

Run the test:

```bash
npx ts-node src/test-remotion.ts
```

---

## Step 8: Verify Installation

Check that:
1. ✅ `node_modules` contains `remotion`, `react`, `react-dom`
2. ✅ `src/remotion/` directory exists with templates
3. ✅ Test script runs without errors
4. ✅ `uploads/test-video.mp4` is created

---

## Troubleshooting

### Error: "Cannot find module 'react'"
**Solution**: Ensure React is installed in the backend, not just the frontend:
```bash
npm install react react-dom --save
```

### Error: "Webpack compilation failed"
**Solution**: Install missing webpack dependencies:
```bash
npm install webpack webpack-cli --save-dev
```

### Error: "FFmpeg not found"
**Solution**: Install FFmpeg on your system:
- **Windows**: Download from https://ffmpeg.org/download.html
- Add FFmpeg to your PATH environment variable

---

## Next Steps

Once installation is verified:
1. Proceed to implement the `video.worker.ts` (as per implementation_plan.md)
2. Update `VideoService` to dispatch jobs to the queue
3. Test end-to-end video generation

---

## Reference
- Remotion Docs: https://www.remotion.dev/docs
- Implementation Plan: `implementation_plan.md`
