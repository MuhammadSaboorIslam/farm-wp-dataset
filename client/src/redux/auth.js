import {createSlice,createAsyncThunk} from "@reduxjs/toolkit";
import {post} from '../api'

export const registerUser=createAsyncThunk('auth/register', (form)=> post('/auth/register', form))
export const loginUser = createAsyncThunk('auth/login', (form)=>post('/auth/login', form))

function saveUser(state, payload){
  state.loading=false
  state.user=payload.user
  localStorage.setItem("user", JSON.stringify(payload.user))
  localStorage.setItem("token", payload.token)
}

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: JSON.parse(localStorage.getItem("user")) || null,
    loading:false,
    error: null,
  },
  reducers: {
    logoutUser(state) {
      state.user = null;
      state.error = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
    setUser(state, action){
      state.user = action.payload
      localStorage.setItem("user", JSON.stringify(action.payload))
    },
    clearAuthError(state){
      state.error = null
    },
  },
  extraReducers:(builder)=>{
    builder.addCase(registerUser.pending,(state)=>{
      state.loading=true
      state.error=null
    })
    builder.addCase(registerUser.fulfilled,(state,action)=>{
      saveUser(state, action.payload)
    })
    builder.addCase(registerUser.rejected,(state,action)=>{
      state.loading=false
      state.error=action.error.message
    })

    builder.addCase(loginUser.pending,(state)=>{
      state.loading=true
      state.error=null
    })
    builder.addCase(loginUser.fulfilled,(state,action)=>{
      saveUser(state, action.payload)
    })
    builder.addCase(loginUser.rejected,(state,action)=>{
      state.loading=false
      state.error=action.error.message
    })
  }
});

export const {logoutUser, setUser, clearAuthError} =authSlice.actions;
export default authSlice.reducer;
