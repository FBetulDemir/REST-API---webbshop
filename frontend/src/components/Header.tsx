import "./Header.css";
import logo from "../images/1cc7d577-c28b-480b-841d-c7b0d020a93d.png";
import { NavLink } from "react-router-dom";
function Header() {
  return (
    <div className="container-header">
      <div className="logo-container">
        <img src={logo} alt="logo" />
      </div>
      <div className="nav">
        <NavLink to={"/"}>Hem</NavLink>
        <NavLink to={"/product"}>Produkter</NavLink>
        <NavLink to={"/cart"}>Varukorg</NavLink>
        <NavLink to={"/user/register"}>Registrera dig</NavLink>
        <NavLink to={"/user/login"}>Logga in</NavLink>
      </div>
    </div>
  );
}
export default Header;
