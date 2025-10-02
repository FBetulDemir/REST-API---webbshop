
import { HashRouter,Routes,Route } from "react-router-dom"
import Home from "./Pages/Home/Home"
import Product from "./Pages/product/Product"
import Cart from "./Pages/cart/cart"
import User from "./Pages/user/user"
function App() {

  return (
    <>
<HashRouter>
	<Routes>
		<Route path="/" element={<Home></Home>}></Route>
		<Route path="/product" element={<Product></Product>}></Route>
		<Route path="/cart" element={<Cart></Cart>}></Route>
		<Route path="/user" element={<User></User>}></Route>
	</Routes>
</HashRouter>
    </>
  )
}

export default App
