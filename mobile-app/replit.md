# SCARO - Supply Chain Risk Intelligence App

## Overview

SCARO is a React Native mobile application for monitoring global supply chain risks through real-time news aggregation, AI-powered risk analysis, and interactive visualization. The app is designed for supply chain analysts who need to detect, track, and respond to global disruptions before they cascade.

The application follows a client-server architecture with:
- **React Native (Expo)** frontend targeting iOS, Android, and Web
- **Express.js** backend API server
- **PostgreSQL** database with Drizzle ORM
- AI-powered risk analysis integration (Ollama)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React Native with Expo SDK 54, supporting iOS, Android, and Web platforms through a single codebase.

**Navigation Structure**:
- Bottom tab navigator with 5 main sections: Dashboard, Graph, Query, Monitor, Settings
- Each tab contains a native stack navigator for screen hierarchy
- Modal screens presented from root navigator level

**State Management**:
- TanStack React Query for server state and caching
- React hooks for local component state
- AsyncStorage for persistent client-side data (settings, cached data)

**UI Component Pattern**:
- Custom themed components (ThemedText, ThemedView, Card, Button) for consistent styling
- Reanimated for performant animations with spring physics
- Expo Haptics for tactile feedback
- Dark/light theme support via useColorScheme hook

**Key Screens**:
- Dashboard: Real-time risk metrics, event feed, commodity status, risk timeline chart
- Graph: Interactive 2D supply chain visualization (SVG-based, designed for 3D expansion)
- Query: AI-powered natural language risk intelligence interface
- Monitor: Weather alerts and system notifications
- Settings: Backend configuration and app preferences

### Backend Architecture

**Server**: Express.js 5 with TypeScript, serving both API endpoints and static assets for web builds.

**API Design**:
- RESTful endpoints prefixed with `/api`
- CORS configured for Replit domains and localhost development
- Metro bundler configured with proxy middleware (metro.config.js) to route /api/* requests to backend

**Database**: PostgreSQL via Drizzle ORM with schema defined in `shared/schema.ts`. Schema includes 8 tables: events, alerts, weatherStatus, graphNodes, graphLinks, userSettings, commodities, riskMetrics. Migrations managed via `drizzle-kit push`.

**Storage Layer**: Abstracted through `IStorage` interface in `server/storage.ts`, currently using in-memory implementation (`MemStorage`) with PostgreSQL support ready via Drizzle.

### Path Aliases

- `@/` maps to `./client/` for frontend imports
- `@shared/` maps to `./shared/` for shared types and schema

### Build System

- **Development**: Expo bundler with Metro, Express server via tsx
- **Production**: Custom build script in `scripts/build.js` for static web output, esbuild for server bundling

## External Dependencies

### Core Services
- **PostgreSQL**: Primary database (configured via DATABASE_URL environment variable)
- **Ollama AI Service**: Risk analysis and natural language query processing (external service, status monitored in app)

### Third-Party Libraries
- **Expo ecosystem**: expo-image, expo-haptics, expo-blur, expo-splash-screen, expo-web-browser
- **React Navigation**: @react-navigation/native, bottom-tabs, native-stack
- **Data visualization**: react-native-chart-kit, react-native-svg
- **Animation**: react-native-reanimated, react-native-gesture-handler
- **Data fetching**: @tanstack/react-query
- **Database**: drizzle-orm, pg, drizzle-zod for schema validation
- **Markdown rendering**: react-native-markdown-display

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required for database operations)
- `EXPO_PUBLIC_DOMAIN`: API server domain for client-server communication
- `REPLIT_DEV_DOMAIN` / `REPLIT_DOMAINS`: CORS configuration for Replit hosting