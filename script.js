```javascript
/* ==========================
   CORENDON VIRTUAL V2
========================== */

const STORAGE_USERS = "corendon_users";

let users = [];

/* ==========================
   DATA
========================== */

function loadData() {

    const saved = localStorage.getItem(STORAGE_USERS);

    if(saved){

        users = JSON.parse(saved);

    }else{

        users = [

            {
                username:"admin",
                password:"ADMIN1",
                flights:250,
                hours:640,
                rank:"Chief Captain"
            }

        ];

        saveData();

    }

}

function saveData(){

    localStorage.setItem(
        STORAGE_USERS,
        JSON.stringify(users)
    );

}

function findUser(username){

    return users.find(
        u =>
        u.username.toLowerCase()
        ===
        username.toLowerCase()
    );

}

/* ==========================
   SESSION
========================== */

function saveSession(username){

    sessionStorage.setItem(
        "currentUser",
        username
    );

}

function getCurrentUser(){

    return sessionStorage.getItem(
        "currentUser"
    );

}

function clearSession(){

    sessionStorage.removeItem(
        "currentUser"
    );

}

/* ==========================
   PAGE SYSTEM
========================== */

function showPage(pageId){

    document
    .querySelectorAll(".page")
    .forEach(page => {

        page.classList.remove(
            "active-page"
        );

    });

    const target =
    document.getElementById(
        pageId + "Page"
    );

    if(target){

        target.classList.add(
            "active-page"
        );

    }

    window.scrollTo({
        top:0,
        behavior:"smooth"
    });

}

window.showPage = showPage;

/* ==========================
   LOGIN
========================== */

function verifyLogin(
    username,
    password
){

    const user =
    findUser(username);

    if(!user){

        return {
            success:false,
            error:"User not found"
        };

    }

    if(user.password !== password){

        return {
            success:false,
            error:"Wrong password"
        };

    }

    return {
        success:true,
        user:user
    };

}

/* ==========================
   UI LOGIN
========================== */

function updateUIForLogin(username){

    const user =
    findUser(username);

    if(!user) return;

    document.getElementById(
        "userStatus"
    ).innerHTML =
    `👨‍✈️ ${username}`;

    document.getElementById(
        "loginMenuBtn"
    ).style.display =
    "none";

    document.getElementById(
        "logoutMenuBtn"
    ).style.display =
    "block";

    const crewNav =
    document.getElementById(
        "crewCenterNav"
    );

    if(crewNav){

        crewNav.style.display =
        "block";

    }

    const flights =
    document.getElementById(
        "totalFlights"
    );

    const hours =
    document.getElementById(
        "flightHours"
    );

    const rank =
    document.getElementById(
        "crewRank"
    );

    if(flights)
        flights.textContent =
        user.flights || 0;

    if(hours)
        hours.textContent =
        user.hours || 0;

    if(rank)
        rank.textContent =
        user.rank || "Cadet";

}

function updateUIForLogout(){

    document.getElementById(
        "userStatus"
    ).innerHTML = "";

    document.getElementById(
        "loginMenuBtn"
    ).style.display =
    "block";

    document.getElementById(
        "logoutMenuBtn"
    ).style.display =
    "none";

    const crewNav =
    document.getElementById(
        "crewCenterNav"
    );

    if(crewNav){

        crewNav.style.display =
        "none";

    }

}

/* ==========================
   LOGIN MODAL
========================== */

function openLogin(){

    const username =
    prompt(
        "Infinite Flight Username"
    );

    if(!username) return;

    const password =
    prompt(
        "Password"
    );

    if(!password) return;

    const result =
    verifyLogin(
        username,
        password
    );

    if(!result.success){

        alert(result.error);
        return;

    }

    saveSession(username);

    updateUIForLogin(
        username
    );

    showPage(
        "crewcenter"
    );

}

/* ==========================
   LOGOUT
========================== */

function logout(){

    clearSession();

    updateUIForLogout();

    showPage(
        "home"
    );

}

/* ==========================
   CHECK SESSION
========================== */

function checkLoginStatus(){

    const currentUser =
    getCurrentUser();

    if(currentUser){

        updateUIForLogin(
            currentUser
        );

    }else{

        updateUIForLogout();

    }

}

/* ==========================
   NAVIGATION
========================== */

function setupNavigation(){

    document
    .querySelectorAll(
        "[data-page]"
    )
    .forEach(link => {

        link.addEventListener(
            "click",
            function(e){

                e.preventDefault();

                const page =
                this.getAttribute(
                    "data-page"
                );

                showPage(page);

            }
        );

    });

}

/* ==========================
   CREATE DEMO USER
========================== */

function createDemoUser(){

    if(findUser("SKYAnatolia"))
        return;

    users.push({

        username:"SKYAnatolia",
        password:"123456",

        flights:128,

        hours:347,

        rank:"Captain"

    });

    saveData();

}

/* ==========================
   INIT
========================== */

document.addEventListener(
    "DOMContentLoaded",
    function(){

        loadData();

        createDemoUser();

        setupNavigation();

        checkLoginStatus();

        const loginBtn =
        document.getElementById(
            "loginMenuBtn"
        );

        if(loginBtn){

            loginBtn.addEventListener(
                "click",
                openLogin
            );

        }

        const logoutBtn =
        document.getElementById(
            "logoutMenuBtn"
        );

        if(logoutBtn){

            logoutBtn.addEventListener(
                "click",
                logout
            );

        }

        showPage(
            "home"
        );

    }
);

/* ==========================
   ADMIN PANEL FUNCTIONS
========================== */

window.CorendonVA = {

    getUsers:() => users,

    addUser:function(
        username,
        password
    ){

        if(findUser(username))
            return false;

        users.push({

            username:username,

            password:password,

            flights:0,

            hours:0,

            rank:"Cadet"

        });

        saveData();

        return true;

    },

    deleteUser:function(
        username
    ){

        const index =
        users.findIndex(
            u =>
            u.username === username
        );

        if(index > -1){

            users.splice(
                index,
                1
            );

            saveData();

            return true;

        }

        return false;

    }

};
```
