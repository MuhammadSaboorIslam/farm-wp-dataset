import {createSlice,createAsyncThunk} from '@reduxjs/toolkit'
import {get,patch} from '../api'

export const loadNotifications = createAsyncThunk('notifications/load', () => get('/notifications'))
export const markAllRead = createAsyncThunk('notifications/read', () => patch('/notifications/read'))

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    list: [],
    unread: 0,
  },
  reducers: {
    clearNotifications(state){
      state.list = []
      state.unread = 0
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadNotifications.fulfilled, (state, action) => {
      state.list = action.payload.notifications
      state.unread = action.payload.unread
    })
    builder.addCase(markAllRead.fulfilled, (state) => {
      for (let i = 0; i < state.list.length; i++){
        state.list[i].read = true
      }
      state.unread = 0
    })
  },
})

export const { clearNotifications } = notificationsSlice.actions
export default notificationsSlice.reducer
