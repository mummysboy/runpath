# Runpath Business OS Dashboard

A Next.js-based Business Operating System (BOS) dashboard application with Supabase backend, featuring role-based access control, ticketing system, and admin console.

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Supabase** for Auth, Postgres DB, Row Level Security (RLS), and Storage
- **Tailwind CSS** for styling
- **Multi-tenant architecture** with organization-based data isolation

## Features

### Authentication
- Email/password authentication
- Magic link authentication
- Protected routes with middleware
- Session persistence

### Role-Based Dashboards
- **Admin**: Full access to all modules
- **UX Researcher**: Can create tickets, view internal comments
- **Developer**: Can comment, change ticket status
- **Client**: Limited view (client-visible tickets only)

### Ticketing System
- Create tickets with evidence links/files
- Comment on tickets (internal/external)
- Change ticket status with audit trail
- Priority and type classification
- Client visibility controls

### Admin Console
- User management and role assignment
- Role and permission management
- Client and project management
- Billing profiles (placeholder)
- Sales pipeline (placeholder)
- Marketing campaigns (placeholder)
- Audit log

### Data Security
- Row Level Security (RLS) policies on all tables
- Multi-tenant data isolation
- Client data visibility controls
- Internal-only fields and comments

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Git

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. Get your service role key from Settings > API (keep this secret!)

### 3. Run Database Migration

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Run the migration

This will create:
- All required tables
- Row Level Security policies
- Helper functions
- Default organization
- Default roles (Admin, UX Researcher, Developer, Client)
- Default permissions

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Important**: Never commit the `.env.local` file. The service role key should never be exposed to the client.

### 5. Set Up Your First Admin User

After running the migration, you need to create your first admin user:

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add user" and create a user with email/password
3. Note the user ID (UUID)

4. In Supabase SQL Editor, run:

```sql
-- Replace 'user-uuid-here' with the actual user ID from step 3
-- Replace '00000000-0000-0000-0000-000000000001' if you changed the default org ID

-- Create user profile
INSERT INTO users_profile (user_id, org_id, full_name)
VALUES (
  'user-uuid-here',
  '00000000-0000-0000-0000-000000000001',
  'Your Name'
);

-- Assign Admin role
INSERT INTO user_roles (user_id, role_id, scope_type, scope_id)
VALUES (
  'user-uuid-here',
  '00000000-0000-0000-0000-000000000010', -- Default Admin role ID
  'org',
  NULL
);
```

### 6. Add Logo Assets

Copy your logo files to the `public` directory:
- `RunpathLabs_Logo-Combined_Reversed.png`
- `RunpathLabs_Logomark.png`

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Navigate to `/login` to sign in with your admin user.

## Project Structure

```
/
├── src/
│   ├── app/
│   │   ├── app/              # Protected app routes
│   │   │   ├── admin/        # Admin console pages
│   │   │   ├── projects/     # Project management
│   │   │   ├── tickets/      # Ticket management
│   │   │   └── layout.tsx    # App layout with sidebar
│   │   ├── login/            # Login page
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/           # React components
│   │   ├── Sidebar.tsx
│   │   ├── TicketComments.tsx
│   │   └── TicketStatusChange.tsx
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts     # Browser Supabase client
│   │       └── server.ts     # Server Supabase client
│   └── middleware.ts         # Auth middleware
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
└── public/                   # Static assets
```

## How RLS Works

Row Level Security (RLS) is enforced at the database level. Every query is filtered based on:

1. **Organization isolation**: Users can only access data from their organization (`org_id`)
2. **Role-based permissions**: Access is checked via `has_permission()` helper function
3. **Client visibility**: Clients can only see tickets/comments where `client_visible = true` and `is_internal = false`
4. **Project membership**: Users must be project members to access project data (unless admin)

### Key RLS Policies

- **Tickets**: Internal users see all, clients only see `client_visible = true`
- **Comments**: Clients never see `is_internal = true` comments
- **Projects**: Only project members or admins can access
- **Admin data**: Only users with admin permissions can access

The RLS policies are defined in `supabase/migrations/001_initial_schema.sql` and are enforced automatically by Supabase.

## Common Tasks

### Adding a New User

1. Create user in Supabase Auth
2. Add profile entry in `users_profile` table
3. Assign roles in `user_roles` table

### Creating a Client

1. Admin creates client in `/app/admin/clients`
2. Create projects for the client
3. Add client users as project members with `member_role = 'client'`
4. Assign "Client" role to the user

### Creating a Ticket

1. UX Researcher navigates to a project
2. Clicks "Create Ticket"
3. Fills in ticket details
4. Optionally adds evidence links/files
5. Sets client visibility

### Changing Ticket Status

1. Developer or Admin opens ticket
2. Uses "Change Status" widget
3. Status change is logged in `ticket_status_history`
4. Audit log entry is created

## Development Notes

- Server components are used by default for data fetching
- Client components are used for interactive forms and real-time updates
- The middleware handles session refresh and route protection
- All database queries respect RLS policies automatically

## Next Steps

- Implement user invitation flow
- Add file upload for ticket evidence
- Build out billing module with invoice generation
- Implement sales pipeline workflows
- Add marketing campaign analytics
- Add "Preview as Client" mode for admins
- Implement notifications
- Add search and filtering

## Troubleshooting

### "Not authenticated" errors
- Check that your `.env.local` has correct Supabase credentials
- Verify the user has a profile entry in `users_profile`
- Check that middleware is running (should redirect to `/login`)

### "Permission denied" errors
- Verify the user has appropriate roles assigned
- Check that RLS policies are enabled on the table
- Ensure user's `org_id` matches the data they're accessing

### Migration errors
- Make sure you're running the migration in the SQL Editor
- Check that extensions (`uuid-ossp`, `pgcrypto`) are enabled
- Verify you're not running the migration twice (check for existing tables)

## License

Private - Runpath Enterprise Solutions

