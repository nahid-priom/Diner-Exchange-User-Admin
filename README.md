# DinarExchange.co.nz Admin Dashboard

A comprehensive backend admin dashboard for DinarExchange.co.nz built with Next.js, MongoDB, and NextAuth.

## Features

### 🔐 Admin Authentication
- Secure login with email/password
- Role-based access control (Admin, Manager, Support)
- Session management with JWT
- Account lockout protection
- Audit trail for all login attempts

### 📊 Order Management
- View all orders with filtering and search
- Order status tracking (Pending, Processing, Shipped, Completed)
- Payment and delivery status monitoring
- High-value transaction alerts ($10,000+ NZD)
- Suspicious order flagging
- Order assignment to admins

### 👥 Customer Directory
- Comprehensive customer profiles
- KYC verification status tracking
- Risk level assessment (Low, Medium, High, Critical)
- Customer search by name, email, or phone
- Order history and transaction patterns
- VIP customer identification

### 🚨 Notifications & Alerts
- Real-time notifications for suspicious activities
- High-value transaction alerts
- System notifications
- Priority-based alert system (Low, Medium, High, Urgent)
- Auto-expiring notifications

### 📈 Dashboard Analytics
- Total orders, revenue, and customer metrics
- Growth tracking with period comparisons
- Interactive charts and graphs
- Currency distribution analysis
- Order status breakdowns
- Top customers by volume

### 🔍 Audit Trail
- Complete log of all admin actions
- Risk scoring for activities
- Detailed change tracking
- IP address and session tracking
- Compliance reporting

### 🛡️ Security Features
- Role-based permissions system
- Middleware route protection
- Failed login attempt tracking
- High-risk activity detection
- Secure password hashing

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API routes, NextAuth.js
- **Database**: MongoDB with Mongoose
- **Charts**: Chart.js, React Chart.js 2
- **Authentication**: NextAuth.js with custom credentials provider
- **UI Components**: Heroicons, React Hot Toast
- **Security**: bcryptjs, JWT sessions

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dinar-exchange-admin
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/dinar-exchange
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-strong-secret-key-here
```

4. Seed the database with sample admin users and data:
```bash
npm run seed-admin
```

5. Start the development server:
```bash
npm run dev
```

6. Access the admin panel:
- Open [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- Use one of the seeded admin accounts:
  - **Super Admin**: `admin@dinarexchange.co.nz` / `admin123!`
  - **Manager**: `manager@dinarexchange.co.nz` / `manager123!`
  - **Support**: `support@dinarexchange.co.nz` / `support123!`

## Project Structure

```
├── app/
│   ├── admin/                  # Admin panel pages
│   │   ├── dashboard/         # Main dashboard
│   │   ├── login/             # Admin login
│   │   ├── orders/            # Order management
│   │   ├── customers/         # Customer directory
│   │   └── ...
│   ├── api/                   # API routes
│   │   ├── admin/             # Admin API endpoints
│   │   └── auth/              # NextAuth configuration
│   └── globals.css
├── components/
│   └── admin/                 # Admin UI components
├── lib/
│   ├── auth.js               # NextAuth configuration
│   └── mongodb.js            # Database connection
├── models/                   # MongoDB schemas
│   ├── Admin.js
│   ├── Order.js
│   ├── Customer.js
│   ├── AuditLog.js
│   └── Notification.js
├── scripts/
│   └── seed-admin-data.js    # Database seeding script
└── middleware.js             # Route protection
```

## Admin Roles & Permissions

### Admin (Full Access)
- All order and customer management
- Analytics and reporting
- Admin user management
- System settings
- Audit log access

### Manager
- Order and customer management
- Analytics access
- Limited admin functions
- Audit log viewing

### Support
- View-only access to orders and customers
- Basic customer support functions
- No administrative privileges

## API Endpoints

### Orders
- `GET /api/admin/orders` - List orders with filtering
- `GET /api/admin/orders/[id]` - Get order details
- `PUT /api/admin/orders/[id]` - Update order
- `DELETE /api/admin/orders/[id]` - Delete order

### Customers
- `GET /api/admin/customers` - List customers
- `GET /api/admin/customers/[id]` - Get customer profile
- `PUT /api/admin/customers/[id]` - Update customer
- `DELETE /api/admin/customers/[id]` - Close customer account

### Analytics
- `GET /api/admin/analytics` - Dashboard metrics and charts

### Notifications
- `GET /api/admin/notifications` - Get notifications
- `POST /api/admin/notifications` - Create notification

## Security Features

- **Route Protection**: Middleware validates admin sessions
- **Permission Checks**: API endpoints verify user permissions
- **Audit Logging**: All admin actions are logged
- **Rate Limiting**: Protection against brute force attacks
- **Data Validation**: Input sanitization and validation
- **Session Security**: Secure JWT tokens with expiration

## Development

### Database Seeding
```bash
npm run seed-admin
```

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software for DinarExchange.co.nz.

## Support

For support and questions, contact the development team.
