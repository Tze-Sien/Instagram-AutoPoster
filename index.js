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

app.get('/api/postInstagram', (req, res) => {
    res.json({
        message:"bye"
    })
})

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
                }else if(payload = {}){
                    payLoadContainer  = {
                        tempHumSensor:null,
                        pmCoSensor:null,
                        count: 0
                    };  
                }
                else{
                    throw new Error('Invalid Packet');
                }
                
            }
            
            // Async Function to generate image and post to instagram
            async function imagePosting(payload){
                
                let temp = payload.tempHumSensor[0].value 
                let humid = payload.tempHumSensor[1].value 
                let pm25 = payload.pmCoSensor[0].value 
                let pm10 = payload.pmCoSensor[1].value
                let co2 = payload.pmCoSensor[2].value
                
                const htmlToPdfOptions = {
                    "type":".jpg",
                    "height":"650px",
                    "width":"850px",
                    "renderDelay": 2000,
                }

                let dateTimeNow = new Date()
                let day = dateTimeNow.getDate();
                let month = dateTimeNow.getMonth();
                let year = dateTimeNow.getFullYear();
                let hour = dateTimeNow.getHours();
                let minutes = dateTimeNow.getMinutes();
                const dateTime = `${day}-${month}-${year} | ${hour}:${minutes}`

                htmlContent = `
                <html style="height:1000px;width:1000px;margin:0;padding:0">
                <body style="height:1000px;width:1000px;margin:0;padding:0">
                    <div class="background" style="width:1000px; height:1000px;margin:0;padding:0;box-sizing:border-box;font-family:'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif;">
                        <img src="${'file://' +__dirname + '/asset/background.png'}" style="width:1000px;height:1000px;position:absolute;z-index:0;margin:0;padding:0">
                        
                        <div class="upper" style="box-sizing:border-box;height:600px;width:1000px;padding-top:100px;padding-right:80px;padding-bottom:100px;padding-left:80px;position:relative;">
                            
                        <div class="date" style="box-sizing:border-box;color:white;height:50px;font-size:30px;text-align:right;margin-right:20px;">${dateTime}</div>
                            
                            <div class="upper-content" style="box-sizing:border-box;display:flex;align-items:center;margin-bottom:0px;">
                                <img class="upper-content-img" src="${'file://' +__dirname + '/asset/temp.png'}" style="display:inline-block;width:100px;">
                                <h1 class="upper-content-text" style="display:inline-block;color:white;font-size:80px;">${temp}&deg;C</h1>
                            </div>
                            
                            <div class="upper-content" style="box-sizing:border-box;">
                                <img class="upper-content-img" src="${'file://' +__dirname + '/asset/humid.png'}" style="display:inline-block;width:100px;">
                                <h1 class="upper-content-text" style="color:white;font-size:80px;display:inline-block;">${humid}% RH</h1>
                            </div>

                        </div>

                        <div class="lower" style="box-sizing:border-box;height:400px;width:1000px;padding-top:0px;padding-right:80px;padding-bottom:0px;padding-left:80px;position:relative;">
                            <div class="lower-content" style="text-align:center;color:white;display:inline-block;width:250px;margin-right:25px;">
                                <img class="lower-image" src="${'file://' +__dirname + '/asset/pm25.png'}" style="height:200px;"><br>
                                <span style="font-size:30px;font-weight:500;">${pm25}ug/m <sup>3</sup></span>
                            </div>
                            <div class="lower-content" style="text-align:center;color:white;display:inline-block;width:250px;margin-right:25px;">
                                <img class="lower-image" src="${'file://' +__dirname + '/asset/pm10.png'}" style="height:200px;"><br>
                                <span style="font-size:30px;font-weight:500;">${pm10}ug/m<sup>3</sup></span>
                            </div>
                            <div class="lower-content" style="text-align:center;color:white;display:inline-block;width:250px;">
                                <img class="lower-image" src="${'file://' +__dirname + '/asset/co2.png'}" style="height:200px;"><br>
                                <span style="font-size:30px;font-weight:500;">${co2}ppm</span>
                            </div>
                        </div>
                    </div>
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
                break;
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