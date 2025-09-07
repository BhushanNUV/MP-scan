export function calculateBMI(
  weight: number | null | undefined, 
  height: number | null | undefined,
  unitSystem: 'metric' | 'imperial' = 'metric'
): { value: number; category: string; color: string } | null {
  if (!weight || !height || weight <= 0 || height <= 0) {
    return null;
  }

  let bmi: number;

  if (unitSystem === 'metric') {
    const heightInMeters = height / 100;
    bmi = weight / (heightInMeters * heightInMeters);
  } else {
    bmi = (weight * 703) / (height * height);
  }

  bmi = Math.round(bmi * 10) / 10;

  let category: string;
  let color: string;

  if (bmi < 18.5) {
    category = 'Underweight';
    color = 'text-blue-600';
  } else if (bmi < 25) {
    category = 'Normal weight';
    color = 'text-green-600';
  } else if (bmi < 30) {
    category = 'Overweight';
    color = 'text-yellow-600';
  } else {
    category = 'Obese';
    color = 'text-red-600';
  }

  return { value: bmi, category, color };
}

export function calculateAge(dateOfBirth: Date | string | null | undefined): number | null {
  if (!dateOfBirth) {
    return null;
  }

  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  
  if (isNaN(dob.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

export function formatDate(
  date: Date | string | null | undefined,
  format: string = 'MM/DD/YYYY'
): string {
  if (!date) {
    return '';
  }

  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return '';
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'MM/DD/YYYY':
    default:
      return `${month}/${day}/${year}`;
  }
}

export function convertUnits(
  value: number,
  fromUnit: 'metric' | 'imperial',
  toUnit: 'metric' | 'imperial',
  type: 'weight' | 'height' | 'temperature'
): number {
  if (fromUnit === toUnit) {
    return value;
  }

  switch (type) {
    case 'weight':
      if (fromUnit === 'metric') {
        return Math.round(value * 2.20462 * 10) / 10;
      } else {
        return Math.round(value / 2.20462 * 10) / 10;
      }
    
    case 'height':
      if (fromUnit === 'metric') {
        return Math.round(value / 2.54 * 10) / 10;
      } else {
        return Math.round(value * 2.54 * 10) / 10;
      }
    
    case 'temperature':
      if (fromUnit === 'metric') {
        return Math.round((value * 9/5 + 32) * 10) / 10;
      } else {
        return Math.round(((value - 32) * 5/9) * 10) / 10;
      }
    
    default:
      return value;
  }
}

export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return first + last || '?';
}