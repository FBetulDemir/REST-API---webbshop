import "./Header.css"
import logo from "../images/1cc7d577-c28b-480b-841d-c7b0d020a93d.png"
import { NavLink } from "react-router-dom"
function Header(){
	return(
		<div className="container-header">
			<div>
				<img src={logo} alt="logo" />

			</div>
			<div className="nav">
				<NavLink to={"/"}>Home</NavLink>
				<NavLink to={"/product"}>Products</NavLink>
				<NavLink to={"/cart"}>Cart</NavLink>


			</div>
		</div>
	)
}
export default Header