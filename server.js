const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('.'));

// Encryption
const ENCRYPTION_KEY = crypto.randomBytes(32);
const IV = crypto.randomBytes(16);

// Encrypt/Decrypt
function encrypt(data){
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
    let encrypted = cipher.update(JSON.stringify(data));
    encrypted = Buffer.concat([encrypted,cipher.final()]);
    return {iv: IV.toString('hex'), data: encrypted.toString('hex')};
}
function decrypt(enc){
    const iv = Buffer.from(enc.iv,'hex');
    const encryptedText = Buffer.from(enc.data,'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc',ENCRYPTION_KEY,iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted,decipher.final()]);
    return JSON.parse(decrypted.toString());
}

// Data
function loadData(){ return fs.existsSync('data.json') ? JSON.parse(fs.readFileSync('data.json')) : {users:{},websites:[]}; }
function saveData(data){ fs.writeFileSync('data.json',JSON.stringify(data,null,2)); }

// Nodemailer (replace with your email credentials)
const transporter = nodemailer.createTransport({
    service:'gmail',
    auth:{user:'YOUR_EMAIL@gmail.com', pass:'YOUR_PASSWORD'}
});

// Routes
app.post('/register', async (req,res)=>{
    const data = loadData();
    const {username,email,password} = req.body;
    if(data.users[username]) return res.json({message:'User exists'});
    const hash = await bcrypt.hash(password,10);
    data.users[username]={email,passwordHash:hash,details:''};
    saveData(data);
    res.json({message:'Registered successfully'});
});

app.post('/login', async (req,res)=>{
    const data = loadData();
    const {username,password} = req.body;
    if(!data.users[username]) return res.json({success:false,message:'User not found'});
    const valid = await bcrypt.compare(password,data.users[username].passwordHash);
    if(!valid) return res.json({success:false,message:'Invalid password'});
    res.json({success:true,message:'Login successful'});
});

app.post('/recover', async (req,res)=>{
    const data = loadData();
    const {email} = req.body;
    const user = Object.keys(data.users).find(u=>data.users[u].email===email);
    if(!user) return res.json({message:'Email not found'});
    const tempPassword = crypto.randomBytes(4).toString('hex');
    data.users[user].passwordHash = await bcrypt.hash(tempPassword,10);
    saveData(data);

    transporter.sendMail({
        from:'YOUR_EMAIL@gmail.com',
        to:email,
        subject:'Password Recovery',
        text:`Your temporary password is: ${tempPassword}`
    });
    res.json({message:'Temporary password sent to your email'});
});

app.post('/update-profile', async (req,res)=>{
    const data = loadData();
    const {username,email,password,details} = req.body;
    if(!data.users[username]) return res.json({message:'User not found'});
    if(email) data.users[username].email=email;
    if(details) data.users[username].details=details;
    if(password) data.users[username].passwordHash = await bcrypt.hash(password,10);
    saveData(data);
    res.json({message:'Profile updated'});
});

app.get('/websites',(req,res)=>{
    const data = loadData();
    const user = req.query.user;
    const userSites = data.websites.filter(w=>w.owner===user);
    res.json({websites:userSites});
});

app.post('/create-website',(req,res)=>{
    const data = loadData();
    const {owner,name,content} = req.body;
    data.websites.push({owner,name,files:{'index.html':content},ratings:[],comments:[]});
    saveData(data);
    res.json({message:'Website created'});
});

app.listen(PORT,()=>console.log(`Server running at http://localhost:${PORT}`));
