import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedVitals() {
  try {
    console.log('🌱 Starting to seed vitals with complete data...');

    // Find the first user to associate the vital with
    const user = await prisma.user.findFirst();
    if (!user) {
      console.error('No users found. Please run the main seed first.');
      return;
    }

    // Find or create a patient
    let patient = await prisma.patient.findFirst({
      where: { userId: user.id }
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          userId: user.id,
          firstName: 'John',
          lastName: 'Smith',
          dateOfBirth: new Date('1985-05-15'),
          gender: 'Male',
          phoneNumber: '+1234567890',
          address: '123 Health Street, Medical City, MC 12345',
          bloodType: 'O+',
          height: 175,
          weight: 75,
          emergencyContact: 'Jane Smith - +0987654321',
        }
      });
    }

    // Create a comprehensive vital record with ALL fields filled
    const completeVital = await prisma.vitals.create({
      data: {
        patientId: patient.id,
        userId: user.id,
        recordedBy: 'Dr. Medical Professional',
        recordedAt: new Date(),
        source: 'device',
        faceScanId: 'SCAN-' + Date.now(),
        
        // Basic Vitals
        heartRate: 72,
        prq: 0.85,
        oxygenSaturation: 98,
        bloodPressure: '120/80',
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        breathingRate: 16.5,
        respiratoryRate: 16,
        temperature: 36.6,
        
        // Confidence Levels (0-3 scale)
        heartRateConfLevel: 3,
        prqConfLevel: 3,
        breathingRateConfLevel: 2,
        hrvSdnnConfLevel: 3,
        
        // Stress & Recovery Metrics
        stressLevel: 0.35,
        recoveryAbility: 'Good',
        stressResponse: 'Normal',
        respiration: 16.2,
        
        // HRV Metrics
        hrvSdnn: 42.5,
        pnsIndex: 0.65,
        snsIndex: 0.35,
        sd2: 45.3,
        sd1: 21.8,
        rmssd: 38.2,
        meanRri: 833.5,
        lfHf: 1.2,
        
        // Risk Assessments
        diabeticRisk: 'Low',
        hypertensionRisk: 'Medium',
        highFastingGlucoseRisk: 'Low',
        highTotalCholesterolRisk: 'Medium',
        lowHemoglobinRisk: 'Low',
        ascvdRisk: '5%',
        heartAge: '38',
        
        // Blood Metrics
        hemoglobin: 14.5,
        hba1c: 5.4,
        bloodGlucose: 95.0,
        
        // Cholesterol
        cholesterolTotal: 185.0,
        cholesterolLDL: 110.0,
        cholesterolHDL: 55.0,
        triglycerides: 100.0,
        
        // Additional Metrics
        bmi: 24.5,
        painLevel: 0,
        
        // Activity & Sleep
        stepsCount: 8500,
        caloriesBurned: 2200.5,
        sleepHours: 7.5,
        sleepQuality: 'Good',
        
        // Notes
        notes: 'Complete health check performed. All vitals within normal range. Patient shows good overall health. HRV metrics indicate balanced autonomic nervous system. Cholesterol levels are within acceptable range. No cardiovascular risk factors identified.',
        symptoms: 'No symptoms reported. Patient feels healthy and energetic. Good sleep quality and regular physical activity.',
      }
    });

    console.log('✅ Complete vital record created successfully!');
    console.log('📊 Vital ID:', completeVital.id);
    console.log('👤 Patient:', patient.firstName, patient.lastName);
    console.log('📅 Recorded at:', completeVital.recordedAt);
    console.log('\n📈 Key Metrics:');
    console.log('   - Heart Rate:', completeVital.heartRate, 'bpm');
    console.log('   - Blood Pressure:', completeVital.bloodPressure);
    console.log('   - Oxygen Saturation:', completeVital.oxygenSaturation, '%');
    console.log('   - BMI:', completeVital.bmi);
    console.log('   - HRV SDNN:', completeVital.hrvSdnn, 'ms');
    console.log('   - Stress Level:', (completeVital.stressLevel! * 100).toFixed(0), '%');
    console.log('   - Cholesterol Total:', completeVital.cholesterolTotal, 'mg/dL');
    console.log('\n🎉 All ' + Object.keys(completeVital).filter(k => completeVital[k as keyof typeof completeVital] !== null).length + ' fields have been populated with sample data!');

  } catch (error) {
    console.error('❌ Error seeding vitals:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedVitals();