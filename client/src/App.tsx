import React, { MouseEvent } from 'react';
import './App.scss';
import {createApiClient, Order, Statistics,SearchParams} from './api';
import OrderItems from './OrderItems';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';

export type AppState = {
	orders?: Order[], 			  // list of orders that fit the current page, based on user filters.
	clickedOrderID: number,      // keeps track on latest order that was clicked and in "drop down" mode. 
	page: number, 			    // current page the user's in.
	lastPage: number, 		   // disabling "Next" button upon page reaching this value.    
	productNames?: string[],  // available items' names. 
	statistics?: Statistics  // keeps track of statistics, as requested in Part D.
	filters:SearchParams  	// centralizes all filters made available to the user.
}

enum PageNumber{
	First = -3,
	Prev = -2,
	Last = -1,
	Next = 0
}

const api = createApiClient();

export class App extends React.PureComponent<{}, AppState> {

	state: AppState = {
		clickedOrderID: -1,
		page: 1,
		lastPage: 1,
		filters:{customerName:'',fulfillmentStatus:'',productName:'',paymentStatus:''}
	};

	searchDebounce: any = null;
	
	async componentDidMount() {
		const ordersResults = await api.getOrders(this.state.filters, this.state.page);

		this.setState({
			orders: ordersResults.orders,
			lastPage: ordersResults.pages,
			productNames: await api.getProductsName(),
			statistics: await api.getStatistics()
		});
	}

	/**
	 * updates orders to conform to user input (along with currently active filters) and current page.
	 */
	onSearch = async (value: string) => {
		clearTimeout(this.searchDebounce);
		this.searchDebounce = setTimeout(async () => {
			const newFilter:SearchParams = Object.assign({},this.state.filters);
			newFilter.customerName = value
			let ordersResults = await api.getOrders(newFilter , this.state.page);

			// if filter update won't fetch enough orders to reach current page, reset user to first page
			if (ordersResults.orders === undefined || ordersResults.orders.length == 0) {
				this.state.page = 1; // value is set outside of setState to avoid an unnecessary render.
				ordersResults = await api.getOrders(newFilter, this.state.page);
			}

			this.setState({
				orders:  ordersResults.orders,
				lastPage: ordersResults.pages,
				filters: newFilter
			});
		}, 300);
		};
	


	render() {
		const {orders} = this.state;  // orders is initialized to state.orders 
		return (
			<main className = 'main'>
				<h1>Orders</h1>
				{this.renderStatisticsCards()}
				<header>
					<input type="search" placeholder="Search orders by customer name or order ID" 
					onChange={(e) => this.onSearch(e.target.value)}/>
				</header>
				{this.renderFilters()}
				{orders ? <div className='results'>Showing {orders.length} results</div> : null}
				{orders ? this.renderOrders() : <h2>Loading...</h2>}
				{this.renderPagination()}
			</main>
		)
	}

	renderPagination(){
		return(
			<Grid
                container
                direction="row"
                justify="center"
                alignItems="center">
                <Grid item xs={2}>
					<Button variant="contained" color="primary" 
					onClick={this.onPageClick(PageNumber.First)} 
                    disabled={this.state.page==1}> First </Button>
                </Grid>
                <Grid item xs={3}>
					<Button variant="contained" color="primary" 
					onClick={this.onPageClick(PageNumber.Prev)} 
                    disabled={this.state.page==1}> Previous </Button>
                </Grid>
				<Grid item xs={3}>
					<br/>
                    <p className = 'pageNumber'>
						Page {  this.state.page} of {Math.ceil(this.state.lastPage}
					</p>
				</Grid>
				
                <Grid item xs={2}>
                    <Button variant="contained" color="primary" onClick={this.onPageClick(PageNumber.Next)} 
                    disabled={this.state.lastPage <= this.state.page}> Next </Button>
                </Grid>
                <Grid>
                    <Button variant="contained" color="primary" onClick={this.onPageClick(PageNumber.Last)}
                     disabled={this.state.lastPage <= this.state.page}> Last </Button>
                </Grid>
            </Grid>
		)
	}


	renderStatisticsCards() {
		return(
			<Grid
				container
				className='filtersGrid'
				direction='row'
				justify='flex-start'
				alignItems='flex-start'>
				<Grid item xs={2}>
					<Card className='statisticsCard'>
						<CardContent>
							<Typography color="textSecondary" gutterBottom>
								Total Orders
							</Typography>
							<Typography variant="h5" component="h2">
								{this.state.statistics?.totalOrders}
							</Typography>
						</CardContent>
		 	 		</Card>
				</Grid>
				<Grid item xs={1}></Grid>
				<Grid item xs={2}>
					<Card className='statisticsCard'>
			  			<CardContent>
							<Typography color="textSecondary" gutterBottom>
								Paid Orders
							</Typography>
							<Typography variant="h5" component="h2">
								{this.state.statistics?.paid}
							</Typography>
		  				</CardContent>
					</Card>
				</Grid>
				<Grid item xs={1}></Grid>
				<Grid item xs={2}>
					<Card className='statisticsCard'>
						<CardContent>
							<Typography color="textSecondary" gutterBottom>
								Delivered
							</Typography>
							<Typography variant="h5" component="h2">
								{this.state.statistics?.delivered}
							</Typography>
						</CardContent>
		  		</Card>
				</Grid>
				<Grid item xs={1}></Grid>
				<Grid item xs={2}>
					<Card className='statisticsCard'>
						<CardContent>
							<Typography color="textSecondary" gutterBottom>
								Not Delivered
							</Typography>
							<Typography variant="h5" component="h2">
								{this.state.statistics?.notDelivered}
							</Typography>
						</CardContent>
		  		</Card>
				</Grid>
				<Grid item xs={1}></Grid>
			</Grid>
		)
	}

	
	renderFilters(){
		return(
			<Grid
				container
				className='filtersGrid'
				direction='row'
				justify='flex-start'
				alignItems='flex-start'>
				<Grid item xs={3}>
				<FormControl className={'selectForm'}>
					<InputLabel className="inputLabel" id="fulfillmentStatusFilterLabel">Fulfillment Status</InputLabel>
					<Select className="inputLabel"
						id="fulfillmentStatusFilter"
						value={this.state.filters.fulfillmentStatus}
						onChange={this.onFulfillmentStatusChange}
						>
						<MenuItem className='defaultLabel' value=""><em>None</em></MenuItem>
						<MenuItem value={'fulfilled'}>Fulfilled</MenuItem>
						<MenuItem value={'not-fulfilled'}>Not-Fulfilled</MenuItem>
						<MenuItem value={'canceled'}>Canceled</MenuItem>
					</Select>
				</FormControl>
				</Grid>
				<Grid item xs={3}>
					<FormControl className={'selectForm'}>
						<InputLabel className="inputLabel" id="productNameFilterLabel">Product Name</InputLabel>
						<Select className="inputLabel"
							id="productNameFilter"
							value={this.state.filters.productName}
							onChange={this.onProductNameChange}
							>
							<MenuItem className='defaultLabel' value=""><em>None</em></MenuItem>
							{
								this.state.productNames?.map(name => {
									return(
										<MenuItem value={name}>{name}</MenuItem>
									);
								})
							}
						</Select>
					</FormControl>			
				</Grid>
				<Grid item xs={3}>
					<FormControl className={'selectForm'}>
						<InputLabel className="inputLabel" id="paymentStatusFilterLabel">Payment Status</InputLabel>
						<Select className="inputLabel"
							id="paymentStatusFilter"
							value={this.state.filters.paymentStatus}
							onChange={this.onPaymentStatusChange}
							>
							<MenuItem className='defaultLabel' value=""><em>None</em></MenuItem>
							<MenuItem value={'paid'}>Paid</MenuItem>
							<MenuItem value={'not-paid'}>Not-paid</MenuItem>
							<MenuItem value={'refunded'}>Refunded</MenuItem>
						</Select>
					</FormControl>				
				</Grid>
				<Grid item xs={3}>
					<Button className='clearFilters' variant="contained" color="primary" onClick={this.onFiltersClear}> Clear Filters </Button>
				</Grid>
			</Grid>
		)
	}

	renderOrders = () => {
		return (
			<div className='orders'>
				{this.state.orders?.map((order) => (
					<div className={'orderCard'} onClick={this.onOrderClick(order.id)}>
						<div className={'generalData'}>
							<h6>{order.id}</h6>
							<h4>{order.customer.name}</h4>
							<h5>Order Placed: {new Date(order.createdDate).toLocaleString()}</h5>
						</div>
						<div className={'fulfillmentData'}>
							<h4>{order.itemQuantity} Items</h4>
							<img src={App.getAssetByStatus(order.fulfillmentStatus)}/>
							{order.fulfillmentStatus !== 'canceled' &&
								<a onClick={this.onStatusChange(order.id, order.fulfillmentStatus)} >Mark as {order.fulfillmentStatus === 'fulfilled' ? 'Not Delivered' : 'Delivered'}</a>
							}
						</div>
						<div className={'paymentData'}>
							<h4>{order.price.formattedTotalPrice}</h4>
							<img src={App.getAssetByStatus(order.billingInfo.status)}/>
						</div>
						{
							(this.state.clickedOrderID == order.id)?
							order.items.map(item => {
								return(
									<OrderItems item={item}/>
								)
							}): null
						}
					</div>
				))}
				
				
			</div>
		)
	};


	/**
	 * reloads orders for current page after an update to one of the filters was introduced. 
	 */
	onFilterChange = async () => {
		let ordersResults = await api.getOrders(this.state.filters, this.state.page);
		
		// if filter update won't fetch enough orders to reach current page, reset user to first page
		if (ordersResults.orders === undefined || ordersResults.orders.length == 0) {
			this.state.page = 1; // value is set outside of setState to avoid an unnecessary render.
			ordersResults = await api.getOrders(this.state.filters, this.state.page);
		}

		this.setState({
			orders:  ordersResults.orders,
			lastPage: ordersResults.pages,
		})
	}
	/**
	 * updates filters to accommodate change to fulfillment status and reloads orders (through onFilterChange()) 
	 */
	onFulfillmentStatusChange = async (e:any) => {
		const newFilter:SearchParams = Object.assign({},this.state.filters);
		newFilter.fulfillmentStatus = e.target.value;
		await this.setState({
			filters: newFilter
		})

		this.onFilterChange();
	}

	/**
	 * updates filters to accommodate change to product selection and reloads orders (through onFilterChange()) 
	 */
	onProductNameChange = async (e:any) => {
		const newFilter:SearchParams = Object.assign({},this.state.filters);
		newFilter.productName = e.target.value;
		await this.setState({
			filters: newFilter
		})

		this.onFilterChange();
	}

	/**
	 * updates filters to accommodate change to payment status and reloads orders (through onFilterChange()) 
	 */
	onPaymentStatusChange = async (e:any) => {
		const newFilter:SearchParams = Object.assign({},this.state.filters);
		newFilter.paymentStatus = e.target.value;
		await this.setState({
			filters: newFilter
		})

		this.onFilterChange();
	}

	/**
	 * clears filters (apart from customerName) and reloads orders (through onFilterChange()) 
	 */
	onFiltersClear = async() => {
		const newFilter:SearchParams = Object.assign({},this.state.filters);
		newFilter.fulfillmentStatus = '';
		newFilter.productName = '';
		newFilter.paymentStatus = '';
		await this.setState({
			filters:newFilter,
		})
		this.onFilterChange()
	}

	/**
	 * loads next batch of orders for either the previous or the next page.
	 */
	onPageClick = (pageNum:number) =>
	async () => 
	{	
		let newPage:number;
		if (pageNum == PageNumber.First){
			newPage=1;
		}
		else if(pageNum == PageNumber.Prev){
			newPage = this.state.page - 1;
		}
		else if(pageNum == PageNumber.Next){
			newPage = this.state.page + 1;
		}
		else if(pageNum == PageNumber.Last){
			newPage = Math.ceil(this.state.lastPage);
		}
		else{
			newPage = pageNum;
		}


		const orderData = await api.getOrders(this.state.filters,newPage);
		
		this.setState({
			orders: orderData["orders"],
			page: newPage,
			lastPage: orderData["pages"]
		})
	}
	
	/**
	 * tracks the last order that was clicked odd number of times (to open / close items description) 
	 */
	onOrderClick = (orderID: number) => {
		return (event: MouseEvent) => {
			if (this.state.clickedOrderID == orderID){
				orderID = -1;
			}

			this.setState({
				clickedOrderID: orderID
			})
		} 
	}

	/**
	 * updates statistics and current orders upon change to fulfillment status (state.orders). 
	 */
	onStatusChange = (orderID:number, fulfillmentStatus: string) => {
		return (event: MouseEvent) => {
			const newStatus: "not-fulfilled" | "fulfilled" = this.getNewOrderStatus(fulfillmentStatus);
			if (this.state.statistics){ // statistics defined as optional null, thus a value verification required
				const statistics: Statistics = this.state.statistics;
				if  (newStatus == "fulfilled"){
					statistics.delivered = statistics.delivered + 1;
					statistics.notDelivered = statistics.notDelivered - 1;
				}else{
					statistics.delivered = statistics.delivered - 1;
					statistics.notDelivered = statistics.notDelivered + 1;
				}

				this.setState({statistics: statistics});
			}

			event.stopPropagation(); // prevent parent click listener from being called as well
			api.updateDB(orderID,newStatus); // pseudo updates database (i.e. updates server)

			this.setState({
				orders: this.state.orders?.map(order => {
					if (order.id == orderID){
						order.fulfillmentStatus = newStatus;
					}
					return order;
				})
			});
		}
	}
	
	/**
	 * returns the inverse value of provided fulfillment status  
	 */
	getNewOrderStatus = (prevStatus: string) => {
		if (prevStatus == "fulfilled"){
			return "not-fulfilled";
		}

		return "fulfilled";
	}

	/**
	 * returns image corresponding to given fulfillment status.
	 */
	static getAssetByStatus(status: string) {
		switch (status) {
			case 'fulfilled':
				return require('./assets/package.png');
			case 'not-fulfilled':
				return require('./assets/pending.png');
			case 'canceled':
				return require('./assets/cancel.png');
			case 'paid':
				return require('./assets/paid.png');
			case 'not-paid':
				return require('./assets/not-paid.png');
			case 'refunded':
				return require('./assets/refunded.png');
		}
	}
	
}

export default App;
