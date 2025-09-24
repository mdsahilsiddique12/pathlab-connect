# PathLab Connect - Professional Lab Booking System

A modern full-stack web application for pathology lab appointments.

## Features
- React + Vite frontend with Tailwind CSS
- Netlify Functions backend
- Prisma database with PostgreSQL
- WhatsApp and Email integration
- Admin dashboard
- Neumorphic design

## Setup
1. `cp .env.example .env` (configure your variables)
2. `npm install`
3. `cd web 
Unknown command: "install`"


Did you mean one of these?
  npm install # Install a package
  npm uninstall # Remove a package
To see a list of supported npm commands, run:
  npm help
4. `npx prisma migrate dev`
5. `npm run dev`

## Environment Variables
- DATABASE_URL: PostgreSQL connection string
- JWT_SECRET: Secret for JWT tokens
- WHATSAPP_TOKEN: WhatsApp Business API token
- SMTP_*: Email configuration

## Deployment
Deploy to Netlify with environment variables configured.
