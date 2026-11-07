import {createSlice} from '@reduxjs/toolkit'
import {logoutUser} from './auth'

function save(items){
  localStorage.setItem('cart', JSON.stringify(items))
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: JSON.parse(localStorage.getItem('cart')) || [],
  },
  reducers: {
    addToCart(state, action){
      const { product, qty } = action.payload
      let found = null
      for (let i = 0; i < state.items.length; i++){
        if (state.items[i].product === product.id){
          found = state.items[i]
        }
      }
      if (found){
        found.qty = Math.min(found.qty + qty, product.quantity)
      } else {
        state.items.push({
          product: product.id,
          name: product.name,
          price: product.price,
          unit: product.unit,
          image: product.images[0] || '',
          max: product.quantity,
          qty: Math.min(qty, product.quantity),
          farmerId: product.farmer.id,
          farmName: product.farmer.farmName,
        })
      }
      save(state.items)
    },
    setQty(state, action){
      const { product, qty } = action.payload
      for (let i = 0; i < state.items.length; i++){
        if (state.items[i].product === product){
          state.items[i].qty = Math.max(1, Math.min(qty, state.items[i].max))
        }
      }
      save(state.items)
    },
    removeFromCart(state, action){
      const keep = []
      for (let i = 0; i < state.items.length; i++){
        if (state.items[i].product !== action.payload) keep.push(state.items[i])
      }
      state.items = keep
      save(state.items)
    },
    clearCart(state){
      state.items = []
      save(state.items)
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logoutUser, (state) => {
      state.items = []
      save(state.items)
    })
  },
})

export const { addToCart, setQty, removeFromCart, clearCart } = cartSlice.actions

export function cartCount(state){
  let n = 0
  for (let i = 0; i < state.cart.items.length; i++){
    n += state.cart.items[i].qty
  }
  return n
}

export default cartSlice.reducer
