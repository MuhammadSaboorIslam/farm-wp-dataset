import {createSlice,createAsyncThunk} from '@reduxjs/toolkit'
import {get,post,del} from '../api'
import {logoutUser} from './auth'

export const loadFarm = createAsyncThunk('farms/load', (id) => get('/farms/' + id))
export const toggleFollow = createAsyncThunk('farms/follow', ({id, following}) => following ? del('/farms/' + id + '/follow') : post('/farms/' + id + '/follow'))
export const loadFollowing = createAsyncThunk('farms/following', () => get('/farms/following'))
export const loadMyUpdates = createAsyncThunk('farms/myUpdates', () => get('/updates?farmer=me'))
export const postUpdate = createAsyncThunk('farms/postUpdate', (form) => post('/updates', form))

const initialState = {
  current: null,
  following: [],
  myUpdates: [],
  loading: false,
  error: null,
  saving: false,
  saveError: null,
}

const farmsSlice = createSlice({
  name: 'farms',
  initialState,
  reducers: {
    clearSaveError(state){
      state.saveError = null
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logoutUser, () => initialState)
    builder.addCase(loadFarm.pending, (state) => {
      state.loading = true
      state.error = null
      state.current = null
    })
    builder.addCase(loadFarm.fulfilled, (state, action) => {
      state.loading = false
      state.current = action.payload
    })
    builder.addCase(loadFarm.rejected, (state, action) => {
      state.loading = false
      state.error = action.error.message
    })

    builder.addCase(toggleFollow.fulfilled, (state, action) => {
      if (state.current){
        state.current.following = action.payload.following
        state.current.followers = action.payload.followers
      }
    })

    builder.addCase(loadFollowing.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(loadFollowing.fulfilled, (state, action) => {
      state.loading = false
      state.following = action.payload.farms
    })
    builder.addCase(loadFollowing.rejected, (state, action) => {
      state.loading = false
      state.error = action.error.message
    })

    builder.addCase(loadMyUpdates.pending, (state) => {
      state.loading = true
    })
    builder.addCase(loadMyUpdates.fulfilled, (state, action) => {
      state.loading = false
      state.myUpdates = action.payload.updates
    })
    builder.addCase(loadMyUpdates.rejected, (state, action) => {
      state.loading = false
      state.error = action.error.message
    })

    builder.addCase(postUpdate.pending, (state) => {
      state.saving = true
      state.saveError = null
    })
    builder.addCase(postUpdate.fulfilled, (state, action) => {
      state.saving = false
      state.myUpdates.unshift(action.payload.update)
    })
    builder.addCase(postUpdate.rejected, (state, action) => {
      state.saving = false
      state.saveError = action.error.message
    })
  },
})

export const { clearSaveError } = farmsSlice.actions
export default farmsSlice.reducer
