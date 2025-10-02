import { useEffect, useState } from "react"
import "./product.css"
function Product(){
	const [data,setData]=useState<ProductType[]>([])
	
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
	
	
	return(
		<div className="product-container">
		<h1 className="title">PRODUCTS</h1>
		<div className="container">
		{data && data.map(item=>(
			<div key={item.pk} className="div-product">
			<div>
			<img src={item.image} alt="image-ptoduct" />
			
			</div>
			<div className="div-column">
			<h2>Name: {item.name}</h2>
			<p>Price:{item.price}</p>
			
			<p>Available Stock:{item.amountInStock}</p>
			</div>
			<div className="product-button">
			<button>Add to order</button>
			<button>Edit</button>
			<button>Delete</button>
			</div>
			
			
			</div>
		))}
		
		</div>
		</div>
	)
}
export default Product