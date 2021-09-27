import {
  Ayusocoin,
  Approval,
  SetRootAttempt,
  Transfer
} from "../generated/Ayusocoin/Ayusocoin"
import { Account } from "../generated/schema"

export function handleApproval(event: Approval): void {
  // - contract._totalSupply(...)
  // - contract.allowance(...)
  // - contract.allowed(...)
  // - contract.approve(...)
  // - contract.balanceOf(...)
  // - contract.decimals(...)
  // - contract.getRoot(...)
  // - contract.isRoot(...)
  // - contract.maxbalance_per_addr(...)
  // - contract.name(...)
  // - contract.setMaxBalancePerAddress(...)
  // - contract.setRoot(...)
  // - contract.symbol(...)
  // - contract.totalSupply(...)
  // - contract.transfer(...)
  // - contract.transferFrom(...)
}

export function handleSetRootAttempt(event: SetRootAttempt): void {
  console.log("[SetRoot] " + event.params.oldroot.toHex() + " -> " + event.params.newroot.toHex())
  let _old = Account.load(event.params.oldroot.toHex())
  if (!_old) _old = new Account(event.params.oldroot.toHex())
  _old.isRoot = false
  _old.save()

  let _new = Account.load(event.params.newroot.toHex())
  if (!_new) _new = new Account(event.params.newroot.toHex())
  _new.isRoot = true
  _new.save()
}

export function handleTransfer(event: Transfer): void {
  let contract = Ayusocoin.bind(event.address)
  let maxbalance_per_addr = contract.maxbalance_per_addr()

  let from = Account.load(event.params._from.toHex())
  if (!from) from = new Account(event.params._from.toHex())
  from.balance = contract.balanceOf(event.params._from)
  from.capped = from.balance.ge(maxbalance_per_addr)
  from.save()

  let to = Account.load(event.params._to.toHex())
  if (!to) to = new Account(event.params._to.toHex())
  to.balance = contract.balanceOf(event.params._to)
  to.capped = to.balance.ge(maxbalance_per_addr)
  to.save()
}
