import { Address, BigInt } from "@graphprotocol/graph-ts"
import {
  Ayusocoin,
  Approval,
  SetRootAttempt,
  Transfer as TransferEvent
} from "../generated/Ayusocoin/Ayusocoin"
import { Account, Allowance, Token, Transfer } from "../generated/schema" 

/*
    __________
   /          \
  |  Entities  |
   \__________/

*/

/**
 * Ensures that the token entity is obtained correctly.
 * @param adx Contract address
 * @returns Token entity
 */
 export function ensureToken(adx: Address): Token {
  const ID = "0";
  let token = Token.load(ID)
  if(!token) {
      let contract = Ayusocoin.bind(adx)
      token = new Token(ID)
      token.name = "Ayuso Coin v1"
      token.symbol = "AYUSOS"
      token.owner = contract.getRoot().toHex()
      token.totalSupply = contract.totalSupply()
      token.holders = new Array<string>()
  }
  return token as Token
}

/**
 * Ensures that the account entity is obtained correctly.
 * @param id Account address
 * @param adx Contract address
 * @returns Account entity
 */
export function ensureAccount(id: Address, adx: Address): Account {
  let account = Account.load(id.toHex())
  if(!account) {
      let contract = Ayusocoin.bind(adx)
      account = new Account(id.toHex())
      account.balance = contract.balanceOf(id)
      account.type = updateAccountType(id, adx)
  }
  return account as Account
}

/**
 * Ensures that an allowance entity is updated correctly.
 * @param owner Address of balance owner
 * @param sender Sender address
 * @param adx Contract address
 */
export function updateAllowance(owner: Address, spender: Address, adx: Address): void {
  if(owner === spender) return
  let allowance = Allowance.load(`${owner.toHex()}-${spender.toHex()}`)
  if(!allowance) {
    allowance = new Allowance(`${owner.toHex()}-${spender.toHex()}`)
    allowance.owner = owner.toHex()
    allowance.spender = spender.toHex()
  }
  let contract = Ayusocoin.bind(adx)
  allowance.balance = contract.allowance(owner, spender)
  allowance.save()
}


/**
 * Ensures that an account type is updated correctly.
 * @param id Account address
 * @param adx Contract address
 * @returns Account type
 */
 export function updateAccountType(id: Address, adx: Address): string {
  let token = ensureToken(adx)
  let contract = Ayusocoin.bind(adx)
  let type = id.toHex() === contract.getRoot().toHex() ? "Owner" : (contract.balanceOf(id).notEqual(BigInt.fromI32(0)) ? "Holder" : "Empty")
  return type
}

/*
    __________
   /          \
  |   Events   |
   \__________/

*/

/**
 * Event handler related to transfer allowance
 * @param event 
 */
export function handleApproval(event: Approval): void {
  updateAllowance(event.params._owner, event.params._spender, event.address)
}

/**
 * Event handler related to changes in contract ownership
 * @param event SetRootAttempt
 */
export function handleSetRootAttempt(event: SetRootAttempt): void {
  // Remove the contract owner
  let oldr = ensureAccount(event.params.oldroot, event.address)
  oldr.type = updateAccountType(event.params.oldroot, event.address)
  oldr.save()
  // Establish the new contract owner
  let newr = ensureAccount(event.params.newroot, event.address)
  oldr.type = updateAccountType(event.params.newroot, event.address)
  newr.save()
}

/**
 * Event handler related to token transfers
 * @param event Transfer
 */
export function handleTransfer(event: TransferEvent): void {
  // Contract
  let contract = Ayusocoin.bind(event.address)
  // Establish the new transfer
  let transfer = new Transfer(event.transaction.hash.toHex())
  transfer.to = event.params._to.toHex()
  transfer.from = event.params._from.toHex()
  transfer.amount = event.params._value
  transfer.block = event.block.number
  transfer.timestamp = event.block.timestamp
  transfer.gasUsed = event.block.gasUsed
  transfer.gasLimit = event.block.gasLimit
  transfer.save()
  // Update the balance of the accounts
  let from = ensureAccount(event.params._from, event.address)
  from.balance = contract.balanceOf(event.params._from)
  from.type = updateAccountType(event.params._from, event.address)
  from.save()
  let to = ensureAccount(event.params._to, event.address)
  to.balance = contract.balanceOf(event.params._to)
  to.type = updateAccountType(event.params._to, event.address)
  to.save()
  // Update the allowance
  if(event.params._from !== event.transaction.from)
    updateAllowance(event.params._from, event.transaction.from, event.address)
}
