import types from './types';
import IPFSNODE from '../../ipfs'

export function getIPFSStatus(payload){
  return {
    type: types.IPFS_STATUS,
    payload,
  }
}

export function catFromIPFS(payload){
  return {
    type: types.IPFS_CAT,
    payload,
  }
}

export function addToIPFS(payload){
  return {
    type: types.IPFS_ADD,
    payload,
  }
}

export function IPFS_reqPending(payload){
  return {
    type: types.IPFS_REQ_PENDING,
    payload,
  }
}

export function IPFS_ready(payload){
  return {
    type: types.IPFS_REQ_READY,
    payload,
  }
}

export function getFromIPFS_THUNK(query){
  return (dispatch) => {
    IPFSNODE.files.cat(query, (err, data)=> {
      if (err) {return console.error(err)}
      console.log("The data is", data)
      //dispatch goes after here.
      dispatch(catFromIPFS(data));
    }
  )
  }
}

export function putToIPFS_THUNK(data){
  return (dispatch) => {
    //Add in the Status calls
    //Ass in a check for if the node is ready.
    console.log("About to call IPFS WITH THIS data: ", data);
    IPFSNODE.files.add(IPFSNODE.types.Buffer.from(data), (err, files)=> {
      if (err) {return console.error(err)}
      console.log(files[0].hash);
      dispatch(addToIPFS(files[0].hash))
      window.localStorage.setItem('IPFS_index', files[0].hash )
      console.log("Dispatch to IPFS Sent");
    })
    console.log("Is it async?")
  }
}
