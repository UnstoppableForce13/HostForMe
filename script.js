let currentUser = null;

function showSection(sectionId){
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(sec=>sec.style.display='none');
    document.getElementById(sectionId).style.display='block';
}

function logout(){
    currentUser = null;
    document.getElementById('dashboard').style.display='none';
    document.getElementById('auth-section').style.display='block';
}

// Sign Up
document.getElementById('signup-form').addEventListener('submit', async e=>{
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    const res = await fetch('/register',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({username,email,password})
    });
    const data = await res.json();
    alert(data.message);
});

// Sign In
document.getElementById('signin-form').addEventListener('submit', async e=>{
    e.preventDefault();
    const username = document.getElementById('signin-username').value;
    const password = document.getElementById('signin-password').value;

    const res = await fetch('/login',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({username,password})
    });
    const data = await res.json();
    if(data.success){
        currentUser = username;
        document.getElementById('auth-section').style.display='none';
        document.getElementById('dashboard').style.display='block';
        loadWebsites();
    } else { alert(data.message); }
});

// Password Recovery
document.getElementById('recover-form').addEventListener('submit', async e=>{
    e.preventDefault();
    const email = document.getElementById('recover-email').value;
    const res = await fetch('/recover',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({email})
    });
    const data = await res.json();
    alert(data.message);
});

// Update Profile
async function updateProfile(){
    const email = document.getElementById('profile-email').value;
    const password = document.getElementById('profile-password').value;
    const details = document.getElementById('profile-details').value;

    const res = await fetch('/update-profile',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({username:currentUser,email,password,details})
    });
    const data = await res.json();
    alert(data.message);
}

// Load Websites
async function loadWebsites(){
    const res = await fetch(`/websites?user=${currentUser}`);
    const data = await res.json();
    const list = document.getElementById('website-list');
    list.innerHTML='';
    data.websites.forEach(site=>{
        const li = document.createElement('li');
        li.textContent = site.name;
        list.appendChild(li);
    });
}

// Create Website
async function createWebsite(){
    const name = document.getElementById('new-site-name').value;
    const content = document.getElementById('new-site-content').value;
    const res = await fetch('/create-website',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({owner:currentUser,name,content})
    });
    const data = await res.json();
    alert(data.message);
    loadWebsites();
}
