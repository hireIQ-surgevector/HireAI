import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

/* =========================
   FETCH DASHBOARD DATA
========================= */

export const fetchDashboardSummary = createAsyncThunk(
  "dashboard/fetchSummary",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5001/api/dashboard-summary`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || "Failed to load dashboard data.");
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Something went wrong.");
    }
  },
);

/* =========================
   INITIAL STATE
========================= */

const initialState = {
  summary: null,
  loading: false,
  error: null,
  lastFetched: null,
};

/* =========================
   DASHBOARD SLICE
========================= */

const dashboardSlice = createSlice({
  name: "dashboard",

  initialState,

  reducers: {
    clearDashboardData: (state) => {
      state.summary = null;
      state.loading = false;
      state.error = null;
      state.lastFetched = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* FETCH STARTED */

      .addCase(fetchDashboardSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      /* FETCH SUCCESS */

      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
        state.lastFetched = Date.now();
      })

      /* FETCH FAILED */

      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load dashboard data.";
      });
  },
});

/* =========================
   EXPORTS
========================= */

export const { clearDashboardData } = dashboardSlice.actions;

export default dashboardSlice.reducer;
