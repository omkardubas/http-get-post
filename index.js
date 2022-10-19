const https = require('https');
const fs = require('fs');
const fetch = require('node-fetch');

const url = "https://interview.adpeai.com/api/v2/get-task";

let data = ''

const PORT = process.env.port || 3000;

const _options = {
    key: fs.readFileSync('localhost-key.pem'),
    cert: fs.readFileSync('localhost.pem')
  };

// This creates a localhost server 
https.createServer(_options, function (postRequest, res) {
    res.write('Hello World!'); 
    res.end();
}).listen(PORT, function(){
    console.log("server start at port "+PORT); 
});

// Get Request
fetch(url)
    .then(res => res.text())
    .then(text => {
        let temp = '';
        let previousYear = new Date().getFullYear() - 1;
        let employees = {}
        let transactions = []
        let _transactions = ''
        let max = -Infinity;

        temp = JSON.parse(text);

        // Filters based on previous year
        temp.transactions.filter(obj => {
            if ((new Date(obj.timeStamp)).getFullYear() == previousYear) {
                if (obj.employee.id in employees) {
                    employees[obj.employee.id].push(obj)
                } else {
                    employees[obj.employee.id] = [obj]
                }
            }
            return employees;
        });

        // Calculates the total of amount
        for (const i in employees) {
            employees[i].total = 0
            employees[i].filter(obj => {
                employees[i].total += obj.amount
            })
        }

        // Get the Highest Value of the amount in the Employees
        for (const i in employees) {
            if(employees[i].total > max){
                max = employees[i].total
            }
        }

        // Filters transaction ID for alpha type
        for(const i in employees){
            if(employees[i].total == max){
                _transactions = employees[i].filter(obj => {
                    if(obj.type == "alpha"){
                        return transactions.push(obj.transactionID)
                    }
                })
            }
        }

        const results = {
            "id": temp.id,
            "result": transactions
        }

        data = JSON.stringify(results)

        console.log(data)

        // POST Request
        fetch('https://interview.adpeai.com/api/v2/submit-task', {
            method: 'POST',
            body: data,
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(res =>{ 
                console.log('POST Status Code:', res.status);
                JSON.stringify(res)})
            .then(json => console.log(json))
            .catch (err => console.log(err, 'err'))
    });
