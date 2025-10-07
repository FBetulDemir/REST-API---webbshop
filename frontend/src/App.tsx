import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "./Pages/Home/Home";
import Product from "./Pages/product/Product";
import Cart from "./Pages/cart/cart";
import Login from "./Pages/user/Login.tsx";
import Register from "./Pages/user/Register.tsx";
import Header from "./components/Header.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import "./App.css";

function App() {
  return (
    <>
      <HashRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Home></Home>}></Route>
          <Route path="/product" element={<Product></Product>}></Route>
          <Route path="/cart" element={
            <ProtectedRoute>
              <Cart></Cart>
            </ProtectedRoute>
          }></Route>
          <Route path="/user/login" element={<Login />} />
          <Route path="/user/register" element={<Register />} />
        </Routes>
      </HashRouter>
    </>
  );
}

export default App;
