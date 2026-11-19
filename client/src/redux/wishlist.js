import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { get, post, del } from '../api'
import { logoutUser } from './auth'

export const loadWishlist = createAsyncThunk('wishlist/load', () => get('/wishlist'))
export const toggleWish = createAsyncThunk('wishlist/toggle', ({ id, saved }) =>
  saved ? del('/wishlist/' + id) : post('/wishlist/' + id),
)

const initialState = { ids: [], products: [], loading: false, error: null }

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(logoutUser, () => initialState)
    builder.addCase(loadWishlist.pending,(state)=>{
      state.loading = true
      state.error = null
    })
    builder.addCase(loadWishlist.fulfilled,(state, action)=>{
      state.loading = false
      state.ids = action.payload.ids
      state.products = action.payload.products
    })
    builder.addCase(loadWishlist.rejected,(state, action)=>{
      state.loading = false
      state.error = action.error.message
    })
    builder.addCase(toggleWish.pending,(state, action)=>{
      const { id, saved } = action.meta.arg
      state.ids = saved ? state.ids.filter((x) => x !== id) : state.ids.concat(id)
      if (saved) state.products = state.products.filter((p) => p.id !== id)
    })
    builder.addCase(toggleWish.fulfilled,(state, action)=>{
      state.ids = action.payload.ids
    })
    builder.addCase(toggleWish.rejected,(state, action)=>{
      const { id, saved } = action.meta.arg
      state.ids = saved ? state.ids.concat(id) : state.ids.filter((x) => x !== id)
    })
  },
})

export default wishlistSlice.reducer
