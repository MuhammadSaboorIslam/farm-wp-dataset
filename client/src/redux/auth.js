import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { get, post, put } from '../api'

export const registerUser = createAsyncThunk('auth/register', (form) => post('/auth/register', form))
export const loginUser = createAsyncThunk('auth/login', (form) => post('/auth/login', form))
export const loadMe = createAsyncThunk('auth/me', () => get('/auth/me'))
export const updateProfile = createAsyncThunk('auth/updateProfile', (form) => put('/auth/me', form))
export const changePassword = createAsyncThunk('auth/password', (form) => put('/auth/password', form))
export const updateSettings = createAsyncThunk('auth/settings', (form) => put('/auth/settings', form))

function saveuser(state, payload) {
  state.loading = false
  state.user = payload.user
  localStorage.setItem('user', JSON.stringify(payload.user))
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    loading: false,
    error: null,
  },
  reducers: {
    logoutUser(state) {
      state.user = null
      state.error = null
      localStorage.removeItem('user')
    },
    setUser(state, action) {
      state.user = action.payload
      localStorage.setItem('user', JSON.stringify(action.payload))
    },
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder.addCase(registerUser.pending,(state)=>{
      state.loading = true
      state.error = null
    })
    builder.addCase(registerUser.fulfilled,(state, action)=>{
      saveuser(state, action.payload)
    })
    builder.addCase(registerUser.rejected,(state, action)=>{
      state.loading = false
      state.error = action.error.message
    })

    builder.addCase(loginUser.pending,(state)=>{
      state.loading = true
      state.error = null
    })
    builder.addCase(loginUser.fulfilled,(state, action)=>{
      saveuser(state, action.payload)
    })
    builder.addCase(loginUser.rejected,(state, action)=>{
      state.loading = false
      state.error = action.error.message
    })

    builder.addCase(loadMe.fulfilled,(state, action)=>{
      state.user = action.payload.user
      localStorage.setItem('user', JSON.stringify(action.payload.user))
    })
    builder.addCase(updateSettings.fulfilled,(state, action)=>{
      state.user = action.payload.user
      localStorage.setItem('user', JSON.stringify(action.payload.user))
    })
    builder.addCase(updateProfile.fulfilled,(state, action)=>{
      state.user = action.payload.user
      localStorage.setItem('user', JSON.stringify(action.payload.user))
    })
  },
})

export const { logoutUser, setUser, clearAuthError } = authSlice.actions
export default authSlice.reducer
