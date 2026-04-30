import { GoogleGenAI, Type } from "@google/genai";
import { Student } from '../types';
import { addMonths, addDays, addWeeks, format, isValid } from 'date-fns';
import { getGeminiKeys } from './neuralEngine';

const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const sanitizeValue = (val: any): string => {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (str.toLowerCase() === 'null') return '';
  return str;
};

/**
 * Robust replacement for missing date-fns parse and parseISO members.
 */
const manualParse = (str: string, fmt: string): Date | null => {
    const clean = str.trim();
    const parts = clean.split(/[\/\-\.]/);
    if (parts.length !== 3) return null;
    
    let d, m, y;
    if (fmt === 'dd/MM/yyyy') {
        [d, m, y] = parts.map(Number);
    } else if (fmt === 'MM/dd/yyyy') {
        [m, d, y] = parts.map(Number);
    } else if (fmt === 'yyyy-MM-dd') {
        [y, m, d] = parts.map(Number);
    } else {
        return null;
    }
    
    if (y < 100) y += 2000;
    const date = new Date(y, m - 1, d);
    return isValid(date) ? date : null;
};

/**
 * Normalizes date strings and rigorously handles 2-digit years.
 */
const normalizeDate = (dateStr: string): Date | null => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const clean = dateStr.trim();

    // dd/mm/yy pattern
    const match = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
    if (match) {
        const d = parseInt(match[1], 10);
        const m = parseInt(match[2], 10) - 1;
        let y = parseInt(match[3], 10);
        
        // Force conversion to 2000s
        if (y < 100) {
            y += 2000;
        } else if (y < 1000) {
            y = 2000 + (y % 100);
        }
        
        const date = new Date(y, m, d);
        return isValid(date) ? date : null;
    }

    const iso = new Date(clean);
    if (isValid(iso)) {
        if (iso.getFullYear() < 100) {
            iso.setFullYear(2000 + iso.getFullYear());
        }
        return iso;
    }

    const formats = ['dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd'];
    for (const fmt of formats) {
        const d = manualParse(clean, fmt);
        if (d && isValid(d)) {
            if (d.getFullYear() < 100) d.setFullYear(2000 + d.getFullYear());
            return d;
        }
    }
    return null;
};

const calculateDeadline = (startDate: Date, durationStr: string): Date => {
    const normalized = durationStr.toLowerCase().trim();
    const amountMatch = normalized.match(/\d+/);
    const amount = amountMatch ? parseInt(amountMatch[0], 10) : 1;
    
    if (normalized.includes('day')) return addDays(startDate, amount);
    if (normalized.includes('week')) return addWeeks(startDate, amount);
    if (normalized.includes('year')) return addMonths(startDate, amount * 12);
    
    return addMonths(startDate, amount);
};

export const parseStudentData = async (inputText: string, imageFile?: File, mode: 'Hall' | 'Finance' | 'Attendance' | 'DailyTask' = 'Hall'): Promise<Partial<Student>[] | null> => {
  const parts: any[] = [];
  if (imageFile) parts.push(await fileToGenerativePart(imageFile));
  if (inputText) parts.push({ text: `Context: ${inputText}` });

  let prompt = '';
  if (mode === 'Hall') {
      prompt = `Extract Hall Study records: Name (name), Fee (schoolFee), Teacher (teachers), Level (level), Behavior (behavior), Schedule (schedule - e.g. Mon-Fri or Sat & Sunday), Time (time), Start Date (startDate), Assistant (assistant), Duration (duration).`;
  } else if (mode === 'Finance') {
      prompt = `Extract Finance records: ID (displayId), Name (name), Fee (schoolFee), Level (level), Start Date (startDate), Teachers (teachers), Monthly Payments (paymentList), Duration (duration).`;
  } else if (mode === 'DailyTask') {
      prompt = `Extract Teacher Daily Task assignments: Teacher Name (name), Level (level), Shift (shift). Shift should be 'Morning', 'Afternoon', or 'Evening'.`;
  } else {
      prompt = `Extract Attendance list: Full Name (name). Keep Sex (M)/(F) if present.`;
  }
  
  prompt += `\nCRITICAL: Return startDate in format dd/MM/yyyy (e.g., 24/12/2025). Ensure year is ALWAYS 4 digits. JSON array format.`;

  const availableKeys = getGeminiKeys();
  if (availableKeys.length === 0) {
      console.error("No Gemini API keys configured");
      return null;
  }
  
  // Use first available key for this service
  const ai = new GoogleGenAI({ apiKey: availableKeys[0] });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              schoolFee: { type: Type.STRING },
              displayId: { type: Type.STRING },
              behavior: { type: Type.STRING }, 
              level: { type: Type.STRING },
              teachers: { type: Type.STRING },
              startDate: { type: Type.STRING },
              time: { type: Type.STRING },
              schedule: { type: Type.STRING },
              assistant: { type: Type.STRING },
              duration: { type: Type.STRING },
              shift: { type: Type.STRING },
              paymentList: { 
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { period: { type: Type.STRING }, status: { type: Type.STRING } }
                }
              },
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    const rawData = JSON.parse(text);

    return rawData.map((item: any) => {
        const payments: Record<string, string> = {};
        if (item.paymentList) item.paymentList.forEach((p: any) => payments[p.period] = sanitizeValue(p.status));
        const { paymentList, ...studentData } = item;
        const sanitizedData: any = {};
        Object.keys(studentData).forEach(k => sanitizedData[k] = sanitizeValue(studentData[k]));

        if (sanitizedData.startDate) {
            const dateObj = normalizeDate(sanitizedData.startDate);
            if (dateObj) {
                sanitizedData.startDate = format(dateObj, 'dd/MM/yy');
                const durationText = sanitizedData.duration || '1 month';
                const deadlineDate = calculateDeadline(dateObj, durationText);
                sanitizedData.deadline = format(deadlineDate, 'dd/MM/yy');
            }
        }
        return { ...sanitizedData, payments };
    });
  } catch (error) {
    console.error("GenAI Error:", error);
    return null;
  }
};