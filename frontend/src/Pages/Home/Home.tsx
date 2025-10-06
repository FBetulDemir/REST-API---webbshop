import "./Home.css";
import webbshop from "../../images/Starta-en-webbshop.jpg";
import { NavLink } from "react-router-dom";
function Home() {
  return (
    <div>
      <h2>
        Upptäck trendiga kläder och accessoarer för alla tillfällen. Snabb
        leverans och enkel shopping direkt online
      </h2>
      <div className="image-Home">
        <img src={webbshop} alt="Webbshop" />
        <NavLink to={"/product"}>Shoppa nu</NavLink>
      </div>
    </div>
  );
}

export default Home;
