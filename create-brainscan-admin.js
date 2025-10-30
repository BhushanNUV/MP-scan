const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Generate CUID-like ID
function generateId() {
  return 'c' + crypto.randomBytes(12).toString('base64').replace(/[^a-z0-9]/gi, '').substring(0, 24);
}

async function createBrainScanAdmin() {
  try {
    console.log('Creating BrainScan admin user...\n');

    // Create admin user for BrainScan
    const adminPassword = await bcrypt.hash('brainscan123', 10);
    const brainScanAdmin = await prisma.user.upsert({
      where: { email: 'brainscan@admin.com' },
      update: {},
      create: {
        id: generateId(),
        email: 'brainscan@admin.com',
        name: 'BrainScan Admin',
        password: adminPassword,
        role: 'admin',
        emailVerified: new Date(),
        updatedAt: new Date(),
        profile: {
          create: {
            id: generateId(),
            firstName: 'BrainScan',
            lastName: 'Administrator',
            dateOfBirth: new Date('1980-01-01'),
            gender: 'Not specified',
            updatedAt: new Date(),
          },
        },
        settings: {
          create: {
            id: generateId(),
            updatedAt: new Date(),
          },
        },
      },
    });

    console.log('✓ BrainScan Admin user created successfully!');
    console.log('\n=== Login Credentials ===');
    console.log('Email: brainscan@admin.com');
    console.log('Password: brainscan123');
    console.log('Role: admin');
    console.log('\nThis admin will only see BrainScan data on the dashboard and reports.');

  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createBrainScanAdmin();
