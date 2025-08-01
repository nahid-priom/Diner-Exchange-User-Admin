# Magic Link Authentication System

A permanent magic link login system built with Next.js (app router), MongoDB with Mongoose, and Tailwind CSS. No JWTs or temporary tokens - uses permanent, secure magic keys stored in the database.

## Features

- ✨ **Permanent Magic Links**: No expiration unless manually regenerated
- 🔐 **No Passwords**: Secure authentication via email
- 🚀 **Next.js App Router**: Modern React patterns
- 📧 **Email Integration**: Nodemailer with Gmail SMTP
- 🎨 **Beautiful UI**: Tailwind CSS styling
- 🗄️ **MongoDB**: Persistent user and key storage

## Quick Start

### 1. Install Dependencies

Dependencies are already installed:
- `mongoose` - MongoDB object modeling
- `nodemailer` - Email sending

### 2. Environment Setup

Configure your `.env.local` file with your credentials:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/magic-link-auth

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Base URL for magic links
BASE_URL=http://localhost:3000
```

**Important**: For Gmail, use an App Password instead of your regular password. Generate one at: https://myaccount.google.com/apppasswords

### 3. Start Development Server

```bash
npm run dev
```

## System Architecture

### File Structure

```
├── lib/mongodb.js                    # MongoDB connection utility
├── models/User.js                    # User schema with email & magicKey
├── app/user/
│   ├── login/page.js                 # Login form (/user/login)
│   ├── magic-login/page.js           # Magic link handler (/user/magic-login)
│   ├── dashboard/page.js             # Protected dashboard
│   └── api/
│       ├── send-magic-link/route.js  # Send magic link API
│       └── verify-magic-link/route.js # Verify magic link API
└── .env.local                        # Environment variables
```

### Authentication Flow

1. **User enters email** → `/user/login`
2. **System finds/creates user** → Generates permanent `magicKey` if needed
3. **Email sent** → Contains link to `/user/magic-login?key=xxx`
4. **User clicks link** → Redirects to magic-login page
5. **Key verification** → API validates key against database
6. **Session created** → Cookie set, user redirected to dashboard

## API Endpoints

### POST `/user/api/send-magic-link`
Handles login form submission:
- Finds or creates user by email
- Generates permanent magic key (if doesn't exist)
- Sends formatted email with magic link

### POST `/user/api/verify-magic-link`
Validates magic links:
- Verifies magic key against database
- Sets authentication cookie
- Returns user information

### GET `/user/api/verify-magic-link`
Checks authentication status:
- Validates existing session cookie
- Returns current user data

## Security Features

- **Permanent Keys**: Never expire unless manually regenerated
- **Unique Constraints**: Each magic key is unique in database
- **HTTP-Only Cookies**: Session cookies aren't accessible via JavaScript
- **Secure Email**: HTML-formatted emails with security notes
- **Database Validation**: Email format validation at schema level

## Customization

### Email Template
Modify the email HTML in `app/user/api/send-magic-link/route.js`:

```javascript
const mailOptions = {
  from: process.env.EMAIL_FROM,
  to: email,
  subject: 'Your Magic Login Link',
  html: `<!-- Your custom email template -->`
};
```

### Redirect Paths
Change redirect destinations in:
- `app/user/magic-login/page.js` (after successful login)
- `app/user/dashboard/page.js` (after logout)

### Session Duration
Modify cookie expiration in `app/user/api/verify-magic-link/route.js`:

```javascript
response.cookies.set('auth-token', user._id.toString(), {
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
});
```

## Deployment Notes

- Set `NODE_ENV=production` for secure cookies
- Use MongoDB Atlas or hosted MongoDB instance
- Configure SMTP service (Gmail, SendGrid, etc.)
- Set proper `BASE_URL` for your domain

## Usage Examples

### Login Flow
1. Navigate to `/user/login`
2. Enter email address
3. Check email for magic link
4. Click link to authenticate
5. Access protected routes

### Protecting Routes
Use the session check pattern from `dashboard/page.js`:

```javascript
useEffect(() => {
  const checkAuth = async () => {
    const response = await fetch('/user/api/verify-magic-link');
    if (!response.ok) {
      router.push('/user/login');
    }
  };
  checkAuth();
}, []);
```

## Troubleshooting

### Email Not Sending
- Verify Gmail app password is correct
- Check if 2FA is enabled on Gmail account
- Ensure SMTP settings match your provider

### MongoDB Connection Issues
- Verify MongoDB is running locally or connection string is correct
- Check network connectivity for cloud databases

### Magic Link Invalid
- Confirm the key exists in database
- Check for typos in environment variables
- Verify the link hasn't been manually regenerated

---

Built with ❤️ using Next.js, MongoDB, and Tailwind CSS