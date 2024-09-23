{/* <div class="p-5 justify-content-center d-flex ">
                                            <div class="walletBack   w-75  border: 2px  solid #000  padding:10px  margin:5px  border-radius: 5px">

                                                <div class="">
                                                    
                                                    <h4>Current Balance <samp>:  ₹ <%=walletDetail?.balance %></samp></h4>
                                                </div>
                                                <br>
                                                <form action="/addWallet" method="post" id="myForm">
                                                <div class="row">
                                                <div class="col-md-4">
                                                    <input class="amount" id="amount" type="number" name="walletAdd" placeholder="Enter Amount" >
                                                </div>
                                            
                                                <div class="col-md-4 addButton">
                                                    <button class="btn btn-primary" type="button"  onclick="razorPay()">Add Money</button>
                                                </div>
                                            </div>
                                        </form>
                                                <div>
                                                    <br>

                                                <br>
                                                <div class="select-menu">
                                                    <div class="select">
                                                      <span>Histoy</span>
                                                      <i class="fas fa-angle-down"></i>
                                                    </div>
                                                    <div class="options-list">
                                            <table class="table  table-check">
                                                <thead>
                                                    <tr>
                                                        <td>Transactions</td>
                                                        <td>Amount</td>
                                                        <td>Date</td>
                                                    </tr>
                                                </thead>
                                                    <tbody>
                                                        <% walletDetail?.transaction.forEach((Data)=>{ %>
                                                    <tr>
                                                        <td><%=Data.creditOrDebit %></td>
                                                        <td>₹ <%=Data.amount %></td>
                                                        <td><%=Data.date.toLocaleDateString() %></td>
                                                    </tr>
                                                    <% }) %>
                                                </tbody>
                                            </table>
                                                    </div>
                                                  </div>
                                                  
                                                </div>
                                        </div>
                                    </div> */}


//                           <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

//         <script>
//             function razorPay() {
//                 const form = document.getElementById('myForm')
//                 const amount = document.getElementById('amount')
//                 console.log(amount.value)
   
//    fetch('/razors', {
//        method: 'POST',
//        headers: { 'Content-type': 'application/json' },
//        body: JSON.stringify({ amount:amount.value })
//    }).then(res => res.json()).then(data => {
//        if (data.success) {
        
//            let options = {
//                "key": ${data.key_id},
//                "amount":` ${data.amount}`,
//                "currency": "INR",
//                "name": "GLOWING",
//                "handler": function (response) {
//                    form.submit();
//                },
//                "profile": {
//                    "name": ${data.name},
//                    "email": ${data.email}
//                }
//            }

//            let razorpayObject = new Razorpay(options);
//            razorpayObject.on('payment.failed', (response) => {
//                alert('payment failed');
              
//                form.submit();
//            });
//            razorpayObject.open();
//        } else if (data.fail) {
//            const Toast = Swal.mixin({

//                toast: true,
//                position: "bottom",
//                showConfirmButton: false,
//                timer: 3000,
//                timerProgressBar: true,

//                didOpen: (toast) => {

//                    toast.onmouseenter = Swal.stopTimer;
//                    toast.onmouseleave = Swal.resumeTimer;
//                }

//            });

//            Toast.fire({

//                icon: "warning",
//                title: "No address",
//                background: "31363F"

//            })
//        }
//    })
//    .catch(error => {
//    console.error('Error:', error);
// });
// }
//         </script>