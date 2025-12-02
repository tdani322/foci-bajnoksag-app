import mongoose from 'mongoose'
import { config } from 'dotenv'
import express from 'express'
const router = express.Router();
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path';
import fs from 'fs';

import api from './routes/api.js'

config()
const app = express()
app.use(express.json())
app.use(cors());


app.use('/api', api)
app.use('/uploads', express.static('uploads'))

const { DB_USER, DB_PASSWORD, DB_URL, DB_NAME, TOKEN_SECRET, MONGO_LOCAL } = process.env

let mongoStr;

// --- ITT VOLT A HIBA JAVÍTVA ---
// Ha be van állítva a MONGO_LOCAL környezeti változó (Dockerben), akkor azt használja
if (MONGO_LOCAL === 'true') {
  // A docker-compose-ból kapott DB_URL-t használjuk (ami "mongo:27017")
  mongoStr = `mongodb://${DB_URL}/${DB_NAME}`;
  console.log(`Connecting to LOCAL Docker MongoDB at: ${mongoStr}`);
} else {
  // Egyébként marad a felhős (ha később élesítenéd)
  mongoStr = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_URL}/?retryWrites=true&w=majority&appName=Cluster0`;
  console.log("Connecting to CLOUD Atlas MongoDB...");
}
// -------------------------------

mongoose.connect(mongoStr, {
  dbName: DB_NAME,
})
const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  password: { type: String, select: false },
  registeredAt: { type: Date, select: false, default: Date.now },
  email: { type: String },
})

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`
})

userSchema.set('toJSON', {
  virtuals: true,
})

const User = mongoose.model('User', userSchema)

// Championship schema
const championshipSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  isRunning: { type: Boolean, default: false },
  championships_type: { type: String, enum: ['knockout', 'group'], default: 'group' },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }],
})

const Championship = mongoose.model('Championship', championshipSchema)

// Match schema
const matchSchema = new mongoose.Schema({
  championshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Championship' },
  homeTeam: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    name: String
  },
  awayTeam: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    name: String
  },  
  homeScore: Number,
  awayScore: Number,
  round: { type: Number, required: false },
  isBye: Boolean
})

const Match = mongoose.model('Match', matchSchema)

// Team schema
const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  championshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Championship' },
  players: [{ type: String }],
  teamPhoto: { type: String },
});

const Team = mongoose.model('Team', teamSchema);

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
    console.log('Uploads folder created!');
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

mongoose.connection
  .once('open', () => {
    console.log('connected to mongo')
  })
  .on('error', (err) => {
    console.error(err)
  })

const authMW = async (req, res, next) => {
  try {
    const token = req.headers?.authorization?.replace('Bearer ', '')
    const { userId } = await jwt.verify(token, TOKEN_SECRET)
    req.user = userId
    next()
  } catch (error) {
    next(error)
  }
}

app.post('/api/register', async (req, res, next) => {
  const { userName, password } = req.body
  const user = await User.findOne({ userName })
  if (user) { next('User already exists') } else {
    const hashed = await bcrypt.hash(password, 10)
    const createdUser = await User.create({ ...req.body, userName, password: hashed })
    res.json({ id: createdUser.id })
  }
})

app.post('/api/login', async (req, res, next) => {
  const { userName, password } = req.body
  const user = await User.findOne({ userName }).select('+password')
  if (!user) { next('User does not exist') } else {
    const match = await bcrypt.compare(password, user.password)
    if (!match) { next('Wrong password') } else {
      const token = await jwt.sign({ userId: user.id }, TOKEN_SECRET, { expiresIn: '1h' })
      res.json({ token })
    }
  }
})

app.post('/api/matches', authMW, async (req, res, next) => {
  try {
    const match = await Match.create(req.body)
    res.json(match)
  } catch (err) { next(err) }
})

app.post('/api/championships', authMW, async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name ) { return res.status(400).json({ error: 'Name and type are required' }) }
    const existing = await Championship.findOne({ name })
    if (existing) return res.status(400).json({ error: 'Championship already exists' })
    const newChampionship = await Championship.create({ name, isRunning: false })
    res.status(201).json(newChampionship)
  } catch (err) { next(err) }
})

app.post('/api/teams', authMW, upload.single('teamPhoto'), async (req, res, next) => {
  try {
    const { name, players, championshipId } = req.body
    const teamPhoto = req.file ? req.file.path : null
    let playersArray = [];
    if (typeof players === 'string') {
      try { playersArray = JSON.parse(players); } catch { playersArray = players.split(/\r?\n|,/).map(p => p.trim()).filter(Boolean); }
    } else if (Array.isArray(players)) { playersArray = players; }

    if (!name || !championshipId) { return res.status(400).json({ error: 'Name and championshipId are required' }) }
    const newTeam = await Team.create({ name, players: playersArray, championshipId, teamPhoto })
    await Championship.findByIdAndUpdate(championshipId, { $push: { teams: newTeam._id } })
    res.status(201).json(newTeam)
  } catch (err) { next(err) }
})

app.post('/api/championships/:id/generate-matches', authMW, async (req, res, next) => {
  try {
    const championship = await Championship.findById(req.params.id).populate('teams')
    if (!championship) { return res.status(404).json({ error: 'Championship not found' }) }
    const matches = []
    if (championship.championships_type === 'group') {
      const teams = [...championship.teams]
      const isOdd = teams.length % 2 !== 0
      if (isOdd) { teams.push({ _id: null, name: 'BYE' }) }
      const numRounds = teams.length - 1
      const numMatchesPerRound = teams.length / 2
      for (let round = 0; round < numRounds; round++) {
        for (let i = 0; i < numMatchesPerRound; i++) {
          const home = teams[i]
          const away = teams[teams.length - 1 - i]
          if (home._id && away._id) {
            matches.push({ championshipId: championship._id, homeTeam: { id: home._id, name: home.name }, awayTeam: { id: away._id, name: away.name }, round: round + 1 })
          }
        }
        const fixed = teams[0]
        const rotated = [fixed, ...teams.slice(1).slice(-1), ...teams.slice(1, -1)]
        teams.splice(0, teams.length, ...rotated)
      }
    } else if (championship.championships_type === 'knockout') {
      const shuffled = [...championship.teams].sort(() => Math.random() - 0.5)
      for (let i = 0; i < shuffled.length; i += 2) {
        if (i + 1 < shuffled.length) {
          matches.push({ championshipId: championship._id, homeTeam: { id: shuffled[i]._id, name: shuffled[i].name }, awayTeam: { id: shuffled[i + 1]._id, name: shuffled[i + 1].name }, round: 1 })
        }
      }
    }
    const createdMatches = await Match.insertMany(matches)
    await Championship.findByIdAndUpdate(req.params.id, { $push: { matches: { $each: createdMatches.map(m => m._id) } }, isRunning: true })
    res.json({ matches: createdMatches })
  } catch (err) { next(err) }
})

app.post('/api/championships/:id/next-round', authMW, async (req, res, next) => {
  try {
    const championshipId = req.params.id;
    const allMatches = await Match.find({ championshipId });
    const lastRound = Math.max(...allMatches.map(m => m.round || 1));
    const lastRoundMatches = allMatches.filter(m => m.round === lastRound);
    if (lastRoundMatches.some(m => m.homeScore === undefined || m.awayScore === undefined)) {
      return res.status(400).json({ error: 'Nem minden meccs rendelkezik eredménnyel az előző körből.' });
    }
    const winners = lastRoundMatches.map(match => {
      if (match.isBye) return match.homeTeam;
      return match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam;
    });
    const nextRound = lastRound + 1;
    const newMatches = [];
    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 < winners.length) {
        newMatches.push({ championshipId, homeTeam: winners[i], awayTeam: winners[i + 1], round: nextRound });
      } else {
        newMatches.push({ championshipId, homeTeam: winners[i], awayTeam: null, homeScore: 1, awayScore: 0, isBye: true, round: nextRound });
      }
    }
    const created = await Match.insertMany(newMatches);
    await Championship.findByIdAndUpdate(championshipId, { $push: { matches: { $each: created.map(m => m._id) } } });
    res.json({ matches: created });
  } catch (err) { next(err); }
});

app.get('/api/matches/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) { return res.status(400).json({ error: 'Érvénytelen mérkőzés azonosító' }); }
    const match = await Match.findById(req.params.id).populate('homeTeam.id', 'name teamPhoto').populate('awayTeam.id', 'name teamPhoto');
    if (!match) { return res.status(404).json({ error: 'Mérkőzés nem található' }); }
    res.json(match);
  } catch (err) { next(err); }
});

app.get('/api/championships/:id/matches', async (req, res, next) => {
  try {
    const matches = await Match.find({ championshipId: req.params.id }).populate('homeTeam', 'name teamPhoto').populate('awayTeam', 'name teamPhoto');
    res.json(matches);
  } catch (err) { next(err); }
});

app.get('/api/championships/:id', async (req, res, next) => {
  try {
    const championship = await Championship.findById(req.params.id).populate('teams').populate('matches');
    res.json(championship);
  } catch (err) { next(err); }
});

app.get('/api/championships', async (req, res, next) => {
  try {
    const championships = await Championship.find().populate({ path: 'teams', select: 'name players teamPhoto', });
    res.json(championships);
  } catch (err) { next(err); }
});

app.put('/api/matches/:id', authMW, async (req, res, next) => {
  try {
    const { homeScore, awayScore } = req.body;
    const updatedMatch = await Match.findByIdAndUpdate(req.params.id, { homeScore, awayScore }, { new: true });
    if (!updatedMatch) { return res.status(404).json({ error: 'Match not found' }); }
    res.json(updatedMatch);
  } catch (err) { next(err); }
});

app.put('/api/championships/:id/start', authMW, async (req, res, next) => {
  try {
    const { type } = req.body;
    const updated = await Championship.findByIdAndUpdate(req.params.id, { isRunning: true, championships_type: type }, { new: true }).populate('teams matches');
    if (!updated) { return res.status(404).json({ error: 'Bajnokság nem található' }); }
    res.json(updated);
  } catch (err) { next(err); }
});

app.delete('/api/teams/:id', authMW, async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) { return res.status(404).json({ error: 'Team not found' }); }
    if (team.teamPhoto) {
      try {
        const photoPath = path.join(process.cwd(), team.teamPhoto);
        if (fs.existsSync(photoPath)) { fs.unlinkSync(photoPath); }
      } catch (fileError) { console.error('Hiba a kép törlésekor:', fileError); }
    }
    await Championship.findByIdAndUpdate(team.championshipId, { $pull: { teams: team._id } });
    await Match.deleteMany({ $or: [ { 'homeTeam.id': new mongoose.Types.ObjectId(team._id) }, { 'awayTeam.id': new mongoose.Types.ObjectId(team._id) } ] });
    await Team.findByIdAndDelete(req.params.id);
    res.json({ message: 'Team deleted successfully' });
  } catch (err) { console.error('Hiba a csapat törlésekor:', err); next(err); }
});

app.delete('/api/championships/:id/reset', async (req, res, next) => {
  try {
    const { id } = req.params;
    const championship = await Championship.findById(id);
    if (!championship) { return res.status(404).json({ error: 'Championship not found' }); }
    await Match.deleteMany({ championshipId: new mongoose.Types.ObjectId(id) });
    championship.matches = [];
    await championship.save();
    res.status(200).json({ message: 'A bajnokság meccsei sikeresen törölve lettek.' });
  } catch (err) { console.error('Hiba a bajnokság resetelésekor:', err); next(err); }
});

app.listen(3001, '0.0.0.0', () => console.log('Server is listening'))