# AI Photo Generator

An application that uses artificial intelligence to swap faces with avatars in real-time.

## Overview

AI Photo Generator leverages cutting-edge AI models to allow users to swap their faces with pre-defined avatars. Users can take a photo using their camera and choose from 6 male and 6 female avatars to see their face swapped onto the selected avatar.

## Features

- Real-time face swapping
- 6 male and 6 female avatars to choose from
- Camera integration for capturing user images
- High-quality AI-based face blending
- Image download options

## Tech Stack

- Frontend: React
- Backend: PHP

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v14 or higher)
- npm or yarn
- Git

## Getting Started

Follow these steps to set up the project locally:

### Clone the repository

```bash
git clone https://github.com/yourorganization/AI-Photo-Generator.git
cd AI-Photo-Generator
```

### Install dependencies

```bash
npm install
# or
yarn install
```

### Configure environment variables

1. Create a `.env` file in the root directory
2. Add the following variables:

```
VITE_PRINTNODE_API_KEY=YOUR_API_KEY
VITE_PRINTNODE_PRINTER_ID=YOUR_PRINTER_ID
VITE_API_URL=API_URL
```

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
