import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const activityFile = path.join(dataDir, 'activity.json');

export async function logActivity(action, details = '') {
  try {
    let activities = [];
    if (fs.existsSync(activityFile)) {
      const fileData = fs.readFileSync(activityFile, 'utf8');
      activities = JSON.parse(fileData);
    }
    
    // Add new activity at the beginning
    activities.unshift({
      id: Date.now().toString(),
      action,
      details,
      timestamp: new Date().toISOString()
    });
    
    // Keep only the last 100 activities
    if (activities.length > 100) {
      activities = activities.slice(0, 100);
    }
    
    fs.writeFileSync(activityFile, JSON.stringify(activities, null, 2));
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

export async function getActivities() {
  try {
    if (fs.existsSync(activityFile)) {
      const fileData = fs.readFileSync(activityFile, 'utf8');
      return JSON.parse(fileData);
    }
  } catch (err) {
    console.error('Failed to read activities:', err);
  }
  return [];
}
