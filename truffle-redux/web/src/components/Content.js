import React from 'react';
// import PropTypes from 'prop-types';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import { injectIntl } from 'react-intl';
import CreateProduct from '../containers/createProduct';
import Purchases from './Purchases';
import SingleProduct from './SingleProduct';
import queryString from 'query-string';
import CreateStore from '../containers/createStore';
import StoreDetails from '../containers/storeDetails';

export function Content(props) {
	console.log('Content Props: ', props);

	function getContractAddress(props) {
		if (props.contract.storeExists === true) {
			return <span className="store-address">{props.contract.storeAddress}</span>;
		} else {
			return '';
		}
	}

	function myStoreOptions() {
		return (
			<div>
				{' '}
				<span className="nav-button">
					<Link to="/createProduct">Create Product</Link>
				</span>{' '}
				<span className="nav-button">
					<Link to="/purchases">Check Purchases</Link>
				</span>
			</div>
		);
	}

	function createStore() {
		return (
			<div className="nav-button">
				<Link to="/createStore">Create Store</Link>
			</div>
		);
	}
	return (
		<div className="App-intro">
			<div className="flexbox-parent">
				<div className="flexbox-item header ">
					<div className="title-bar">
						<span className="oppTitle">
							<span className="big-font">VNDR</span>
							<span className="oppContractAddress">
								<span className="store-address">{props.contract.storeAddress}</span>
							</span>
						</span>
					</div>
				</div>

				<div className="flexbox-item fill-area content flexbox-item-grow">
					<div className="fill-area-content flexbox-item-grow">
						<div className="menu-bar">
							<div>{props.contract.storeExists[0] ? myStoreOptions() : createStore()}</div>
						</div>
						<div className="content-body">
							<Switch>
								<Route exact path="/createProduct" component={CreateProduct} />
								<Route exact path="/purchases" component={Purchases} />
								<Route path={`/products`} component={SingleProduct} />
								<Route exact path="/createStore" component={CreateStore} />
								{/* <Route path="/about" component={About} /> */}

								{/* <Route exact path="/demo" component={IPFS_status} />
            <Route component={NoMatch} /> */}
							</Switch>
							<StoreDetails />
						</div>
					</div>
				</div>

				<div className="flexbox-item footer" />
			</div>
		</div>
	);
}

Content.propTypes = {};

export default injectIntl(Content);
