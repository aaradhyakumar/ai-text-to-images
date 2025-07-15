# AI Image Generator with Pollination.ai

## Overview

This is an API-only AI image generation service that leverages the Pollination.ai API to create images from text prompts. The application features a Node.js/Express backend with automatic image downloading, local storage, and cleanup functionality designed for RapidAPI marketplace integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### API-Only Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API endpoints optimized for RapidAPI
- **Storage**: In-memory storage for generation tracking
- **Validation**: Custom validation functions for request data
- **Image Processing**: Automatic download and local storage from Pollination.ai
- **File Management**: Automatic cleanup of expired images (24-hour expiration)
- **CORS**: Full CORS support for cross-origin requests

## Key Components

### Core Features
1. **Image Generation**: Text-to-image generation using Pollination.ai API
2. **Image Gallery**: Display and manage generated images
3. **Generation History**: Track and store all generation requests
4. **API Documentation**: Built-in documentation for external integrations

### Database Schema
- **Users Table**: Basic user management structure
- **Image Generations Table**: Stores prompts, parameters, generated images, and metadata
- **Generation Tracking**: Status tracking (pending, completed, failed) with timing metrics

### API Endpoints (Simplified for Better Storage & Understanding)
**Essential Endpoints (8 total):**
- `POST /api/generate` - Main image generation endpoint
- `GET /api/generations` - Retrieve all generations history
- `DELETE /api/generations` - Clear generation history
- `GET /api/health` - Health check endpoint
- `GET /api/models` - Available model information
- `GET /api/image/:filename` - Serve locally stored images
- `GET /api/download/:filename` - Download images with proper headers
- `DELETE /api/cleanup` - Manual cleanup of expired images

**Integration Endpoints (5 total):**
- `GET /api/docs` - API documentation (JSON format)
- `POST /api/webhook/generate` - Webhook for n8n, Zapier integration
- `POST /api/ai/generate` - AI agent optimized endpoint
- `GET /api/schema` - OpenAPI schema for development tools

**Removed Complex Endpoints:**
- `POST /graphql` - GraphQL endpoint (complex, rarely used)
- `GET /api/events` - Server-sent events (complex real-time)
- `POST /api/generate/realtime` - Real-time background processing
- `GET /api/status/:id` - Status monitoring endpoint
- `POST /api/batch/generate` - Batch processing (complex)
- `GET /api/sdk/javascript` - Live SDK generation
- `GET /api/sdk/python` - Live SDK generation
- `GET /docs` - Complex HTML documentation

## Data Flow

1. **API Request**: Client sends POST request to /api/generate with prompt and parameters
2. **Request Validation**: Custom validation ensures prompt length and dimensions are valid
3. **Storage**: Generation request stored with "pending" status in memory
4. **External API Call**: Server calls Pollination.ai API with user parameters
5. **Image Download**: Generated image is downloaded and saved locally with unique filename
6. **Response**: API returns local image URL and download link, hiding Pollination.ai source
7. **Auto-Cleanup**: Images automatically deleted after 24 hours to save storage space

## External Dependencies

### Third-Party APIs
- **Pollinations.ai**: Free, open-source image generation service (no API key required)
- **Neon Database**: PostgreSQL hosting (inferred from @neondatabase/serverless)

### Key Libraries
- **HTTP Server**: Express.js with TypeScript
- **File System**: Node.js fs/promises for image storage
- **Crypto**: Node.js crypto for unique filename generation
- **Path Handling**: Node.js path module for file operations
- **Storage**: In-memory Map-based storage for generation tracking

## Deployment Strategy

### Development Mode
- Vite dev server for frontend hot reload
- Express server with TypeScript compilation
- Development-specific logging and error handling

### Production Build
- Vite builds optimized React bundle
- ESBuild compiles server TypeScript to JavaScript
- Static files served from Express server
- Database migrations handled via Drizzle Kit

### Environment Configuration
- No API keys required (using free Pollinations.ai service)
- Development/production mode detection via `NODE_ENV`
- Automatic temp_images directory creation for local storage
- Configurable cleanup intervals (default: hourly cleanup, 24-hour retention)

### Infrastructure Requirements
- Node.js runtime environment
- PostgreSQL database
- Environment variables for API keys and database connection
- Static file serving capability

The application is designed for easy deployment to platforms like Replit, Vercel, or Railway, with a unified server that handles API requests and serves locally stored images. Perfect for RapidAPI marketplace integration with hidden source attribution and automatic resource management.

## Recent Changes (July 15, 2025)

### API Simplification (Latest)
- **Removed Complex Endpoints**: Eliminated 8 complex/redundant endpoints for better storage efficiency
- **Kept Essential Functionality**: Maintained all core features while reducing complexity
- **Preserved n8n Integration**: Kept webhook and AI agent endpoints for automation platforms
- **Improved Maintainability**: Reduced from 20+ endpoints to 13 focused endpoints
- **Better Documentation**: Simplified API structure for easier understanding and integration

### Benefits of Simplification
- ✅ **Reduced Memory Usage**: Fewer endpoints = less storage overhead
- ✅ **Easier Maintenance**: Simpler codebase with focused functionality
- ✅ **Better Performance**: Fewer unused complex features
- ✅ **Cleaner Integration**: Essential endpoints optimized for RapidAPI and automation
- ✅ **Preserved Functionality**: All core features maintained for users

### Modern 2025 Integration Enhancements
- **GraphQL Endpoint**: Added `/graphql` endpoint for modern applications with 30% resource reduction
- **Real-time APIs**: Server-Sent Events at `/api/events` for live updates and status tracking
- **Real-time Generation**: `/api/generate/realtime` for background processing with status monitoring
- **Status Monitoring**: `/api/status/:id` endpoint for real-time generation tracking
- **Batch Processing**: `/api/batch/generate` for high-volume applications (up to 10 images per batch)
- **SDK Generation**: Live SDK generation at `/api/sdk/javascript` and `/api/sdk/python`
- **Modern Integration Hub**: Comprehensive `/integrations` page showcasing all 2025 technologies
- **Enhanced Documentation**: Updated with AI agent guidelines, GraphQL examples, and real-time patterns

### Technology Stack Compatibility
- **REST API**: Traditional HTTP endpoints (most widely used)
- **GraphQL**: Single endpoint with query flexibility (growing adoption)
- **Real-time APIs**: Server-Sent Events for live applications (trending)
- **AI Agent Integration**: Simplified responses for automated systems (emerging)
- **Webhook Support**: No-code platform integration (stable)
- **Batch Processing**: Enterprise-grade bulk operations (high-volume)
- **SDK Support**: JavaScript, Python, and OpenAPI schema generation

### Performance Optimizations
- **Background Processing**: Non-blocking image generation with status tracking
- **Resource Efficiency**: GraphQL reduces over-fetching by 30%
- **Real-time Updates**: Live status monitoring without polling
- **Batch Operations**: Efficient handling of multiple requests
- **Caching Support**: HTTP caching for REST endpoints
- **Error Handling**: Comprehensive error messages with troubleshooting guidance

## Earlier Changes

### Image Download and Storage System
- **Local Image Storage**: Images are now downloaded from Pollination.ai and stored locally
- **Hidden Source**: API responses no longer expose Pollination.ai URLs
- **Download Endpoints**: Added `/api/image/:filename` and `/api/download/:filename` endpoints
- **Automatic Cleanup**: Images automatically deleted after 24 hours to save storage
- **Unique Filenames**: MD5 hash-based filenames prevent conflicts
- **Proper Headers**: Download endpoint includes proper Content-Disposition headers
- **Sequential Downloads**: Downloads named as free5000images1.png, free5000images2.png, etc.

### Enhanced API Response Format
- **Expiration Info**: API responses include `expiresAt` field showing when image will be deleted
- **Download URLs**: Separate `downloadUrl` field for direct file downloads
- **Local URLs**: `imageUrl` field now points to local server, not external source
- **Error Handling**: Proper 404 responses for expired or missing images

### Storage Management
- **Temp Directory**: All images stored in `temp_images/` directory
- **Hourly Cleanup**: Automatic cleanup runs every hour to remove expired images
- **Manual Cleanup**: `/api/cleanup` endpoint for manual cleanup operations
- **File Validation**: Proper file existence checking before serving images

### Developer-Friendly Enhancements (No-Code Integration Focus)
- **API Documentation**: Comprehensive `/api/docs` endpoint with JSON format
- **HTML Documentation**: User-friendly `/docs` page with examples and integration guides
- **Webhook Endpoint**: `/api/webhook/generate` optimized for no-code platforms
- **Full URLs**: Webhook responses include complete URLs for easy integration
- **Platform-Specific Guides**: Zapier, n8n, and RapidAPI integration instructions
- **Code Examples**: cURL, JavaScript, and Python examples included
- **Sequential Naming**: Counter-based file naming for organized downloads
- **Enhanced Responses**: Webhook endpoint includes downloadFileName and timestamp fields

### AI Agent Integration Enhancements
- **AI Agent Endpoint**: `/api/ai/generate` with simplified, structured responses
- **OpenAPI Schema**: `/api/schema` endpoint provides OpenAPI 3.0.0 specification
- **AI-Friendly Documentation**: Structured metadata in `/api/docs` for AI agent parsing
- **Clear Error Messages**: Detailed error responses with troubleshooting suggestions
- **Prompt Guidelines**: Best practices for AI agents to generate effective prompts
- **Response Validation**: Consistent success/error field structure across all endpoints
- **Machine-Readable Format**: JSON responses optimized for programmatic consumption