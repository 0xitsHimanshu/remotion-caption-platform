# Remotion Captioning Platform

A full-stack web application that allows users to upload MP4 videos, automatically generate captions using AssemblyAI, and render those captions onto videos using Remotion with support for Hinglish (Hindi + English) text.

## Features

- 🎥 **Video Upload**: Upload MP4 videos via drag-and-drop or file picker
- 🎤 **Auto-Captioning**: Automatic speech-to-text transcription using AssemblyAI
- 🌐 **Hinglish Support**: Full support for mixed Hindi (Devanagari) and English text with proper font rendering
- 🎨 **Caption Styles**: Three preset styles:
  - Bottom-centered subtitles (standard)
  - Top-bar captions (news-style)
  - Karaoke-style highlighting
- 👀 **Real-time Preview**: Preview captioned videos using Remotion Player
- 📤 **Export**: Export final captioned videos as MP4

<img src="https://github.com/remotion-dev/template-next/assets/1629785/c9c2e5ca-2637-4ec8-8e40-a8feb5740d88" />

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account (for production video storage)
- AssemblyAI API key (for transcription)
- AWS account (for video rendering via Remotion Lambda)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd remotion
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration (Required for production)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AssemblyAI API Key (Required for transcription)
ASSEMBLYAI_API_KEY=your_assemblyai_api_key

# AWS Lambda Configuration (Required for video rendering)
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
# Or use Remotion-specific env vars:
# REMOTION_AWS_ACCESS_KEY_ID=your_aws_access_key_id
# REMOTION_AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
```

### Setting up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Storage and create a new bucket named `videos`
3. Set the bucket to public (or configure RLS policies as needed)
4. Copy your project URL and anon key to `.env.local`

### Setting up AssemblyAI

1. Sign up at [assemblyai.com](https://www.assemblyai.com/)
2. Get your API key from the dashboard
3. Add it to `.env.local`

### Setting up AWS Lambda (for video rendering)

1. Follow the [Remotion Lambda setup guide](https://www.remotion.dev/docs/lambda/setup)
2. Configure your AWS credentials in `.env.local`
3. Edit `config.mjs` to your desired Lambda settings
4. Run `node deploy.mjs` to deploy your Lambda function

## Usage

### Development

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000/caption](http://localhost:3000/caption) in your browser

3. Upload an MP4 video, generate captions, select a style, and export!

### Local Development Notes

- For local development, videos are stored in the `/tmp` folder
- For transcription to work, you need a publicly accessible video URL (use Supabase in production)
- The app will automatically use Supabase storage if `NEXT_PUBLIC_SUPABASE_URL` is set

### Commands

- `npm run dev` - Start Next.js dev server
- `npm run remotion` - Open Remotion Studio
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npx remotion render` - Render a video locally
- `node deploy.mjs` - Deploy Remotion Lambda function

### Deployment

#### 🚀 Deploy to Vercel + AWS Remotion Lambda

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete step-by-step instructions.**

Quick start:
1. **Deploy Remotion Lambda** (run locally):
   ```bash
   # Set AWS credentials
   export AWS_ACCESS_KEY_ID=your_key
   export AWS_SECRET_ACCESS_KEY=your_secret
   export REMOTION_SITE_NAME=remotion-caption-platform-prod
   
   # Deploy Lambda function and site
   node deploy.mjs
   # Or use helper script:
   # Windows: .\scripts\deploy-remotion.ps1
   # Linux/Mac: ./scripts/deploy-remotion.sh
   ```

2. **Deploy to Vercel**:
   - Push code to GitHub
   - Import project in Vercel
   - Add environment variables (see DEPLOYMENT.md)
   - Deploy!

#### Deploy to Render

1. Create a new Web Service
2. Connect your GitHub repository
3. Add environment variables
4. Set build command: `npm run build`
5. Set start command: `npm run start`

#### Important Notes for Deployment

- **AWS Lambda must be deployed separately** before deploying to Vercel (run `node deploy.mjs`)
- Ensure Supabase storage bucket is configured and accessible
- AssemblyAI API key must be set for transcription to work
- The `REMOTION_SITE_NAME` in Vercel must match the site name from Lambda deployment
- For local file storage, ensure `/tmp` directory is writable (not recommended for production)

## Architecture

### Components

- **Video Upload**: `/api/upload` - Handles video uploads to Supabase or local `/tmp` folder
- **Transcription**: `/api/transcribe` - Uses AssemblyAI to generate captions from video audio
- **Video Rendering**: `/api/lambda/render` - Renders captioned videos using Remotion Lambda
- **Caption Styles**: Three Remotion compositions for different caption styles
- **Font Support**: Noto Sans and Noto Sans Devanagari loaded via Google Fonts CDN for Hinglish support

### File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── upload/          # Video upload endpoint
│   │   ├── transcribe/       # AssemblyAI transcription
│   │   ├── lambda/           # Remotion Lambda rendering
│   │   └── video/            # Local video file serving
│   ├── caption/              # Main captioning UI page
│   └── page.tsx              # Home page
├── remotion/
│   ├── CaptionedVideo/       # Captioned video composition
│   │   ├── Main.tsx         # Main composition
│   │   └── styles/          # Caption style components
│   └── Root.tsx             # Remotion root configuration
├── lib/
│   └── supabase.ts          # Supabase client and upload utilities
└── types/
    ├── constants.ts         # Type definitions and constants
    └── schema.ts           # API request/response schemas
```

## Caption Styles

1. **Bottom-Centered**: Standard subtitle style at the bottom center of the video
2. **Top-Bar**: News-style captions at the top with a bar background
3. **Karaoke**: Word-by-word highlighting with golden glow effect

## Hinglish Support

The platform fully supports mixed Hindi (Devanagari script) and English text:
- Uses Noto Sans and Noto Sans Devanagari fonts
- Automatically detects Devanagari characters and applies appropriate font
- Proper text rendering and alignment for mixed-language sentences

## API Documentation

### Upload Video
```
POST /api/upload
Content-Type: multipart/form-data

Body: { file: File }
Response: { url: string, fileName: string }
```

### Transcribe Video
```
POST /api/transcribe
Content-Type: application/json

Body: { videoUrl: string }
Response: { captions: Array<{text, start, end}>, fullText: string }
```

### Render Video
```
POST /api/lambda/render
Content-Type: application/json

Body: { id: string, inputProps: CaptionedVideoProps }
Response: RenderMediaOnLambdaOutput
```

## Troubleshooting

### Transcription fails with local files
- Local `file://` URLs cannot be accessed by AssemblyAI
- Use Supabase storage for production, or ensure your video URL is publicly accessible

### Video not playing in preview
- Check that the video URL is accessible
- For local development, ensure the video API route is working
- Check browser console for CORS or loading errors

### Fonts not rendering correctly
- Ensure Google Fonts CDN is accessible
- Check that Noto Sans fonts are loaded in the browser
- Verify text encoding is UTF-8

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).

## Credits

Built with:
- [Remotion](https://remotion.dev) - Programmatic video creation
- [AssemblyAI](https://www.assemblyai.com/) - Speech-to-text transcription
- [Supabase](https://supabase.com) - Video storage
- [Next.js](https://nextjs.org) - React framework
