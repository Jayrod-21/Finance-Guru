/**
 * Centralized API client for all backend communication.
 * Base URL defaults to localhost:8000 for Docker dev environment.
 */
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: API_BASE });

/* ── Transactions ── */
export const getTransactions = (params) => api.get("/api/transactions", { params });
export const createTransaction = (data) => api.post("/api/transactions", data);
export const updateTransaction = (id, data) => api.put(`/api/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/api/transactions/${id}`);
export const getBalance = () => api.get("/api/transactions/balance");

/* ── Categories ── */
export const getCategories = () => api.get("/api/categories");
export const createCategory = (data) => api.post("/api/categories", data);
export const updateCategory = (id, data) => api.put(`/api/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/api/categories/${id}`);

/* ── Budgets ── */
export const getBudgetOverview = () => api.get("/api/budgets/overview");
export const getDangerZones = () => api.get("/api/budgets/danger-zones");

/* ── Recurring Expenses ── */
export const getRecurring = () => api.get("/api/recurring");
export const getRecurringUpcoming = () => api.get("/api/recurring/upcoming");
export const createRecurring = (data) => api.post("/api/recurring", data);
export const updateRecurring = (id, data) => api.put(`/api/recurring/${id}`, data);
export const deleteRecurring = (id) => api.delete(`/api/recurring/${id}`);

/* ── Income ── */
export const getIncome = () => api.get("/api/income");
export const getMonthlyIncome = () => api.get("/api/income/monthly");
export const createIncome = (data) => api.post("/api/income", data);
export const updateIncome = (id, data) => api.put(`/api/income/${id}`, data);
export const deleteIncome = (id) => api.delete(`/api/income/${id}`);

/* ── Goals ── */
export const getGoals = () => api.get("/api/goals");
export const createGoal = (data) => api.post("/api/goals", data);
export const updateGoal = (id, data) => api.put(`/api/goals/${id}`, data);
export const deleteGoal = (id) => api.delete(`/api/goals/${id}`);
export const getGoalFeasibility = () => api.get("/api/goals/feasibility");

/* ── Debts ── */
export const getDebts = () => api.get("/api/debts");
export const createDebt = (data) => api.post("/api/debts", data);
export const updateDebt = (id, data) => api.put(`/api/debts/${id}`, data);
export const deleteDebt = (id) => api.delete(`/api/debts/${id}`);

/* ── Analytics ── */
export const getTopCategories = (params) => api.get("/api/analytics/top-categories", { params });
export const getFrequency = (params) => api.get("/api/analytics/frequency", { params });
export const getLargest = (params) => api.get("/api/analytics/largest", { params });
export const getWeeklyComparison = () => api.get("/api/analytics/comparisons/weekly");
export const getMonthlyComparison = () => api.get("/api/analytics/comparisons/monthly");
export const getInsights = () => api.get("/api/analytics/insights");
export const getProjection = () => api.get("/api/analytics/projection");
export const getBurnRate = () => api.get("/api/analytics/burn-rate");
export const getCashflow = () => api.get("/api/analytics/cashflow");

/* ── Snapshots ── */
export const getSnapshots = () => api.get("/api/snapshots");
export const getSnapshot = (year, month) => api.get(`/api/snapshots/${year}/${month}`);
export const generateSnapshot = (params) => api.post("/api/snapshots/generate", null, { params });

/* ── Notifications ── */
export const getNotificationPrefs = () => api.get("/api/notifications/preferences");
export const updateNotificationPref = (data) => api.put("/api/notifications/preferences", data);
export const getActiveNotifications = () => api.get("/api/notifications/active");

/* ── Chat ── */
export const sendChat = (message) => api.post("/api/chat", { message });
export const getChatHistory = () => api.get("/api/chat/history");

/* ── Settings ── */
export const storeApiKey = (api_key) => api.post("/api/settings/apikey", { api_key });
export const getApiKeyStatus = () => api.get("/api/settings/apikey/status");

export default api;
