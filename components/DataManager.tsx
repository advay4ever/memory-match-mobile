export interface SessionData {
  id: string;
  timestamp: Date;
  accuracy: number; // percentage (0-100)
  reactionTime: number; // milliseconds
  correctSounds: string[];
  selectedSounds: string[];
  gameNumber: number;
  isCorrect: boolean;
}

export interface UserProfile {
  sessions: SessionData[];
  alertThreshold: number;
  needsAlert: boolean;
}

export class DataManager {
  private static instance: DataManager;
  private storageKey = 'cognitive_assessment_data';

  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  saveSession(sessionData: SessionData): void {
    try {
      const existingData = this.getAllSessions();
      existingData.push(sessionData);
      localStorage.setItem(this.storageKey, JSON.stringify(existingData));
      
      // Check if alert is needed
      this.checkAlertConditions();
    } catch (error) {
      console.error('Failed to save session data:', error);
    }
  }

  getAllSessions(): SessionData[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to retrieve session data:', error);
      return [];
    }
  }

  getRecentSessions(count: number = 3): SessionData[] {
    const sessions = this.getAllSessions();
    return sessions.slice(-count);
  }

  checkAlertConditions(): boolean {
    const recentSessions = this.getRecentSessions(3);
    
    if (recentSessions.length >= 3) {
      const averageAccuracy = recentSessions.reduce((sum, session) => sum + session.accuracy, 0) / recentSessions.length;
      
      // Alert if average accuracy below 60% over last 3 sessions
      if (averageAccuracy < 60) {
        this.triggerAlert(averageAccuracy);
        return true;
      }
    }
    
    return false;
  }

  private triggerAlert(averageAccuracy: number): void {
    console.log(`🚨 ALERT: Low performance detected. Average accuracy: ${averageAccuracy.toFixed(1)}%`);
    // In a real app, this would notify CHW/caregiver
  }

  exportData(): string {
    const sessions = this.getAllSessions();
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      totalSessions: sessions.length,
      sessions: sessions
    }, null, 2);
  }

  clearAllData(): void {
    localStorage.removeItem(this.storageKey);
  }
}