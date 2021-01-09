import axios from 'axios';

export type Customer = {
	name: string;
}

export type BillingInfo = {
	status: string;
}

export type Price = {
	formattedTotalPrice: string;
}

export type Order = {
	id: number;
	createdDate: string;
	fulfillmentStatus: string;
	billingInfo: BillingInfo;
	customer: Customer;
	itemQuantity: number;
	price: Price;
	items: OrderItem[];
}

export type OrderItem = {
	id: string;
	quantity: number;
}

export type Item = {
	id: string;
	name: string;
	price: number;
	image: string;
}

export type OrdersResult = {
	orders: Order[];
	pages: number;
}

// filters made available for user
export type SearchParams = {
	customerName: string; 
	fulfillmentStatus: string;  
	productName: string;
	paymentStatus: string;
}

export type Statistics = {
	totalOrders: number;
	paid: number;
	delivered: number;
	notDelivered: number;
}

export type ApiClient = {	
	//returns orders that corresponds to given page number and filters.
	getOrders:(searchParams:SearchParams, page: number) => Promise<OrdersResult>;
	// replaced by getProductWithSize. kept for backwards compatibility's sake.   
	getProduct: (itemId: string) => Promise<Item>;
	// returns product that corresponds to given item id and image size. 
	getProductWithSize: (itemId: string, size: string) => Promise<Item>;
	// returns all available product names for the filters menu. 
	getProductsName: () => Promise<string[]>;
	//returns the attributes of the statistics type defined above, regarding the whole, unfiltered orders in our database (Json file)
	getStatistics: () => Promise<Statistics>;
	//pseudo updates the database, i.e updates the allOrders string, located in the server-side,
	// which contains the orders within orders.json. 
	updateDB:(orderId:number,newStatus:string)=>Promise<null>;
}

export const createApiClient = (): ApiClient => {
	return {
		getOrders: (searchParams:SearchParams, page: number) => {
				
			const params = {
				customerName:searchParams.customerName,
				fulfillmentStatus:searchParams.fulfillmentStatus,
				productName:searchParams.productName,
				paymentStatus:searchParams.paymentStatus,
				page:page
			};

			return axios.get(`http://localhost:3232/api/orders`, {params}).then((res) =>{return res.data});
		},
		getProduct: (itemId: string) => {
			return axios.get(`http://localhost:3232/api/items/${itemId}`).then((res) => res.data);
		},
		
		getProductWithSize: (itemId: string, size: string) => {
			const params = {
				size: size
			};
		
			return axios.get(`http://localhost:3232/api/items/${itemId}`, {params}).then((res) => res.data);
		},
		getProductsName: () => {
			return axios.get(`http://localhost:3232/api/products/name`).then((res) => res.data);
		},
		getStatistics: () => {
			return axios.get(`http://localhost:3232/api/statistics`).then((res) => res.data);
		},
		updateDB:(orderId:number,newStatus:string)=>{
			const params = {
				orderId: orderId,
				newStatus:newStatus
			};

			return axios.get(`http://localhost:3232/api/database`,{params});
		}
	}
};



