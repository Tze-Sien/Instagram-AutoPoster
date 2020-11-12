const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const htmlPdf = require('html-pdf');
const converter = require('./smartudaraco2');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
require('tools-for-instagram');

var payLoadContainer = {
    tempHumSensor:null,
    pmCoSensor:null,
    count: 0
};

app.post('/api/postInstagram', async(req, res) =>{
    
    try {
        // 0. Functions

            // 0.1 Remove all files in a specific directory
            const removeDir = function(path) {
                if (fs.existsSync(path)) {
                const files = fs.readdirSync(path)
            
                if (files.length > 0) {
                    files.forEach(function(filename) {
                    if (fs.statSync(path + "/" + filename).isDirectory()) {
                        removeDir(path + "/" + filename)
                    } else {
                        fs.unlinkSync(path + "/" + filename)
                    }
                    })
                } else {
                    console.log("No files found in the directory.")
                }
                } else {
                console.log("Directory path not found.")
                }
            }
            
            // 0.2 Converting UNIX to normal Time Stamp
            function timeConverter(UNIX_timestamp){
                let a = new Date(UNIX_timestamp * 1000);
                let months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                let year = a.getFullYear();
                let month = months[a.getMonth()];
                let date = a.getDate();
                let hour = a.getHours();
                let min = a.getMinutes();
                let sec = a.getSeconds();
                let time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
                return time;
            }

        // 1. Data Extraction from Request Body 
            
            // Async Function to accumulate the 2 packets 
            async function payLoadAccumulator(payload){

                const data = converter(payload);
                if(payload.data[1] == 2){
                    if(payLoadContainer.tempHumSensor != null){
                        throw new Error('Temperature-Humidity Sensor Trying to send packet before previous packet is published;');
                    }else{
                        payLoadContainer.tempHumSensor = data;
                        console.log(payLoadContainer)
                        return true
                    }
                }else if(payload.data[1] == 1){
                    if(payLoadContainer.pmCoSensor != null){
                        throw new Error('PM-CO2 Sensor Trying to send packet before previous packet is published');
                    }else{
                        payLoadContainer.pmCoSensor = data;
                        console.log(payLoadContainer)
                        return true
                    }
                }else{
                    throw new Error('Invalid Packet');
                }
                
            }
            
            // Async Function to generate image and post to instagram
            async function imagePosting(payload){
                
                let temp = payload.tempHumSensor[0].value + payload.tempHumSensor[0].unit;
                let humid = payload.tempHumSensor[1].value + payload.tempHumSensor[1].unit;
                let pm25 = payload.pmCoSensor[0].value + payload.pmCoSensor[0].unit
                let pm10 = payload.pmCoSensor[1].value + payload.pmCoSensor[1].unit;
                let co2 = payload.pmCoSensor[2].value + payload.pmCoSensor[2].unit;
                
                const htmlToPdfOptions = {
                    "type":".jpg",
                    "height":"650px",
                    "width":"850px",
                    "renderDelay": 2000,
                }

                htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Document</title>
                    <style>
                        body{
                            color: white;
                            background-color: black;
                        }
                    </style>
                </head>
                <body>
                    <h2>${temp}</h2>
                    <h2>${humid}</h2>
                    <h2>${pm25}</h2>
                    <h2>${pm10}</h2>
                    <h2>${co2}</h2>
                </body>
                </html>
                `

                htmlPdf.create(htmlContent,htmlToPdfOptions)
                .toFile('./images/image.jpg', (err, result) => {
                    if(err) return console.log(err)
                    return result;
                })

                // 4. Sign in to Instagram and Upload Picture
                let ig = await login(); 
                let myPicturePath = path.join(__dirname, '/images/image.jpg');;
                let image = await uploadPicture(ig, 'Weather Today', myPicturePath);   

                // 5. Delete the image 
                const pathToDir = path.join(__dirname, "/images")
                await removeDir(pathToDir)

                return true;
            }

            if(payLoadContainer.count == 0){           // First Packet
                
                let accumulate = await payLoadAccumulator(req.body);
                if(accumulate){
                    payLoadContainer.count++;
                    res.json(payLoadContainer);
                }

            }else if(payLoadContainer.count == 1){     // Second Packet (Publish Instagram Post here)
                
                let accumulate = await payLoadAccumulator(req.body);
                let postInsta = await imagePosting(payLoadContainer);
                if(postInsta){
                    payLoadContainer.count++;
                    payLoadContainer = {
                        tempHumSensor:null,
                        pmCoSensor:null,
                        count: 0
                    };
                    payLoadContainer.count = 0;
                    res.json({
                        message:'Done Creating Image'
                    });
                }

            }else{                                      // Error Handling
                                                  
                payLoadContainer = {
                    tempHumSensor:null,
                    pmCoSensor:null,
                    count: 0
                };

                throw new Error('Packets sent exceed 2 before posting to Instagram, Please try again!');
            }

    }catch(error){
        res.status(400).json({
            error:error.message
        });
    }
})

let port = process.env.PORT || 8085;  

app.listen(port, () => {
    console.log(`Listening to Port ${port}`)
})