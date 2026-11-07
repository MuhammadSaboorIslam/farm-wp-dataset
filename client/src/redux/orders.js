import {createSlice,createAsyncThunk} from '@reduxjs/toolkit'
import {get,post,patch} from '../api'
import {logoutUser} from './auth'

export const STATUS_LABELS = {
  placed: 'Placed',
  packed: 'Packed',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const placeOrder = createAsyncThunk('orders/place', (form) => post('/orders', form))
export const loadMyOrders = createAsyncThunk('orders/mine', () => get('/orders/mine'))
export const loadOrder = createAsyncThunk('orders/one', (id) => get('/orders/' + id))
export const setOrderStatus = createAsyncThunk('orders/status', ({id, status}) => patch('/orders/' + id + '/status', { status: status }))
export const loadAvailable = createAsyncThunk('orders/available', () => get('/orders/available'))
export const claimOrder = createAsyncThunk('orders/claim', (id) => post('/orders/' + id + '/claim'))

function withoutOrder(list, id){
  const keep = []
  for (let i = 0; i < list.length; i++){
    if (list[i].id != id) keep.push(list[i])
  }
  return keep
}

function replaceIn(list, order){
  for (let i = 0; i < list.length; i++){
    if (list[i].id === order.id){
      list[i] = order
    }
  }
}

const initialState = {
  list: [],
  available: [],
  current: null,
  loading: false,
  error: null,
  placing: false,
  placeError: null,
  placed: null,
}

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearPlaced(state){
      state.placed = null
      state.placeError = null
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logoutUser, () => initialState)
    builder.addCase(placeOrder.pending, (state) => {
      state.placing = true
      state.placeError = null
    })
    builder.addCase(placeOrder.fulfilled, (state, action) => {
      state.placing = false
      state.placed = action.payload.orders
    })
    builder.addCase(placeOrder.rejected, (state, action) => {
      state.placing = false
      state.placeError = action.error.message
    })

    builder.addCase(loadMyOrders.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(loadMyOrders.fulfilled, (state, action) => {
      state.loading = false
      state.list = action.payload.orders
    })
    builder.addCase(loadMyOrders.rejected, (state, action) => {
      state.loading = false
      state.error = action.error.message
    })

    builder.addCase(loadOrder.pending, (state) => {
      state.loading = true
      state.error = null
      state.current = null
    })
    builder.addCase(loadOrder.fulfilled, (state, action) => {
      state.loading = false
      state.current = action.payload.order
    })
    builder.addCase(loadOrder.rejected, (state, action) => {
      state.loading = false
      state.error = action.error.message
    })

    builder.addCase(setOrderStatus.fulfilled, (state, action) => {
      const o = action.payload.order
      replaceIn(state.list, o)
      state.available = withoutOrder(state.available, o.id)
      if (state.current && state.current.id === o.id){
        state.current = o
      }
    })
    builder.addCase(setOrderStatus.rejected, (state, action) => {
      state.error = action.error.message
    })

    builder.addCase(loadAvailable.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(loadAvailable.fulfilled, (state, action) => {
      state.loading = false
      state.available = action.payload.orders
    })
    builder.addCase(loadAvailable.rejected, (state, action) => {
      state.loading = false
      state.error = action.error.message
    })

    builder.addCase(claimOrder.fulfilled, (state, action) => {
      const o = action.payload.order
      state.available = withoutOrder(state.available, o.id)
      state.list.unshift(o)
    })
    builder.addCase(claimOrder.rejected, (state, action) => {
      state.error = action.error.message
    })
  },
})

export const { clearPlaced } = ordersSlice.actions
export default ordersSlice.reducer
