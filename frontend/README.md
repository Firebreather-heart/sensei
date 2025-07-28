# Sensei Code Sharing Platform

A modern code sharing platform built with Next.js that integrates with the Sensei API.

## Setup Instructions

1. **Clone and Install**
   \`\`\`bash
   npm install
   \`\`\`

2. **Configure API Connection**
   
   Update the `.env.local` file with your Sensei API URL:
   \`\`\`env
   SENSEI_API_URL=http://your-api-domain.com
   NEXT_PUBLIC_API_URL=http://your-api-domain.com
   \`\`\`

3. **Start Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`

## API Integration

The app connects directly to your Sensei API endpoints:

- **Authentication**: `/api/v1/auth/login`, `/api/v1/auth/register`
- **Files**: `/api/v1/filesystem/files/*`
- **Sharing**: `/api/v1/filesystem/files/{id}/share`
- **Search**: `/api/v1/filesystem/search`

## Troubleshooting

If you see "Unexpected token '<'" errors:

1. Verify your API is running and accessible
2. Check the API URL in `.env.local`
3. Ensure CORS is configured on your API
4. Test API endpoints directly with curl or Postman

## Features

- ✅ User authentication and registration
- ✅ Code file management (create, edit, delete)
- ✅ File sharing with permissions
- ✅ Public/private file toggle
- ✅ Advanced search functionality
- ✅ Mobile-responsive design
- ✅ Real-time code editing
