import { useState } from 'react';
import { api } from '../services/api';
import type { GameResult, CreateGameResultRequest } from '../services/types';

export const useGameResult = () => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveResult = async (
    data: CreateGameResultRequest
  ): Promise<GameResult> => {
    setSaving(true);
    setError(null);

    try {
      const result = await api.saveGameResult(data);
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save result';
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return { saveResult, saving, error };
};
