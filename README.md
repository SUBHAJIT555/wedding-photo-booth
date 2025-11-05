# Wedding Photobooth

A browser-based photobooth optimized for events. Capture a portrait photo, add props and frames, preview the result, print a 4x6 postcard via PrintNode, or share/download via QR code.

## Overview

This app opens the device camera and captures an image cropped to a 2:3 portrait ratio (postcard). After capture, guests can add draggable/resizable props and apply themed frames. The final image can be:

- Printed to a connected printer using PrintNode
- Shared/downloaded by scanning a QR code
- Saved locally for later viewing

## Features

- Camera capture with countdown
- Postcard aspect ratio (2:3 portrait)
- Draggable/resizable props overlay
- Themed frames
- Animated, touch-friendly UI (Framer Motion)
- Preview page with actions
- Print via PrintNode (PDF base64)
- QR code modal for quick sharing

## Tech Stack

- Frontend: React (Vite)
- Styling: Tailwind CSS (utility classes visible in JSX)
- Libraries: framer-motion, pdf-lib, qrcode.react, react-icons, react-router
- Backend: Not required (PrintNode is called directly from the client)

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or higher recommended)
- npm or yarn
- Git

To use printing, you need a PrintNode account with an active computer and printer configured.

## Getting Started

Follow these steps to set up the project locally:

### Clone the repository

```bash
git clone <your-repo-url>
cd wedding-photobooth
```

### Install dependencies

```bash
npm install
# or
yarn install
```

### Configure environment variables

Create a `.env` file in the project root and add:

```
VITE_PRINTNODE_API_KEY=YOUR_PRINTNODE_API_KEY
VITE_PRINTNODE_PRINTER_ID=YOUR_PRINTER_ID
```

Notes:

- These are only required if you plan to use the print feature on the Preview page.
- The app prints a 4x6 postcard by generating a PDF on the client with `pdf-lib` and sending it to PrintNode as `pdf_base64`.

### Run the development server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`.

### Build for production

```bash
npm run build
# or
yarn build
```

## Usage

1. Open the app on a device with a camera and grant camera permissions.
2. Tap Capture and wait for the countdown.
3. Swipe up to open the bottom sheet and add Props or Frames.
4. Submit to proceed to Preview.
5. From Preview, either:
   - Print (requires valid PrintNode credentials and a reachable printer), or
   - Open QR and scan to download/share the image.

## Troubleshooting

- Camera access denied: Check browser permissions and OS privacy settings.
- PrintNode errors: Verify API key, printer ID, and that the PrintNode client is online.
- Wrong print size: Printing targets 4x6 inches (288x432 pts). Ensure the printer media matches 4x6.
