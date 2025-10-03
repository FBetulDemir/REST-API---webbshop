import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "./Pages/Home/Home";
import Product from "./Pages/product/product";
import Cart from "./Pages/cart/cart";
import Login from "./Pages/user/Login.tsx";
import Register from "./Pages/user/Register.tsx";

function App() {
  return (
    <>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home></Home>}></Route>
          <Route path="/product" element={<Product></Product>}></Route>
          <Route path="/cart" element={<Cart></Cart>}></Route>
          <Route path="/user/login" element={<Login />} />
          <Route path="/user/register" element={<Register />} />
        </Routes>
      </HashRouter>
    </>
  );
}

export default App;
