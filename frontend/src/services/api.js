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

export default api;
