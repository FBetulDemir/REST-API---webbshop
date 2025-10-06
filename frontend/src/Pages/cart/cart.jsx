import { useEffect, useState } from "react"
import "./cart.css"

function Cart(){
	const [data, setData] = useState([])
	const [products, setProducts] = useState([])

	async function getData(){
		// Backend styr allt via session
		const [cartResponse, productsResponse] = await Promise.all([
			fetch("http://localhost:3000/api/cart", {
				credentials: 'include' // Inkludera session cookies
			}),
			fetch("http://localhost:3000/products")
		])

		if(!cartResponse.ok || !productsResponse.ok){
			console.log("Can not get data from database")
			return
		}

		const allCarts = await cartResponse.json()
		const productsResult = await productsResponse.json()
		
		// Backend filtrerar redan för användaren via session
		const userCarts = allCarts
		
		// Kombinera cart-data med produktinformation
		const cartWithProducts = userCarts.map(cart => {
			const product = productsResult.find(p => p.pk.replace("PRODUCT#", "") === cart.productId)
			return {
				...cart,
				productName: product?.name || 'Okänd produkt',
				productImage: product?.image || '',
				productPrice: product?.price || 0
			}
		})
		
		setData(cartWithProducts)
		setProducts(productsResult)
	}

	useEffect(() => {
		getData()
	}, [])

	async function deleteHandler(cartId){
		const response = await fetch(`http://localhost:3000/api/cart/${cartId}`, {
			method: "DELETE",
			credentials: 'include' // Inkludera session cookies
		})
		if(!response.ok){
			console.log("can not delete data from database")
			return
		}
		const result = await response.json()
		console.log("Produkt borttagen från varukorgen!")
		
		// Uppdatera listan
		getData()
	}

	async function updateAmountHandler(cartId, newAmount){
		const response = await fetch(`http://localhost:3000/api/cart/${cartId}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: 'include', // Inkludera session cookies
			body: JSON.stringify({ amount: newAmount })
		})
		if(!response.ok){
			console.log("can not update amount")
			return
		}
		const result = await response.json()
		console.log("Antal uppdaterat!")
		
		// Uppdatera listan
		getData()
	}


	return(
		<div className="cart-container">
			<h1 className="title">Varukorg</h1>
			
			<div className="container">
				{data && data.map(item => (
					<div key={item.id} className="div-product">
						<div className="div-img">
							{item.productImage ? (
								<img src={item.productImage} alt={item.productName} />
							) : (
								<div className="placeholder-img">📦</div>
							)}
						</div>
						<div className="div-column">
							<h2>{item.productName}</h2>
							<p>Pris: {item.productPrice} kr</p>
							<div className="amount-controls">
								<label>Antal:</label>
								<input 
									type="number" 
									value={item.amount} 
									min="1"
									onChange={(e) => updateAmountHandler(item.id, parseInt(e.target.value))}
									className="amount-input"
								/>
							</div>
						</div>
						<div className="product-button">
							<button onClick={() => deleteHandler(item.id)}>Ta bort</button>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

export default Cart