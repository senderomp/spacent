import Web3 from "web3"
import { newKitFromWeb3 } from "@celo/contractkit"
import BigNumber from "bignumber.js"
import marketplaceAbi from "../contract/spacerent.abi.json"
import erc20Abi from "../contract/erc20.abi.json"
import {MPContractAddress, emptyAddress, cUSDContractAddress, ERC20_DECIMALS} from "./utils/constants";



let kit
let contract
let spaces = []
let spaceRef 

let daysList = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

let hoursList = ["00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "29:00", "21:00", "22:00", "23:00"]

const connectCeloWallet = async function () {
  if (window.celo) {
    notification("⚠️ Please approve this DApp to use it.")
    try {
      await window.celo.enable()
      notificationOff()

      const web3 = new Web3(window.celo)
      kit = newKitFromWeb3(web3)

      const accounts = await kit.web3.eth.getAccounts()
      kit.defaultAccount = accounts[0]

      contract = new kit.web3.eth.Contract(marketplaceAbi, MPContractAddress)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.")
  }
}

async function approve(_price) {
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)

  return await cUSDContract.methods
      .approve(MPContractAddress, _price)
      .send({from: kit.defaultAccount})

}

const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
  document.querySelector("#balance").textContent = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)

}

const getSpaces = async function() {
  const _spacesLength = await contract.methods.getSpacesLength().call()
  const _spaces = []
  for (let i = 0; i < _spacesLength; i++) {
    let _space = new Promise(async (resolve) => {
      let s = await contract.methods.getSpace(i).call()
      resolve({
        index: i,
        owner: s[0],
        name: s[1],
        startIndex: s[2],
        endIndex: s[3],
        daysAv: s[4],
        slots: s[5],
        price: new BigNumber(s[6]),
      })
    })
    _spaces.push(_space)
  }
  spaces = await Promise.all(_spaces)

  renderSpaces()
}

function renderSpaces() {
  document.getElementById("marketplace").innerHTML = ""
  spaces.forEach((_space) => {
    const newDiv = document.createElement("div")
    newDiv.className = "col-md-4"
    newDiv.innerHTML = productTemplate(_space)
    document.getElementById("marketplace").appendChild(newDiv)
  })
}

function productTemplate(_space) {
  let daysString = "" 
  _space.daysAv.forEach(_day => {
    daysString += " " + daysList[_day]
  })
  return `
  <div class="card" style="width: 18rem;">
    <div class="card-body">
      <h5 class="card-title">${_space.name}</h5>
      <h6 class="card-subtitle mb-2 text-muted">${hoursList[_space.startIndex]} - ${hoursList[_space.endIndex]}</h6>
      <h6 class="card-subtitle mb-2 text-muted">${daysString}</h6>
      <a class="btn btn-outline-primary viewSlots" data-bs-toggle="modal" data-bs-target="#viewSlots" id="${_space.index}">View Slots</a>
    </div>
  </div>
  `
}

// function identiconTemplate(_address) {
//   const icon = blockies
//     .create({
//       seed: _address,
//       size: 8,
//       scale: 16,
//     })
//     .toDataURL()
//
//   return `
//   <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
//     <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
//         target="_blank">
//         <img src="${icon}" width="48" alt="${_address}">
//     </a>
//   </div>
//   `
// }

function notification(_text) {
  document.querySelector(".alert").style.display = "block"
  document.querySelector("#notification").textContent = _text
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none"
}

window.addEventListener("load", async () => {
  notification("⌛ Loading...")
  await connectCeloWallet()
  await getBalance()
  await getSpaces()
  notificationOff()
});

document
    .querySelector("#newSpaceBtn")
    .addEventListener("click", async () => {
      let days = []
      let slots = []
      for (let i = 1; i <= 7; i++) {
        const element = "btncheck" + i
        const tmp = document.getElementById(element)
        if (tmp.checked) {
          days.push(i - 1)
        }
      }
      const startH = document.getElementById("startHourSelect").value
    const endH = document.getElementById("endHourSelect").value
    const totalHours = endH - startH

    if (totalHours <= 0){
      notification(`⚠️ Date not valid.`)
      return 0
    }

    let slotIndex = await contract.methods.getSlotsLength().call()

    for (let i = slotIndex; i < parseInt(slotIndex) + totalHours * days.length; i++){
      slots.push(i)
    }


    const params = [
      document.getElementById("newName").value,
      document.getElementById("startHourSelect").value,
      document.getElementById("endHourSelect").value,
      days,
      slots,
      new BigNumber(document.getElementById("newPrice").value)
      .shiftedBy(ERC20_DECIMALS)
      .toString()
    ]

    
    notification(`⌛ Adding "${params[0]}"...`)
    try {
      await contract.methods
          .createSpace(...params)
          .send({from: kit.defaultAccount})
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`🎉 You successfully added "${params[0]}".`)
    getSpaces()
    
  })

document.querySelector("#marketplace").addEventListener("click", async (e) => {
  if (e.target.className.includes("viewSlots")) {
    spaceRef = e.target.id
    loadSlots(e.target.id)
  }
})  

async function loadSlots(index) {
  document.getElementById("slotsGrid").innerHTML = ""

    const daysLi = spaces[index].daysAv

    document.getElementById("reserveViewModal").innerText = `Slots - ${spaces[index].price.shiftedBy(-ERC20_DECIMALS).toFixed(2)} cUSD per Slot`

    const slotsV = []

    for(let _slotIndex of spaces[index].slots) {
      const _slot = await contract.methods.getSlot(_slotIndex).call()
      slotsV.push({
        index: _slotIndex,
        occupant: _slot[0],
        day: _slot[1],
        hour: _slot[2]
      })
    }
    const startH = spaces[index].startIndex
    const endH = spaces[index].endIndex

    const cont = document.createElement("table")
    cont.className = "table"

    const head = document.createElement("thead")
    const tr = document.createElement("tr")

    tr.innerHTML = '<th scope="col"></th>'
    for (let day of daysLi){
      tr.innerHTML += `<th scope="col">${daysList[day]}</th>`
    }

    head.appendChild(tr)


    cont.appendChild(head)

    const body = document.createElement("tbody")

    let slotRefIndex = 0

    for(var i = parseInt(startH); i < parseInt(endH); i++){

      let tmpTr = document.createElement("tr")
      tmpTr.innerHTML = `<th scope="row">${hoursList[i]}</th>`

      for(var j = 0; j < daysLi.length; j++) {

        if (slotsV[slotRefIndex].occupant == emptyAddress){
          tmpTr.innerHTML += `<td style="padding: 0; border:0;"><button type="button" class="btn btn-outline-dark reserveSlot" style="width: 100%; height: 100%; border-radius:0;" id="${slotsV[slotRefIndex].index}">Reserve</button></td>`
        }
        else if (slotsV[slotRefIndex].occupant == kit.defaultAccount) {
          tmpTr.innerHTML += `<td style="padding: 0; border:0;"><button type="button" class="btn btn-dark" disabled style="width: 100%; height: 100%; border-radius:0;">Your Slot</button></td>`
        }
        else {
          tmpTr.innerHTML += `<td style="padding: 0; border:0;"><button type="button" class="btn btn-outline-secondary" disabled style="width: 100%; height: 100%; border-radius:0;">Reserved</button></td>`
        }
        slotRefIndex++
      }
      body.appendChild(tmpTr)

    }
    cont.appendChild(body)



    document.getElementById("slotsGrid").appendChild(cont)
}

document.querySelector("#slotsGrid").addEventListener("click", async (e) => {
  if(e.target.className.includes("reserveSlot")){
    const index = e.target.id
    notification("⌛ Waiting for payment approval...")
    try {
      await approve(spaces[spaceRef].price)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`⌛ Awaiting payment for "${spaces[spaceRef].name}"...`)
    try {
      await contract.methods
          .reserveSlot(spaceRef, index)
          .send({from: kit.defaultAccount})
      notification(`🎉 You successfully reserved "${spaces[spaceRef].name}".`)
      getSpaces()
      getBalance()
      loadSlots(spaceRef)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  }
})