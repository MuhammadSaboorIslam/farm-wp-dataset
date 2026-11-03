import {createSlice} from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: { message: null },
  reducers: {
    showMessage(state, action){
      state.message = action.payload
    },
    clearMessage(state){
      state.message = null
    },
  },
})

export const { showMessage, clearMessage } = uiSlice.actions

export function flash(dispatch, type, text){
  dispatch(showMessage({ type: type, text: text }))
  setTimeout(() => dispatch(clearMessage()), 3500)
}

export default uiSlice.reducer
