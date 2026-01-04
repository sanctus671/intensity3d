# Intensity Web App

Modern web application for Intensity workout tracking, built with Angular 21 and Angular Material.

## Features

- 🏋️ Workout diary with date navigation
- 📊 Exercise statistics and charts (eCharts)
- 📅 Training program management
- 👥 Social features (friends, leaderboard, messages)
- 📈 Bodyweight tracking
- 🏆 Personal records
- 🧮 Fitness calculators (1RM, plate, warmup, etc.)
- 🌍 19 language support
- 🌓 Light/Dark theme
- 📱 Responsive design
- 🔒 Secure authentication (Email, Facebook, Apple)
- 💳 Premium subscription via Stripe

## Tech Stack

- **Framework**: Angular 21
- **UI Library**: Angular Material 21
- **Charts**: eCharts (ngx-echarts)
- **State Management**: Angular Signals
- **Internationalization**: @ngx-translate
- **Styling**: SCSS with Material theming
- **Date Handling**: Moment.js
- **HTTP**: Angular HttpClient with offline queue

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Angular CLI 21+

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Development Server

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Project Structure

```
src/
├── app/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Route components
│   ├── services/        # Business logic services
│   ├── guards/          # Route guards
│   ├── app.config.ts    # App configuration
│   └── app.routes.ts    # Routing configuration
├── assets/
│   └── i18n/            # Translation files (19 languages)
├── environments/        # Environment configs
└── styles/
    └── themes/          # Material theme files
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run unit tests
- `npm run watch` - Build in watch mode

## Configuration

### Environment Variables

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://api.intensityapp.com/index.php',
  apiKey: 'your-api-key'
};
```

### Theming

Primary color is set to `#D44735` (Intensity red). Customize themes in:
- `src/styles/themes/_light-theme.scss`
- `src/styles/themes/_dark-theme.scss`

### Supported Languages

English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Arabic, Hindi, Tamil, Thai, Turkish, Dutch, Norwegian, Danish, Swedish

Translations are in { 'English string' : 'Translated string'} format.

## Architecture

### Services

- **StorageService**: Local storage with persistence
- **RequestService**: HTTP with offline queue and duplication protection
- **AuthenticationService**: Multi-provider authentication
- **ThemeService**: Theme management with system preference detection
- **TranslationService**: i18n management
- **DiaryService**: Workout diary operations
- **ExerciseService**: Exercise management
- **ProgramService**: Training program management
- **And more...**

### State Management

Using Angular Signals for reactive state management throughout the application.

### Routing

Lazy-loaded routes with authentication guards for optimal performance.

## Development Status

See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for detailed progress.

**Current Status**: Foundation complete (16/19 major features)
- ✅ Core infrastructure
- ✅ Authentication & routing
- ✅ All services implemented
- ✅ Layout & navigation
- ✅ All pages created
- ⏳ Dialogs & modals
- ⏳ Chart components
- ⏳ Polish & optimization

## Contributing

This is a private project. For questions or issues, contact the development team.

## License

Proprietary - All rights reserved

## Author

Taylor Hamling
