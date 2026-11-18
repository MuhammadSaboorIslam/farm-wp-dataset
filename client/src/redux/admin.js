import {createSlice,createAsyncThunk} from '@reduxjs/toolkit'
import {get,patch} from '../api'
import {logoutUser} from './auth'

export const loadPendingFarmers = createAsyncThunk('admin/pending', () => get('/admin/farmers?verified=false'))
export const verifyFarmer = createAsyncThunk('admin/verify', ({id, approve}) => patch('/admin/farmers/' + id + '/verify', { approve: approve }))
export const loadUsers = createAsyncThunk('admin/users', () => get('/admin/users'))
export const loadAllOrders = createAsyncThunk('admin/orders', () => get('/admin/orders'))

const initialState = {
  pending: [],
  users: [],
  orders: [],
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
      for (let i = 0; i < state.pending.length; i++){
        if (state.pending[i].id !== action.payload.farmer.id) keep.push(state.pending[i])
      }
      state.pending = keep
      for (let i = 0; i < state.users.length; i++){
        if (state.users[i].id === action.payload.farmer.id){
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
  },
})

export default adminSlice.reducer
