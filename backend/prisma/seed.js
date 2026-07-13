const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database tables...');
  
  // Clean up in reverse relation order
  await prisma.activityLog.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenant.deleteMany({});

  console.log('Seeding rich workspace database...');

  // 1. Create Tenant (Workspace Organization)
  const tenant = await prisma.tenant.create({
    data: {
      slug: 'ms-forge',
      name: 'MS-Forge Engineering Global'
    }
  });
  console.log('Created Workspace Tenant:', tenant.name);

  // 2. Create Users list (10 diverse, realistic names including Indians)
  const passwordHash = await bcrypt.hash('Mridul123!', 10);
  
  const usersToSeed = [
    { name: 'Mridul Sharma', email: 'admin@msforge.com', role: 'Admin' },
    { name: 'Priyanshu Patel', email: 'priyanshu@msforge.com', role: 'Admin' },
    { name: 'Ananya Iyer', email: 'ananya@msforge.com', role: 'Member' },
    { name: 'Rohan Gupta', email: 'rohan@msforge.com', role: 'Member' },
    { name: 'Amit Verma', email: 'amit@msforge.com', role: 'Member' },
    { name: 'Sneha Reddy', email: 'sneha@msforge.com', role: 'Member' },
    { name: 'Pooja Sharma', email: 'pooja@msforge.com', role: 'Member' },
    { name: 'Devendra Singh', email: 'devendra@msforge.com', role: 'Member' },
    { name: 'Karan Malhotra', email: 'karan@msforge.com', role: 'Member' },
    { name: 'Shreya Sen', email: 'shreya@msforge.com', role: 'Member' }
  ];

  const seededUsers = [];
  for (const u of usersToSeed) {
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash
      }
    });
    seededUsers.push(user);
    console.log(`Created user: ${user.name} (${user.role})`);
  }

  // 3. Create 25 highly realistic task records
  const tasksToSeed = [
    {
      title: 'Optimize landing page image load speed',
      description: 'Compress Unsplash assets and implement next/image components to reduce LCP from 3.2s to under 1.5s.',
      status: 'InProgress',
      priority: 'High',
      daysOffset: 3,
      assigneeEmail: 'admin@msforge.com'
    },
    {
      title: 'Fix SQLite prisma deadlock error in local run',
      description: 'SQLite does not support concurrent write operations well. Adjust database query retry limits and lock wait times.',
      status: 'Done',
      priority: 'High',
      daysOffset: -1,
      assigneeEmail: 'priyanshu@msforge.com'
    },
    {
      title: 'Validate JWT Auth refresh token cookie rotation',
      description: 'Ensure the client correctly rotates refresh tokens and updates HTTP-only cookie headers without forcing login page redirection.',
      status: 'Done',
      priority: 'High',
      daysOffset: -3,
      assigneeEmail: 'ananya@msforge.com'
    },
    {
      title: 'Setup Socket.io client reconnection buffers',
      description: 'Configure standard retry timeouts on browser connection failures to prevent duplicate room join requests.',
      status: 'Todo',
      priority: 'Medium',
      daysOffset: 5,
      assigneeEmail: 'rohan@msforge.com'
    },
    {
      title: 'Setup Stripe webhooks callback router',
      description: 'Configure validation parser for incoming Stripe checkout events to activate tenant workspace subscriptions in real time.',
      status: 'InProgress',
      priority: 'High',
      daysOffset: 2,
      assigneeEmail: 'admin@msforge.com'
    },
    {
      title: 'Dark mode styling verification on Safari',
      description: 'Debug Tailwind class variant styling issues. Some borders do not swap color correctly on mobile iOS browsers.',
      status: 'Todo',
      priority: 'Low',
      daysOffset: 10,
      assigneeEmail: 'amit@msforge.com'
    },
    {
      title: 'Audit log pagination performance profiling',
      description: 'Optimize activityLog table database index on tenantId and createdAt fields to ensure fast queries on large logs lists.',
      status: 'Done',
      priority: 'Medium',
      daysOffset: -5,
      assigneeEmail: 'sneha@msforge.com'
    },
    {
      title: 'Mock Cloudinary storage upload limit validations',
      description: 'Implement frontend file size validations. Show alert warnings if uploaded file exceeds 10MB limit.',
      status: 'Todo',
      priority: 'Low',
      daysOffset: 7,
      assigneeEmail: 'pooja@msforge.com'
    },
    {
      title: 'Configure Node-Cron daily summary mailing schedule',
      description: 'Check Nodemailer credentials and confirm that activity logs are summarized and formatted correctly in HTML email template.',
      status: 'InProgress',
      priority: 'Medium',
      daysOffset: 4,
      assigneeEmail: 'devendra@msforge.com'
    },
    {
      title: 'Design pricing cards container layout',
      description: 'Create responsive pricing containers comparing Starter, Pro, and Enterprise features side-by-side.',
      status: 'Done',
      priority: 'Medium',
      daysOffset: -2,
      assigneeEmail: 'karan@msforge.com'
    },
    {
      title: 'SSO SAML configuration documentation update',
      description: 'Write developer docs detailing SSO setup steps, redirect parameters, and tenant certificate loading scripts.',
      status: 'Todo',
      priority: 'Low',
      daysOffset: 12,
      assigneeEmail: 'shreya@msforge.com'
    },
    {
      title: 'Sanitize HTML text inputs on tasks create form',
      description: 'Apply DOMPurify or custom regex filter checks to sanitize incoming description string inputs, preventing XSS injection.',
      status: 'InProgress',
      priority: 'High',
      daysOffset: 1,
      assigneeEmail: 'priyanshu@msforge.com'
    },
    {
      title: 'Implement global HTTP security headers via Helmet',
      description: 'Set Content Security Policy (CSP), Frame Options, and X-XSS-Protection parameters in Express server config.',
      status: 'Done',
      priority: 'High',
      daysOffset: -4,
      assigneeEmail: 'ananya@msforge.com'
    },
    {
      title: 'API rate limiter test assertions',
      description: 'Write test scripts simulating 200 concurrent requests in 10 seconds to verify that rate limiting returns 429 status code.',
      status: 'Todo',
      priority: 'Medium',
      daysOffset: 6,
      assigneeEmail: 'rohan@msforge.com'
    },
    {
      title: 'Workspace dashboard mobile layout side navigation',
      description: 'Design drawer layout that slides from the left, housing user profile and workspace configurations on mobile views.',
      status: 'InProgress',
      priority: 'Medium',
      daysOffset: 3,
      assigneeEmail: 'amit@msforge.com'
    },
    {
      title: 'Refactor user signup database transactions',
      description: 'Optimize Prisma transaction query flow to ensure that tenant allocation never locks database threads on high traffic signup waves.',
      status: 'Done',
      priority: 'High',
      daysOffset: -3,
      assigneeEmail: 'sneha@msforge.com'
    },
    {
      title: 'Clean up unused CSS files in frontend project',
      description: 'Purge old unused styles and templates from boilerplate folders to keep production JS bundle under 150KB.',
      status: 'Todo',
      priority: 'Low',
      daysOffset: 8,
      assigneeEmail: 'pooja@msforge.com'
    },
    {
      title: 'Configure Nodemailer SMTP auth configurations',
      description: 'Read environment variables for email password, support email, and SMTP server port setup from .env file.',
      status: 'InProgress',
      priority: 'Medium',
      daysOffset: 2,
      assigneeEmail: 'devendra@msforge.com'
    },
    {
      title: 'Workspace analytics cards styling updates',
      description: 'Add hover borders and subtle drop shadows matching Cal.com styles to metrics cards.',
      status: 'Done',
      priority: 'Low',
      daysOffset: -1,
      assigneeEmail: 'karan@msforge.com'
    },
    {
      title: 'Verify dashboard websocket sync in multiple browser tabs',
      description: 'Open two incognito tabs and verify that task updates and status drag movements reflect on the secondary tab instantly.',
      status: 'InProgress',
      priority: 'High',
      daysOffset: 2,
      assigneeEmail: 'shreya@msforge.com'
    },
    {
      title: 'Integrate custom font family Geist in CSS styles',
      description: 'Import Google Geist and Inter web fonts in globals config to replace generic browser fallback typography.',
      status: 'Done',
      priority: 'Medium',
      daysOffset: -6,
      assigneeEmail: 'admin@msforge.com'
    },
    {
      title: 'Write Jest unit test cases for auth routes',
      description: 'Construct mock assertions for /api/v1/auth/signup, /login, and /refresh with valid/invalid headers.',
      status: 'Todo',
      priority: 'Medium',
      daysOffset: 9,
      assigneeEmail: 'priyanshu@msforge.com'
    },
    {
      title: 'Setup PostgreSQL docker container for deployment testing',
      description: 'Create docker-compose files matching Prisma provider configuration to test deployment locally under postgres database.',
      status: 'Todo',
      priority: 'High',
      daysOffset: 8,
      assigneeEmail: 'ananya@msforge.com'
    },
    {
      title: 'Configure server log rotation schedules',
      description: 'Write Winston logger config that rotates debug logs daily and limits log file directory to 50MB.',
      status: 'Done',
      priority: 'Low',
      daysOffset: -8,
      assigneeEmail: 'rohan@msforge.com'
    },
    {
      title: 'Mock checkout success feedback overlay banner',
      description: 'Build modal feedback alert displaying success checks after the user finishes mock Stripe payment simulator.',
      status: 'InProgress',
      priority: 'Medium',
      daysOffset: 4,
      assigneeEmail: 'amit@msforge.com'
    }
  ];

  for (const t of tasksToSeed) {
    const assignee = seededUsers.find(u => u.email === t.assigneeEmail) || null;
    
    await prisma.task.create({
      data: {
        tenantId: tenant.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: new Date(Date.now() + t.daysOffset * 24 * 60 * 60 * 1000),
        assigneeId: assignee ? assignee.id : null,
        attachments: JSON.stringify([])
      }
    });
  }
  console.log('Successfully seeded 25 tasks with realistic assignments!');

  // 4. Create Audit Logs
  const firstAdmin = seededUsers[0];
  const secondAdmin = seededUsers[1];

  const logsToSeed = [
    { user: firstAdmin, action: 'Workspace Created', details: 'Initialized tenant workspace "MS-Forge Engineering Global"' },
    { user: firstAdmin, action: 'Team Provisioned', details: 'Invited 9 engineers to the newly established workspace environment' },
    { user: secondAdmin, action: 'Database Configured', details: 'Finished Prisma migration and loaded task trackers' },
    { user: firstAdmin, action: 'Security Hardening', details: 'Activated Helmet headers and configured Express rate limit constraints' }
  ];

  for (const l of logsToSeed) {
    await prisma.activityLog.create({
      data: {
        tenantId: tenant.id,
        userId: l.user.id,
        action: l.action,
        details: l.details
      }
    });
  }
  console.log('Successfully seeded workspace security audit logs!');

  console.log('Database seeding process completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
