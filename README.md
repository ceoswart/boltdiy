# SalesV2

A modern sales action management platform built with React, TypeScript, and Supabase.

## Features

- 🎯 Action Path Management
- 👥 User & Assignee Management 
- 🔄 Drag & Drop Interface
- 📊 Gantt Chart View
- 🔐 Role-Based Access Control
- 🔄 Salesforce Integration
- 🎨 Beautiful UI with Tailwind CSS
- 🚀 Powered by Vite

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS
- Vite
- Supabase
- Framer Motion
- DND Kit
- Lucide Icons

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/salesv2.git
cd salesv2
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

## Project Structure

```
salesv2/
├── public/              # Static assets
├── src/
│   ├── components/     # React components
│   ├── lib/           # Utility functions and configurations
│   ├── store/         # State management (Zustand)
│   ├── types/         # TypeScript type definitions
│   └── App.tsx        # Root component
├── supabase/          # Supabase migrations and configurations
└── package.json       # Project dependencies and scripts
```

## Environment Variables

The following environment variables are required:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT