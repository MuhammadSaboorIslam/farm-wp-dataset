import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { get, patch } from '../api'
import { logoutUser } from './auth'

export const loadPendingFarmers = createAsyncThunk('admin/pending', () =>
  get('/admin/farmers?verified=false'),
)
export const verifyFarmer = createAsyncThunk('admin/verify', ({ id, approve }) =>
  patch('/admin/farmers/' + id + '/verify', { approve: approve }),
)
export const loadUsers = createAsyncThunk('admin/users', () => get('/admin/users'))
export const loadAllOrders = createAsyncThunk('admin/orders', () => get('/admin/orders'))
export const loadAdminStats = createAsyncThunk('admin/stats', () => get('/admin/stats'))
export const setBlocked = createAsyncThunk('admin/block', ({ id, blocked }) =>
  patch('/admin/users/' + id + '/block', { blocked: blocked }),
)
export const loadAdminProducts = createAsyncThunk('admin/products', () => get('/admin/products'))
export const setHidden = createAsyncThunk('admin/hide', ({ id, hidden }) =>
  patch('/admin/products/' + id + '/hide', { hidden: hidden }),
)

const initialState = {
  pending: [],
  users: [],
  orders: [],
  products: [],
  stats: null,
  loading: false,
  error: null,
}

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(logoutUser, () => initialState)
    builder.addCase(loadPendingFarmers.pending,(state)=>{
      state.loading = true
      state.error = null
    })
    builder.addCase(loadPendingFarmers.fulfilled,(state, action)=>{
      state.loading = false
      state.pending = action.payload.farmers
    })
    builder.addCase(loadPendingFarmers.rejected,(state, action)=>{
      state.loading = false
      state.error = action.error.message
    })

    builder.addCase(verifyFarmer.fulfilled,(state, action)=>{
      const keep = []
      for (let i = 0; i < state.pending.length; i++) {
        if (state.pending[i].id !== action.payload.farmer.id) keep.push(state.pending[i])
      }
      state.pending = keep
      for (let i = 0; i < state.users.length; i++) {
        if (state.users[i].id === action.payload.farmer.id) {
          state.users[i] = action.payload.farmer
        }
      }
    })

    builder.addCase(loadUsers.pending,(state)=>{
      state.loading = true
      state.error = null
    })
    builder.addCase(loadUsers.fulfilled,(state, action)=>{
      state.loading = false
      state.users = action.payload.users
    })
    builder.addCase(loadUsers.rejected,(state, action)=>{
      state.loading = false
      state.error = action.error.message
    })

    builder.addCase(loadAllOrders.pending,(state)=>{
      state.loading = true
      state.error = null
    })
    builder.addCase(loadAllOrders.fulfilled,(state, action)=>{
      state.loading = false
      state.orders = action.payload.orders
    })
    builder.addCase(loadAllOrders.rejected,(state, action)=>{
      state.loading = false
      state.error = action.error.message
    })

    builder.addCase(loadAdminStats.fulfilled,(state, action)=>{
      state.stats = action.payload
    })
    builder.addCase(loadAdminProducts.fulfilled,(state, action)=>{
      state.products = action.payload.products
    })
    builder.addCase(setBlocked.fulfilled,(state, action)=>{
      const u = action.payload.user
      state.users = state.users.map((x) => (x.id === u.id ? u : x))
    })
    builder.addCase(setHidden.fulfilled,(state, action)=>{
      const p = action.payload.product
      state.products = state.products.map((x) => (x.id === p.id ? p : x))
    })
  },
})

export default adminSlice.reducer
