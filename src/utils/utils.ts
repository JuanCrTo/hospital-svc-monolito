import * as bcrypt from 'bcrypt';
import axios from 'axios';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export function calculateAge(birth: string): number {
  const birthDate = new Date(birth);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthday =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasHadBirthday) {
    age--;
  }

  return age;
}

export function calculateClinicalAge(birth: string): string {
  const birthDate = new Date(birth);
  const today = new Date();

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return `${years} años, ${months} meses, ${days} días`;
}

export const getCoordinatesFromLocation = async (location: string): Promise<{ latitude: number, longitude: number }> => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Maps API Key not defined in environment variables');
  }

  const encodedLocation = encodeURIComponent(location);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedLocation}&key=${apiKey}`;

  const response = await axios.get(url);
  const results = response.data.results;

  if (!results || results.length === 0) {
    throw new Error('No results found for the given location');
  }

  const { lat, lng } = results[0].geometry.location;
  return { latitude: lat, longitude: lng };
};

export function addLocationToHistory(
  currentHistory: {
    location: string;
    latitude: number | null;
    longitude: number | null;
    updatedAt: Date;
  }[],
  newEntry: {
    location: string;
    latitude: number | null;
    longitude: number | null;
  }
): typeof currentHistory {
  const lastEntry = currentHistory?.[currentHistory.length - 1];

  // Evita duplicar la última ubicación
  if (
    lastEntry &&
    lastEntry.location === newEntry.location &&
    lastEntry.latitude === newEntry.latitude &&
    lastEntry.longitude === newEntry.longitude
  ) {
    return currentHistory;
  }

  return [
    ...(currentHistory || []),
    { ...newEntry, updatedAt: new Date() },
  ];
}