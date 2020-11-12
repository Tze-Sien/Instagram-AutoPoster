const express = require('express');
const app = express();
// const tfi = require('tools-for-instagram');
const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');
const Jimp = require("jimp");
const bodyParser = require('body-parser');
const nodeHtmlToImage = require('node-html-to-image')
const puppeteer = require('puppeteer')
const converter = require('./smartudaraco2');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


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
                
                console.log("Launching Browser")
                puppeteer.launch().then(async browser => {
                    const page = await browser.newPage();
                    const url = 'https://www.chromestatus.com/features';
                  
                    page.on('response', async resp => {
                      if (resp.ok && resp.url === url) {
                        console.log(await resp.text());
                      }
                    });
                  
                    await page.goto(url);
                  
                    browser.close();
                    return true;
                });

                
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
                    res.json(postInsta);
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

        

        // // 3. Download Image to Local
        //     const url = generatedImage.data.url;
        //     const imageFetch = await fetch(url);
        //     const buffer = await imageFetch.buffer();
        //     fs.writeFile(path.join(__dirname, "/images/image.png"), buffer, () => console.log('finished downloading!'));

        //     // 3.1 Convert file to JPG suitable for Instagram Upload
        //     Jimp.read(path.join(__dirname, "/images/image.png"), function (err, image) {
        //     if (err) {
        //         console.log(err)
        //     } else {
        //         image.write(path.join(__dirname, "/images/image.jpg"))
        //     }
        // })

        // // 4. Sign in to Instagram and Upload Picture
        //     let ig = await login(); 
        //     let myPicturePath = path.join(__dirname, '/images/image.jpg');;
        //     let image = await uploadPicture(ig, headline, myPicturePath);   

        // // 5. Delete the image 
        //     const pathToDir = path.join(__dirname, "/images")
        //     removeDir(pathToDir)
        //     res.json({message: 'Image Uploaded!'})
        
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