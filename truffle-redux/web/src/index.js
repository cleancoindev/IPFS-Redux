import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import Eth from 'ethjs';
import './index.css';
import App from './App';
import { store } from './state/store';
import {
	setUserAccounts,
	web3IsReady,
	databaseReady,
	web3IsFetching,
	web3HasError,
	setUserBalance,
	getOrbit
} from './state/web3/actions';
import { contractLoading, setTotalStores, userStoreExists, setStoreAddress } from './state/contract/actions';
import { IPFS_ready } from './state/IPFS/actions';
import registerServiceWorker from './registerServiceWorker';
//import OrbitDB from 'orbit-db'
import runOrbit from './OrbitDB';
//must be a simpler ;way
import OppStoreJson from './contracts/OppStore.json';

import Web3 from 'web3';
import IPFS from 'ipfs';

const web3utils = new Web3();

//export this top level
export let web3;
export let oppMarket;
//Ethereum Market Information
export const deployedContractAddress = '0x345ca3e014aaf5dca488057592ee47305d9b3e10';
export const marketBytecode = OppStoreJson.bytecode;
export const marketAbi = OppStoreJson.abi;

ReactDOM.render(
	<Provider store={store}>
		<App />
	</Provider>,
	document.getElementById('root')
);
registerServiceWorker();

window.addEventListener('load', async () => {
	//console.log('Is there something on window? ', window.web3);

	store.dispatch(web3IsFetching(true));
	store.dispatch(web3IsReady(false));

	web3 = LoadWeb3(web3);

	//Get Web3 Accounts
	//only handles first account
	const accounts = await getUserWeb3Accounts(web3);

	//Get User Account Balance
	await getUserAccountBalanceFromWeb3(web3, accounts);

	//Get OPP Store Contract
	store.dispatch(contractLoading(true));
	//This is our market Contract instance
	oppMarket = await getMarket(web3, marketAbi, marketBytecode, deployedContractAddress);

	console.log('This is oppMarket', oppMarket);
	store.dispatch(setStoreAddress(oppMarket.address));
	//Get Total Store Count
	const totalOppStores = await getTotalStores(oppMarket);
	store.dispatch(setTotalStores(totalOppStores));
	//Check if User Already has a store.
	const userStoreCount = await doesUserHaveAStore(oppMarket, accounts[0]);
	store.dispatch(userStoreExists(userStoreCount));
	store.dispatch(contractLoading(false));

	//things to export:

	//add ipfs actions?
	const IPFSNODE = await IPFS_SETUP(web3);
	console.log('IPFS NODE IS:', IPFSNODE);

	//put KEY THINGS on window
	window.IPFSNODE = IPFSNODE;
	window.oppMarketContract = oppMarket;
});

export async function getOPPStoreContract(web3) {
	const market = await getMarket(web3, marketAbi, marketBytecode, deployedContractAddress);
	return market;
}

async function getUserAccountBalanceFromWeb3(web3, accounts) {
	store.dispatch(web3IsFetching(true));
	let balance = await getWeb3Balance(web3, accounts[0]);
	store.dispatch(setUserBalance(balance));
	store.dispatch(web3IsFetching(false));
}

function LoadWeb3(web3) {
	if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
		// We are in the browser and metamask is running.
		web3 = new Eth(window.web3.currentProvider);
		store.dispatch(web3IsReady(true));
		store.dispatch(web3IsFetching(false));
	} else {
		// We are on the server *OR* the user is not running metamask
		//In this case we aren't connecting to a remote, we need metamask. So this is disconnected and user is warned.
		// const provider = new Web3.providers.HttpProvider('http://loalhost:7545');
		// web3 = new Eth(provider);
		store.dispatch(
			web3HasError({ status: true, msg: 'This service requires Metamask, no Ethereum provider found' })
		);
		web3 = undefined;
	}
	return web3;
}

async function getUserWeb3Accounts(web3) {
	store.dispatch(web3IsFetching(true));
	const accounts = await getWeb3Accounts(web3);
	store.dispatch(setUserAccounts(accounts));
	store.dispatch(web3IsFetching(false));
	return accounts;
}

async function getWeb3Accounts(web3) {
	let accounts = await web3.accounts();
	console.log('accounts', accounts);
	return accounts;
}

async function getWeb3Balance(web3, account) {
	let balance = await web3.getBalance(account);
	return web3utils.fromWei(balance, 'ether');
}

async function IPFS_SETUP(web3) {
	store.dispatch(IPFS_ready(false));

	const ipfsOptions = {
		EXPERIMENTAL: {
			pubsub: true
		}
	};

	const IPFSNODE = new IPFS(ipfsOptions);

	IPFSNODE.once('ready', async () => {
		console.log('IPFS IS READY. Instance is: ', IPFSNODE);
		store.dispatch(IPFS_ready(true));
		store.dispatch(databaseReady(true));
		//sending in web3 instead of an account.

		const orbitInstance = await runOrbit(IPFSNODE, web3);
		await orbitInstance.load();
		const hash = await orbitInstance.add({ title: 'Hello', content: 'World' });
		console.log('Orbit hash ', hash);
		orbitInstance.events.on('replicated', (address) => {
			console.log('Orbit iterator', orbitInstance.iterator({ limit: -1 }).collect());
		});
		console.log('OrbitorbitInstance loaded', orbitInstance);
		console.log('Orbitdb hash', hash);
		//store.dispatch(getOrbit(orbitInstance));

		//put ORBIT DB on Window
		window.OrbitDBInstance = orbitInstance;

		store.dispatch(databaseReady(true));
	});

	return IPFSNODE;
}

export async function getMarket(web3, marketAbi, marketBytecode, deployedContractAddress) {
	let accounts;
	let market;
	let oppMarket;

	try {
		accounts = await web3.accounts();
	} catch (error) {
		console.log(error);
	}
	console.log('Get Market accounts is: ', accounts);

	try {
		market = await web3.contract(marketAbi, marketBytecode, {
			from: accounts[0],
			gas: 3000000
		});
	} catch (error) {
		console.log(error);
	}

	console.log('Get Market market is: ', market);

	try {
		oppMarket = await market.at(deployedContractAddress);
	} catch (error) {
		console.log(error);
	}

	return oppMarket;
}

async function doesUserHaveAStore(oppMarket, account) {
	try {
		const stores = await oppMarket.hasStore(account);
		console.log('Return Value for User Store Existing: ', stores);
		return stores;
	} catch (error) {
		console.error(error);
		return false;
	}
}

async function getTotalStores(oppMarket) {
	try {
		const storeCount = await oppMarket.storeCount();
		console.log('Return Value of get Total stores: ', storeCount);

		return storeCount;
	} catch (error) {
		console.log(error);
		return 0;
	}
}
