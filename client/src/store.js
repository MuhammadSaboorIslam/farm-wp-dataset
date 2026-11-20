import { configureStore } from '@reduxjs/toolkit'
import authReducer from './redux/auth'
import uiReducer from './redux/ui'
import productsReducer from './redux/products'
import cartReducer from './redux/cart'
import ordersReducer from './redux/orders'
import farmsReducer from './redux/farms'
import notificationsReducer from './redux/notifications'
import adminReducer from './redux/admin'
import wishlistReducer from './redux/wishlist'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    products: productsReducer,
    cart: cartReducer,
    orders: ordersReducer,
    farms: farmsReducer,
    notifications: notificationsReducer,
    admin: adminReducer,
    wishlist: wishlistReducer,
  },
})
