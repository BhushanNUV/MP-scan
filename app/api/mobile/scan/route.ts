import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Optional: Get API token from header if provided
    const authHeader = request.headers.get('Authorization');
    let user = null;
    
    // If token is provided, try to get the user
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const apiToken = authHeader.substring(7);
      user = await prisma.user.findUnique({
        where: { apiToken },
        include: {
          patients: {
            take: 1,
          },
        },
      });
    }
    
    // If no token or user not found, create or use a default public user
    if (!user) {
      // Try to find or create a public/anonymous user for storing data
      user = await prisma.user.findFirst({
        where: { email: 'public@device.local' },
        include: {
          patients: {
            take: 1,
          },
        },
      });
      
      if (!user) {
        // Create a public user for anonymous device submissions
        user = await prisma.user.create({
          data: {
            email: 'public@device.local',
            password: 'not-used', // This account won't be used for login
            name: 'Public Device User',
            role: 'device',
          },
          include: {
            patients: {
              take: 1,
            },
          },
        });
      }
    }

    // Extract all fields from request
    const {
      // User info
      name,
      phoneNumber,
      age,
      height,
      weight,
      gender,
      
      // Basic Vitals
      heart_rate,
      prq,
      oxygen_saturation,
      blood_pressure,
      breathing_rate,
      
      // Confidence Levels
      heart_rate_conf_level,
      breathing_rate_conf_level,
      prq_conf_level,
      hrv_sdnn_conf_level,
      
      // Stress & Recovery
      stress_level,
      recovery_ability,
      stress_response,
      respiration,
      
      // HRV Metrics
      hrv_sdnn,
      pns_index,
      sns_index,
      sd2,
      sd1,
      rmssd,
      mean_rri,
      lf_hf,
      
      // Risk Assessments
      diabetic_risk,
      hypertension_risk,
      high_fasting_glucose_risk,
      high_total_cholesterol_risk,
      low_hemoglobin_risk,
      ascvd_risk,
      heart_age,
      
      // Blood Metrics
      hemoglobin,
      hba1c,
      
      // Legacy fields (for backward compatibility)
      heartRate,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      oxygenSaturation,
      temperature,
      bloodGlucose,
      respiratoryRate,
      
      // Scan data
      scanConfidence,
      scanImage,
      notes,
    } = data;

    // Update user profile with provided data
    if (age || height || weight || gender) {
      const birthYear = age ? new Date().getFullYear() - age : null;
      
      await prisma.userProfile.upsert({
        where: { userId: user.id },
        update: {
          height: height || undefined,
          weight: weight || undefined,
          gender: gender || undefined,
          dateOfBirth: birthYear ? new Date(`${birthYear}-01-01`) : undefined,
        },
        create: {
          userId: user.id,
          height,
          weight,
          gender,
          dateOfBirth: birthYear ? new Date(`${birthYear}-01-01`) : new Date(),
        },
      });
    }

    // Get or create patient
    let patientId = user.patients[0]?.id;
    
    if (!patientId) {
      const newPatient = await prisma.patient.create({
        data: {
          userId: user.id,
          firstName: user.name?.split(' ')[0] || 'User',
          lastName: user.name?.split(' ')[1] || '',
          dateOfBirth: new Date(),
          gender: gender || 'Not specified',
          height,
          weight,
        },
      });
      patientId = newPatient.id;
    } else if (height || weight) {
      // Update patient data
      await prisma.patient.update({
        where: { id: patientId },
        data: {
          height: height || undefined,
          weight: weight || undefined,
          gender: gender || undefined,
        },
      });
    }

    // Create face scan record if scan data provided
    let faceScanId = null;
    if (scanConfidence || scanImage) {
      const faceScan = await prisma.faceScan.create({
        data: {
          userId: user.id,
          confidence: scanConfidence,
          imageUrl: scanImage,
          scanData: data,
          deviceId: 'mobile',
        },
      });
      faceScanId = faceScan.id;
    }

    // Calculate BMI if height and weight provided
    const bmi = height && weight ? weight / Math.pow(height / 100, 2) : null;

    // Parse blood pressure if provided as string (e.g., "120/80")
    let systolic = bloodPressureSystolic;
    let diastolic = bloodPressureDiastolic;
    
    if (blood_pressure && blood_pressure.includes('/')) {
      const [sys, dia] = blood_pressure.split('/');
      systolic = systolic || parseInt(sys);
      diastolic = diastolic || parseInt(dia);
    }

    // Create vitals record with all new fields
    const vital = await prisma.vitals.create({
      data: {
        patientId,
        userId: user.id,
        source: 'device',
        faceScanId,
        
        // User Info
        name: name || null,
        phoneNumber: phoneNumber || null,
        
        // Basic Vitals (use new fields or fallback to legacy)
        heartRate: heart_rate ? parseInt(heart_rate.toString()) : (heartRate ? parseInt(heartRate) : null),
        prq: prq ? parseFloat(prq.toString()) : null,
        oxygenSaturation: oxygen_saturation ? parseInt(oxygen_saturation.toString()) : (oxygenSaturation ? parseInt(oxygenSaturation) : null),
        bloodPressure: blood_pressure || (systolic && diastolic ? `${systolic}/${diastolic}` : null),
        bloodPressureSystolic: systolic ? parseInt(systolic.toString()) : null,
        bloodPressureDiastolic: diastolic ? parseInt(diastolic.toString()) : null,
        breathingRate: breathing_rate ? parseFloat(breathing_rate.toString()) : null,
        respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : null,
        temperature: temperature ? parseFloat(temperature) : null,
        
        // Confidence Levels
        heartRateConfLevel: heart_rate_conf_level ? parseInt(heart_rate_conf_level.toString()) : null,
        breathingRateConfLevel: breathing_rate_conf_level ? parseInt(breathing_rate_conf_level.toString()) : null,
        prqConfLevel: prq_conf_level ? parseInt(prq_conf_level.toString()) : null,
        hrvSdnnConfLevel: hrv_sdnn_conf_level ? parseInt(hrv_sdnn_conf_level.toString()) : null,
        
        // Stress & Recovery
        stressLevel: stress_level ? parseFloat(stress_level.toString()) : null,
        recoveryAbility: recovery_ability || null,
        stressResponse: stress_response || null,
        respiration: respiration ? parseFloat(respiration.toString()) : null,
        
        // HRV Metrics
        hrvSdnn: hrv_sdnn ? parseFloat(hrv_sdnn.toString()) : null,
        pnsIndex: pns_index ? parseFloat(pns_index.toString()) : null,
        snsIndex: sns_index ? parseFloat(sns_index.toString()) : null,
        sd2: sd2 ? parseFloat(sd2.toString()) : null,
        sd1: sd1 ? parseFloat(sd1.toString()) : null,
        rmssd: rmssd ? parseFloat(rmssd.toString()) : null,
        meanRri: mean_rri ? parseFloat(mean_rri.toString()) : null,
        lfHf: lf_hf ? parseFloat(lf_hf.toString()) : null,
        
        // Risk Assessments
        diabeticRisk: diabetic_risk || null,
        hypertensionRisk: hypertension_risk || null,
        highFastingGlucoseRisk: high_fasting_glucose_risk || null,
        highTotalCholesterolRisk: high_total_cholesterol_risk || null,
        lowHemoglobinRisk: low_hemoglobin_risk || null,
        ascvdRisk: ascvd_risk || null,
        heartAge: heart_age || null,
        
        // Blood Metrics
        hemoglobin: hemoglobin ? parseFloat(hemoglobin.toString()) : null,
        hba1c: hba1c ? parseFloat(hba1c.toString()) : null,
        bloodGlucose: bloodGlucose ? parseFloat(bloodGlucose) : null,
        
        // Other
        bmi: bmi ? parseFloat(bmi.toFixed(2)) : null,
        notes,
      },
    });

    // Prepare response with all vital data
    return NextResponse.json({
      success: true,
      message: 'Scan data saved successfully',
      data: {
        scanId: vital.id,
        patientId,
        timestamp: vital.recordedAt,
        faceScanId,
        name: vital.name,
        phoneNumber: vital.phoneNumber,
        vitals: {
          // Basic vitals
          heartRate: vital.heartRate,
          prq: vital.prq,
          oxygenSaturation: vital.oxygenSaturation,
          bloodPressure: vital.bloodPressure,
          breathingRate: vital.breathingRate,
          temperature: vital.temperature,
          
          // Confidence levels
          heartRateConfLevel: vital.heartRateConfLevel,
          breathingRateConfLevel: vital.breathingRateConfLevel,
          prqConfLevel: vital.prqConfLevel,
          hrvSdnnConfLevel: vital.hrvSdnnConfLevel,
          
          // Stress & Recovery
          stressLevel: vital.stressLevel,
          recoveryAbility: vital.recoveryAbility,
          stressResponse: vital.stressResponse,
          
          // HRV Metrics
          hrvSdnn: vital.hrvSdnn,
          pnsIndex: vital.pnsIndex,
          snsIndex: vital.snsIndex,
          sd2: vital.sd2,
          sd1: vital.sd1,
          rmssd: vital.rmssd,
          meanRri: vital.meanRri,
          lfHf: vital.lfHf,
          
          // Risk Assessments
          diabeticRisk: vital.diabeticRisk,
          hypertensionRisk: vital.hypertensionRisk,
          highFastingGlucoseRisk: vital.highFastingGlucoseRisk,
          highTotalCholesterolRisk: vital.highTotalCholesterolRisk,
          lowHemoglobinRisk: vital.lowHemoglobinRisk,
          ascvdRisk: vital.ascvdRisk,
          heartAge: vital.heartAge,
          
          // Blood Metrics
          hemoglobin: vital.hemoglobin,
          hba1c: vital.hba1c,
          bloodGlucose: vital.bloodGlucose,
          
          // Other
          bmi: vital.bmi,
        },
      },
    });
  } catch (error) {
    console.error('Scan submission error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to save scan data' 
      },
      { status: 500 }
    );
  }
}