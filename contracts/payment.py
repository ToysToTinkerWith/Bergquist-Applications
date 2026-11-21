from pyteal import *


def approval_program():
    on_creation = Return(Int(1))

    close_out = Return(Int(1))

    opt_in = Return(Int(1))

    # nobody can update the contract
    handle_updateapp =  Return(Txn.sender() == Global.creator_address())

    # only creator can delete the contract
    handle_deleteapp = Return(Txn.sender() == Global.creator_address())

    pay = Seq(
        App.localPut(Txn.sender(), Bytes("Hours Paid"), Add(App.localGet(Txn.sender(), Bytes("Hours Paid")), Btoi(Txn.application_args[1]))),
        Return(Int(1))
    )

    program = Cond(
        [Txn.application_id() == Int(0), on_creation],
        [Txn.on_completion() == OnComplete.DeleteApplication, handle_updateapp],
        [Txn.on_completion() == OnComplete.UpdateApplication, handle_deleteapp],
        [Txn.on_completion() == OnComplete.CloseOut, close_out],
        [Txn.on_completion() == OnComplete.OptIn, opt_in],
        [Txn.application_args[0] == Bytes("pay"), pay],
    )

    return program


def clear_state_program():
    program = Return(Int(1))
    return program
    


if __name__ == "__main__":
    with open("vote_approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=5)
        f.write(compiled)

    with open("vote_clear_state.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=5)
        f.write(compiled)