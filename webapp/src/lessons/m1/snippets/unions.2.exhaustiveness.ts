type Invoice = {
  type: "INVOICE",
  number: string,
  date: Date
  positions: {
    name: string
    price: number
    quantity: number
  }[]
  rebate: number
}

type Bill = {
  type: "BILL"
  date: Date
  totalPrice: number
}

type DebtPayment = { 
  type: "DEBT"
  amount: number; 
  due: Date 
}

type CompanyPurchase = Invoice | Bill | DebtPayment

const getPrice = (purchase: CompanyPurchase): number => {
  switch(purchase.type){
    case "INVOICE":
      return purchase.positions.reduce((acc, item) => acc + item.price * item.quantity, 0)
    case "BILL":
      return purchase.totalPrice
    case "DEBT":
        return purchase.amount

    // exhaustivness check
    default:
      let x: never = purchase
      return x


  }
  // implementation here...
}

// 🔥 a potem rozszerzamy Unię o trzeci typ, np.
// type DebtPayment = { amount: number; due: Date }
