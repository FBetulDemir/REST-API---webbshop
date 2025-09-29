import z from "zod"
 const productSchema=z.object({
	pk:z.string(),
	sk:z.string(),
	amountInStock:z.number().nonnegative(),
	image: z.string().url("Invalid image URL"),
	name:z.string().min(1, "Product name is required"),
	price:z.number().positive("Price must be positive"),
	type:z.string().min(1, "Product type is required")
})
export const productsArraySchema = z.array(productSchema);


export const createProductSchema=z.object({
	 name: z.string().min(1, "Product name is required"),
  price: z.number().positive("Price must be positive"),
 image: z.string().url("Invalid image URL"),
  amountInStock: z.number().nonnegative("Stock cannot be negative"),
  type: z.string().min(1, "Product type is required")
})