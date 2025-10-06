import { useEffect, useState } from "react"
import "./product.css"
function Product(){
	const [data,setData]=useState<ProductType[]>([])
	const [editId, setEditId] = useState<string | null>(null);
	const[addProduct,setAddProduct]=useState(false)
	
	const[addId,setAddId]=useState("")
	const[addName,setAddName]=useState("")
	const[addPrice,setAddPrice]=useState("")
	const[addImage,setAddImage]=useState("")
	const[addAmountInStock,setAddAmountInStock]=useState("")
	const[addType,setAddType]=useState("")
	
	interface ProductType {
		pk: string; 
		sk:string;
		name: string;
		amountInStock:number;
		image:string;
		price:number;
		type:string
		
	}
	interface addproduct{
		id:number,
		amountInStock:number,
		image:string,
		name:string,
		price:number,
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
	function addHandler(){
		setAddProduct(true)
	}
	
	function closeAddHandler(){
		setAddProduct(false)
	}
	async function SaveProductHandler() {
		const newProduct:addproduct={
			id:Number(addId),
			amountInStock:Number(addAmountInStock),
			image:addImage,
			name:addName,
			price:Number(addPrice),
			type:addType



		}
		const response=await fetch("http://localhost:3000/products",{
			method:"POST",
			headers: {
				"Content-Type": "application/json",
			},
			body:JSON.stringify(newProduct)
		})
		if(!response.ok){
			console.log("can not post a new product")
			return
		}
		const result=await response.json()
		console.log(result)
		
		setAddProduct(false)
		getData()
	}

	async function addToCartHandler(productId: string) {
		// Hämta userId från localStorage (sparas efter login)
		const userId = localStorage.getItem('userId')
		
		if (!userId) {
			console.log("Du måste logga in först!")
			return
		}
		
		const amount = 1
		
		const newCartItem = {
			userId: userId,
			productId: productId,
			amount: amount
		}
		
		const response = await fetch("http://localhost:3000/api/cart", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(newCartItem)
		})
		
		if(!response.ok){
			console.log("can not add to cart")
			return
		}
		
		const result = await response.json()
		console.log("Added to cart:", result)
	}
	
	return(
		<div className="product-container">
		<h1 className="title">Produkter</h1>
		<div className="add-product">
		<button onClick={addHandler}>Lägg till produkt</button>
		
		{addProduct && (
			<div>
			<div className="div-add">
					
			<label htmlFor="addId">Id: </label>
			<input type="text" id="addId" value={addId} onChange={(e)=>setAddId(e.target.value)}/>
			
			<label htmlFor="addName">Namn: </label>
			<input type="text" id="addName" value={addName} onChange={(e)=>setAddName(e.target.value)}/>
			
			<label htmlFor="addPrice">Pris: </label>
			<input type="text" id="addPrice"  value={addPrice} onChange={(e)=>setAddPrice(e.target.value)}/>

			<label htmlFor="addImage">Bild: </label>
			<input type="text" id="addImage"  value={addImage} onChange={(e)=>setAddImage(e.target.value)}/>
			
			<label htmlFor="addAvailable">Tillgängligt: </label>
			<input type="text" id="addAvailable"  value={addAmountInStock} onChange={(e)=>setAddAmountInStock(e.target.value)}/>

			<label htmlFor="addType">Typ: </label>
			<input type="text" id="addType"  value={addType} onChange={(e)=>setAddType(e.target.value)}/>
			
			
			</div>
			<button onClick={SaveProductHandler}>Spara</button>
			<button onClick={closeAddHandler}>Stäng</button>
			</div>
			
		)}
		
		
		</div>
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
			<button onClick={() => addToCartHandler(item.pk.replace("PRODUCT#", ""))}>Lägg i kundvagn</button>
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