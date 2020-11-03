const express = require('express');
const app = express();
const tfi = require('tools-for-instagram');
const path = require('path');
const fetch = require('node-fetch');
const axios = require('axios');
const fs = require('fs');
const Jimp = require("jimp")


app.post('/postInstagram', async(req, res) =>{
    try {

        // 0. Functions
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

        // 1. Request Data
        const response = await fetch('https://finnhub.io/api/v1/news?category=general&token=buchvdv48v6trhm1k80g').then(response => response.json());

        // Get the latest news
        let latestNews = response[response.length-1]

        // Take information of the news
        let imageUrl = latestNews.image;
        let headline = latestNews.headline;
        let date = timeConverter(latestNews.datetime);

        // 2.  Generate Image HTML

        const data = {
            html: `<div class='box' style='height: 500px; width: 500px; margin: 20px; border: 1px solid; text-align: center;'><h2>${headline}</h2><p>${date}<p><img src='${imageUrl}' width='300' height='300'></div>`,
            css: ".box { color: white; background-color: #0f79b9; padding: 10px; font-family: Roboto }",
            google_fonts: "Roboto"
        }

        let headers = { auth: {
            username: '3f89b292-ea85-41a9-a891-eb54264dad84',
            password: '0627bd64-7c25-4e61-97f8-2a3c6e7d557e'
        },
        headers: {
            'Content-Type': 'application/json'
        }
        }

        let generatedImage = await axios.post('https://hcti.io/v1/image', JSON.stringify(data), headers)

        // 3. Download Image to Local

        const url = generatedImage.data.url;
        const imageFetch = await fetch(url);
        const buffer = await imageFetch.buffer();
        fs.writeFile(`./images/image.png`, buffer, () => console.log('finished downloading!'));


        Jimp.read("./images/image.png", function (err, image) {
            if (err) {
            console.log(err)
            } else {
            image.write("./images/image.jpg")
            }
        })

        // 4. Sign in to Instagram and Upload Picture
        let ig = await login(); 
        let myPicturePath = path.join(__dirname, './images/image.jpg');;
        let image = await uploadPicture(ig, headline, myPicturePath);   

        // 5. Delete the image 

        const pathToDir = path.join(__dirname, "/images")
        removeDir(pathToDir)
        
        res.json({message: 'Image Uploaded!'})
        
    }catch(error){
        res.status(400).json({err:error})
    }
})


app.listen('3000', () => {
    console.log('Listening to Port 3000')
})