import express from 'express';
//import {Order} from '../client/src/api';
import bodyParser = require('body-parser');
const fs = require('fs');
//products holds all information fields on all available products (items). 
const {products} = require('./products.json'); // called once as server launches 

const app = express();
// allOrders holds all information fields (found in orders.Json file), regarding each and every order (not filtered). 
const allOrders: any[] = require('./orders.json'); // called once as server launches
const PORT = 3232;
const PAGE_SIZE = 20;

app.use(bodyParser.json());

app.use((_, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', '*');
	res.setHeader('Access-Control-Allow-Headers', '*');
	next();
});

/**
 * returns true if filter isn't active or is a substring of customer's name / order ID. 
 */
function nameFilter(name:string,order:any):boolean{
	return (name === '' || ( name!=='' && ( (order["customer"]["name"] +' '+ order["id"] )
	.toLowerCase().indexOf(name.toLowerCase()) !== -1 ) ))
}

/**
 * returns true if filter isn't active or is a match for order's fulfillment status. 
 */
function fulfillmentFilter(fulfillment:string,order:any):boolean{
	return (fulfillment === '' || (fulfillment!=='' &&  (order["fulfillmentStatus"].toLowerCase()===(fulfillment.toLowerCase()) )))
}

/**
 * returns true if filter isn't active or is a match for order's payment status. 
 */
function paymentFilter(payment:string,order:any):boolean{
	return (payment === '' || (payment!=='' && ( order["billingInfo"]["status"].toLowerCase()===(payment.toLowerCase())) ))
}

/**
 * returns true if filter isn't active or is a match one of the order's items.   
 */
function productFilter(product:string,order:any):boolean{
	var orderItemNames:string = '';
			
	//orderItemNames holds the products' names for the current order 
	order["items"].forEach((item: { [key: string]: string | number}) => {//declaring item as an object with keys of type string and values of string/number. item:{id:string} would have sufficed.
		orderItemNames = orderItemNames + ' ' + products[item["id"]]["name"]
	});
	return (product === '' || (product!=='' && ( orderItemNames.toLowerCase().indexOf(product.toLowerCase()) !== -1) ))
}

/**
 * returns slice of orders that fits given page and conforms to given filter.
 */ 
app.get('/api/orders', (req, res) => {
	const page = <number>(req.query.page || 1);
	const customerName = <string>(req.query.customerName ||'');
	const fulfillmentStatus = <string>(req.query.fulfillmentStatus ||'');
	const productName = <string>(req.query.productName ||'');
	const paymentStatus = <string>(req.query.paymentStatus ||'');
	
	const orders = <any>[];
	// if an order passes all filters it will appear on the client side, if it matches the page user's on.
	allOrders.forEach(order => {
		if (nameFilter(customerName,order) && fulfillmentFilter(fulfillmentStatus,order) 
			&& paymentFilter(paymentStatus,order) && productFilter(productName,order)){
			orders.push(order)
		}
	});
	
	res.send({
		pages: orders.length/PAGE_SIZE,
		orders: orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
	});
	}
);


/**
 * corresponds to getProductWithSize of api.ts. returns details regarding the item corresponding to id given. 
 */
app.get('/api/items/:itemId', (req, res) => {
	const itemId = <string>(req.params.itemId);
	const size = <string>(req.query.size || 'large');
	const product = products[itemId];
	res.send({
		id: itemId,
		name: product.name,
		price: product.price,
		image: product.images[size]
	});
});

/**
 *  corresponds to getProductsName api.ts. returns all known product names. 
 */
app.get('/api/products/name', (req, res) => {
	const names:string[] = [];
	Object.keys(products).map(key => {
		names.push(products[key].name);
	})
	
	res.send(names);
});

/**
 * returns statistic parameters mentioned below while taking into account 
 * all orders in the database (Json file). 
 */
app.get('/api/statistics', (req, res) => {
	const statistics = {
		totalOrders: allOrders.length,
		paid: 0,
		delivered: 0,
		notDelivered: 0,
	};

	allOrders.forEach(order => {
		if (order["billingInfo"]["status"] == "paid"){
			statistics.paid++;
		}

		if (order["fulfillmentStatus"] == "fulfilled"){
			statistics.delivered++;
		}else{
			statistics.notDelivered++;
		}
	})

	res.send(statistics);
});

/**
 * updates the orders array to accommodate changes to fulfillment status.
 * since said array is loaded at the launch of the server, it will stay unchanged until the app is restarted.   
 */
app.get('/api/database', (req, res) => {
	const orderId = (req.query.orderId); 
	const status = <string>(req.query.newStatus ||'');
	
	for (let i in allOrders) {
		if (allOrders[i].id == orderId) {
			allOrders[i].fulfillmentStatus = status;
			break;
		}
	}

	res.send(); // 200 default 
});
	
	
app.listen(PORT);
console.log('Listening on port', PORT);
