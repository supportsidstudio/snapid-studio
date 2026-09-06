import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FEEDBACK_FILE = path.join(DATA_DIR, "feedback.json");

export interface FeedbackRecord {
  id: string;
  rating: number; // 1 to 5
  category: string; // 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Very Poor'
  feedback: string;
  name?: string;
  createdAt: string;
}

/**
 * Ensures data directory and feedback JSON file exist.
 */
export function initFeedbackDb(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(FEEDBACK_FILE)) {
      const initialSeed: FeedbackRecord[] = [
        {
          id: "fb_seed_1",
          rating: 5,
          category: "Excellent",
          feedback: "Very easy to use and really helpful for official passport and visa photo prints!",
          name: "Rahul",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18 hours ago
        },
        {
          id: "fb_seed_2",
          rating: 5,
          category: "Excellent",
          feedback: "AI background removal and automatic Aadhaar card cropping worked seamlessly. Saved my trip to the cyber cafe.",
          name: "Priya Sharma",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 42).toISOString(), // 42 hours ago
        },
        {
          id: "fb_seed_3",
          rating: 5,
          category: "Good",
          feedback: "Resized my signature and photo to exactly 20 KB for government exam form in seconds.",
          name: "Amit Kumar",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago
        },
        {
          id: "fb_seed_4",
          rating: 5,
          category: "Excellent",
          feedback: "100% on-device processing and no biometric data leaves the browser. Amazing privacy protection!",
          name: "Vikram Rathore",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 140).toISOString(), // 5 days ago
        }
      ];
      fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(initialSeed, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Error initializing feedback database:", err);
  }
}

/**
 * Permanently saves a new feedback record to the database file.
 */
export function saveFeedback(data: {
  rating: number;
  category: string;
  feedback?: string;
  name?: string;
}): FeedbackRecord {
  initFeedbackDb();

  let records: FeedbackRecord[] = [];
  try {
    const raw = fs.readFileSync(FEEDBACK_FILE, "utf-8");
    records = JSON.parse(raw);
    if (!Array.isArray(records)) records = [];
  } catch (e) {
    records = [];
  }

  const newRecord: FeedbackRecord = {
    id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    rating: Math.min(5, Math.max(1, Math.round(Number(data.rating) || 5))),
    category: (data.category || "Good").trim(),
    feedback: (data.feedback || "").trim(),
    name: (data.name || "").trim(),
    createdAt: new Date().toISOString(),
  };

  records.unshift(newRecord);

  // Synchronous atomic-like write
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(records, null, 2), "utf-8");

  return newRecord;
}

/**
 * Retrieves all stored feedback records.
 */
export function getAllFeedback(): FeedbackRecord[] {
  initFeedbackDb();
  try {
    const raw = fs.readFileSync(FEEDBACK_FILE, "utf-8");
    const records = JSON.parse(raw);
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}
