export interface SessionData {
  id: string;
  timestamp: Date;
  participantName: string; // Name of the person taking the test
  attemptNumber: number; // Which attempt this is for this participant
  accuracy: number; // percentage (0-100)
  reactionTime: number; // milliseconds
  correctSounds: string[];
  selectedSounds: string[];
  gameNumber: number;
  isCorrect: boolean;
  difficulty?: 'easy' | 'medium' | 'hard'; // Difficulty level
  participantAge?: number | null; // Age of participant
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

  // Get all sessions sorted by date (newest first)
  getAllSessionsSorted(): SessionData[] {
    const sessions = this.getAllSessions();
    return sessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Get the next attempt number for a participant
  getNextAttemptNumber(participantName: string): number {
    const sessions = this.getAllSessions();
    const participantSessions = sessions.filter(
      s => s.participantName?.toLowerCase() === participantName.toLowerCase()
    );
    return participantSessions.length + 1;
  }

  // Get sessions for a specific participant
  getSessionsByParticipant(participantName: string): SessionData[] {
    const sessions = this.getAllSessions();
    return sessions
      .filter(s => s.participantName?.toLowerCase() === participantName.toLowerCase())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Get unique participant names
  getParticipantNames(): string[] {
    const sessions = this.getAllSessions();
    const names = new Set(sessions.map(s => s.participantName).filter(Boolean));
    return Array.from(names).sort();
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