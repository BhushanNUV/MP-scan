'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Activity,
  Heart,
  Thermometer,
  Wind,
  Droplets,
  Scale,
  Save,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  Info
} from 'lucide-react';
import { useVitals } from '@/hooks/useVitals';
import { toast } from 'sonner';

const steps = [
  { id: 1, name: 'Basic Vitals', icon: Heart },
  { id: 2, name: 'Additional Metrics', icon: Activity },
  { id: 3, name: 'Notes & Review', icon: Check },
];

const normalRanges = {
  bloodPressureSystolic: { min: 90, max: 120, unit: 'mmHg' },
  bloodPressureDiastolic: { min: 60, max: 80, unit: 'mmHg' },
  heartRate: { min: 60, max: 100, unit: 'bpm' },
  temperature: { min: 36.5, max: 37.5, unit: '°C' },
  oxygenSaturation: { min: 95, max: 100, unit: '%' },
  respiratoryRate: { min: 12, max: 20, unit: 'breaths/min' },
  bloodGlucose: { min: 70, max: 100, unit: 'mg/dL' },
};

export default function ScanPage() {
  const router = useRouter();
  const { saveVitals, isLoading } = useVitals();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<any>({});

  const updateFormData = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: null }));
    }
  };

  const getFieldStatus = (field: string, value: number) => {
    const range = normalRanges[field as keyof typeof normalRanges];
    if (!range || !value) return null;
    
    if (value < range.min) return 'low';
    if (value > range.max) return 'high';
    return 'normal';
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return '';
    if (status === 'low') return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20';
    if (status === 'high') return 'text-red-600 bg-red-50 dark:bg-red-950/20';
    return 'text-green-600 bg-green-50 dark:bg-green-950/20';
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return '';
    if (status === 'low') return 'Below Normal';
    if (status === 'high') return 'Above Normal';
    return 'Normal';
  };

  const validateStep = () => {
    const newErrors: any = {};
    
    if (currentStep === 1) {
      // At least one vital sign should be entered
      const hasVitals = formData.bloodPressureSystolic || 
                       formData.heartRate || 
                       formData.temperature || 
                       formData.oxygenSaturation;
      
      if (!hasVitals) {
        newErrors.general = 'Please enter at least one vital sign';
      }
      
      // If BP systolic is entered, diastolic should also be entered
      if (formData.bloodPressureSystolic && !formData.bloodPressureDiastolic) {
        newErrors.bloodPressureDiastolic = 'Please enter diastolic pressure';
      }
      if (formData.bloodPressureDiastolic && !formData.bloodPressureSystolic) {
        newErrors.bloodPressureSystolic = 'Please enter systolic pressure';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSave = async (submitNow = true) => {
    if (!submitNow) {
      // Save to local storage for later
      localStorage.setItem('vitals_draft', JSON.stringify(formData));
      toast.success('Draft saved! You can continue later.');
      return;
    }

    try {
      // Convert string values to numbers
      const dataToSave = Object.keys(formData).reduce((acc: any, key) => {
        const value = formData[key];
        if (typeof value === 'string' && !isNaN(Number(value))) {
          acc[key] = Number(value);
        } else {
          acc[key] = value;
        }
        return acc;
      }, {});

      await saveVitals(dataToSave);
      toast.success('Vitals saved successfully!');
      localStorage.removeItem('vitals_draft');
      router.push('/dashboard/vitals');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save vitals');
    }
  };

  const progressPercentage = (currentStep / steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Record Health Vitals</h1>
        <p className="text-muted-foreground mt-1">Enter your current vital signs and health metrics</p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors
                      ${isActive ? 'border-primary bg-primary text-primary-foreground' : ''}
                      ${isCompleted ? 'border-green-600 bg-green-600 text-white' : ''}
                      ${!isActive && !isCompleted ? 'border-muted-foreground/30 bg-background' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`mt-2 text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step.name}
                  </span>
                </div>
                {step.id < steps.length && (
                  <div className={`mx-4 h-0.5 w-20 ${step.id < currentStep ? 'bg-green-600' : 'bg-muted-foreground/30'}`} />
                )}
              </div>
            );
          })}
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Form Steps */}
      <Card className="p-6">
        {errors.general && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 p-3 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{errors.general}</span>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-600" />
              Basic Vital Signs
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Blood Pressure */}
              <div className="space-y-4 md:col-span-2">
                <Label>Blood Pressure</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="120"
                        value={formData.bloodPressureSystolic || ''}
                        onChange={(e) => updateFormData('bloodPressureSystolic', e.target.value)}
                        className={errors.bloodPressureSystolic ? 'border-red-500' : ''}
                      />
                      <span className="flex items-center px-3 text-sm text-muted-foreground">Systolic</span>
                    </div>
                    {errors.bloodPressureSystolic && (
                      <p className="text-xs text-red-600 mt-1">{errors.bloodPressureSystolic}</p>
                    )}
                  </div>
                  <div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="80"
                        value={formData.bloodPressureDiastolic || ''}
                        onChange={(e) => updateFormData('bloodPressureDiastolic', e.target.value)}
                        className={errors.bloodPressureDiastolic ? 'border-red-500' : ''}
                      />
                      <span className="flex items-center px-3 text-sm text-muted-foreground">Diastolic</span>
                    </div>
                    {errors.bloodPressureDiastolic && (
                      <p className="text-xs text-red-600 mt-1">{errors.bloodPressureDiastolic}</p>
                    )}
                  </div>
                </div>
                {formData.bloodPressureSystolic && (
                  <div className={`flex items-center gap-2 rounded-lg p-2 text-sm ${getStatusColor(getFieldStatus('bloodPressureSystolic', Number(formData.bloodPressureSystolic)))}`}>
                    <Info className="h-4 w-4" />
                    <span>{getStatusLabel(getFieldStatus('bloodPressureSystolic', Number(formData.bloodPressureSystolic)))}</span>
                    <span className="ml-auto text-xs">Normal: 90-120 mmHg</span>
                  </div>
                )}
              </div>

              {/* Heart Rate */}
              <div className="space-y-2">
                <Label htmlFor="heartRate">Heart Rate</Label>
                <div className="flex gap-2">
                  <Input
                    id="heartRate"
                    type="number"
                    placeholder="72"
                    value={formData.heartRate || ''}
                    onChange={(e) => updateFormData('heartRate', e.target.value)}
                  />
                  <span className="flex items-center px-3 text-sm text-muted-foreground">bpm</span>
                </div>
                {formData.heartRate && (
                  <div className={`flex items-center gap-2 rounded-lg p-2 text-xs ${getStatusColor(getFieldStatus('heartRate', Number(formData.heartRate)))}`}>
                    <span>{getStatusLabel(getFieldStatus('heartRate', Number(formData.heartRate)))}</span>
                    <span className="ml-auto">Normal: 60-100 bpm</span>
                  </div>
                )}
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <Label htmlFor="temperature">Body Temperature</Label>
                <div className="flex gap-2">
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    placeholder="37.0"
                    value={formData.temperature || ''}
                    onChange={(e) => updateFormData('temperature', e.target.value)}
                  />
                  <span className="flex items-center px-3 text-sm text-muted-foreground">°C</span>
                </div>
                {formData.temperature && (
                  <div className={`flex items-center gap-2 rounded-lg p-2 text-xs ${getStatusColor(getFieldStatus('temperature', Number(formData.temperature)))}`}>
                    <span>{getStatusLabel(getFieldStatus('temperature', Number(formData.temperature)))}</span>
                    <span className="ml-auto">Normal: 36.5-37.5°C</span>
                  </div>
                )}
              </div>

              {/* Oxygen Saturation */}
              <div className="space-y-2">
                <Label htmlFor="oxygen">Oxygen Saturation</Label>
                <div className="flex gap-2">
                  <Input
                    id="oxygen"
                    type="number"
                    placeholder="98"
                    value={formData.oxygenSaturation || ''}
                    onChange={(e) => updateFormData('oxygenSaturation', e.target.value)}
                  />
                  <span className="flex items-center px-3 text-sm text-muted-foreground">%</span>
                </div>
                {formData.oxygenSaturation && (
                  <div className={`flex items-center gap-2 rounded-lg p-2 text-xs ${getStatusColor(getFieldStatus('oxygenSaturation', Number(formData.oxygenSaturation)))}`}>
                    <span>{getStatusLabel(getFieldStatus('oxygenSaturation', Number(formData.oxygenSaturation)))}</span>
                    <span className="ml-auto">Normal: 95-100%</span>
                  </div>
                )}
              </div>

              {/* Respiratory Rate */}
              <div className="space-y-2">
                <Label htmlFor="respiratory">Respiratory Rate</Label>
                <div className="flex gap-2">
                  <Input
                    id="respiratory"
                    type="number"
                    placeholder="16"
                    value={formData.respiratoryRate || ''}
                    onChange={(e) => updateFormData('respiratoryRate', e.target.value)}
                  />
                  <span className="flex items-center px-3 text-sm text-muted-foreground">breaths/min</span>
                </div>
                {formData.respiratoryRate && (
                  <div className={`flex items-center gap-2 rounded-lg p-2 text-xs ${getStatusColor(getFieldStatus('respiratoryRate', Number(formData.respiratoryRate)))}`}>
                    <span>{getStatusLabel(getFieldStatus('respiratoryRate', Number(formData.respiratoryRate)))}</span>
                    <span className="ml-auto">Normal: 12-20/min</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Additional Measurements
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="glucose">Blood Glucose</Label>
                <div className="flex gap-2">
                  <Input
                    id="glucose"
                    type="number"
                    placeholder="95"
                    value={formData.bloodGlucose || ''}
                    onChange={(e) => updateFormData('bloodGlucose', e.target.value)}
                  />
                  <span className="flex items-center px-3 text-sm text-muted-foreground">mg/dL</span>
                </div>
                {formData.bloodGlucose && (
                  <div className={`flex items-center gap-2 rounded-lg p-2 text-xs ${getStatusColor(getFieldStatus('bloodGlucose', Number(formData.bloodGlucose)))}`}>
                    <span>{getStatusLabel(getFieldStatus('bloodGlucose', Number(formData.bloodGlucose)))}</span>
                    <span className="ml-auto">Normal: 70-100 mg/dL</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <div className="flex gap-2">
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="70"
                    value={formData.weight || ''}
                    onChange={(e) => updateFormData('weight', e.target.value)}
                  />
                  <span className="flex items-center px-3 text-sm text-muted-foreground">kg</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pain">Pain Level (0-10)</Label>
                <Input
                  id="pain"
                  type="number"
                  min="0"
                  max="10"
                  placeholder="0"
                  value={formData.painLevel || ''}
                  onChange={(e) => updateFormData('painLevel', e.target.value)}
                />
                {formData.painLevel && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {Number(formData.painLevel) === 0 && 'No pain'}
                    {Number(formData.painLevel) >= 1 && Number(formData.painLevel) <= 3 && 'Mild pain'}
                    {Number(formData.painLevel) >= 4 && Number(formData.painLevel) <= 6 && 'Moderate pain'}
                    {Number(formData.painLevel) >= 7 && Number(formData.painLevel) <= 10 && 'Severe pain'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sleep">Sleep Hours</Label>
                <div className="flex gap-2">
                  <Input
                    id="sleep"
                    type="number"
                    step="0.5"
                    placeholder="8"
                    value={formData.sleepHours || ''}
                    onChange={(e) => updateFormData('sleepHours', e.target.value)}
                  />
                  <span className="flex items-center px-3 text-sm text-muted-foreground">hours</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="steps">Steps Count</Label>
                <Input
                  id="steps"
                  type="number"
                  placeholder="10000"
                  value={formData.stepsCount || ''}
                  onChange={(e) => updateFormData('stepsCount', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="calories">Calories Burned</Label>
                <Input
                  id="calories"
                  type="number"
                  placeholder="2000"
                  value={formData.caloriesBurned || ''}
                  onChange={(e) => updateFormData('caloriesBurned', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Review & Notes</h2>
            
            {/* Summary of entered values */}
            <div className="rounded-lg bg-background/50 p-4 space-y-3">
              <h3 className="font-medium mb-3">Summary of Measurements</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {formData.bloodPressureSystolic && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Blood Pressure:</span>
                    <span className="font-medium">{formData.bloodPressureSystolic}/{formData.bloodPressureDiastolic} mmHg</span>
                  </div>
                )}
                {formData.heartRate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Heart Rate:</span>
                    <span className="font-medium">{formData.heartRate} bpm</span>
                  </div>
                )}
                {formData.temperature && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Temperature:</span>
                    <span className="font-medium">{formData.temperature}°C</span>
                  </div>
                )}
                {formData.oxygenSaturation && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Oxygen Saturation:</span>
                    <span className="font-medium">{formData.oxygenSaturation}%</span>
                  </div>
                )}
                {formData.bloodGlucose && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Blood Glucose:</span>
                    <span className="font-medium">{formData.bloodGlucose} mg/dL</span>
                  </div>
                )}
                {formData.weight && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weight:</span>
                    <span className="font-medium">{formData.weight} kg</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="symptoms">Symptoms (if any)</Label>
                <Textarea
                  id="symptoms"
                  placeholder="Describe any symptoms you're experiencing..."
                  rows={3}
                  value={formData.symptoms || ''}
                  onChange={(e) => updateFormData('symptoms', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information or context..."
                  rows={3}
                  value={formData.notes || ''}
                  onChange={(e) => updateFormData('notes', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSave(false)}
            >
              Save Draft
            </Button>
            
            {currentStep < steps.length ? (
              <Button
                type="button"
                onClick={handleNext}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={() => handleSave(true)}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Vitals'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}