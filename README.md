This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:8033](http://localhost:8033) with your browser to see the result.

### Portfolio Preview

`npm run dev` starts the app in local portfolio preview mode automatically. The preview uses mock data and does not require Firebase or production API credentials.

Open [http://localhost:3000](http://localhost:3000) and use these demo credentials:

- Email: `demo@ballpitt.dev`
- Password: `Demo123!` (any non-empty password is accepted in preview mode)

This mode is development-only and is disabled in production builds.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

### Google Sheets Configuration

The application uses Google Sheets API for storing chat transcripts. You need to set the following environment variables:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GOOGLE_SHEETS_PRIVATE_KEY=your_private_key
```

## Features

### Email and Phone Verification

- **During Signup**: Email and phone numbers are verified using IPQualityScore API before account creation.

  - Invalid emails/phones are rejected with user-friendly error messages.
  - Disposable emails, high-risk numbers, and recently abused emails are blocked.
  - Verification status is stored in the user document.

- **During Chat Storage**: When chats are stored in Google Sheets:
  - Sender and receiver email/phone are captured from user documents.
  - Contact information is verified again using IPQualityScore API.
  - Verification status (Yes/No) is included in the spreadsheet.

### Spreadsheet Columns

The "Chat Summary" sheet includes the following additional columns:

- Host Email
- Host Phone
- Guest Email
- Guest Phone
- Host Email Valid
- Host Phone Valid
- Guest Email Valid
- Guest Phone Valid

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
