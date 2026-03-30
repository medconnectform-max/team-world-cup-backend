require('dotenv').config();
const express = require('express')
const mongoose = require('mongoose')
const cron = require('node-cron')
const axios = require('axios');
const DataModel = require('./models/Data.model');
const LastModel = require('./models/Last.model');
const uploadPlayers = require("./main");


//models


const app = express();
const port = process.env.PORT || 3000;















let GLOBAL = 0;

const API_KEY = [
  process.env.API_1,
  process.env.API_2,
  process.env.API_3,
  process.env.API_4,
  process.env.API_5,
  process.env.API_6,
  process.env.API_7,
  process.env.API_8,
  process.env.API_9
  
];

const TOURNAMENT_LINK ='https://cricbuzz-cricket.p.rapidapi.com/series/v1/9241';

function get_key() {
  const key = API_KEY[GLOBAL];
  GLOBAL = (GLOBAL + 1) % API_KEY.length;

  return key;
}


function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function get_match_id(obj) {
  if (obj.matchInfo.state == 'Complete') {
    return obj.matchInfo.matchId;
  }
}
async function details() {
  let complete_match_id = [];

  const response = await axios.get(TOURNAMENT_LINK, {
    headers: {
      'x-rapidapi-key': get_key(),
      'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com',
    },
  });

  const json = response.data;
  
 

  for (let i = 0; i < json.matchDetails.length; i++) {
    const obj = json.matchDetails[i];
    if ('matchDetailsMap' in obj) {
      if ('match' in obj.matchDetailsMap) {
        for (let j = 0; j < obj.matchDetailsMap.match.length; j++) {
          const id = get_match_id(obj.matchDetailsMap.match[j]);
        
          
          if (id != undefined) {
    
            complete_match_id.push(id);
           
          }
        }
      }
    }
  }


  return complete_match_id;
}


async function getPlayerRuns(){

    // getting the playerRuns in dict format
       let runs = await DataModel.find();
            if (runs.length === 0 ) {
            runs = { data: [] };
            } else {
            runs = runs[0].data;

            }
    const player_runs = {};
    for(let i=0;i<runs.length;i++){
        playerName = runs[i].name;
        playerRun = runs[i].run;
        player_runs[playerName] = playerRun;
    }


    let lastMatch = await LastModel.find();
   
    lastMatch =  lastMatch[0].last;


    const match_ids = await details();

    for(let id = lastMatch ; id<match_ids.length; id++){
        lastMatch++;
       

    

         const response = await axios.get(
              `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${match_ids[id]}/hscard`,
              {
                headers: {
                  'x-rapidapi-key': get_key(),
                  'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com',
                },
              },
            );
         const json = response.data;
     

            if(json.ismatchcomplete === false) continue;
               
            await sleep(500);
        
            for (let i = 0; i < 2; i++) {
              const obj = json.scorecard[i];
             
              for (let j = 0; j < obj.batsman.length; j++) {
                let runs = player_runs[obj.batsman[j].name];
                if (runs == undefined) {
                  player_runs[obj.batsman[j].name] = 0;
                }
                player_runs[obj.batsman[j].name] += parseInt(obj.batsman[j].runs);
              }
            }
          
        
        }




const formatted = Object.entries(player_runs).map(([name, run]) => ({
  name,
  run
}));


await DataModel.findOneAndUpdate(
  {},
  { $set: { data: formatted } },
  { upsert: true, returnDocument: 'after' }
);
        

    await LastModel.findOneAndUpdate(
        {},
         { $set: { last:  lastMatch} },
  { upsert: true, returnDocument: 'after' }
        
    )
    }


app.get('/get-all-players', async (req, res) => {
  try {
    await getPlayerRuns();
    let runs = await DataModel.find();
     runs = runs[0].data
    const playerRuns = {};
    for(let i=0;i<runs.length;i++){
        playerName = runs[i].name;
        playerRun = runs[i].run;
        playerRuns[playerName] = playerRun;
    }
    res.json(playerRuns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



async function connectDB() {
  try {
   
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected with Mongoose");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

app.listen(port, async () => {
    connectDB();
  console.log(`Example app listening on port ${port}`);
});