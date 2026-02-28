import axios from "axios";
import { PredictionResult, TicketCategory } from "@/utils/mockData";

const rawApiBase =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";
const API_BASE = rawApiBase.replace(/\/$/, "");

interface PredictPayload {
  subject: string;
  description: string;
  userId?: string | null;
  userRole?: "admin" | "agent" | "viewer";
}

interface BackendPredictionResponse {
  request_id?: string;
  category: string;
  confidence: number;
  top_classes: Array<{ label: string; score: number }>;
  plain_explanation?: string;
  model_version?: string;
  confidence_status?: string;
  quality?: { score: number; issues: string[]; is_acceptable: boolean };
}

interface BatchPredictPayload {
  tickets: Array<{ subject: string; description: string }>;
  userId?: string | null;
  userRole?: "admin" | "agent" | "viewer";
}

const getHeaders = (userId?: string | null, userRole?: "admin" | "agent" | "viewer") => ({
  "x-user-id": userId || "anonymous",
  "x-user-role": userRole || "agent",
});

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
): Promise<PredictionResult & { requestId?: string; plainExplanation?: string; modelVersion?: string; confidenceStatus?: string; quality?: { score: number; issues: string[]; is_acceptable: boolean } }> => {
  const { subject, description, userId, userRole } = payload;
  const response = await axios.post<BackendPredictionResponse>(
    `${API_BASE}/predict`,
    {
      subject,
      description,
      user_id: userId,
    },
    {
      timeout: 15000,
      headers: getHeaders(userId, userRole),
    }
  );

  const data = response.data;

  const topCategories = (data.top_classes || []).slice(0, 3).map((item) => ({
    category: normalizeCategory(item.label),
    score: item.score,
  }));

  return {
    requestId: data.request_id,
    category: normalizeCategory(data.category),
    confidence: data.confidence,
    topCategories,
    plainExplanation: data.plain_explanation,
    modelVersion: data.model_version,
    confidenceStatus: data.confidence_status,
    quality: data.quality,
  };
};

export const predictBatchTickets = async (payload: BatchPredictPayload) => {
  const { tickets, userId, userRole } = payload;
  const response = await axios.post(
    `${API_BASE}/predict/batch`,
    {
      tickets: tickets.map((ticket) => ({
        subject: ticket.subject,
        description: ticket.description,
        user_id: userId,
      })),
      user_id: userId,
    },
    {
      timeout: 30000,
      headers: getHeaders(userId, userRole),
    }
  );

  return response.data;
};

export const submitPredictionFeedback = async (payload: {
  predictionId: string;
  correctCategory: TicketCategory;
  comments?: string;
  userId?: string | null;
  userRole?: "admin" | "agent" | "viewer";
}) => {
  const response = await axios.post(
    `${API_BASE}/feedback`,
    {
      prediction_id: payload.predictionId,
      correct_category: payload.correctCategory,
      comments: payload.comments,
    },
    {
      headers: getHeaders(payload.userId, payload.userRole),
    }
  );
  return response.data;
};

export const getCalibrationReport = async (userId?: string | null, userRole?: "admin" | "agent" | "viewer") => {
  const response = await axios.get(`${API_BASE}/monitor/calibration`, {
    headers: getHeaders(userId, userRole),
  });
  return response.data;
};

export const getModelRegistry = async (userId?: string | null, userRole?: "admin" | "agent" | "viewer") => {
  const response = await axios.get(`${API_BASE}/models/registry`, {
    headers: getHeaders(userId, userRole),
  });
  return response.data;
};

export const triggerRetrain = async (
  input: { reason?: string; minFeedbackRecords?: number },
  userId?: string | null,
  userRole?: "admin" | "agent" | "viewer"
) => {
  const response = await axios.post(
    `${API_BASE}/retrain/trigger`,
    {
      reason: input.reason || "manual",
      min_feedback_records: input.minFeedbackRecords ?? 10,
    },
    {
      headers: getHeaders(userId, userRole),
    }
  );
  return response.data;
};
