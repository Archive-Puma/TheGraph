import { Address, BigInt } from "@graphprotocol/graph-ts"
import {
  Ayusocoin,
  Approval,
  SetRootAttempt,
  Transfer as TransferEvent
} from "../generated/Ayusocoin/Ayusocoin"
import { Account, Transfer } from "../generated/schema" 

/*
    __________
   /          \
  |  Entities  |
   \__________/

*/

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
      account.balance = BigInt.fromI32(0)
      account.isRoot = contract.isRoot(id)
  }
  return account as Account
}

/*
    __________
   /          \
  |   Events   |
   \__________/

*/

export function handleApproval(event: Approval): void {
  
}

/**
 * Event handler related to changes in contract ownership
 * @param event SetRootAttempt
 */
export function handleSetRootAttempt(event: SetRootAttempt): void {
  // Remove the contract owner
  let oldr = ensureAccount(event.params.oldroot, event.address)
  oldr.isRoot = false
  oldr.save()
  // Establish the new contract owner
  let newr = ensureAccount(event.params.newroot, event.address)
  newr.isRoot = true
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
  transfer.timestamp = event.block.timestamp
  transfer.gasUsed = event.block.gasUsed
  transfer.gasLimit = event.block.gasLimit
  transfer.save()
  // Update the balance of the accounts
  let from = ensureAccount(event.params._from, event.address)
  from.balance = contract.balanceOf(event.params._from)
  from.save()
  let to = ensureAccount(event.params._to, event.address)
  to.balance = contract.balanceOf(event.params._to)
  to.save()
}
