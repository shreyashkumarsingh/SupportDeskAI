import axios from "axios";
import { PredictionResult, TicketCategory } from "@/utils/mockData";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

interface PredictPayload {
  subject: string;
  body: string;
  userId?: string | null;
}

interface BackendPredictionResponse {
  category: string;
  confidence: number;
  top_classes: Array<{ label: string; score: number }>;
}

// Convert backend labels to our TicketCategory union if possible
const normalizeCategory = (label: string): TicketCategory => {
  const normalized = label.trim();
  if (["Incident", "Request", "Problem", "Change"].includes(normalized)) {
    return normalized as TicketCategory;
  }
  return "Incident"; // safe fallback
};

export const predictTicket = async (
  payload: PredictPayload
): Promise<PredictionResult> => {
  const { subject, body, userId } = payload;
  const response = await axios.post<BackendPredictionResponse>(
    `${API_BASE}/predict`,
    {
      subject,
      body,
      user_id: userId,
    },
    {
      timeout: 15000,
    }
  );

  const data = response.data;

  const topCategories = (data.top_classes || []).slice(0, 3).map((item) => ({
    category: normalizeCategory(item.label),
    score: item.score,
  }));

  return {
    category: normalizeCategory(data.category),
    confidence: data.confidence,
    topCategories,
  };
};
