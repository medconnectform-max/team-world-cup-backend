const express = require('express');
const app = express();
const axios = require('axios');
const cron = require('node-cron');
const fs = require('fs');
const fsp = require('fs').promises;
const cors = require('cors');

app.use(cors());
app.use(express.json());

const port = 3000;

let GLOBAL = 0;

const API_KEY = [
  '7d7a1c516emsh12ffdc7876881b7p13aa7ajsne8965e70cf2f',
  '82beaef021msh5f8e00de42853b9p116d92jsnf1bb4106d583',
  'f5f2e5eddfmsh5f94ce61f983dfap1f8901jsnf2605e691dbb',
  '331c114fc5msh1892e1b83bef3f1p1e92c3jsn5fa1e1547ee7',
  '52d0d447e1msh9d98058b77f903fp14a799jsn66e9056c359f',
  '79ead7deb5msh1606ef261a06940p1a8e88jsn4b6536df0f01',
  'ce88e140a0mshdc69ceb629931adp12dcf6jsne7b5f9f8f529',
  '4ac635efdcmsh95a31076083d6b8p14564ejsnde4b8ae4464a',
];

const TOURNAMENT_LINK =
  'https://cricbuzz-cricket.p.rapidapi.com/series/v1/11253';

function get_key() {
  const key = API_KEY[GLOBAL];
  GLOBAL = (GLOBAL + 1) % API_KEY.length;

  return key;
}

app.get('/get-all-players', (req, res) => {
  const data = fs.readFileSync('data.json', 'utf-8');
  const json = JSON.parse(data);
  return res.send(json);
});

//FUNCTION FOR GETTING COMPLETE MATCH IDS
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function get_player_runs() {
  let player_runs = JSON.parse(fs.readFileSync('data.json', 'utf8'));
  const match_ids = await details();

  const last_match = parseInt(
    JSON.parse(fs.readFileSync('last_match.json', 'utf8')).last,
  );

  for (let id = last_match + 1; id < match_ids.length; id++) {
    last = {
      last: id,
    };

    await fsp.writeFile('data.json', JSON.stringify(last, null, 2), 'utf8');

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

  await fsp.writeFile(
    'data.json',
    JSON.stringify(player_runs, null, 2),
    'utf8',
  );
}

cron.schedule('0 14,17,22 * * *', async () => {
  get_player_runs();
});

app.get('/keep-alive', (req, res) => {
  res.json('ok');
});

cron.schedule('*/14 * * * *', async () => {
  try {
    const res = await axios.get('http://localhost:3000/keep-alive');
  } catch (err) {
    console.error('Ping failed:', err.message);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
