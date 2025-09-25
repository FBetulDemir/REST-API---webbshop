import z from "zod"
 const productSchema=z.object({
	pk:z.string(),
	sk:z.string(),
	amountInStock:z.number().nonnegative(),
	image:z.url(),
	name:z.string().min(1, "Product name is required"),
	price:z.number(),
	type:z.string().min(1, "Product type is required")
})
export const productsArraySchema = z.array(productSchema);