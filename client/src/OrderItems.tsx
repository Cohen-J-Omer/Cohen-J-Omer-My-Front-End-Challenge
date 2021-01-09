import React, { MouseEvent } from 'react';
import './App.scss';
import {createApiClient, Item, OrderItem} from './api';

export type OrderItemsState = { //state of OrderItems
	product?: Item
}

// Defining the input (props) from the parent component
export type OrderItemsProps = {
	item: OrderItem
}

const api = createApiClient();

export class OrderItems extends React.PureComponent<OrderItemsProps, OrderItemsState> {

	state: OrderItemsState = {
	};
	
	async componentDidMount() {
		//getting items of an order with given (through props) order id .
		this.setState({
			product: await api.getProductWithSize(this.props.item.id, 'medium')
		});
	}

	render() {
		return (
			<div className='orderDataGrid'>
				<img className='productImage' src={this.state.product?.image}></img>
				<h4>{this.state.product?.name}</h4>
				<h5>Quantity: {this.props.item.quantity}</h5>
				<h5>Price: {this.state.product?.price}$ * {this.props.item.quantity}</h5>
			</div>
		)
	}
}

export default OrderItems;
