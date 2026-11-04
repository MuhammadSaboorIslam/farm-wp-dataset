import {createSlice,createAsyncThunk} from '@reduxjs/toolkit'
import {get,post,put,del,toQuery} from '../api'
import {logoutUser} from './auth'

export const CATEGORIES = ['Vegetables', 'Fruits', 'Dairy & Eggs', 'Grains', 'Honey', 'Herbs', 'Meat & Poultry']
export const UNITS = ['kg', 'dozen', 'litre', 'bunch', 'piece']

export const defaultFilters = {
  q: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  location: '',
  sort: 'newest',
  page: 0,
}

export const loadProducts = createAsyncThunk('products/load', (filters) => get('/products' + toQuery(filters)))
export const loadProduct = createAsyncThunk('products/loadOne', (id) => get('/products/' + id))
export const loadMyProducts = createAsyncThunk('products/loadMine', () => get('/products?farmer=me&size=100'))
export const createProduct = createAsyncThunk('products/create', (form) => post('/products', form))
export const updateProduct = createAsyncThunk('products/update', ({id, form}) => put('/products/' + id, form))
export const deleteProduct = createAsyncThunk('products/delete', async (id) => {
  await del('/products/' + id)
  return id
})
export const addReview = createAsyncThunk('products/review', (form) => post('/reviews', form))

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    list: [],
    page: { number: 0, totalPages: 0, totalElements: 0 },
    filters: { ...defaultFilters },
    loading: false,
    error: null,

    current: null,
    reviews: [],

    mine: [],
    mineLoading: false,
    saving: false,
    saveError: null,
  },
  reducers: {
    setFilters(state, action){
      const changes = action.payload
      state.filters = { ...state.filters, ...changes }
      if (!('page' in changes)){
        state.filters.page = 0
      }
    },
    resetFilters(state){
      state.filters = { ...defaultFilters }
    },
    clearSaveError(state){
      state.saveError = null
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logoutUser, (state) => {
      state.mine = []
      state.saveError = null
    })
    builder.addCase(loadProducts.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(loadProducts.fulfilled, (state, action) => {
      state.loading = false
      state.list = action.payload.products
      state.page = action.payload.page
    })
    builder.addCase(loadProducts.rejected, (state, action) => {
      state.loading = false
      state.error = action.error.message
    })

    builder.addCase(loadProduct.pending, (state) => {
      state.loading = true
      state.error = null
      state.current = null
      state.reviews = []
    })
    builder.addCase(loadProduct.fulfilled, (state, action) => {
      state.loading = false
      state.current = action.payload.product
      state.reviews = action.payload.reviews
    })
    builder.addCase(loadProduct.rejected, (state, action) => {
      state.loading = false
      state.error = action.error.message
    })

    builder.addCase(loadMyProducts.pending, (state) => {
      state.mineLoading = true
    })
    builder.addCase(loadMyProducts.fulfilled, (state, action) => {
      state.mineLoading = false
      state.mine = action.payload.products
    })
    builder.addCase(loadMyProducts.rejected, (state, action) => {
      state.mineLoading = false
      state.error = action.error.message
    })

    builder.addCase(createProduct.pending, (state) => {
      state.saving = true
      state.saveError = null
    })
    builder.addCase(createProduct.fulfilled, (state, action) => {
      state.saving = false
      state.mine.unshift(action.payload.product)
    })
    builder.addCase(createProduct.rejected, (state, action) => {
      state.saving = false
      state.saveError = action.error.message
    })

    builder.addCase(updateProduct.pending, (state) => {
      state.saving = true
      state.saveError = null
    })
    builder.addCase(updateProduct.fulfilled, (state, action) => {
      state.saving = false
      for (let i = 0; i < state.mine.length; i++){
        if (state.mine[i].id === action.payload.product.id){
          state.mine[i] = action.payload.product
        }
      }
    })
    builder.addCase(updateProduct.rejected, (state, action) => {
      state.saving = false
      state.saveError = action.error.message
    })

    builder.addCase(deleteProduct.fulfilled, (state, action) => {
      state.mine = state.mine.filter(p => p.id !== action.payload)
    })

    builder.addCase(addReview.fulfilled, (state, action) => {
      state.reviews.unshift(action.payload.review)
      if (state.current){
        const n = state.current.reviewCount + 1
        state.current.rating = Math.round((state.current.rating * state.current.reviewCount + action.payload.review.rating) / n * 10) / 10
        state.current.reviewCount = n
      }
    })
  },
})

export const { setFilters, resetFilters, clearSaveError } = productsSlice.actions
export default productsSlice.reducer
