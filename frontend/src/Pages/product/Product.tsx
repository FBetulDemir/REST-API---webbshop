import { useEffect, useState } from "react"
import "./product.css"
import Header from "../../components/Header";
function Product(){
	const [data,setData]=useState<ProductType[]>([])
	 const [editId, setEditId] = useState<string | null>(null);
	
	interface ProductType {
		pk: string; 
		sk:string;
		name: string;
		amountInStock:number;
		image:string;
		price:number;
		type:string
		
	}
	
	async function getData(){
		const response=await fetch("http://localhost:3000/products")
		if(!response.ok){
			console.log("Can not get data from database")
			return
		}
		const result:ProductType[]=await response.json()
		setData(result)
		
		
	}
	useEffect(()=>{
		getData()
		
	},[])
	async function deleteHandler(productId:string){
		const response= await fetch (`http://localhost:3000/products/${productId}`,{
			method: "DELETE"
			
		})
		if(!response.ok){
			console.log("can not delete data from database")
			return
		}
		const result=await response.json()
		console.log(result)
		getData()
		
		
	}
	function openEditHandler(productId:string){
		setEditId(productId)
		
	}
	function closeHandler(){
		setEditId(null)
	}
	
	return(
		<div className="product-container">
		<Header></Header>
		<h1 className="title">Produkter</h1>
		<div className="container">
		{data && data.map(item=>(
			<div key={item.pk} className="div-product">
			<div className="div-img">
			<img src={item.image} alt="image-ptoduct" />
			
			</div>
			<div className="div-column">
			<h2>Namn: {item.name}</h2>
			<p>Pris: {item.price}</p>
			
			<p>Tillgängligt lager: {item.amountInStock}</p>
			</div>
			<div className="product-button">
			<button>Lägg i kundvagn</button>
			<button onClick={()=>openEditHandler(item.pk)}>Redigera</button>
			<button onClick={() => deleteHandler(item.pk.replace("PRODUCT#", ""))}>Tabort</button>
			</div>
			<div>
				{editId == item.pk && (
				<div className="div-edit">
				<div>
				<label htmlFor="name">Namn: </label>
				<input type="text" id="name" />
				</div>
				<div>
				<label htmlFor="price">Pris: </label>
				<input type="text" id="price" />
				</div>
				<div>
				<label htmlFor="available">Tillgängligt: </label>
				<input type="text" id="available" />
				</div>
				<button>Spara</button>
				<button onClick={closeHandler}>Stäng</button>
				
				</div>
			)}
			</div>
			
			
			</div>
		))}
		
		</div>
		</div>
	)
}
export default Product