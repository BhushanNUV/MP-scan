import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'admin',
      emailVerified: new Date(),
      UserProfile: {
        create: {
          id: crypto.randomUUID(),
          firstName: 'Admin',
          lastName: 'User',
          dateOfBirth: new Date('1980-01-01'),
          gender: 'Not specified',
          updatedAt: new Date(),
        },
      },
      UserSettings: {
        create: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
        },
      },
    },
  });
  console.log('✅ Admin user created:', adminUser.email);

  // Create device user for Android
  const devicePassword = await bcrypt.hash('device123', 10);
  const deviceUser = await prisma.user.upsert({
    where: { email: 'device@example.com' },
    update: {},
    create: {
      email: 'device@example.com',
      name: 'Test Device User',
      password: devicePassword,
      role: 'device',
      emailVerified: new Date(),
      UserProfile: {
        create: {
          id: crypto.randomUUID(),
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: new Date('1990-05-15'),
          gender: 'male',
          height: 175, // cm
          weight: 70, // kg
          bloodType: 'O+',
          phoneNumber: '+1234567890',
          address: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          postalCode: '12345',
          updatedAt: new Date(),
        },
      },
      UserSettings: {
        create: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
        },
      },
      Patient: {
        create: {
          id: crypto.randomUUID(),
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: new Date('1990-05-15'),
          gender: 'male',
          height: 175,
          weight: 70,
          bloodType: 'O+',
          phoneNumber: '+1234567890',
          address: '123 Test Street',
          updatedAt: new Date(),
        },
      },
    },
  });
  console.log('✅ Device user created:', deviceUser.email);

  // Create a regular user
  const userPassword = await bcrypt.hash('user123', 10);
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Regular User',
      password: userPassword,
      role: 'user',
      emailVerified: new Date(),
      UserProfile: {
        create: {
          id: crypto.randomUUID(),
          firstName: 'Jane',
          lastName: 'Smith',
          dateOfBirth: new Date('1985-03-20'),
          gender: 'female',
          height: 165,
          weight: 60,
          bloodType: 'A+',
          updatedAt: new Date(),
        },
      },
      UserSettings: {
        create: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
        },
      },
      Patient: {
        create: {
          id: crypto.randomUUID(),
          firstName: 'Jane',
          lastName: 'Smith',
          dateOfBirth: new Date('1985-03-20'),
          gender: 'female',
          height: 165,
          weight: 60,
          bloodType: 'A+',
          updatedAt: new Date(),
        },
      },
    },
  });
  console.log('✅ Regular user created:', regularUser.email);

  // Add sample vitals for device user's patient
  const devicePatient = await prisma.patient.findFirst({
    where: { userId: deviceUser.id },
  });

  if (devicePatient) {
    const vitalsData = [
      {
        patientId: devicePatient.id,
        userId: deviceUser.id,
        recordedBy: 'seed-script',
        source: 'device',
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        heartRate: 72,
        respiratoryRate: 16,
        temperature: 36.6,
        oxygenSaturation: 98,
        bloodGlucose: 95,
        bmi: 22.9,
        recordedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      },
      {
        patientId: devicePatient.id,
        userId: deviceUser.id,
        recordedBy: 'seed-script',
        source: 'device',
        bloodPressureSystolic: 118,
        bloodPressureDiastolic: 78,
        heartRate: 70,
        respiratoryRate: 15,
        temperature: 36.5,
        oxygenSaturation: 99,
        bloodGlucose: 92,
        bmi: 22.9,
        recordedAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
      },
      {
        patientId: devicePatient.id,
        userId: deviceUser.id,
        recordedBy: 'seed-script',
        source: 'device',
        bloodPressureSystolic: 122,
        bloodPressureDiastolic: 82,
        heartRate: 75,
        respiratoryRate: 17,
        temperature: 36.7,
        oxygenSaturation: 97,
        bloodGlucose: 98,
        bmi: 22.9,
        recordedAt: new Date(), // now
      },
    ];

    for (const vital of vitalsData) {
      await prisma.vitals.create({ data: { id: crypto.randomUUID(), ...vital } });
    }
    console.log('✅ Sample vitals created for device user');
  }

  // Create BriahScan Admin user
  const briahScanAdminPassword = await bcrypt.hash('briahscan123', 10);
  const briahScanAdmin = await prisma.user.upsert({
    where: { email: 'briahscan@admin.com' },
    update: {},
    create: {
      email: 'briahscan@admin.com',
      name: 'BriahScan Admin',
      password: briahScanAdminPassword,
      role: 'admin',
      emailVerified: new Date(),
      UserProfile: {
        create: {
          id: crypto.randomUUID(),
          firstName: 'BriahScan',
          lastName: 'Administrator',
          dateOfBirth: new Date('1980-01-01'),
          gender: 'Admin',
          updatedAt: new Date(),
        },
      },
      UserSettings: {
        create: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
        },
      },
    },
  });
  console.log('✅ BriahScan Admin user created:', briahScanAdmin.email);

  console.log('\n🎉 Database seed completed successfully!');
  console.log('\n📱 Android Device Login Credentials:');
  console.log('   Email: device@example.com');
  console.log('   Password: device123');
  console.log('\n👤 Admin Panel Login:');
  console.log('   Email: admin@example.com');
  console.log('   Password: admin123');
  console.log('\n👥 Regular User Login:');
  console.log('   Email: user@example.com');
  console.log('   Password: user123');
  console.log('\n🧠 BriahScan Admin Login:');
  console.log('   Email: briahscan@admin.com');
  console.log('   Password: briahscan123');
  console.log('   (Views BriahScan data only)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });